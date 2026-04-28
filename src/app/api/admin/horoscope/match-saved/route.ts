import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/horoscope/match-saved
 *
 * Looks up the most recent saved astro toolkit artifact whose form_data
 * matches the submitted form data for the given toolname. Used by the
 * /admin/horoscope toolkit to skip live compute + AI calls when the same
 * (toolname, person identity) has already been generated and saved.
 *
 * Why this endpoint vs. /api/astro-ai/lookup-saved:
 *   - lookup-saved is scoped to the *authenticated end user* (`user_id`)
 *     and operates on a fixed set of identity fields used by the
 *     community flow. Admins viewing the horoscope tool need to be able
 *     to find ANY saved row (their own, an end user's, or a session
 *     prefill) by birth identity alone.
 *   - The legacy save path stored real form data inside `ai_response`
 *     (under `formData`/`form_data`) rather than the column. We must
 *     deep-search both surfaces to honour those rows.
 *
 * Request body shape — mirrors the toolkit's runtime FormState:
 *   {
 *     "toolname": "tropical_transits_monthly_v3",
 *     "type":     "single" | "two-person",
 *     "person1": {
 *       "dob":  "YYYY-MM-DD",
 *       "tob":  "HH:MM",
 *       "city": { "lat": number, "lng": number, "label": string,
 *                 "timezone": { ... } } | null
 *     },
 *     "person2": <same shape as person1, optional>,
 *     "extras":  { "areaOfInquiry"?, "question"?, "futureWeek"?, "futureMonth"? },
 *     "limit":   number  (optional, default 30)
 *   }
 *
 * Response:
 *   { found: true,  res: <astro_ai_responses row> }
 *   { found: false }
 *
 * Match strategy:
 *   1. Filter by `toolname` at the SQL layer (cheap indexed read).
 *   2. Walk recent candidates (default 30) and compare birth identity
 *      against each row's effective form_data, looking inside both the
 *      `form_data` column and `ai_response.formData` / `.form_data`.
 *   3. For "single" tools: identity = (year, month, day, hour, min, lat, lon).
 *   4. For "two-person" tools: identity must match for BOTH self and
 *      partner; we accept either order (self↔partner) so legacy rows
 *      saved with partner-first don't slip through.
 *   5. Optional extras (futureMonth, futureWeek, question) further
 *      narrow the match for tools that produce different reports for
 *      the same birth identity but a different target date/question.
 *
 * No writes. Read-only.
 */

interface PersonInput {
  dob?: string | null;
  tob?: string | null;
  city?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
}

interface MatchBody {
  toolname?: string;
  type?: "single" | "two-person";
  person1?: PersonInput | null;
  person2?: PersonInput | null;
  extras?: {
    areaOfInquiry?: string;
    question?: string;
    futureWeek?: string;
    futureMonth?: string;
  } | null;
  limit?: number;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

/**
 * Resolve the canonical `formData` blob from a saved row. Prefers the
 * top-level column when populated; falls back to whatever the legacy
 * save path stored inside `ai_response`.
 */
function resolveFormData(row: JsonRecord): JsonRecord | null {
  const colForm = asRecord(row.form_data);
  if (colForm && Object.keys(colForm).length > 0) return colForm;

  const ai = asRecord(row.ai_response);
  if (!ai) return null;
  return (
    asRecord(ai.formData) ??
    asRecord(ai.form_data) ??
    null
  );
}

/**
 * Identity tuple for a single person. Matches the `parseBirth(...)`
 * shape the toolkit page builds before saving:
 *   { day, month, year, hour, min, lat, lon, tzone }
 *
 * We accept a few legacy spellings so older rows still match.
 */
interface Identity {
  year: number | null;
  month: number | null;
  day: number | null;
  hour: number | null;
  min: number | null;
  lat: number | null;
  lon: number | null;
  dob: string | null;
  tob: string | null;
}

function pickNumber(source: JsonRecord | null, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    const v = source[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const parsed = Number(v);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function pickString(source: JsonRecord | null, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const v = source[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function identityFrom(source: JsonRecord | null): Identity {
  if (!source) {
    return {
      year: null, month: null, day: null,
      hour: null, min: null,
      lat: null, lon: null,
      dob: null, tob: null,
    };
  }

  // Birth date components — direct first, then derive from `dob`/`birthDate`.
  let year = pickNumber(source, ["year", "birthYear", "birth_year"]);
  let month = pickNumber(source, ["month", "birthMonth", "birth_month"]);
  let day = pickNumber(source, ["day", "date", "birthDay", "birth_day"]);

  const dob = pickString(source, [
    "dob", "dateOfBirth", "date_of_birth", "birthDate", "birth_date",
  ]);
  if (dob && (!year || !month || !day)) {
    const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      year = year ?? Number(m[1]);
      month = month ?? Number(m[2]);
      day = day ?? Number(m[3]);
    }
  }

  // Birth time components.
  let hour = pickNumber(source, ["hour", "hours", "birthHour", "birth_hour"]);
  let min = pickNumber(source, [
    "min", "minute", "minutes", "birthMinute", "birth_minute",
  ]);
  const tob = pickString(source, [
    "tob", "birthTime", "birth_time", "timeOfBirth", "time_of_birth",
  ]);
  if (tob && (hour == null || min == null)) {
    const m = tob.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      hour = hour ?? Number(m[1]);
      min = min ?? Number(m[2]);
    }
  }

  // Location — direct lat/lng first, then nested `city.{lat,lng}`.
  let lat = pickNumber(source, [
    "lat", "latitude", "birthLat", "birth_lat",
  ]);
  let lon = pickNumber(source, [
    "lon", "lng", "longitude", "birthLng", "birth_lng",
  ]);
  if (lat == null || lon == null) {
    const city = asRecord(source.city);
    if (city) {
      lat = lat ?? pickNumber(city, ["lat", "latitude"]);
      lon = lon ?? pickNumber(city, ["lng", "lon", "longitude"]);
    }
  }

  return { year, month, day, hour, min, lat, lon, dob, tob };
}

function approxEq(a: number | null, b: number | null, eps = 0.01): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= eps;
}

function exactEq(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return false;
  return a === b;
}

/**
 * Compare two identities. Returns true when every available field on
 * the *candidate* request matches what the saved row stored. We treat
 * lat/lon with a small epsilon to tolerate the ±1e-6 jitter different
 * Google Places picks for the same city. Birth date and time must
 * match exactly — they're integers.
 */
function identityMatches(req: Identity, row: Identity): boolean {
  if (!exactEq(req.year, row.year)) return false;
  if (!exactEq(req.month, row.month)) return false;
  if (!exactEq(req.day, row.day)) return false;
  if (!exactEq(req.hour, row.hour)) return false;
  if (!exactEq(req.min, row.min)) return false;
  if (!approxEq(req.lat, row.lat, 0.01)) return false;
  if (!approxEq(req.lon, row.lon, 0.01)) return false;
  return true;
}

/**
 * Extract the per-person sub-records from a saved formData. Two-person
 * tools nest under `self`/`partner`; single tools store flat. We accept
 * both shapes so a tool that switched type doesn't lose match.
 */
function splitPersons(formData: JsonRecord | null): {
  self: JsonRecord | null;
  partner: JsonRecord | null;
} {
  if (!formData) return { self: null, partner: null };

  const self =
    asRecord(formData.self) ??
    asRecord(formData.person1) ??
    asRecord(formData.primary) ??
    formData;
  const partner =
    asRecord(formData.partner) ??
    asRecord(formData.person2) ??
    asRecord(formData.secondary) ??
    asRecord(formData.spouse) ??
    null;

  return { self, partner };
}

/**
 * Build the request-side identities from the body. The toolkit submits
 * runtime FormState (`{ dob, tob, city: { lat, lng } }`) rather than
 * the parsed `parseBirth` shape, so we run identityFrom on the raw
 * person input — the helper handles both surfaces.
 */
function reqIdentitiesFromBody(body: MatchBody): {
  self: Identity;
  partner: Identity | null;
  twoPerson: boolean;
} {
  const self = identityFrom(asRecord(body.person1) ?? null);
  const partner = body.person2
    ? identityFrom(asRecord(body.person2) ?? null)
    : null;
  return {
    self,
    partner,
    twoPerson: body.type === "two-person",
  };
}

function isComplete(id: Identity): boolean {
  return (
    id.year != null && id.month != null && id.day != null &&
    id.hour != null && id.min != null &&
    id.lat != null && id.lon != null
  );
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as MatchBody | null;
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

    const reqIds = reqIdentitiesFromBody(body);

    // We need at minimum a complete self identity to match anything
    // meaningful. Without birth date+time+location we'd return any row
    // for the toolname, which is never what the toolkit wants.
    if (!isComplete(reqIds.self)) {
      return NextResponse.json({ found: false });
    }
    if (reqIds.twoPerson && (!reqIds.partner || !isComplete(reqIds.partner))) {
      return NextResponse.json({ found: false });
    }

    // Optional extras to further narrow the match. Only enforce them
    // when the request explicitly carries a non-empty value — saved
    // rows that omit the field still count as a hit on identity alone,
    // which matches user expectations on tools where the extra is
    // advisory (e.g. areaOfInquiry).
    const reqFutureMonth = body.extras?.futureMonth?.trim() || null;
    const reqFutureWeek = body.extras?.futureWeek?.trim() || null;
    const reqQuestion = body.extras?.question?.trim() || null;

    const limit = Math.max(1, Math.min(body.limit ?? 30, 100));
    const admin = createAdminClient();

    // Pull recent candidates scoped by toolname only. Doing the JSON
    // identity match in Node keeps the route resilient to evolving
    // form_data shapes across legacy/new save paths.
    const { data: candidates, error } = await admin
      .from("astro_ai_responses")
      .select(
        [
          "id",
          "user_id",
          "toolname",
          "form_data",
          "ai_response",
          "natal_chart",
          "astro_api_data",
          "free_natal_wheel_chart",
          "free_natal_wheel_chart_transit",
          "free_natal_wheel_chart_self",
          "free_natal_wheel_chart_partner",
          "free_natal_wheel_chart_p2",
          "free_natal_wheel_chart_transit_p2",
          "summary",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .eq("toolname", toolname)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[admin/horoscope/match-saved] read error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const candidate of candidates ?? []) {
      const row = candidate as JsonRecord;
      const formData = resolveFormData(row);
      if (!formData) continue;

      // Optional extras gate first — these are cheap string compares
      // and let us skip identity work for obviously-wrong rows.
      if (reqFutureMonth) {
        const rowFutureMonth =
          pickString(formData, ["futureMonth", "future_month", "targetMonth", "target_month"]);
        if (rowFutureMonth && rowFutureMonth.slice(0, 7) !== reqFutureMonth.slice(0, 7)) continue;
      }
      if (reqFutureWeek) {
        const rowFutureWeek =
          pickString(formData, ["futureWeek", "future_week", "weekStartDate", "week_start_date"]);
        if (rowFutureWeek && rowFutureWeek.slice(0, 10) !== reqFutureWeek.slice(0, 10)) continue;
      }
      if (reqQuestion) {
        const rowQuestion =
          pickString(formData, ["question", "horaryQuestion", "horary_question"]);
        if (rowQuestion && rowQuestion.toLowerCase() !== reqQuestion.toLowerCase()) continue;
      }

      const { self: rowSelf, partner: rowPartner } = splitPersons(formData);
      const rowSelfId = identityFrom(rowSelf);

      if (reqIds.twoPerson) {
        // Need a partner identity on both sides.
        if (!rowPartner) continue;
        const rowPartnerId = identityFrom(rowPartner);

        const direct =
          identityMatches(reqIds.self, rowSelfId) &&
          identityMatches(reqIds.partner!, rowPartnerId);
        const swapped =
          identityMatches(reqIds.self, rowPartnerId) &&
          identityMatches(reqIds.partner!, rowSelfId);

        if (!direct && !swapped) continue;
      } else {
        if (!identityMatches(reqIds.self, rowSelfId)) continue;
      }

      return NextResponse.json({ found: true, res: row });
    }

    return NextResponse.json({ found: false });
  } catch (err) {
    console.error("[admin/horoscope/match-saved] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Match-saved failed" },
      { status: 500 }
    );
  }
}
