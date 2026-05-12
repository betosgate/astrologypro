// migrated-to-canonical-accounts: 2026-04-23
// Task 02 removed the direct-add POST; Task 04 extends GET to include the
// canonical affiliate_accounts join + latest invite per pending row + the
// diviner's affiliate-agreement flag.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT,
  flattenDivinerAffiliate,
  type DivinerAffiliateWithAccount,
  type FlatDivinerAffiliate,
} from "@/lib/affiliate-queries";

export const dynamic = "force-dynamic";

type LatestInvite = {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  resent_count: number;
  created_at: string;
};

type FlatWithInvite = FlatDivinerAffiliate & {
  latest_invite: LatestInvite | null;
};

/**
 * GET /api/dashboard/affiliates
 *
 * Returns this diviner's affiliates (paginated) with:
 *   - Flat identity fields (name/email/phone/user_id) preferring canonical
 *     account over legacy columns (Task 06 convention).
 *   - Additive canonical fields (affiliate_account_id, account_status,
 *     avatar_url, tax_form_status, invited_at, accepted_at).
 *   - latest_invite: latest non-consumed invite for pending junctions; null
 *     otherwise. Lets the UI drive Resend / Revoke / Copy Link actions
 *     without a second fetch.
 *   - meta.affiliate_agreement_signed for the agreement gate banner.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const offset = (page - 1) * limit;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, affiliate_agreement_signed")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 },
    );
  }

  let query = admin
    .from("diviner_affiliates")
    .select(DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT + ", name, email, phone, user_id", { count: "exact" })
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59Z");

  const { data: rawRows, error, count } = await query;
  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
      },
      { status: 500 },
    );
  }

  const rows = (rawRows ?? []) as unknown as Array<
    DivinerAffiliateWithAccount & {
      name: string | null;
      email: string | null;
      phone: string | null;
      user_id: string | null;
    }
  >;

  // Attach latest non-consumed invite to each pending row (batched lookup)
  const pendingIds = rows
    .filter((r) => r.status === "pending")
    .map((r) => r.id);

  const invitesByJunction = new Map<string, LatestInvite>();
  if (pendingIds.length > 0) {
    const { data: invites } = await admin
      .from("affiliate_invites")
      .select("id, junction_id, expires_at, revoked_at, resent_count, created_at")
      .in("junction_id", pendingIds)
      .is("consumed_at", null)
      .order("created_at", { ascending: false });

    for (const inv of invites ?? []) {
      if (!invitesByJunction.has(inv.junction_id)) {
        invitesByJunction.set(inv.junction_id, {
          id: inv.id,
          expires_at: inv.expires_at,
          revoked_at: inv.revoked_at,
          resent_count: inv.resent_count ?? 0,
          created_at: inv.created_at,
        });
      }
    }
  }

  const items: FlatWithInvite[] = rows.map((row) => ({
    ...flattenDivinerAffiliate(row),
    latest_invite: invitesByJunction.get(row.id) ?? null,
  }));

  return NextResponse.json({
    data: items,
    total: count ?? 0,
    meta: {
      affiliate_agreement_signed: Boolean(diviner.affiliate_agreement_signed),
    },
  });
}
