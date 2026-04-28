import { NextRequest, NextResponse } from "next/server";

import { saveAndLinkNatalReport } from "@/lib/community/saved-report-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NATAL_TOOLNAME = "western_horoscope_v2";

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
      | {
          familyMemberId?: unknown;
          payload?: unknown;
        }
      | null;

    const familyMemberId =
      typeof body?.familyMemberId === "string" ? body.familyMemberId : null;
    const payload =
      body?.payload && typeof body.payload === "object"
        ? (body.payload as Record<string, unknown>)
        : null;

    if (!familyMemberId || !payload) {
      return NextResponse.json(
        { error: "familyMemberId and payload are required" },
        { status: 400 },
      );
    }

    if (payload.toolname !== NATAL_TOOLNAME) {
      return NextResponse.json(
        { error: "Invalid natal report toolname" },
        { status: 400 },
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
        { status: 403 },
      );
    }
    if (member.membership_type !== "perennial_mandalism") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Inactive membership" },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
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
        { status: 404 },
      );
    }

    const result = await saveAndLinkNatalReport({
      userId: user.id,
      familyMemberId,
      payload: {
        ...payload,
        toolname: NATAL_TOOLNAME,
      },
    });

    if (!result.domainLinked) {
      return NextResponse.json(
        {
          error:
            result.domainLinkError ??
            "Saved report but failed to link family member",
          reportId: result.reportId,
          domainLinked: false,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      reportId: result.reportId,
      domainLinked: true,
      status: "generated",
    });
  } catch (err) {
    console.error("[community/saved-reports/natal/link] error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to link natal report",
      },
      { status: 500 },
    );
  }
}
