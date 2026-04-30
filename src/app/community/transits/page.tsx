import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";
import { isValidMonthlyTransit } from "@/lib/community/chart-validators";
import {
  deriveMonthlyReportState,
  deriveNatalReportState,
  ctaForState,
} from "@/lib/community/chart-report-state";
import { isBirthDataComplete } from "@/lib/community/birth-data-readiness";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { BookReadingButton } from "./BookReadingButton";
import { TransitCardExpander } from "./TransitCardExpander";

export const metadata = { title: "Monthly Transits - AstrologyPro Community" };
export const dynamic = "force-dynamic";

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
  transit_data: MonthlyTransitData;
  generation_status: string | null;
  full_report_id: string | null;
  full_report_status: string | null;
  full_report_generated_at: string | null;
  community_family_members: { full_name: string };
};

type FamilyTransitOwner = {
  id: string;
  full_name: string;
  natal_chart: unknown;
  natal_status: string | null;
  natal_report_id: string | null;
  natal_report_status: string | null;
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
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

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
      "id, full_name, natal_chart, natal_status, natal_report_id, natal_report_status, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
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

    // Filter to only valid transit shapes — no dummy/legacy data
    familyTransits = (
      (transits ?? []) as unknown as TransitRow[]
    ).filter((row) => isValidMonthlyTransit(row.transit_data, currentMonth));
  }

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  // Pre-compute card data server-side for the client expander
  const cardData = familyTransits.map((row) => {
    const data = row.transit_data;
    const harmoniousCount = data.planets.reduce(
      (s, p) => s + p.aspects.filter((a) => a.isHarmonious).length,
      0
    );
    const challengingCount = data.planets.reduce(
      (s, p) => s + p.aspects.filter((a) => !a.isHarmonious).length,
      0
    );

    const reportState = deriveMonthlyReportState(
      {
        month: row.month,
        transit_data: row.transit_data,
        generation_status: row.generation_status,
        full_report_id: row.full_report_id,
        full_report_status: row.full_report_status,
      },
      currentMonth
    );
    const hasSavedFullReport = Boolean(row.full_report_id);
    const fullReportCta = (() => {
      if (row.full_report_status === "failed") {
        return { label: "Retry Transit Report", kind: "retry" as const };
      }
      if (hasSavedFullReport) {
        return { label: "View Transit Report", kind: "view" as const };
      }
      return { label: "Generate Transit Report", kind: "generate" as const };
    })();
    const detailedHref = `/community/transits/detailed?familyMemberId=${row.family_member_id}&month=${row.month}`;
    const chartHref = `/community/family/${row.family_member_id}`;
    const isPending = reportState === "generating";
    const ctaDisabledBase = ctaForState(reportState).disabled;
    const chartOwner = familyOwnerById.get(row.family_member_id);
    const chartState = deriveNatalReportState({
      natal_chart: chartOwner?.natal_chart,
      natal_status: chartOwner?.natal_status,
      natal_report_id: chartOwner?.natal_report_id,
      natal_report_status: chartOwner?.natal_report_status,
    });
    const chartCta = ctaForState(chartState);
    const chartCtaLabel =
      chartCta.kind === "view"
        ? "View Natal Chart"
        : chartCta.kind === "retry"
        ? "Retry Natal Chart"
        : chartCta.kind === "regenerate"
        ? "Update Natal Chart"
        : chartCta.kind === "generating"
        ? "Generating Natal Chart..."
        : chartCta.kind === "locked"
        ? "Review Natal Chart"
        : "Generate Natal Chart";
    const reportStatusLabel = (() => {
      if (row.full_report_status === "failed") return "Full report needs attention";
      if (hasSavedFullReport) return "Full report saved";
      if (isPending) return "Summary generating";
      return "Full report not generated yet";
    })();

    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      memberName: row.community_family_members.full_name,
      harmoniousCount,
      challengingCount,
      fullReportCta,
      detailedHref,
      chartHref,
      chartCtaLabel,
      chartCtaDisabled: chartCta.disabled,
      isPending,
      ctaDisabledBase,
      hasSavedFullReport,
      month: row.month,
      reportStatusLabel,
      highlights: data.highlights.slice(0, 3),
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
      {eligibleFamily.length > 0 && familyTransits.length === 0 && (
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
      {familyTransits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{familyTransits.length} member{familyTransits.length !== 1 ? "s" : ""} with transit data</span>
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
            {incompleteFamily.map((fm) => (
              <Card key={fm.id} className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{fm.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add birth date, time and place to enable monthly transits.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/community/family/${fm.id}`}>
                      Complete Birth Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
