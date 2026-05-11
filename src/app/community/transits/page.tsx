import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";
import { isValidMonthlyTransit } from "@/lib/community/chart-validators";
import {
  deriveMonthlyReportState,
  deriveNatalReportState,
  ctaForState,
} from "@/lib/community/chart-report-state";
import {
  isBirthDataComplete,
  computeBirthDataReadiness,
  type BirthDataField,
} from "@/lib/community/birth-data-readiness";
import { ensureCanonicalSelfFamilyMember } from "@/lib/community/self-family-member";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { BookReadingButton } from "./BookReadingButton";
import { TransitCardExpander } from "./TransitCardExpander";
import {
  buildMonthlyTransitSummaryFromReport,
  type MonthlyTransitReportSummaryItem,
} from "@/lib/community/monthly-transit-report-summary";

export const metadata = { title: "Monthly Transits - AstrologyPro Community" };
export const dynamic = "force-dynamic";

/**
 * Build the user-facing missing-fields hint for the incomplete-family list.
 *
 * Coordinate-only-missing case is special-cased: when the only thing
 * holding the row back is `birth_lat` / `birth_lng` (text fields like city
 * and country are all present), the user already typed a place but never
 * picked a city suggestion that resolves to coordinates — telling them to
 * "add birth date, time and place" is misleading.
 *
 * Sprint: tasks/06.05.2026/community-transits-profile-and-display-fixes/01-fix-duplicate-self-profile-coordinate-readiness.md
 */
const FIELD_LABELS: Record<BirthDataField, string> = {
  date_of_birth: "birth date",
  birth_time: "birth time",
  birth_city: "birth city",
  birth_country: "birth country",
  birth_lat: "birth coordinates",
  birth_lng: "birth coordinates",
};

function buildIncompleteHint(missing: BirthDataField[]): string {
  const onlyCoordsMissing =
    missing.length > 0 &&
    missing.every((f) => f === "birth_lat" || f === "birth_lng");
  if (onlyCoordsMissing) {
    return "Select the birth city from suggestions to save coordinates.";
  }
  if (missing.length === 0) {
    // Defensive — caller filtered for incomplete, but readiness disagreed.
    return "Add birth date, time and place to enable monthly transits.";
  }
  // Field-specific: dedupe (lat+lng both map to "birth coordinates"),
  // preserve ordering, then build a friendly list.
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const f of missing) {
    const lab = FIELD_LABELS[f];
    if (!seen.has(lab)) {
      seen.add(lab);
      labels.push(lab);
    }
  }
  if (labels.length === 1) return `Add ${labels[0]} to enable monthly transits.`;
  if (labels.length === 2)
    return `Add ${labels[0]} and ${labels[1]} to enable monthly transits.`;
  const last = labels.pop();
  return `Add ${labels.join(", ")}, and ${last} to enable monthly transits.`;
}

type TransitAspect = {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
};

type TransitPlanet = {
  name: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  aspects: TransitAspect[];
};

type MonthlyTransitData = {
  month: string;
  planets: TransitPlanet[];
  highlights: string[];
};

type TransitRow = {
  id: string;
  family_member_id: string;
  month: string;
  transit_data: unknown;
  generation_status: string | null;
  full_report_id: string | null;
  full_report_status: string | null;
  full_report_generated_at: string | null;
  community_family_members: { full_name: string };
};

type SavedMonthlyReportRow = {
  id: string;
  ai_response: unknown;
  astro_api_data: unknown;
  form_data: unknown;
  created_at: string | null;
};

type FamilyTransitOwner = {
  id: string;
  relationship: string | null;
  full_name: string;
  natal_chart: unknown;
  natal_status: string | null;
  natal_report_id: string | null;
  natal_report_status: string | null;
  natal_report_generated_at: string | null;
  natal_last_generated_at: string | null;
  chart_updated_at: string | null;
  updated_at: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  birth_lat: number | string | null;
  birth_lng: number | string | null;
};

export default async function TransitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select(
      "id, user_id, full_name, membership_status, date_of_birth, birth_time, birth_city, birth_country"
    )
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  await ensureCanonicalSelfFamilyMember(member, user.id);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ── Get this member's household family IDs ────────────────────────────
  //
  // Independent product rule (tasks/30.04.2026): the gate for the
  // monthly transit workflow is *complete birth data*, not saved
  // natal_chart state. We still pull natal_* fields so the natal CTA
  // (separate, secondary action) can render its own state per row.
  const { data: familyRows } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, relationship, natal_chart, natal_status, natal_report_id, natal_report_status, natal_report_generated_at, natal_last_generated_at, chart_updated_at, updated_at, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
    )
    .eq("member_id", member.id);

  const familyOwners = (familyRows ?? []) as FamilyTransitOwner[];
  const familyOwnerById = new Map(familyOwners.map((f) => [f.id, f]));
  const allFamilyIds = familyOwners.map((f) => f.id);

  // Members with complete birth data are visible in the transit
  // workflow regardless of natal_chart state.
  const eligibleFamily = familyOwners.filter((f) => isBirthDataComplete(f));
  // Members with incomplete birth data stay visible too, but with a
  // "Complete Birth Details" CTA instead of a transit card — they must
  // not be silently hidden.
  const incompleteFamily = familyOwners.filter((f) => !isBirthDataComplete(f));

  // ── Lazy catch-up: generate missing current-month rows ────────────────
  if (eligibleFamily.length > 0) {
    const { count: existingTransitCount } = await supabase
      .from("monthly_transits")
      .select("id", { count: "exact", head: true })
      .in("family_member_id", eligibleFamily.map((f) => f.id))
      .eq("month", currentMonth);

    if ((existingTransitCount ?? 0) < eligibleFamily.length) {
      try {
        await ensureCurrentMonthTransitsForMember(member.id);
      } catch (err) {
        console.warn(
          "[transits/page] lazy fallback failed:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  // ── Load current-month transits scoped to this household ──────────────
  let familyTransits: TransitRow[] = [];

  if (allFamilyIds.length > 0) {
    const { data: transits } = await supabase
      .from("monthly_transits")
      .select(
        "id, family_member_id, month, transit_data, generation_status, full_report_id, full_report_status, full_report_generated_at, community_family_members!inner(full_name)"
      )
      .in("family_member_id", allFamilyIds)
      .eq("month", currentMonth)
      .order("id");

    familyTransits = (transits ?? []) as unknown as TransitRow[];
  }

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const transitByFamilyId = new Map(
    familyTransits.map((row) => [row.family_member_id, row])
  );
  const linkedFullReportIds = Array.from(
    new Set(
      familyTransits
        .map((row) => row.full_report_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const savedReportById = new Map<string, SavedMonthlyReportRow>();

  if (linkedFullReportIds.length > 0) {
    const admin = createAdminClient();
    const { data: savedReports, error: savedReportsError } = await admin
      .from("astro_ai_responses")
      .select("id, ai_response, astro_api_data, form_data, created_at")
      .in("id", linkedFullReportIds);

    if (savedReportsError) {
      console.warn(
        "[transits/page] failed to load linked saved monthly reports:",
        savedReportsError.message
      );
    }

    for (const report of (savedReports ?? []) as SavedMonthlyReportRow[]) {
      savedReportById.set(report.id, report);
    }
  }

  // Pre-compute card data server-side for the client expander
  const cardData = eligibleFamily.map((familyMember) => {
    const row = transitByFamilyId.get(familyMember.id);
    const validTransitData = row && isValidMonthlyTransit(row.transit_data, currentMonth)
      ? row.transit_data as MonthlyTransitData
      : null;
    const harmoniousCount = validTransitData?.planets.reduce(
      (s, p) => s + p.aspects.filter((a) => a.isHarmonious).length,
      0
    ) ?? 0;
    const challengingCount = validTransitData?.planets.reduce(
      (s, p) => s + p.aspects.filter((a) => !a.isHarmonious).length,
      0
    ) ?? 0;
    // Aspect-count display gate. When no valid monthly summary payload
    // exists, the zero counts above are NOT real — they're the
    // `?? 0` fallback. The card subtitle and snapshot must hide those
    // numbers and show a neutral status string instead.
    //
    // Spec: tasks/06.05.2026/community-transits-profile-and-display-fixes/02-hide-misleading-zero-aspect-counts.md
    const hasValidTransitSummary = validTransitData !== null;

    const reportState = deriveMonthlyReportState(
      {
        month: row?.month ?? currentMonth,
        transit_data: row?.transit_data ?? null,
        generation_status: row?.generation_status ?? null,
        full_report_id: row?.full_report_id ?? null,
        full_report_status: row?.full_report_status ?? null,
      },
      currentMonth
    );
    const hasSavedFullReport = Boolean(row?.full_report_id);
    const fullReportCta = (() => {
      if (row?.full_report_status === "failed") {
        return { label: "Retry Transit Report", kind: "retry" as const };
      }
      if (hasSavedFullReport) {
        return { label: "View Transit Report", kind: "view" as const };
      }
      return { label: "Generate Transit Report", kind: "generate" as const };
    })();
    const detailedHref = `/community/transits/detailed?familyMemberId=${familyMember.id}&month=${row?.month ?? currentMonth}`;
    const chartHref = `/community/family/${familyMember.id}`;
    const isPending = reportState === "generating";
    const ctaDisabledBase = ctaForState(reportState).disabled;
    const chartOwner = familyOwnerById.get(familyMember.id);
    const chartState = deriveNatalReportState({
      natal_chart: chartOwner?.natal_chart,
      natal_status: chartOwner?.natal_status,
      natal_report_id: chartOwner?.natal_report_id,
      natal_report_status: chartOwner?.natal_report_status,
      natal_report_generated_at: chartOwner?.natal_report_generated_at,
      natal_last_generated_at: chartOwner?.natal_last_generated_at,
      chart_updated_at: chartOwner?.chart_updated_at,
      updated_at: chartOwner?.updated_at,
    });
    const chartCta = ctaForState(chartState);
    const chartCtaLabel =
      chartState === "generated"
        ? "View Natal Chart"
        : chartState === "generating"
        ? "Generating Natal Chart..."
        : "Generate Natal Chart";
    const reportStatusLabel = (() => {
      if (row?.full_report_status === "failed") return "Full report needs attention";
      if (hasSavedFullReport) return "Full report saved";
      if (isPending) return "Summary generating";
      if (!validTransitData) return "Summary not generated yet";
      return "Full report not generated yet";
    })();
    // Neutral subtitle text shown in place of the aspect counts when
    // `hasValidTransitSummary` is false. We mirror the report-status
    // wording so the card explains *why* counts are missing rather than
    // implying a calculation actually returned zero aspects.
    const transitSummaryLabel: string | null = hasValidTransitSummary
      ? null
      : isPending
        ? "Summary generating"
        : "Summary not available yet";
    const savedFullReport = row?.full_report_id
      ? savedReportById.get(row.full_report_id)
      : null;
    const reportSummaryItems: MonthlyTransitReportSummaryItem[] =
      savedFullReport && row?.full_report_status === "generated"
        ? buildMonthlyTransitSummaryFromReport(savedFullReport, 3)
        : [];

    return {
      id: row?.id ?? `${familyMember.id}-${currentMonth}`,
      familyMemberId: familyMember.id,
      memberName: familyMember.full_name,
      harmoniousCount,
      challengingCount,
      hasValidTransitSummary,
      transitSummaryLabel,
      fullReportCta,
      detailedHref,
      chartHref,
      chartCtaLabel,
      chartCtaDisabled: chartCta.disabled,
      isPending,
      ctaDisabledBase,
      hasSavedFullReport,
      month: row?.month ?? currentMonth,
      reportStatusLabel,
      reportSummaryItems,
      highlights: validTransitData?.highlights.slice(0, 3) ?? [],
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">Monthly Transits</h1>
            </div>
            <p className="text-muted-foreground">
              How the current sky affects your family — {monthLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Community member cross-sell CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Get a professional reading</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              As a community member you receive a 5% discount on platform fees when you book an AstrologyPro reading.
            </p>
          </div>
          <BookReadingButton />
        </CardContent>
      </Card>

      {/* Empty state: no family members at all */}
      {familyOwners.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No family members yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add family members with their birth details to see monthly transits.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/family">Go to Family</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Eligible family exists but no valid transit rows yet */}
      {eligibleFamily.length > 0 && cardData.length === 0 && (
        <Card className="border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Transits generating soon
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-1">
              Monthly transits are generated on the 1st of each month. Check back then, or ask an admin to trigger a manual run.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transit cards — collapsed-by-default like /family and /charts */}
      {cardData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{cardData.length} member{cardData.length !== 1 ? "s" : ""} with transit access</span>
          </div>
          <TransitCardExpander cards={cardData} />
        </div>
      )}

      {/* Members with incomplete birth data — visible but actionable */}
      {incompleteFamily.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            <span>
              {incompleteFamily.length} member
              {incompleteFamily.length !== 1 ? "s" : ""} need
              {incompleteFamily.length !== 1 ? "" : "s"} birth details
            </span>
          </div>
          <div className="space-y-2">
            {incompleteFamily.map((fm) => {
              const readiness = computeBirthDataReadiness(fm);
              const hint = buildIncompleteHint(readiness.missing);
              const isSelf = (fm.relationship ?? "").toLowerCase() === "self";
              const completeHref = isSelf
                ? "/community/profile"
                : `/community/family/${fm.id}/edit`;
              return (
                <Card key={fm.id} className="border-amber-500/40 bg-amber-500/5">
                  <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{fm.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hint}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={completeHref}>
                        Complete Birth Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
