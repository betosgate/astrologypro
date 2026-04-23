// Task 02 — POST /api/dashboard/affiliates/invite/junction/[junctionId]/resend
//
// Issues a FIRST invite token for a junction that predates the 2026-04-23
// flow (legacy-pending rows grandfathered by Task 01's backfill without any
// matching affiliate_invites row). Sends the email afterwards.
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
const RESEND_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

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
  { params }: { params: Promise<{ junctionId: string }> },
) {
  if (!isAffiliateIdentityV2Enabled()) return problem(503, "Feature not available");

  const { junctionId } = await params;
  if (!junctionId) return problem(422, "Validation error", "junctionId is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();

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
      "Sign the affiliate partnership agreement before sending invites.",
    );
  }

  // Fetch account name for email — ownership + status checks happen inside the RPC
  const { data: junction } = await admin
    .from("diviner_affiliates")
    .select("affiliate_account_id, diviner_id, status")
    .eq("id", junctionId)
    .maybeSingle();
  if (!junction) return problem(404, "Junction not found");
  if (junction.diviner_id !== diviner.id) return problem(403, "Not your junction");

  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("name, email, status")
    .eq("id", junction.affiliate_account_id)
    .single();

  // Rate limit per junction (same key as regular resend)
  const rl = await rateLimit(
    `aff_invite_resend:${junctionId}`,
    RESEND_RATE_LIMIT,
    RESEND_RATE_WINDOW_MS,
  );
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      "This invite has been resent too many times today. Please try again later.",
    );
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  const { data: rpcData, error: rpcError } = await admin.rpc(
    "resend_affiliate_invite_by_junction",
    {
      p_junction_id: junctionId,
      p_caller_diviner_id: diviner.id,
      p_new_token_hash: tokenHash,
      p_new_expires_at: expiresAt.toISOString(),
      p_invited_by: user.id,
    },
  );

  if (rpcError) {
    const code = (rpcError as { code?: string }).code;
    if (code === "P0006") {
      return problem(
        409,
        "Junction not eligible",
        "Only pending junctions that you own can receive a new invite through this endpoint.",
      );
    }
    if (code === "P0001") {
      return problem(
        403,
        "Affiliate account is blocked platform-wide",
        rpcError.message,
      );
    }
    console.error("[invite:resend-by-junction] RPC error", {
      code,
      message: rpcError.message,
    });
    return problem(500, "Failed to send invitation", rpcError.message);
  }
  if (!rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
    return problem(500, "Failed to send invitation", "RPC returned no row");
  }

  const row = rpcData[0] as {
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
    email: string;
  };

  console.log("[invite:resend-by-junction:created]", {
    new_invite_id: row.invite_id,
    junction_id: row.junction_id,
    diviner_id: diviner.id,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const acceptUrl = `${appUrl}/affiliate/accept/${rawToken}`;
  let emailDelivery: "sent" | "failed" = "sent";
  try {
    await sendAffiliateInvitation({
      to: row.email,
      affiliateName: account?.name ?? row.email,
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
        email_delivery: emailDelivery,
      },
    },
    { status: 201 },
  );
}
