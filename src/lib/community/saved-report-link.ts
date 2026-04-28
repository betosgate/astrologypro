/**
 * Saved-report → domain-row linkage helpers.
 *
 * Spec source:
 *   tasks/27.04.2026/community-saved-chart-report-lifecycle/04-implement-saved-natal-report-lifecycle.md
 *   tasks/27.04.2026/community-saved-chart-report-lifecycle/05-implement-saved-monthly-report-lifecycle.md
 *   tasks/27.04.2026/community-saved-chart-report-lifecycle/06-implement-saved-relationship-report-lifecycle.md
 *   tasks/27.04.2026/community-saved-chart-report-lifecycle/08-add-toolkit-saved-report-hydration.md
 *
 * Two responsibilities:
 *
 *   1. Save a generated full toolkit report payload to `astro_ai_responses`
 *      AND link the domain row that owns the chart's lifecycle. The two
 *      writes are atomic-ish: if the link fails, the saved row is left in
 *      place (it still works as a standalone artifact, future runs can
 *      re-link it via /api/astro-ai/lookup-saved). We never silently drop
 *      the save.
 *
 *   2. Load the saved payload for View. Used by future hydration wrappers
 *      so the toolkit can render a saved report without re-running
 *      compute / AI.
 *
 * These helpers do NOT enforce auth at the HTTP layer — callers must
 * already hold a verified `userId` / `memberId` (server pages or API
 * routes that just authenticated). The helpers DO use the admin client
 * so RLS is bypassed; callers must therefore ensure they're acting on
 * rows the user actually owns.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Shared types ────────────────────────────────────────────────────────

/** A toolkit-generated full report payload, in the legacy NestJS shape. */
export type ToolkitReportPayload = Record<string, unknown> & {
  toolname: string;
  ai_response?: unknown;
  formData?: unknown;
  astro_api_data?: unknown;
};

export type RelationshipReportType = "friendship" | "romantic" | "partnership";

interface SaveAndLinkResult {
  /** UUID of the inserted/updated `astro_ai_responses` row. */
  reportId: string;
  /** True if the domain row was successfully linked to the report. */
  domainLinked: boolean;
  /** Surface-friendly error if domain linking failed. */
  domainLinkError?: string;
}

// ── Internal: write the artifact ───────────────────────────────────────

async function persistReport(
  userId: string,
  payload: ToolkitReportPayload,
  conditionMeta: Record<string, unknown>
): Promise<string> {
  const admin = createAdminClient();

  // Map camelCase wire fields → snake_case columns. Mirrors the mapping
  // in /api/astro-ai/save-astro-ai-response so callers that already build
  // the legacy payload don't need a second adapter.
  const dbPayload: Record<string, unknown> = {
    user_id: userId,
    toolname: payload.toolname,
    ai_response: payload.ai_response ?? {},
    form_data: payload.formData ?? (payload as { form_data?: unknown }).form_data ?? {},
    astro_api_data: payload.astro_api_data ?? {},
    natal_chart: (payload as { natal_chart?: unknown }).natal_chart ?? {},
    free_natal_wheel_chart:
      (payload as { freeNatalWheelChart?: string }).freeNatalWheelChart ?? null,
    free_natal_wheel_chart_transit:
      (payload as { freeNatalWheelChartForTransit?: string }).freeNatalWheelChartForTransit ??
      (payload as { freeNatalWheelChartForTrasit?: string }).freeNatalWheelChartForTrasit ??
      null,
    free_natal_wheel_chart_self:
      (payload as { freeNatalWheelChartSelf?: string }).freeNatalWheelChartSelf ??
      (payload as { freeNatalWheelChartForself?: string }).freeNatalWheelChartForself ??
      null,
    free_natal_wheel_chart_partner:
      (payload as { freeNatalWheelChartPartner?: string }).freeNatalWheelChartPartner ??
      (payload as { freeNatalWheelChartForPartner?: string }).freeNatalWheelChartForPartner ??
      null,
    free_natal_wheel_chart_p2:
      (payload as { freeNatalWheelChartP2?: string }).freeNatalWheelChartP2 ?? null,
    free_natal_wheel_chart_transit_p2:
      (payload as { freeNatalWheelChartForTransitP2?: string }).freeNatalWheelChartForTransitP2 ??
      (payload as { freeNatalWheelChartForTrasitP2?: string }).freeNatalWheelChartForTrasitP2 ??
      null,
    response_share_url:
      (payload as { response_share_url?: string }).response_share_url ?? null,
    // condition is the place where the spec says identity metadata lives —
    // we use it so by-key lookups via /api/astro-ai/lookup-saved have
    // structured fields to filter on without needing new columns.
    condition: conditionMeta,
  };

  const { data, error } = await admin
    .from("astro_ai_responses")
    .insert([dbPayload])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to persist saved report");
  }
  return data.id as string;
}

// ── Natal: save + link to community_family_members ─────────────────────

export async function saveAndLinkNatalReport(args: {
  userId: string;
  familyMemberId: string;
  payload: ToolkitReportPayload;
}): Promise<SaveAndLinkResult> {
  const { userId, familyMemberId, payload } = args;

  const reportId = await persistReport(userId, payload, {
    report_kind: "natal",
    family_member_id: familyMemberId,
    toolname: payload.toolname,
    schema_version: "community_natal_v1",
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_family_members")
    .update({
      natal_report_id: reportId,
      natal_report_generated_at: new Date().toISOString(),
      natal_report_status: "generated",
    })
    .eq("id", familyMemberId);

  if (error) {
    return {
      reportId,
      domainLinked: false,
      domainLinkError: error.message,
    };
  }

  // ── Cascade: mark dependent relationship reports stale ───────────────
  // Any relationship saved report whose pair includes this family member
  // is now potentially out-of-date — its synastry/composite payload was
  // computed against the OLD natal. We don't delete the artifact (the
  // user can still View the previous report); we only flip the lifecycle
  // status to 'stale' with an audit reason. The list page renders a
  // Regenerate CTA for those rows.
  //
  // Best-effort: a failure here doesn't fail the natal save itself.
  try {
    const invalidatedAt = new Date().toISOString();
    await admin
      .from("community_relationship_reports")
      .update({
        report_status: "stale",
        invalidated_at: invalidatedAt,
        invalidation_reason: "natal_regenerated",
        updated_at: invalidatedAt,
      })
      .or(`person_a_id.eq.${familyMemberId},person_b_id.eq.${familyMemberId}`)
      .eq("report_status", "generated");
  } catch (err) {
    console.error(
      "[saveAndLinkNatalReport] relationship invalidation cascade failed:",
      err,
    );
  }

  return { reportId, domainLinked: true };
}

// ── Monthly: save + link to monthly_transits ───────────────────────────

export async function saveAndLinkMonthlyReport(args: {
  userId: string;
  familyMemberId: string;
  monthKey: string; // "YYYY-MM"
  payload: ToolkitReportPayload;
}): Promise<SaveAndLinkResult> {
  const { userId, familyMemberId, monthKey, payload } = args;

  const reportId = await persistReport(userId, payload, {
    report_kind: "monthly_full",
    family_member_id: familyMemberId,
    month: monthKey,
    toolname: payload.toolname,
    schema_version: "community_monthly_full_v1",
  });

  const admin = createAdminClient();
  // Update existing summary row if present, else insert a placeholder
  // summary so the link has somewhere to live. This keeps the
  // (family_member_id, month) uniqueness intact.
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
      return {
        reportId,
        domainLinked: false,
        domainLinkError: error.message,
      };
    }
    return { reportId, domainLinked: true };
  }

  const { error } = await admin
    .from("monthly_transits")
    .insert({
      family_member_id: familyMemberId,
      month: monthKey,
      transit_data: {},
      generation_status: "pending", // summary still needs to be computed
      full_report_id: reportId,
      full_report_generated_at: new Date().toISOString(),
      full_report_status: "generated",
    });

  if (error) {
    return {
      reportId,
      domainLinked: false,
      domainLinkError: error.message,
    };
  }
  return { reportId, domainLinked: true };
}

// ── Relationship: save + link via community_relationship_reports ──────

export async function saveAndLinkRelationshipReport(args: {
  userId: string;
  memberId: string;
  personAId: string;
  personBId: string;
  reportType: RelationshipReportType;
  payload: ToolkitReportPayload;
}): Promise<SaveAndLinkResult> {
  const { userId, memberId, personAId, personBId, reportType, payload } = args;

  // Canonical sort matches the unique key `(person_a_id, person_b_id, report_type)`
  // and the existing `relationship_charts` ordering.
  const [aId, bId] = [personAId, personBId].sort();

  const reportId = await persistReport(userId, payload, {
    report_kind: "relationship",
    member_id: memberId,
    person_a_id: aId,
    person_b_id: bId,
    report_type: reportType,
    toolname: payload.toolname,
    schema_version: "community_relationship_v1",
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_relationship_reports")
    .upsert(
      {
        member_id: memberId,
        person_a_id: aId,
        person_b_id: bId,
        report_type: reportType,
        astro_ai_response_id: reportId,
        report_status: "generated",
        generated_at: new Date().toISOString(),
        invalidated_at: null,
        invalidation_reason: null,
        failure_reason: null,
        last_attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person_a_id,person_b_id,report_type" }
    );

  if (error) {
    return {
      reportId,
      domainLinked: false,
      domainLinkError: error.message,
    };
  }
  return { reportId, domainLinked: true };
}

// ── Hydration: load saved report by domain row ────────────────────────

export async function loadSavedReportById(reportId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_ai_responses")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Convenience: given a family member's id, return its currently-linked
 * saved natal report payload (or null).
 */
export async function loadLinkedNatalReport(familyMemberId: string) {
  const admin = createAdminClient();
  const { data: fm } = await admin
    .from("community_family_members")
    .select("natal_report_id")
    .eq("id", familyMemberId)
    .maybeSingle();

  if (!fm?.natal_report_id) return null;
  return await loadSavedReportById(fm.natal_report_id);
}

/**
 * Convenience: given a family member + month, return the linked saved
 * full monthly-transit report (or null).
 */
export async function loadLinkedMonthlyReport(
  familyMemberId: string,
  monthKey: string
) {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("monthly_transits")
    .select("full_report_id")
    .eq("family_member_id", familyMemberId)
    .eq("month", monthKey)
    .maybeSingle();

  if (!row?.full_report_id) return null;
  return await loadSavedReportById(row.full_report_id);
}

/**
 * Convenience: given a sorted pair + report type, return the linked
 * saved relationship report payload (or null).
 */
export async function loadLinkedRelationshipReport(args: {
  personAId: string;
  personBId: string;
  reportType: RelationshipReportType;
}) {
  const [aId, bId] = [args.personAId, args.personBId].sort();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("community_relationship_reports")
    .select("astro_ai_response_id")
    .eq("person_a_id", aId)
    .eq("person_b_id", bId)
    .eq("report_type", args.reportType)
    .maybeSingle();

  if (!row?.astro_ai_response_id) return null;
  return await loadSavedReportById(row.astro_ai_response_id);
}
