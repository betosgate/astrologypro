import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const outcomeStatus = sp.get("outcome_status") ?? "";
  const entityId = sp.get("entity_id") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  const VALID_OUTCOME_STATUS = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, leader_id, forecast_period_start, forecast_period_end, event_categories, confidence_level, outcome_status, is_public, created_at",
      { count: "exact" }
    )
    .eq("is_public", true);

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }
  if (outcomeStatus && (VALID_OUTCOME_STATUS as readonly string[]).includes(outcomeStatus)) {
    query = query.eq("outcome_status", outcomeStatus);
  }

  query = query
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    forecasts: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}
