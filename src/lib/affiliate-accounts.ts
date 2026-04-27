/**
 * Canonical affiliate-account helpers.
 *
 * `affiliate_accounts` is the single source of truth for a diviner-affiliate's
 * identity (email, login, profile, payout method). One row per person.
 * `diviner_affiliates` is a junction — one row per (diviner, account) partnership.
 *
 * These helpers are the ONLY supported way to read / write `affiliate_accounts`.
 * Do NOT update `affiliate_accounts.user_id` outside the accept-flow RPC —
 * a DB trigger (20260423000003_accept_rpc) will raise P0005 otherwise.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type AffiliateAccountStatus =
  | "unclaimed"
  | "active"
  | "suspended"
  | "blocked";

export type AffiliateAccount = {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string | null;
  payout_method: "bank" | "paypal" | "check" | "other" | null;
  payout_details: unknown;
  tax_form_status:
    | "not_collected"
    | "pending"
    | "verified"
    | "rejected";
  tax_form_url: string | null;
  status: AffiliateAccountStatus;
  notification_prefs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Fetch the canonical affiliate account for an auth user.
 * Returns null if the user is not an affiliate.
 */
export async function getAffiliateAccountByUserId(
  admin: Admin,
  userId: string,
): Promise<AffiliateAccount | null> {
  const { data, error } = await admin
    .from("affiliate_accounts")
    .select(
      "id, user_id, email, name, phone, avatar_url, timezone, payout_method, payout_details, tax_form_status, tax_form_url, status, notification_prefs, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as AffiliateAccount | null) ?? null;
}

/**
 * Fetch the canonical affiliate account by email (case-insensitive — the
 * column is CITEXT so equality works regardless of case).
 */
export async function getAffiliateAccountByEmail(
  admin: Admin,
  email: string,
): Promise<AffiliateAccount | null> {
  const { data, error } = await admin
    .from("affiliate_accounts")
    .select(
      "id, user_id, email, name, phone, avatar_url, timezone, payout_method, payout_details, tax_form_status, tax_form_url, status, notification_prefs, created_at, updated_at",
    )
    .eq("email", email.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as AffiliateAccount | null) ?? null;
}

/**
 * Upsert a canonical affiliate account by email. Used by the invite flow.
 *
 * - If no row exists for the email → inserts one with status='unclaimed'.
 * - If a row exists → preserves its existing name/phone (does NOT overwrite
 *   from diviner-provided values; the invite is a contact prompt, not a
 *   profile update).
 *
 * Does NOT set user_id — that happens only via the accept-flow RPC.
 */
export async function upsertAffiliateAccount(
  admin: Admin,
  params: {
    email: string;
    name: string;
    phone?: string | null;
  },
): Promise<{ account: AffiliateAccount; created: boolean }> {
  const email = params.email.trim();
  const name = params.name.trim();
  if (!email || !name) {
    throw new Error("upsertAffiliateAccount: email and name are required");
  }

  const existing = await getAffiliateAccountByEmail(admin, email);
  if (existing) {
    return { account: existing, created: false };
  }

  const { data, error } = await admin
    .from("affiliate_accounts")
    .insert({
      email,
      name,
      phone: params.phone ?? null,
      status: "unclaimed",
    })
    .select(
      "id, user_id, email, name, phone, avatar_url, timezone, payout_method, payout_details, tax_form_status, tax_form_url, status, notification_prefs, created_at, updated_at",
    )
    .single();

  if (error) {
    // Race: another request inserted the row between the existence check
    // and our insert. Re-fetch and return existing.
    if (error.code === "23505") {
      const nowExisting = await getAffiliateAccountByEmail(admin, email);
      if (nowExisting) return { account: nowExisting, created: false };
    }
    throw new Error(error.message);
  }

  return { account: data as AffiliateAccount, created: true };
}

/**
 * Resolve the authorization context for a caller hitting an /api/affiliate/*
 * endpoint. Returns the canonical account + the set of junction IDs the
 * caller owns. All /api/affiliate/* endpoints should gate on this: if it
 * returns null, respond with 403.
 *
 * - 403 (via null return) when the user has no canonical account, or the
 *   account is suspended/blocked/unclaimed.
 * - Returns empty `junctionIds` for an affiliate with zero partnerships
 *   (still authorized to see empty-state UI).
 */
export async function resolveAffiliateForCaller(
  admin: Admin,
  userId: string,
): Promise<{ account: AffiliateAccount; junctionIds: string[] } | null> {
  const account = await getAffiliateAccountByUserId(admin, userId);
  if (!account || account.status !== "active") return null;

  const { data: junctions } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("affiliate_account_id", account.id);
  const junctionIds = (junctions ?? []).map((j) => j.id);

  return { account, junctionIds };
}

/**
 * Inverse of `resolveAffiliateForCaller` — given a junction id
 * (`diviner_affiliates.id`), resolve the canonical affiliate account
 * so notifications + emails can be targeted at the real user.
 *
 * Returns `null` if the junction doesn't exist or the joined account is
 * missing. Callers should log and skip notification when this returns
 * null — don't raise.
 */
export async function getAffiliateAccountForJunction(
  admin: Admin,
  junctionId: string,
): Promise<AffiliateAccount | null> {
  const { data: junction } = await admin
    .from("diviner_affiliates")
    .select("affiliate_account_id")
    .eq("id", junctionId)
    .maybeSingle();
  if (!junction || !junction.affiliate_account_id) return null;

  const { data: account } = await admin
    .from("affiliate_accounts")
    .select(
      "id, user_id, email, name, phone, avatar_url, timezone, payout_method, payout_details, tax_form_status, tax_form_url, status, notification_prefs, created_at, updated_at",
    )
    .eq("id", junction.affiliate_account_id)
    .maybeSingle();
  return (account ?? null) as AffiliateAccount | null;
}

/**
 * Link an auth user to a canonical affiliate account.
 *
 * IMPORTANT: This helper is only valid inside the accept-flow RPC context.
 * Direct calls from route handlers will fail with P0005 because a DB trigger
 * (see migration 20260423000003_accept_rpc) guards `affiliate_accounts.user_id`
 * against writes outside that RPC.
 *
 * Call `consume_invite_and_activate_junction(p_invite_id, p_user_id)` via
 * `admin.rpc(...)` from the accept route; that RPC calls this linkage
 * internally with the right transaction-local flag set.
 */
export async function linkUserToAffiliateAccount(
  admin: Admin,
  params: { inviteId: string; userId: string },
): Promise<void> {
  const { error } = await admin.rpc(
    "consume_invite_and_activate_junction",
    {
      p_invite_id: params.inviteId,
      p_user_id: params.userId,
    },
  );
  if (error) throw new Error(error.message);
}
