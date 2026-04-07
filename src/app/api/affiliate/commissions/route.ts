import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/affiliate/commissions
// Paginated list of commissions for the authenticated affiliate user
// Query: status?, limit?, cursor?
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

  const admin = createAdminClient();

  // Look up affiliate record
  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (affError) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: affError.message },
      { status: 500 }
    );
  }

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate record not found", status: 404 },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor");

  let query = admin
    .from("affiliate_commissions")
    .select(
      "id, order_reference, order_amount_cents, commission_type, commission_rate, commission_amount_cents, status, approved_at, notes, created_at"
    )
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
