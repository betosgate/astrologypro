/**
 * Shared Supabase SELECT strings for querying `diviner_affiliates` with the
 * canonical `affiliate_accounts` identity joined in.
 *
 * Use this from every Task 06 Tier-A endpoint when rewriting identity-reader
 * routes. The standard pattern is:
 *
 *   const { data } = await admin
 *     .from("diviner_affiliates")
 *     .select(DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT)
 *     .eq("diviner_id", diviner.id)
 *     ...;
 *
 *   return NextResponse.json({
 *     data: (data ?? []).map(flattenDivinerAffiliate),
 *   });
 *
 * `flattenDivinerAffiliate` collapses the nested `account` object back into
 * top-level keys so existing UIs keep working. See the 00-verification-report
 * §7 for the canonical flat shape.
 */

export const DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT = `
  id,
  diviner_id,
  affiliate_account_id,
  status,
  notes,
  default_commission_type,
  default_commission_value,
  invited_at,
  accepted_at,
  created_at,
  updated_at,
  account:affiliate_accounts (
    id,
    user_id,
    email,
    name,
    phone,
    avatar_url,
    status,
    tax_form_status
  )
` as const;

/**
 * Row shape as returned by the select above. `account` may be null only
 * in a narrow transition window before the 2026-04-23 backfill completes;
 * post-migration, every junction row has a canonical account.
 */
export type DivinerAffiliateWithAccount = {
  id: string;
  diviner_id: string;
  affiliate_account_id: string | null;
  status: "pending" | "active" | "suspended" | "blocked";
  notes: string | null;
  default_commission_type: "percentage" | "fixed" | null;
  default_commission_value: number | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    user_id: string | null;
    email: string;
    name: string;
    phone: string | null;
    avatar_url: string | null;
    status: "unclaimed" | "active" | "suspended" | "blocked";
    tax_form_status:
      | "not_collected"
      | "pending"
      | "verified"
      | "rejected";
  } | null;
};

/**
 * Legacy flat shape exposed by pre-refactor `/api/dashboard/affiliates*` endpoints.
 * Tier-A rewrites in Task 06 must preserve these top-level keys so the UI
 * needs no changes.
 */
export type FlatDivinerAffiliate = {
  id: string;
  diviner_id: string;
  status: "pending" | "active" | "suspended" | "blocked";
  notes: string | null;
  default_commission_type: "percentage" | "fixed" | null;
  default_commission_value: number | null;
  created_at: string;
  updated_at: string;

  // Legacy flat identity (same keys existing UI reads today)
  name: string;
  email: string;
  phone: string | null;
  user_id: string | null;

  // Additive canonical fields — safe to consume or ignore
  affiliate_account_id: string | null;
  avatar_url: string | null;
  account_status:
    | "unclaimed"
    | "active"
    | "suspended"
    | "blocked"
    | null;
  tax_form_status:
    | "not_collected"
    | "pending"
    | "verified"
    | "rejected"
    | null;
  invited_at: string | null;
  accepted_at: string | null;
};

/**
 * Flatten a joined row back into the legacy flat shape. Prefers canonical
 * fields from `account` when available, falls back to the legacy columns
 * on `diviner_affiliates` otherwise. Fallback is a belt-and-braces guard
 * for unmigrated rows or unexpected join failures — post-backfill every
 * junction has an account.
 */
export function flattenDivinerAffiliate(
  row: DivinerAffiliateWithAccount & {
    // Legacy columns still present on diviner_affiliates during the transition
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    user_id?: string | null;
  },
): FlatDivinerAffiliate {
  const account = row.account;
  return {
    id: row.id,
    diviner_id: row.diviner_id,
    status: row.status,
    notes: row.notes,
    default_commission_type: row.default_commission_type,
    default_commission_value: row.default_commission_value,
    created_at: row.created_at,
    updated_at: row.updated_at,

    name: account?.name ?? row.name ?? "",
    email: account?.email ?? row.email ?? "",
    phone: account?.phone ?? row.phone ?? null,
    user_id: account?.user_id ?? row.user_id ?? null,

    affiliate_account_id: account?.id ?? row.affiliate_account_id ?? null,
    avatar_url: account?.avatar_url ?? null,
    account_status: account?.status ?? null,
    tax_form_status: account?.tax_form_status ?? null,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at,
  };
}
