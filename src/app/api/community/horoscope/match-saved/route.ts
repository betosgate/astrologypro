import { NextRequest, NextResponse } from "next/server";

import {
  linkExistingMonthlyReport,
  linkExistingNatalReport,
} from "@/lib/community/saved-report-link";
import {
  findSavedReportMatch,
  MatchSavedReportBody,
  normalizeMatchLimit,
  SAVED_REPORT_MATCH_SELECT,
} from "@/lib/horoscope/saved-report-match";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NATAL_TOOLNAME = "western_horoscope_v2";
const MONTHLY_TOOLNAME = "tropical_transits_monthly_v3";

function monthKeyFromBody(body: MatchSavedReportBody): string | null {
  const futureMonth = body.extras?.futureMonth?.trim();
  if (!futureMonth) return null;
  const monthKey = futureMonth.slice(0, 7);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) ? monthKey : null;
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
    const familyMemberId =
      typeof body.familyMemberId === "string" ? body.familyMemberId : null;
    const personAId = typeof body.personAId === "string" ? body.personAId : null;
    const personBId = typeof body.personBId === "string" ? body.personBId : null;

    if (!toolname) {
      return NextResponse.json(
        { error: "Missing toolname" },
        { status: 400 }
      );
    }
    if (!familyMemberId && (!personAId || !personBId)) {
      return NextResponse.json(
        { error: "familyMemberId or relationship pair ids are required" },
        { status: 400 }
      );
    }

    const { data: member } = await supabase
      .from("community_members")
      .select("id, membership_type, membership_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Community member not found" },
        { status: 403 }
      );
    }
    if (member.membership_type !== "perennial_mandalism") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Inactive membership" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    if (familyMemberId) {
      const { data: familyMember, error: familyError } = await admin
        .from("community_family_members")
        .select("id")
        .eq("id", familyMemberId)
        .eq("member_id", member.id)
        .maybeSingle();

      if (familyError) {
        return NextResponse.json({ error: familyError.message }, { status: 500 });
      }
      if (!familyMember) {
        return NextResponse.json(
          { error: "Family member not found" },
          { status: 404 }
        );
      }
    }

    if (personAId && personBId) {
      const { data: pairMembers, error: pairError } = await admin
        .from("community_family_members")
        .select("id")
        .eq("member_id", member.id)
        .in("id", [personAId, personBId]);

      if (pairError) {
        return NextResponse.json({ error: pairError.message }, { status: 500 });
      }
      if ((pairMembers ?? []).length !== 2) {
        return NextResponse.json(
          { error: "Relationship members not found" },
          { status: 404 }
        );
      }
    }

    const { data: candidates, error } = await admin
      .from("astro_ai_responses")
      .select(SAVED_REPORT_MATCH_SELECT)
      .eq("toolname", toolname)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(normalizeMatchLimit(body.limit));

    if (error) {
      console.error("[community/horoscope/match-saved] read error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const match = findSavedReportMatch(body, candidates ?? []);
    if (!match) {
      return NextResponse.json({ found: false });
    }

    let domainLinked = false;

    if (toolname === NATAL_TOOLNAME && familyMemberId && typeof match.id === "string") {
      const link = await linkExistingNatalReport({
        familyMemberId,
        reportId: match.id,
      });
      if (!link.domainLinked) {
        return NextResponse.json(
          {
            error:
              link.domainLinkError ??
              "Saved report found but failed to link family member",
            found: true,
            res: match,
            domainLinked: false,
          },
          { status: 500 }
        );
      }
      domainLinked = true;
    }

    if (toolname === MONTHLY_TOOLNAME && familyMemberId && typeof match.id === "string") {
      const monthKey = monthKeyFromBody(body);
      if (monthKey) {
        const link = await linkExistingMonthlyReport({
          familyMemberId,
          monthKey,
          reportId: match.id,
        });
        if (!link.domainLinked) {
          return NextResponse.json(
            {
              error:
                link.domainLinkError ??
                "Saved report found but failed to link monthly transit",
              found: true,
              res: match,
              domainLinked: false,
            },
            { status: 500 }
          );
        }
        domainLinked = true;
      }
    }

    return NextResponse.json({
      found: true,
      res: match,
      domainLinked,
    });
  } catch (err) {
    console.error("[community/horoscope/match-saved] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Match-saved failed" },
      { status: 500 }
    );
  }
}
