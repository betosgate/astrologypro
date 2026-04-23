// Task 02 — POST /api/dashboard/affiliates/invite/[inviteId]/resend
//
// Revokes the prior invite on the same junction, issues a fresh token, sends
// a new invitation email. Bumps resent_count on the new invite row.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/02-invite-flow-refactor.md

import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendAffiliateInvitation } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INVITE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const RESEND_RATE_LIMIT = 3;
const RESEND_RATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h per junction

function problem(
  status: number,
  title: string,
  detail?: string,
) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  if (!isAffiliateIdentityV2Enabled()) return problem(503, "Feature not available");

  const { inviteId } = await params;
  if (!inviteId) return problem(422, "Validation error", "inviteId is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();

  // Resolve diviner + agreement gate
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, affiliate_agreement_signed")
    .eq("user_id", user.id)
    .single();
  if (!diviner) return problem(403, "Not a diviner");
  if (!diviner.affiliate_agreement_signed) {
    return problem(
      403,
      "Affiliate agreement not signed",
      "Sign the affiliate partnership agreement before resending invites.",
    );
  }

  // Look up the invite to find its junction_id + account for rate-limit key + email target
  const { data: invite } = await admin
    .from("affiliate_invites")
    .select(
      "id, junction_id, affiliate_account_id, email, diviner_id, consumed_at, revoked_at",
    )
    .eq("id", inviteId)
    .maybeSingle();
  if (!invite) return problem(404, "Invite not found");
  if (invite.diviner_id !== diviner.id) return problem(403, "Not your invite");
  if (invite.consumed_at) return problem(409, "Invite already accepted");

  // Rate limit per junction
  const rl = await rateLimit(
    `aff_invite_resend:${invite.junction_id}`,
    RESEND_RATE_LIMIT,
    RESEND_RATE_WINDOW_MS,
  );
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      "This invite has been resent too many times today. Please try again later.",
    );
  }

  // Fetch account name for email personalization
  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("name")
    .eq("id", invite.affiliate_account_id)
    .single();

  // Issue new token
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  const { data: rpcData, error: rpcError } = await admin.rpc(
    "resend_affiliate_invite",
    {
      p_invite_id: inviteId,
      p_caller_diviner_id: diviner.id,
      p_new_token_hash: tokenHash,
      p_new_expires_at: expiresAt.toISOString(),
    },
  );

  if (rpcError) {
    const code = (rpcError as { code?: string }).code;
    if (code === "P0003") return problem(404, "Invite not found");
    if (code === "P0004") return problem(409, "Invite already accepted");
    console.error("[invite:resend] RPC error", { code, message: rpcError.message });
    return problem(500, "Failed to resend invitation", rpcError.message);
  }
  if (!rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
    return problem(500, "Failed to resend invitation", "RPC returned no row");
  }

  const row = rpcData[0] as {
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
    email: string;
    resent_count: number;
  };

  console.log("[invite:resent]", {
    new_invite_id: row.invite_id,
    junction_id: row.junction_id,
    diviner_id: diviner.id,
    resent_count: row.resent_count,
  });

  // Send the new email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const acceptUrl = `${appUrl}/affiliate/accept/${rawToken}`;
  let emailDelivery: "sent" | "failed" = "sent";
  try {
    await sendAffiliateInvitation({
      to: invite.email,
      affiliateName: account?.name ?? invite.email,
      divinerName: diviner.display_name ?? "A diviner",
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
        accept_url_masked: `${appUrl}/affiliate/accept/<TOKEN_REDACTED>`,
        expires_at: expiresAt.toISOString(),
        resent_count: row.resent_count,
        email_delivery: emailDelivery,
      },
    },
    { status: 201 },
  );
}
