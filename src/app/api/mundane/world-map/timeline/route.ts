import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const entity_id = sp.get("entity_id") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!entity_id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "entity_id is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("entity_stress_scores")
    .select("score_date, stress_score")
    .eq("entity_id", entity_id);

  if (from) {
    query = query.gte("score_date", from);
  }
  if (to) {
    query = query.lte("score_date", to);
  }

  query = query
    .order("score_date", { ascending: true })
    .order("id", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entity_id,
    from: from || null,
    to: to || null,
    timeline: (data ?? []).map((row: { score_date: string; stress_score: number }) => ({
      date: row.score_date,
      score: row.stress_score,
    })),
  });
}
