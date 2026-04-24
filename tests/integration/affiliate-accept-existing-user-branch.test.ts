/**
 * Regression guard for the Task 01 fix at
 *   docs/tasks/2026-04-24/affiliate-identity-followups/01-fix-accept-flow-existing-user-branch.md
 *
 * The bug: POST /api/affiliate/accept decided sign-in vs sign-up by reading
 * affiliate_accounts.user_id. That proxy is wrong when the invitee
 * independently signs up as a client before accepting — user_id stays NULL
 * on the canonical row while auth.users already holds an account for that
 * email, so the route fell into the sign-up branch and failed on duplicate
 * email in admin.auth.admin.createUser.
 *
 * The fix: findAuthUserIdByEmail now queries Supabase Auth authoritatively.
 * This test reproduces the exact pre-accept data state (invite present,
 * auth.users row present, affiliate_accounts.user_id NULL) and asserts the
 * helper returns the real auth user id — i.e. the route would take the
 * sign-in branch, not the sign-up branch.
 *
 * Scope: deliberately narrow. The full accept flow (signInWithPassword,
 * consume_invite_and_activate_junction, etc.) is covered by the existing
 * affiliate-accept-rpc.test.ts suite.
 *
 * Run: `npm run test:affiliate-accept-existing-user`
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserIdByEmail } from "../../src/app/api/affiliate/accept/route";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const sr: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Matches the fixture diviner used by the other affiliate integration tests.
const TEST_DIV_USER = "e8a4f928-954c-4c0e-99c3-53ac8889bd81";

function mkTok() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: crypto.createHash("sha256").update(raw).digest("hex") };
}

async function createInviteAndAuthUser() {
  const { data: div } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", TEST_DIV_USER)
    .single();

  const email = `e2e-existing-user+${Date.now()}@test.astrologypro.com`;
  const token = mkTok();

  const { data: rpcData, error: rpcErr } = await sr.rpc("create_affiliate_invite", {
    p_diviner_id: (div as { id: string }).id,
    p_email: email,
    p_name: "E2E Existing User",
    p_phone: null,
    p_message: null,
    p_commission_type: "percentage",
    p_commission_value: 10,
    p_token_hash: token.hash,
    p_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    p_created_by: TEST_DIV_USER,
  });
  if (rpcErr) throw new Error(rpcErr.message);
  const row = (rpcData as Array<{
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
  }>)[0];

  // Pre-existing auth.users record — simulates the invitee having signed up
  // independently as a client before ever seeing the invite email.
  const { data: u, error: uErr } = await sr.auth.admin.createUser({
    email,
    password: "TempPass12345!",
    email_confirm: true,
  });
  if (uErr) throw new Error(uErr.message);

  return { ...row, email, userId: u.user!.id };
}

async function teardown(ctx: {
  invite_id: string;
  junction_id: string;
  affiliate_account_id: string;
  userId: string;
}) {
  await sr.from("affiliate_invites").delete().eq("id", ctx.invite_id);
  await sr.from("diviner_affiliates").delete().eq("id", ctx.junction_id);
  await sr.from("affiliate_accounts").delete().eq("id", ctx.affiliate_account_id);
  await sr.auth.admin.deleteUser(ctx.userId).catch(() => {});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test("findAuthUserIdByEmail — returns auth user even when affiliate_accounts.user_id is NULL", async () => {
  const ctx = await createInviteAndAuthUser();
  try {
    // Sanity check: the data state mirrors the bug report. affiliate_accounts
    // row exists with user_id NULL, while auth.users already has a row for
    // the same email. The old (broken) proxy check would return null here.
    const { data: acc } = await sr
      .from("affiliate_accounts")
      .select("user_id")
      .eq("id", ctx.affiliate_account_id)
      .single();
    assert.equal(
      acc!.user_id,
      null,
      "pre-accept canonical row must have user_id NULL to reproduce the bug",
    );

    const found = await findAuthUserIdByEmail(sr, ctx.email);
    assert.equal(
      found,
      ctx.userId,
      "helper must return the real auth user id so the route takes the sign-in branch",
    );
  } finally {
    await teardown(ctx);
  }
});

test("findAuthUserIdByEmail — returns null when no auth user exists for the email", async () => {
  const unusedEmail = `e2e-nobody+${Date.now()}@test.astrologypro.com`;
  const found = await findAuthUserIdByEmail(sr, unusedEmail);
  assert.equal(
    found,
    null,
    "helper must return null so the route takes the sign-up branch",
  );
});

test("findAuthUserIdByEmail — case-insensitive email match", async () => {
  const ctx = await createInviteAndAuthUser();
  try {
    const mixedCase = ctx.email.toUpperCase();
    const found = await findAuthUserIdByEmail(sr, mixedCase);
    assert.equal(
      found,
      ctx.userId,
      "email lookup must be case-insensitive — Supabase Auth stores emails lower-cased",
    );
  } finally {
    await teardown(ctx);
  }
});
