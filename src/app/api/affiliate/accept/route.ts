// Task 03 — POST /api/affiliate/accept
//
// Atomically claims an affiliate invite, links the canonical affiliate_accounts
// row to the accepting auth.users id, and flips the diviner_affiliates junction
// to 'active'. Handles three branches: sign-up (anonymous + no existing auth
// user), sign-in (anonymous + existing auth user), session (already logged in
// with matching email). Enforces D5 — no auto-linking by email alone.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/03-accept-flow.md

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse, getIpIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Rate limits
const IP_LIMIT = 20;
const IP_WINDOW_MS = 10 * 60 * 1000;
const TOKEN_LIMIT = 5;
const TOKEN_WINDOW_MS = 10 * 60 * 1000;

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

/**
 * Best-effort Origin / Host match. The repo does not use a dedicated CSRF
 * mechanism — Supabase's SameSite=Lax session cookies cover the primary
 * cookie-based threat model. We add an Origin check here as defense in depth
 * for the one cross-table write on the critical path.
 */
function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // CSRF: require Origin to match the request Host on state-changing POSTs
  if (!hasTrustedOrigin(request)) {
    return problem(403, "Invalid origin");
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const {
    token,
    password,
    name,
    phone,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return problem(422, "Invalid or missing token");
  }

  // Rate limit by IP and by token hash
  const ipKey = `affiliate_accept:${getIpIdentifier(request)}`;
  const ipRl = await rateLimit(ipKey, IP_LIMIT, IP_WINDOW_MS);
  if (!ipRl.success) {
    return rateLimitResponse(ipRl, "Too many accept attempts from this IP.");
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokRl = await rateLimit(
    `affiliate_accept:token:${tokenHash}`,
    TOKEN_LIMIT,
    TOKEN_WINDOW_MS,
  );
  if (!tokRl.success) {
    return rateLimitResponse(tokRl, "Too many attempts on this invite.");
  }

  const admin = createAdminClient();

  // Look up the invite (never expose whether the row exists — let the RPC
  // handle expired/revoked/consumed discrimination via P0003. For 404 vs 409
  // we do an upfront read so we can show the right UI state.)
  const { data: invite, error: inviteErr } = await admin
    .from("affiliate_invites")
    .select("id, email, expires_at, consumed_at, revoked_at, diviner_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteErr) {
    console.error("[accept:lookup-error]", inviteErr.message);
    return problem(500, "Lookup failed");
  }
  if (!invite) {
    console.log("[accept:invite-not-found]", {
      ip: getIpIdentifier(request),
      token_prefix: tokenHash.slice(0, 4),
    });
    return problem(404, "Invitation not found");
  }
  if (invite.consumed_at) return problem(409, "Invitation already accepted");
  if (invite.revoked_at) return problem(410, "Invitation revoked");
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return problem(410, "Invitation expired");
  }

  const supabase = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  // Determine the branch
  let acceptingUserId: string;
  let branch: "signup" | "signin" | "session";

  if (sessionUser) {
    // Session branch — email must match
    if (
      !sessionUser.email ||
      sessionUser.email.toLowerCase() !== invite.email.toLowerCase()
    ) {
      console.log("[accept:email-mismatch]", {
        invite_id: invite.id,
        ip: getIpIdentifier(request),
      });
      return problem(
        403,
        "Signed-in email does not match invitation",
        "Sign out and try again, or ask the diviner to re-invite with your logged-in email.",
      );
    }
    acceptingUserId = sessionUser.id;
    branch = "session";
  } else {
    // Anonymous — we need a password to proceed
    if (typeof password !== "string" || password.length < 8) {
      return problem(
        422,
        "Password required",
        "Password is required (8+ characters) when not signed in.",
      );
    }

    // Check whether an auth user already exists for this email.
    const { data: existing } = await admin
      .from("affiliate_accounts")
      .select("user_id")
      .eq("email", invite.email)
      .maybeSingle();

    if (existing?.user_id) {
      // Sign-in branch — existing auth user. Try to sign them in.
      const { data: signIn, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });
      if (signInErr || !signIn.user) {
        return problem(401, "Invalid credentials");
      }
      acceptingUserId = signIn.user.id;
      branch = "signin";
    } else {
      // Sign-up branch — create a new auth user and then sign them in.
      // email_confirm:true is safe here because the invite token itself was
      // delivered to this address, proving inbox control.
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: invite.email,
          password,
          email_confirm: true,
          user_metadata: {
            source: "affiliate_accept_flow",
            ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
          },
        });
      if (createErr || !created.user) {
        console.error("[accept:create-user-failed]", createErr?.message);
        return problem(500, "Sign-up failed", createErr?.message);
      }
      // Issue a session for the new user via signInWithPassword so cookies are written
      const { data: signIn, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });
      if (signInErr || !signIn.user) {
        console.error("[accept:signin-after-create-failed]", signInErr?.message);
        return problem(500, "Session creation failed");
      }
      acceptingUserId = created.user.id;
      branch = "signup";

      // Best-effort profile population on the canonical account (name/phone
      // from the sign-up form, if provided). user_id is NOT set here — the
      // RPC will set it atomically. This UPDATE does not touch user_id, so
      // the trigger guard allows it.
      const updates: Record<string, unknown> = {};
      if (typeof name === "string" && name.trim()) updates.name = name.trim();
      if (typeof phone === "string" && phone.trim()) updates.phone = phone.trim();
      if (Object.keys(updates).length > 0) {
        await admin
          .from("affiliate_accounts")
          .update(updates)
          .eq("email", invite.email);
      }
    }
  }

  // Run the RPC — atomic: claim invite + activate junction + link user_id
  const { data: rpcData, error: rpcError } = await admin.rpc(
    "consume_invite_and_activate_junction",
    {
      p_invite_id: invite.id,
      p_user_id: acceptingUserId,
    },
  );

  if (rpcError) {
    const code = (rpcError as { code?: string }).code;
    if (code === "P0003") {
      return problem(
        410,
        "Invitation is no longer claimable",
        "The invite was expired, revoked, or already accepted between page load and submit.",
      );
    }
    if (code === "P0004") {
      return problem(
        409,
        "Affiliate account already linked to another user",
        "This affiliate identity is linked to a different Supabase user. Contact support.",
      );
    }
    console.error("[accept:rpc-error]", { code, message: rpcError.message });
    return problem(500, "Accept failed", rpcError.message);
  }
  if (!rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
    return problem(500, "Accept failed", "RPC returned no row");
  }

  const row = rpcData[0] as {
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
  };

  console.log("[accept:success]", {
    invite_id: row.invite_id,
    junction_id: row.junction_id,
    affiliate_account_id: row.affiliate_account_id,
    diviner_id: invite.diviner_id,
    branch,
  });

  return NextResponse.json(
    {
      data: {
        redirect_to: "/affiliate",
        invite_id: row.invite_id,
        junction_id: row.junction_id,
        affiliate_account_id: row.affiliate_account_id,
        branch,
      },
    },
    { status: 200 },
  );
}
