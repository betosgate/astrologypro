"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  MapPin,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  deriveRelationshipReportState,
  type ChartReportState,
} from "@/lib/community/chart-report-state";
import { formatBirthPlace } from "@/lib/community/birth-location";

type FamilyMember = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
  relationship: string | null;
  age_group: "child" | "adult" | string | null;
  natal_chart: unknown | null;
  natal_status: string | null;
  natal_report_id: string | null;
  natal_report_status: string | null;
  natal_report_generated_at?: string | null;
  natal_last_generated_at?: string | null;
  chart_updated_at: string | null;
  updated_at?: string | null;
  notes: string | null;
};

type Aspect = {
  planetA: string;
  planetB: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
};

type SynastryData = {
  personAName: string;
  personBName: string;
  aspects: Aspect[];
  score: number;
  summary: string;
};

type RelationshipChart = {
  id: string;
  person_a_id: string;
  person_b_id: string;
  chart_data: SynastryData;
  generated_at: string;
};

type ChartsPagePayload = {
  familyMembers: FamilyMember[];
  charts: RelationshipChart[];
  relationshipReports: RelationshipReportRow[];
  familyOverviewReports: FamilyOverviewReportRow[];
};

/**
 * Lifecycle row from `community_relationship_reports`. Used per pair ×
 * report_type to derive whether the CTA should be Generate / View on this list.
 */
type RelationshipReportRow = {
  person_a_id: string;
  person_b_id: string;
  report_type: "romantic" | "friendship" | "partnership";
  astro_ai_response_id: string | null;
  report_status: string | null;
  invalidated_at: string | null;
  generated_at: string | null;
};

type FamilyOverviewReportRow = {
  mode: "romantic" | "friendship" | "business";
  astro_ai_response_id: string | null;
  report_status: string | null;
  generated_at: string | null;
};

const RELATIONSHIP_MODES = [
  { value: "romantic", label: "Romantic" },
  { value: "friendship", label: "Friendship" },
  { value: "business", label: "Business" },
] as const;

type RelationshipMode = (typeof RELATIONSHIP_MODES)[number]["value"];

function RelationshipModeIcon({ mode }: { mode: RelationshipMode }) {
  if (mode === "romantic") return <Heart className="size-4 text-rose-400" />;
  if (mode === "friendship") return <Users className="size-4 text-blue-500" />;
  return <Star className="size-4 text-amber-500" />;
}

/**
 * UI mode → canonical `report_type` enum on community_relationship_reports.
 * UI exposes "business" but the lifecycle row stores "partnership". Same
 * mapping is enforced server-side in /api/community/saved-reports/relationship/link
 * and on the detailed page hydration.
 */
const MODE_TO_REPORT_TYPE: Record<
  RelationshipMode,
  "romantic" | "friendship" | "partnership"
> = {
  romantic: "romantic",
  friendship: "friendship",
  business: "partnership",
};

/** Short label shown next to each option in the type selector. */
function ctaLabelForState(state: ChartReportState): string {
  switch (state) {
    case "generated":
    case "stale":
    case "locked_for_review":
      return "View";
    case "failed":
    case "generating":
    case "missing":
    default:
      return state === "generating" ? "In progress" : "Generate";
  }
}

function statusToneClass(state: ChartReportState): string {
  switch (state) {
    case "generated":
    case "stale":
    case "locked_for_review":
      return "text-green-600 dark:text-green-400";
    case "failed":
    case "missing":
      return "text-amber-600 dark:text-amber-400";
    case "generating":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-muted-foreground";
  }
}

function formatBirthDate(value: string | null): string {
  if (!value) return "Birth date missing";
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAgeLabel(value: string | null): string | null {
  if (!value) return null;
  const dob = new Date(value + "T12:00:00");
  const age = Math.floor(
    (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
  );
  return Number.isFinite(age) ? `Age ${age}` : null;
}

function formatBirthTime(value: string | null): string {
  if (!value) return "Birth time missing";
  const [hour, minute] = value.split(":");
  return hour && minute ? `${hour}:${minute}` : value;
}

function formatMemberSubtitle(member: FamilyMember): string {
  return [member.relationship, getAgeLabel(member.date_of_birth)]
    .filter(Boolean)
    .join(" | ");
}

function RelationshipChartsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading relationship charts">
      <Card>
        <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-72 max-w-[70vw]" />
            </div>
          </div>
          <Skeleton className="size-4 rounded-full" />
        </div>
      </Card>

      {[0, 1, 2, 3].map((item) => (
        <Card key={item}>
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-56 max-w-[55vw]" />
                <Skeleton className="h-3 w-72 max-w-[65vw]" />
              </div>
            </div>
            <Skeleton className="h-9 w-[150px] shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

async function fetchChartsPagePayload(): Promise<ChartsPagePayload> {
  const payload: ChartsPagePayload = {
    familyMembers: [],
    charts: [],
    relationshipReports: [],
    familyOverviewReports: [],
  };

  const result = await fetch("/api/community/relationship-charts");
  if (result.ok) {
    const data = await result.json();
    payload.familyMembers = data.familyMembers ?? [];
    payload.charts = data.charts ?? [];
    payload.relationshipReports = data.relationshipReports ?? [];
    payload.familyOverviewReports = data.familyOverviewReports ?? [];
  }

  return payload;
}

export default function ChartsPage() {
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [charts, setCharts] = useState<RelationshipChart[]>([]);
  const [relationshipReports, setRelationshipReports] = useState<
    RelationshipReportRow[]
  >([]);
  const [familyOverviewReports, setFamilyOverviewReports] = useState<
    FamilyOverviewReportRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchChartsPagePayload();
    setFamilyMembers(data.familyMembers);
    setCharts(data.charts);
    setRelationshipReports(data.relationshipReports);
    setFamilyOverviewReports(data.familyOverviewReports);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const data = await fetchChartsPagePayload();
      if (cancelled) return;

      setFamilyMembers(data.familyMembers);
      setCharts(data.charts);
      setRelationshipReports(data.relationshipReports);
      setFamilyOverviewReports(data.familyOverviewReports);
      setLoading(false);
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Resolve the canonical lifecycle state for a given pair + UI mode.
   * Returns "missing" when there's no row yet — the deriver in the
   * shared lib treats that as "Generate". When a saved row exists, the
   * deriver reads `report_status`, `astro_ai_response_id`, and
   * `invalidated_at` to decide whether this report exists yet.
   *
   * IMPORTANT: this deliberately ignores `relationship_charts.chart_data`
   * (the legacy lightweight synastry summary). Per the spec, that data
   * does not unlock View for full saved reports.
   */
  function getReportStateForMode(
    aId: string,
    bId: string,
    mode: RelationshipMode
  ): ChartReportState {
    const [a, b] = [aId, bId].sort();
    const reportType = MODE_TO_REPORT_TYPE[mode];
    const row = relationshipReports.find(
      (r) =>
        r.person_a_id === a &&
        r.person_b_id === b &&
        r.report_type === reportType
    );
    return deriveRelationshipReportState({
      report_id: row?.astro_ai_response_id ?? null,
      report_status: row?.report_status ?? null,
      invalidated_at: row?.invalidated_at ?? null,
      // Pass undefined chart_data so the deriver doesn't fall back to
      // the legacy synastry summary as proof of a full saved report.
      chart_data: undefined,
    });
  }

  function getFamilyOverviewStateForMode(mode: RelationshipMode): ChartReportState {
    const row = familyOverviewReports.find((report) => report.mode === mode);
    return deriveRelationshipReportState({
      report_id: row?.astro_ai_response_id ?? null,
      report_status: row?.report_status ?? null,
      invalidated_at: null,
      chart_data: undefined,
    });
  }

  function getChartForPair(aId: string, bId: string) {
    const [a, b] = [aId, bId].sort();
    return charts.find(
      (c) => c.person_a_id === a && c.person_b_id === b
    );
  }

  function openDetailedReport(
    personAId: string,
    personBId: string,
    mode: RelationshipMode,
  ) {
    router.push(
      `/community/charts/detailed?personAId=${encodeURIComponent(personAId)}&personBId=${encodeURIComponent(personBId)}&mode=${mode}`,
    );
  }

  function openFamilyDetailedReport(mode: RelationshipMode) {
    router.push(`/community/charts/detailed?family=1&mode=${mode}`);
  }

  // Build all unique pairings
  const pairs: { a: FamilyMember; b: FamilyMember }[] = [];
  for (let i = 0; i < familyMembers.length; i++) {
    for (let j = i + 1; j < familyMembers.length; j++) {
      pairs.push({ a: familyMembers[i], b: familyMembers[j] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Relationship Charts</h1>
          </div>
          <p className="text-muted-foreground">
            Synastry charts for every pair in your family.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {!loading && familyMembers.length > 0 && (
        <Card>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
            aria-expanded={overviewOpen}
            onClick={() => setOverviewOpen((open) => !open)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Family Chart Overview</p>
                <p className="text-xs text-muted-foreground">
                  {familyMembers.length} family member{familyMembers.length === 1 ? "" : "s"} | Romantic, friendship, and business reports
                </p>
              </div>
            </div>
            {overviewOpen ? (
              <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            )}
          </button>

          {overviewOpen && (
            <CardContent className="space-y-4 border-t pt-4">
              <section className="rounded-md border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Family Members Included</h2>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="rounded-md border bg-background p-3 w-full sm:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)] max-w-[400px]">
                      <p className="truncate text-sm font-medium">
                        {member.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMemberSubtitle(member) || "Family member"}
                      </p>
                      <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 shrink-0" />
                          {formatBirthDate(member.date_of_birth)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 shrink-0" />
                          {formatBirthTime(member.birth_time)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {formatBirthPlace(
                              member.birth_city,
                              member.birth_country
                            ) || "Birth place missing"}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-3">
                {RELATIONSHIP_MODES.map((option) => {
                  const state = getFamilyOverviewStateForMode(option.value);
                  const cta = ctaLabelForState(state);
                  return (
                    <section key={option.value} className="rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <RelationshipModeIcon mode={option.value} />
                        <h2 className="text-sm font-semibold">
                          {option.label}
                        </h2>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {familyMembers.length} family member{familyMembers.length === 1 ? "" : "s"} included.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full"
                        disabled={familyMembers.length < 2}
                        onClick={() => openFamilyDetailedReport(option.value)}
                      >
                        <span className={statusToneClass(state)}>{cta}</span>
                      </Button>
                    </section>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}


      {loading ? (
        <RelationshipChartsSkeleton />
      ) : familyMembers.length < 2 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Heart className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Not enough family members</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add at least 2 family members to generate relationship charts.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/plan?tab=members">Manage Family</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pairs.map(({ a, b }) => {
            const pairKey = [a.id, b.id].sort().join("-");
            const chart = getChartForPair(a.id, b.id);
            const synastry = chart?.chart_data;
            const isOpen = expandedId === pairKey;

            return (
              <Card key={pairKey}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
                  aria-expanded={isOpen}
                  onClick={() => setExpandedId(isOpen ? null : pairKey)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Heart className="size-5 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {a.full_name} &amp; {b.full_name}
                      </p>
                      {synastry ? (
                        <p className="text-xs text-muted-foreground">
                          {synastry.aspects.length} aspects ·{" "}
                          {synastry.aspects.filter((x) => x.isHarmonious).length} harmonious ·{" "}
                          {synastry.aspects.filter((x) => !x.isHarmonious).length} challenging
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Romantic, friendship, and business reports
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {synastry && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${i < Math.round(synastry.score / 20)
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                              }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {synastry.score}%
                        </span>
                      </div>
                    )}

                    {/*
                      Legacy quick-generate/regenerate behavior bypassed:
                      this screen no longer calls POST /api/community/relationship-charts
                      directly. Eligible pairs must first choose Romantic,
                      Friendship, or Business, then the detailed toolkit flow
                      uses the selected type plus pre-populated birth data.
                    */}

                    {isOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <CardContent className="border-t pt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {RELATIONSHIP_MODES.map((option) => {
                        const state = getReportStateForMode(a.id, b.id, option.value);
                        const cta = ctaLabelForState(state);
                        return (
                          <section key={option.value} className="rounded-md border p-4">
                            <div className="flex items-center gap-2">
                              <RelationshipModeIcon mode={option.value} />
                              <h2 className="text-sm font-semibold">
                                {option.label}
                              </h2>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {a.full_name} &amp; {b.full_name}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-4 w-full"
                              onClick={() => openDetailedReport(a.id, b.id, option.value)}
                            >
                              <span className={statusToneClass(state)}>{cta}</span>
                            </Button>
                          </section>
                        );
                      })}
                    </div>

                    {/*
                      In-house/dummy synastry summary, compatibility score,
                      aspect type legend, and harmonious/challenging aspect
                      lists intentionally hidden. Full relationship analysis is
                      handled by the detailed report toolkit after type select.

                      Commented-out legacy block kept for reference:

                      const harmonious = synastry.aspects.filter((a) => a.isHarmonious);
                      const challenging = synastry.aspects.filter((a) => !a.isHarmonious);
                      const aspectTypes = [...new Set(synastry.aspects.map((a) => a.aspectType))];

                      <p className="text-sm text-muted-foreground italic">
                        {synastry.summary}
                      </p>

                      <div className="space-y-2">
                        Compatibility Score: {synastry.score}%
                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                          <div style={{ width: `${synastry.score}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        Total Aspects: {synastry.aspects.length}
                        Harmonious: {harmonious.length}
                        Challenging: {challenging.length}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {aspectTypes.map((type) => render aspect count badge)}
                      </div>

                      {harmonious.length > 0 && render harmonious aspect rows}
                      {challenging.length > 0 && render challenging aspect rows}
                    */}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
