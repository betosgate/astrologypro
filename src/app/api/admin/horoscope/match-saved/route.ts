import { NextRequest, NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findSavedReportMatch,
  MatchSavedReportBody,
  normalizeMatchLimit,
  SAVED_REPORT_MATCH_SELECT,
} from "@/lib/horoscope/saved-report-match";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/horoscope/match-saved
 *
 * Admin-scoped saved toolkit lookup. The matching algorithm is shared with
 * the community route, but this wrapper intentionally keeps global admin
 * visibility behind admin auth.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | MatchSavedReportBody
      | null;
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

    const admin = createAdminClient();
    const { data: candidates, error } = await admin
      .from("astro_ai_responses")
      .select(SAVED_REPORT_MATCH_SELECT)
      .eq("toolname", toolname)
      .order("created_at", { ascending: false })
      .limit(normalizeMatchLimit(body.limit));

    if (error) {
      console.error("[admin/horoscope/match-saved] read error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const match = findSavedReportMatch(body, candidates ?? []);
    return match
      ? NextResponse.json({ found: true, res: match })
      : NextResponse.json({ found: false });
  } catch (err) {
    console.error("[admin/horoscope/match-saved] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Match-saved failed" },
      { status: 500 }
    );
  }
}
