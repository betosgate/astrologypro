import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET: list historical periods ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const tag = sp.get("tag") ?? "";
  const planet = sp.get("planet") ?? "";

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_historical_periods")
    .select("id, label, period_start, period_end, dominant_aspects, dominant_planets, notes, outcome_description, tags, created_at")
    .order("period_start", { ascending: false })
    .order("id", { ascending: true });

  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (planet) {
    query = query.contains("dominant_planets", [planet]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ periods: data ?? [] });
}

// ─── POST: run analog match for a reference_date + planet_list ────────────────
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    reference_date?: string;
    planet_list?: string[];
  };

  const { reference_date, planet_list } = body;

  if (!reference_date) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "reference_date is required (YYYY-MM-DD)" },
      { status: 422 }
    );
  }

  if (!planet_list || !Array.isArray(planet_list) || planet_list.length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "planet_list is required and must be a non-empty array" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch all historical periods
  const { data: periods, error: periodsError } = await admin
    .from("mundane_historical_periods")
    .select("id, label, period_start, period_end, dominant_aspects, dominant_planets, notes, outcome_description, tags")
    .order("period_start", { ascending: false })
    .order("id", { ascending: true });

  if (periodsError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: periodsError.message },
      { status: 500 }
    );
  }

  // Normalise input planets for case-insensitive comparison
  const normInput = planet_list.map((p) => p.trim().toLowerCase());

  // Score each period: matching_count / max(len(provided), len(historical))
  type MatchResult = {
    historical_period_id: string;
    label: string;
    period_start: string;
    period_end: string;
    dominant_aspects: string[];
    dominant_planets: string[];
    outcome_description: string | null;
    tags: string[];
    similarity_score: number;
    matching_factors: string[];
  };

  const results: MatchResult[] = (periods ?? []).map((p) => {
    const histPlanets: string[] = (p.dominant_planets ?? []).map((pl: string) =>
      pl.trim().toLowerCase()
    );
    const matchingFactors = normInput.filter((inp) => histPlanets.includes(inp));
    const matchingCount = matchingFactors.length;
    const denominator = Math.max(normInput.length, histPlanets.length);
    const score = denominator === 0 ? 0 : parseFloat((matchingCount / denominator).toFixed(4));

    return {
      historical_period_id: p.id,
      label: p.label,
      period_start: p.period_start,
      period_end: p.period_end,
      dominant_aspects: p.dominant_aspects ?? [],
      dominant_planets: p.dominant_planets ?? [],
      outcome_description: p.outcome_description ?? null,
      tags: p.tags ?? [],
      similarity_score: score,
      matching_factors: matchingFactors,
    };
  });

  // Sort by score desc, take top 5
  const top5 = results
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);

  // Persist matches to mundane_analog_matches (upsert not applicable — always insert fresh)
  if (top5.length > 0) {
    const inserts = top5.map((m) => ({
      reference_date,
      historical_period_id: m.historical_period_id,
      similarity_score: m.similarity_score,
      matching_factors: m.matching_factors,
      computed_at: new Date().toISOString(),
      created_by: adminUser.id,
    }));

    // Fire-and-forget — don't block the response on insert errors
    admin.from("mundane_analog_matches").insert(inserts).then(() => {});
  }

  return NextResponse.json({
    reference_date,
    planet_list,
    matches: top5,
  });
}
