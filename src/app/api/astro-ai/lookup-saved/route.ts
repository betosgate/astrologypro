import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/astro-ai/lookup-saved
 *
 * Spec source:
 *   tasks/27.04.2026/community-monthly-transit-architecture/02-align-toolkit-report-persistence.md
 *
 * Looks up the most recent saved Astro Toolkit report for the
 * authenticated user that matches a deterministic identity:
 *   - toolname            (e.g. "tropical_transits_monthly_v3")
 *   - target month        ("YYYY-MM")  — looked up inside form_data
 *   - birth identity      (date_of_birth + birth_time + city/country
 *                         OR lat/lng), looked up inside form_data
 *
 * Why a dedicated lookup endpoint:
 *   The existing fetch-by-id endpoint requires the row's UUID — which
 *   the toolkit doesn't carry across sessions. This endpoint lets the
 *   toolkit ask "have I already generated this report for this user
 *   for this month + birth data?" and skip an expensive AI run when
 *   the answer is yes.
 *
 * Identity match strategy:
 *   We filter by (user_id, toolname) at the SQL level — those are
 *   indexed cheap reads — then walk the candidates in `created_at DESC`
 *   order matching the request's identity in JS. JSONB key extraction
 *   could be done in SQL but keeps the route resilient to evolving
 *   form_data shapes (e.g. nested `formData.self` for the romantic
 *   forecast). The candidate list per (user, toolname) is small.
 *
 * Body:
 *   {
 *     "toolname":      "tropical_transits_monthly_v3",
 *     "month":         "2026-04",                  // optional
 *     "dateOfBirth":   "1990-01-15",               // optional
 *     "birthTime":     "12:30",                    // optional
 *     "birthCity":     "Boston",                   // optional
 *     "birthCountry":  "USA",                      // optional
 *     "birthLat":      42.36,                       // optional
 *     "birthLng":      -71.06,                      // optional
 *     "limit":         5                            // optional, default 1
 *   }
 *
 * Response:
 *   { found: true,  res: <row> }
 *   { found: false }
 */

interface LookupBody {
  toolname?: string;
  month?: string;
  dateOfBirth?: string;
  birthTime?: string;
  birthCity?: string;
  birthCountry?: string;
  birthLat?: number;
  birthLng?: number;
  limit?: number;
}

/** Walks a JSONB blob looking for a property at any nested level. */
function deepFindString(blob: unknown, key: string): string | null {
  if (!blob || typeof blob !== "object") return null;
  if (Array.isArray(blob)) {
    for (const v of blob) {
      const hit = deepFindString(v, key);
      if (hit !== null) return hit;
    }
    return null;
  }
  const obj = blob as Record<string, unknown>;
  const v = obj[key];
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  for (const child of Object.values(obj)) {
    if (child && typeof child === "object") {
      const hit = deepFindString(child, key);
      if (hit !== null) return hit;
    }
  }
  return null;
}

function deepFindNumber(blob: unknown, key: string): number | null {
  if (!blob || typeof blob !== "object") return null;
  if (Array.isArray(blob)) {
    for (const v of blob) {
      const hit = deepFindNumber(v, key);
      if (hit !== null) return hit;
    }
    return null;
  }
  const obj = blob as Record<string, unknown>;
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  for (const child of Object.values(obj)) {
    if (child && typeof child === "object") {
      const hit = deepFindNumber(child, key);
      if (hit !== null) return hit;
    }
  }
  return null;
}

function approxEq(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as LookupBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const toolname = body.toolname?.trim();
    if (!toolname) {
      return NextResponse.json(
        { error: "Missing toolname" },
        { status: 400 }
      );
    }

    // Pull recent candidates scoped by (user, toolname). The candidate
    // set is normally tiny (often 0-5 rows per user per tool), so doing
    // identity matching in JS is cheap.
    const limit = Math.max(1, Math.min(body.limit ?? 25, 50));
    const admin = createAdminClient();
    const { data: candidates, error } = await admin
      .from("astro_ai_responses")
      .select("*")
      .eq("user_id", user.id)
      .eq("toolname", toolname)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[astro-ai/lookup-saved] read error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reqMonth = body.month?.trim() || null;
    const reqDob = body.dateOfBirth?.trim() || null;
    const reqTime = body.birthTime?.trim() || null;
    const reqCity = body.birthCity?.trim() || null;
    const reqCountry = body.birthCountry?.trim() || null;
    const reqLat =
      typeof body.birthLat === "number" ? body.birthLat : null;
    const reqLng =
      typeof body.birthLng === "number" ? body.birthLng : null;

    for (const row of candidates ?? []) {
      const formData = row.form_data ?? null;

      if (reqMonth) {
        const rowMonth =
          deepFindString(formData, "month") ??
          deepFindString(formData, "futureMonth") ??
          deepFindString(formData, "targetMonth");
        if (rowMonth !== reqMonth) continue;
      }

      if (reqDob) {
        const rowDob =
          deepFindString(formData, "dateOfBirth") ??
          deepFindString(formData, "date_of_birth") ??
          deepFindString(formData, "birthDate");
        if (rowDob !== reqDob) continue;
      }

      if (reqTime) {
        const rowTime =
          deepFindString(formData, "birthTime") ??
          deepFindString(formData, "birth_time") ??
          deepFindString(formData, "time_of_birth");
        if (rowTime !== reqTime) continue;
      }

      if (reqCity) {
        const rowCity =
          deepFindString(formData, "birthCity") ??
          deepFindString(formData, "birth_city") ??
          deepFindString(formData, "city");
        // City is best-effort match; skip if the row also stored a city
        // and it doesn't match.
        if (rowCity && rowCity.toLowerCase() !== reqCity.toLowerCase()) continue;
      }

      if (reqCountry) {
        const rowCountry =
          deepFindString(formData, "birthCountry") ??
          deepFindString(formData, "birth_country") ??
          deepFindString(formData, "country");
        if (rowCountry && rowCountry.toLowerCase() !== reqCountry.toLowerCase())
          continue;
      }

      if (reqLat != null) {
        const rowLat =
          deepFindNumber(formData, "birthLat") ??
          deepFindNumber(formData, "lat");
        if (rowLat != null && !approxEq(rowLat, reqLat)) continue;
      }

      if (reqLng != null) {
        const rowLng =
          deepFindNumber(formData, "birthLng") ??
          deepFindNumber(formData, "lng") ??
          deepFindNumber(formData, "lon");
        if (rowLng != null && !approxEq(rowLng, reqLng)) continue;
      }

      return NextResponse.json({ found: true, res: row });
    }

    return NextResponse.json({ found: false });
  } catch (err) {
    console.error("[astro-ai/lookup-saved] error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Lookup failed",
      },
      { status: 500 }
    );
  }
}
