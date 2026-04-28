import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveAndLinkMonthlyReport } from "@/lib/community/saved-report-link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/saved-reports/monthly/link
 *
 * Spec source:
 *   tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle/04-save-and-link-full-monthly-report.md
 *
 * Thin authenticated wrapper around `saveAndLinkMonthlyReport(...)`.
 *
 * Two operating modes:
 *
 *   1. Inline payload  — caller already has the full toolkit payload
 *      ready (e.g. a future callback from HoroscopeToolkitPage):
 *        { familyMemberId, monthKey, payload }
 *      We persist a fresh artifact row + link it.
 *
 *   2. Lookup-and-link — caller passed identity fields only. The toolkit
 *      already auto-saved its payload to astro_ai_responses (via the
 *      earlier save-persistence partial), so we look up the most-recent
 *      matching row for this (user, toolname, month, birth-identity)
 *      and link it onto monthly_transits without inserting a duplicate.
 *      This is the path the manual "Save This Report" button uses.
 *
 * Validation
 * ─────────
 * - Auth required (Supabase session).
 * - Active `perennial_mandalism` membership required.
 * - `familyMemberId` must belong to the caller's household.
 * - `monthKey` must match `YYYY-MM`.
 * - Inline mode: `payload.toolname` must be `tropical_transits_monthly_v3`.
 *
 * Response
 * ────────
 *   200  { reportId, domainLinked: true, mode: "inline" | "lookup_and_link" }
 *   422  { error }   validation failure (missing fields, bad month, etc.)
 *   403  { error }   ownership / membership rejection
 *   404  { error }   lookup-mode found no matching saved artifact
 *   500  { error }   write failure
 */

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const TOOLNAME = "tropical_transits_monthly_v3";

interface InlineBody {
  familyMemberId?: string;
  monthKey?: string;
  payload?: Record<string, unknown>;
}

interface LookupBody {
  familyMemberId?: string;
  monthKey?: string;
  toolname?: string;
  dateOfBirth?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  birthLat?: number | null;
  birthLng?: number | null;
}

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("community_members")
      .select("id, membership_type, membership_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }
    if (member.membership_type !== "perennial_mandalism") {
      return NextResponse.json(
        { error: "Perennial Mandalism membership required" },
        { status: 403 }
      );
    }
    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Inactive membership" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as InlineBody &
      LookupBody;

    const familyMemberId = body.familyMemberId?.trim();
    const monthKey = body.monthKey?.trim();
    if (!familyMemberId) {
      return NextResponse.json(
        { error: "`familyMemberId` is required" },
        { status: 422 }
      );
    }
    if (!monthKey || !MONTH_RE.test(monthKey)) {
      return NextResponse.json(
        { error: "`monthKey` must be a valid YYYY-MM string" },
        { status: 422 }
      );
    }

    // Object-level authz: family member must belong to the caller's household.
    const admin = createAdminClient();
    const { data: fm } = await admin
      .from("community_family_members")
      .select("id, member_id")
      .eq("id", familyMemberId)
      .eq("member_id", member.id)
      .maybeSingle();
    if (!fm) {
      return NextResponse.json(
        { error: "Family member not found in your household" },
        { status: 403 }
      );
    }

    // ── Mode 1 — inline payload save + link ────────────────────────────
    if (body.payload && typeof body.payload === "object") {
      const payload = body.payload as Record<string, unknown> & {
        toolname?: string;
      };
      if (payload.toolname !== TOOLNAME) {
        return NextResponse.json(
          { error: `payload.toolname must be "${TOOLNAME}"` },
          { status: 422 }
        );
      }
      const result = await saveAndLinkMonthlyReport({
        userId: user.id,
        familyMemberId,
        monthKey,
        payload: payload as Parameters<
          typeof saveAndLinkMonthlyReport
        >[0]["payload"],
      });
      if (!result.domainLinked) {
        return NextResponse.json(
          {
            error:
              result.domainLinkError ??
              "Saved the report but failed to link the monthly_transits row",
            reportId: result.reportId,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        reportId: result.reportId,
        domainLinked: true,
        mode: "inline" as const,
      });
    }

    // ── Mode 2 — lookup the most-recent matching saved row + link ──────
    // The toolkit's auto-save (earlier save-persistence partial) already
    // wrote the artifact; we just need to find it and link it onto
    // monthly_transits for this (member, month).
    const reqDob = body.dateOfBirth?.trim() || null;
    const reqTime = body.birthTime?.trim() || null;
    const reqCity = body.birthCity?.trim() || null;
    const reqCountry = body.birthCountry?.trim() || null;
    const reqLat =
      typeof body.birthLat === "number" && Number.isFinite(body.birthLat)
        ? body.birthLat
        : null;
    const reqLng =
      typeof body.birthLng === "number" && Number.isFinite(body.birthLng)
        ? body.birthLng
        : null;

    const { data: candidates } = await admin
      .from("astro_ai_responses")
      .select("*")
      .eq("user_id", user.id)
      .eq("toolname", TOOLNAME)
      .order("created_at", { ascending: false })
      .limit(25);

    let match: Record<string, unknown> | null = null;
    for (const row of candidates ?? []) {
      const formData = row.form_data ?? null;

      // Month check — tropical_transits_monthly_v3 stamps `futureMonth`
      // and/or `month` in formData.
      const rowMonth =
        deepFindString(formData, "futureMonth") ??
        deepFindString(formData, "month");
      if (rowMonth) {
        // futureMonth is sometimes "YYYY-MM-DD" (1st of month).
        const rowMonthKey = rowMonth.slice(0, 7);
        if (rowMonthKey !== monthKey) continue;
      }

      if (reqDob) {
        const d =
          deepFindString(formData, "dob") ??
          deepFindString(formData, "dateOfBirth") ??
          deepFindString(formData, "date_of_birth");
        if (d && d !== reqDob) continue;
      }

      if (reqTime) {
        const t =
          deepFindString(formData, "tob") ??
          deepFindString(formData, "birthTime") ??
          deepFindString(formData, "birth_time");
        if (t && t !== reqTime) continue;
      }

      if (reqCity) {
        const c =
          deepFindString(formData, "birthCity") ??
          deepFindString(formData, "birth_city") ??
          deepFindString(formData, "city");
        if (c && c.toLowerCase() !== reqCity.toLowerCase()) continue;
      }
      if (reqCountry) {
        const c =
          deepFindString(formData, "birthCountry") ??
          deepFindString(formData, "birth_country") ??
          deepFindString(formData, "country");
        if (c && c.toLowerCase() !== reqCountry.toLowerCase()) continue;
      }
      if (reqLat != null) {
        const lat =
          deepFindNumber(formData, "lat") ??
          deepFindNumber(formData, "birthLat");
        if (lat != null && !approxEq(lat, reqLat)) continue;
      }
      if (reqLng != null) {
        const lng =
          deepFindNumber(formData, "lng") ??
          deepFindNumber(formData, "lon") ??
          deepFindNumber(formData, "birthLng");
        if (lng != null && !approxEq(lng, reqLng)) continue;
      }

      match = row as Record<string, unknown>;
      break;
    }

    if (!match) {
      return NextResponse.json(
        {
          error:
            "No matching saved monthly report found yet — run the toolkit and try again.",
        },
        { status: 404 }
      );
    }

    const reportId = match.id as string;

    // Update the (family_member_id, month) monthly_transits row to
    // point at the newly-linked saved artifact. Insert a placeholder
    // pending summary row if one doesn't yet exist (mirrors the
    // saveAndLinkMonthlyReport helper's behaviour).
    const { data: existing } = await admin
      .from("monthly_transits")
      .select("id")
      .eq("family_member_id", familyMemberId)
      .eq("month", monthKey)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("monthly_transits")
        .update({
          full_report_id: reportId,
          full_report_generated_at: new Date().toISOString(),
          full_report_status: "generated",
        })
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json(
          { error: error.message, reportId },
          { status: 500 }
        );
      }
    } else {
      const { error } = await admin.from("monthly_transits").insert({
        family_member_id: familyMemberId,
        month: monthKey,
        transit_data: {},
        generation_status: "pending",
        full_report_id: reportId,
        full_report_generated_at: new Date().toISOString(),
        full_report_status: "generated",
      });
      if (error) {
        return NextResponse.json(
          { error: error.message, reportId },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      reportId,
      domainLinked: true,
      mode: "lookup_and_link" as const,
    });
  } catch (err) {
    console.error("[saved-reports/monthly/link] error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to save monthly report",
      },
      { status: 500 }
    );
  }
}
