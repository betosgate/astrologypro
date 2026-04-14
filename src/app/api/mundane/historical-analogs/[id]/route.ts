import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "id is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const [periodRes, matchesRes] = await Promise.all([
    admin
      .from("mundane_historical_periods")
      .select("id, label, period_start, period_end, dominant_aspects, dominant_planets, notes, outcome_description, tags, similarity_vectors, created_at")
      .eq("id", id)
      .single(),

    admin
      .from("mundane_analog_matches")
      .select("id, reference_date, similarity_score, matching_factors, computed_at")
      .eq("historical_period_id", id)
      .order("computed_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20),
  ]);

  if (periodRes.error || !periodRes.data) {
    if (periodRes.error?.code === "PGRST116") {
      return NextResponse.json(
        { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Historical period not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: periodRes.error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    period: periodRes.data,
    analog_matches: matchesRes.data ?? [],
  });
}
