import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/commissions
// Returns commissions belonging to the authenticated diviner's affiliates.
// Uses the affiliate_commissions table (affiliate_id FK → diviner_affiliates).
// Query params: affiliate_id?, status?, limit?, cursor?
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const affiliateId = searchParams.get("affiliate_id");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  // Resolve diviner record so we scope to their affiliates only
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  // Build the query — join via affiliate_commissions.affiliate_id → diviner_affiliates.id
  // We use a sub-select: first get all affiliate IDs for this diviner, then filter commissions.
  const { data: affiliateRows, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("diviner_id", diviner.id);

  if (affError) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: affError.message, status: 500 },
      { status: 500 }
    );
  }

  const affiliateIds = (affiliateRows ?? []).map((a: { id: string }) => a.id);

  if (affiliateIds.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  let query = admin
    .from("affiliate_commissions")
    .select(
      "id, affiliate_id, diviner_id, link_id, order_reference, order_amount_cents, commission_type, commission_rate, commission_amount_cents, status, approved_at, notes, is_locked, created_at, updated_at"
    )
    .in("affiliate_id", affiliateId ? [affiliateId] : affiliateIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  // Scope to diviner's affiliates even when affiliate_id filter is supplied
  if (affiliateId && !affiliateIds.includes(affiliateId)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden — affiliate not under this diviner", status: 403 },
      { status: 403 }
    );
  }

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message, status: 500 },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
