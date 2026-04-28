import { NextRequest, NextResponse } from "next/server";

import {
  saveAndLinkRelationshipReport,
  type RelationshipReportType,
} from "@/lib/community/saved-report-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/saved-reports/relationship/link
 *
 * Save the full generated payload of a community relationship report and
 * link it through the `community_relationship_reports` lifecycle row.
 *
 * Modeled on the natal equivalent (`/api/community/saved-reports/natal/link`).
 * The actual save + upsert is delegated to `saveAndLinkRelationshipReport()`
 * — this route is a thin auth/ownership/contract gate.
 *
 * Request body:
 * {
 *   personAId: uuid,
 *   personBId: uuid,
 *   reportType: "romantic" | "friendship" | "partnership",
 *   payload: { toolname: <matching toolname>, ... }
 * }
 *
 * Mapping enforced server-side:
 *   romantic    → romantic_forecast_report_tropical_v2
 *   friendship  → friendship_report_tropical_v2
 *   partnership → business_partner_v2
 *
 * Response:
 *   201 → { reportId, domainLinked: true,  status: "generated" }
 *   500 → { reportId, domainLinked: false, error }   (artifact saved but link failed)
 *   400 → validation error
 *   403 → membership/household-ownership error
 */

const REPORT_TYPE_TO_TOOLNAME: Record<RelationshipReportType, string> = {
  romantic: "romantic_forecast_report_tropical_v2",
  friendship: "friendship_report_tropical_v2",
  partnership: "business_partner_v2",
};

const VALID_REPORT_TYPES: ReadonlySet<RelationshipReportType> = new Set([
  "romantic",
  "friendship",
  "partnership",
]);

function isValidReportType(value: unknown): value is RelationshipReportType {
  return typeof value === "string" && VALID_REPORT_TYPES.has(value as RelationshipReportType);
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
      | {
          personAId?: unknown;
          personBId?: unknown;
          reportType?: unknown;
          payload?: unknown;
        }
      | null;

    const personAId =
      typeof body?.personAId === "string" ? body.personAId : null;
    const personBId =
      typeof body?.personBId === "string" ? body.personBId : null;
    const reportType = isValidReportType(body?.reportType)
      ? body.reportType
      : null;
    const payload =
      body?.payload && typeof body.payload === "object"
        ? (body.payload as Record<string, unknown>)
        : null;

    if (!personAId || !personBId || !reportType || !payload) {
      return NextResponse.json(
        {
          error:
            "personAId, personBId, reportType, and payload are required",
        },
        { status: 400 },
      );
    }

    if (personAId === personBId) {
      return NextResponse.json(
        { error: "personAId and personBId must be different family members" },
        { status: 400 },
      );
    }

    // Enforce the toolname ↔ reportType pairing server-side. Without this,
    // a client could save a friendship payload under a romantic linkage
    // (or vice versa) and then "View" the wrong report.
    const expectedToolname = REPORT_TYPE_TO_TOOLNAME[reportType];
    if (payload.toolname !== expectedToolname) {
      return NextResponse.json(
        {
          error: `payload.toolname must be "${expectedToolname}" for reportType "${reportType}"`,
        },
        { status: 400 },
      );
    }

    // ── Membership check ────────────────────────────────────────────
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

    // ── Household ownership check (both ids must belong to this member) ──
    // Single query covers both ids; if we don't get exactly two rows back,
    // at least one id is foreign and we refuse without leaking which one.
    const admin = createAdminClient();
    const { data: ownedRows, error: ownedErr } = await admin
      .from("community_family_members")
      .select("id")
      .eq("member_id", member.id)
      .in("id", [personAId, personBId]);

    if (ownedErr) {
      return NextResponse.json({ error: ownedErr.message }, { status: 500 });
    }

    const ownedIds = new Set((ownedRows ?? []).map((row) => row.id as string));
    if (!ownedIds.has(personAId) || !ownedIds.has(personBId)) {
      return NextResponse.json(
        { error: "Family member(s) not found" },
        { status: 404 },
      );
    }

    // ── Delegate to the existing helper. It handles canonical id sort,
    //    artifact insert into astro_ai_responses, and upsert into
    //    community_relationship_reports.
    const result = await saveAndLinkRelationshipReport({
      userId: user.id,
      memberId: member.id,
      personAId,
      personBId,
      reportType,
      payload: {
        ...payload,
        toolname: expectedToolname,
      },
    });

    if (!result.domainLinked) {
      return NextResponse.json(
        {
          error:
            result.domainLinkError ??
            "Saved artifact but failed to link relationship report",
          reportId: result.reportId,
          domainLinked: false,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        reportId: result.reportId,
        domainLinked: true,
        status: "generated",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(
      "[community/saved-reports/relationship/link] error:",
      err,
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to link relationship report",
      },
      { status: 500 },
    );
  }
}
