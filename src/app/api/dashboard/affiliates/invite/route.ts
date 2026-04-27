// migrated-to-canonical-accounts: 2026-04-23
// Task 02 — rewrite of POST /api/dashboard/affiliates/invite against the new
// canonical affiliate_accounts + diviner_affiliates junction + affiliate_invites
// model.
//
// Sprint plan: docs/tasks/2026-04-23/affiliate-identity-refactor/02-invite-flow-refactor.md

import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendAffiliateInvitation } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Invite tokens: 14 days, 32 random bytes → 43-char base64url.
const INVITE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const INVITE_RATE_LIMIT = 5;
const INVITE_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function problem(
  status: number,
  title: string,
  detail?: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
      ...extra,
    },
    { status },
  );
}

function maskAcceptUrl(appUrl: string) {
  return `${appUrl}/affiliate/accept/<TOKEN_REDACTED>`;
}

/**
 * POST /api/dashboard/affiliates/invite
 *
 * Body: {
 *   email: string,
 *   name: string,
 *   message?: string,
 *   default_commission_type?: 'percentage' | 'fixed',
 *   default_commission_value?: number,
 *   phone?: string
 * }
 */
export async function POST(request: Request) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, affiliate_agreement_signed")
    .eq("user_id", user.id)
    .single();
  if (!diviner) return problem(403, "Not a diviner");

  // Agreement gate — duplicates the UI banner; can't be bypassed by a crafted POST
  if (!diviner.affiliate_agreement_signed) {
    return problem(
      403,
      "Affiliate agreement not signed",
      "Sign the affiliate partnership agreement before inviting affiliates.",
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }

  const {
    email,
    name,
    message,
    phone,
    default_commission_type,
    default_commission_value,
  } = body as Record<string, unknown>;

  // Validate
  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email.trim()) ||
    typeof name !== "string" ||
    name.trim() === ""
  ) {
    return problem(
      422,
      "Validation error",
      "name and a valid email are required.",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Reject diviner inviting their own email
  if (user.email && user.email.toLowerCase() === normalizedEmail) {
    return problem(
      422,
      "Validation error",
      "You cannot invite yourself as an affiliate.",
    );
  }

  // Commission cap
  try {
    await assertAffiliateShareWithinCap({
      commissionType: default_commission_type,
      commissionValue: default_commission_value,
    });
  } catch (err) {
    return problem(
      422,
      "Validation error",
      err instanceof Error ? err.message : "Affiliate share exceeds allowed cap.",
    );
  }

  // Rate limit
  const rl = await rateLimit(
    `aff_invite_create:${diviner.id}`,
    INVITE_RATE_LIMIT,
    INVITE_RATE_WINDOW_MS,
  );
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      "Too many invites recently. Please try again later.",
    );
  }

  // Issue token — 32 random bytes → 43-char base64url
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  // Atomic write through the RPC
  const { data: rpcData, error: rpcError } = await admin.rpc(
    "create_affiliate_invite",
    {
      p_diviner_id: diviner.id,
      p_email: normalizedEmail,
      p_name: (name as string).trim(),
      p_phone: typeof phone === "string" ? phone.trim() : null,
      p_message: typeof message === "string" ? message : null,
      p_commission_type:
        typeof default_commission_type === "string"
          ? default_commission_type
          : null,
      p_commission_value:
        typeof default_commission_value === "number"
          ? default_commission_value
          : null,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
      p_created_by: user.id,
    },
  );

  if (rpcError) {
    // Map PG SQLSTATE raised by the RPC
    const code = (rpcError as { code?: string }).code;
    if (code === "P0001") {
      return problem(
        403,
        "Affiliate account is blocked platform-wide",
        rpcError.message,
      );
    }
    if (code === "P0002") {
      return problem(
        409,
        "This email is already invited or active under your account",
        "An existing affiliate relationship prevents a new invite. Resend or revoke the existing invite to issue a fresh one.",
      );
    }
    console.error("[invite:create] RPC error", {
      code,
      message: rpcError.message,
    });
    return problem(500, "Failed to create invitation", rpcError.message);
  }

  if (!rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
    return problem(
      500,
      "Failed to create invitation",
      "RPC returned no row",
    );
  }

  const row = rpcData[0] as {
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
  };

  console.log("[invite:created]", {
    invite_id: row.invite_id,
    junction_id: row.junction_id,
    affiliate_account_id: row.affiliate_account_id,
    diviner_id: diviner.id,
  });

  // Send email AFTER the RPC commits. Await — don't silently drop failures.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const acceptUrl = `${appUrl}/affiliate/accept/${rawToken}`;
  let emailDelivery: "sent" | "failed" = "sent";
  try {
    await sendAffiliateInvitation({
      to: normalizedEmail,
      affiliateName: (name as string).trim(),
      divinerName: diviner.display_name ?? "A diviner",
      message:
        typeof message === "string" && message.trim() ? message.trim() : undefined,
      acceptUrl,
      expiresAt,
    });
  } catch (err) {
    emailDelivery = "failed";
    console.error("[invite:email-send-failed]", {
      invite_id: row.invite_id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      data: {
        invite_id: row.invite_id,
        junction_id: row.junction_id,
        affiliate_account_id: row.affiliate_account_id,
        accept_url_masked: maskAcceptUrl(appUrl),
        expires_at: expiresAt.toISOString(),
        email_delivery: emailDelivery,
      },
    },
    { status: 201 },
  );
}
