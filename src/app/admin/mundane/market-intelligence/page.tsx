import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  Activity,
  Droplets,
  Wheat,
  Globe,
  Clock,
} from "lucide-react";
import CorrelationsSection from "./CorrelationsSection";
import { type CorrelationResult } from "./CorrelatePanel";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DataSource = {
  id: string;
  name: string;
  source_type: string;
  provider: string | null;
  fetch_interval_hours: number;
  last_fetched_at: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
};

type ExternalDataPoint = {
  id: string;
  source_id: string;
  data_type: string;
  symbol: string | null;
  recorded_at: string;
  value: number | null;
  change_percent: number | null;
};

type Correlation = CorrelationResult;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const SOURCE_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  market: { label: "Market", badgeClass: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp },
  weather: { label: "Weather", badgeClass: "bg-sky-100 text-sky-700 border-sky-200", icon: Droplets },
  agriculture: { label: "Agriculture", badgeClass: "bg-green-100 text-green-700 border-green-200", icon: Wheat },
  social: { label: "Social", badgeClass: "bg-orange-100 text-orange-700 border-orange-200", icon: Globe },
  news: { label: "News", badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Activity },
  custom: { label: "Custom", badgeClass: "bg-gray-100 text-gray-600 border-gray-200", icon: Activity },
};

const VALID_SOURCE_TYPES = ["all", "market", "weather", "agriculture", "social", "news", "custom"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function changeColor(v: number | null): string {
  if (v === null) return "text-muted-foreground";
  return v >= 0 ? "text-green-600" : "text-red-600";
}

// Latest data point per source
function getLatestBySource(
  dataBySource: Record<string, ExternalDataPoint[]>
): Record<string, ExternalDataPoint | undefined> {
  const result: Record<string, ExternalDataPoint | undefined> = {};
  for (const [sid, points] of Object.entries(dataBySource)) {
    result[sid] = points.sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )[0];
  }
  return result;
}

// Last 8 data points per source sorted oldest→newest for sparkline
function getSparklinePoints(points: ExternalDataPoint[]): ExternalDataPoint[] {
  return [...points]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-8);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function MarketIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ source_type?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const rawType = sp.source_type ?? "all";
  const sourceTypeFilter = (VALID_SOURCE_TYPES as readonly string[]).includes(rawType)
    ? rawType
    : "all";

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // ─── Fetch data sources ──────────────────────────────────────────────────────
  let sourcesQuery = admin
    .from("mundane_data_sources")
    .select(
      "id, name, source_type, provider, fetch_interval_hours, last_fetched_at, is_active, config, created_at"
    )
    .order("source_type", { ascending: true })
    .order("name", { ascending: true });

  if (sourceTypeFilter !== "all") {
    sourcesQuery = sourcesQuery.eq("source_type", sourceTypeFilter);
  }

  const { data: sourcesData, error: sourcesError } = await sourcesQuery;

  if (sourcesError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load data sources: {sourcesError.message}
      </div>
    );
  }

  const allSources = (sourcesData ?? []) as DataSource[];
  const activeSources = allSources.filter((s) => s.is_active);
  const activeSourceIds = activeSources.map((s) => s.id);

  // ─── Fetch recent external data (last 30 days) ───────────────────────────────
  const recentDataBySource: Record<string, ExternalDataPoint[]> = {};

  if (activeSourceIds.length > 0) {
    const { data: edData } = await admin
      .from("mundane_external_data")
      .select("id, source_id, data_type, symbol, recorded_at, value, change_percent")
      .in("source_id", activeSourceIds)
      .gte("recorded_at", thirtyDaysAgoStr)
      .order("recorded_at", { ascending: false })
      .limit(500);

    for (const dp of (edData ?? []) as ExternalDataPoint[]) {
      if (!recentDataBySource[dp.source_id]) {
        recentDataBySource[dp.source_id] = [];
      }
      recentDataBySource[dp.source_id].push(dp);
    }
  }

  // ─── Fetch top correlations ──────────────────────────────────────────────────
  const { data: corrData } = await admin
    .from("mundane_correlations")
    .select(
      "id, data_source_id, astro_event_type, planet, sign, correlation_coefficient, sample_count, date_range_start, date_range_end, significance_level, notes, computed_at"
    )
    .order("computed_at", { ascending: false })
    .limit(50);

  const allCorrelations = (corrData ?? []) as Correlation[];
  const topCorrelations = allCorrelations
    .sort(
      (a, b) =>
        Math.abs(b.correlation_coefficient ?? 0) - Math.abs(a.correlation_coefficient ?? 0)
    )
    .slice(0, 5);

  // Build source name map for correlation display
  const sourceNameMap: Record<string, string> = {};
  for (const s of allSources) {
    sourceNameMap[s.id] = s.name;
  }

  const latestBySource = getLatestBySource(recentDataBySource);

  const TYPE_FILTERS = [
    { label: "All", value: "all" },
    { label: "Market", value: "market" },
    { label: "Weather", value: "weather" },
    { label: "Agriculture", value: "agriculture" },
    { label: "Social", value: "social" },
    { label: "News", value: "news" },
    { label: "Custom", value: "custom" },
  ];

  // Active market sources for KPI row
  const marketSources = activeSources.filter((s) => s.source_type === "market");

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="size-6 text-blue-500" />
            Market / Weather / Agriculture Intelligence
          </h1>
          <p className="text-muted-foreground">
            Correlate astrological cycles with financial markets, weather, and agricultural data.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/market-intelligence/sources/new">
            <Plus className="mr-1.5 size-4" /> Add Data Source
          </Link>
        </Button>
      </div>

      {/* Source type filter pills */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/mundane/market-intelligence"
                : `/admin/mundane/market-intelligence?source_type=${f.value}`
            }
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              sourceTypeFilter === f.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* ── Data Sources grid ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Data Sources{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({allSources.length} total, {activeSources.length} active)
          </span>
        </h2>

        {allSources.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No data sources found.{" "}
              <Link
                href="/admin/mundane/market-intelligence/sources/new"
                className="underline hover:text-foreground"
              >
                Add one
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allSources.map((s) => {
              const cfg = SOURCE_TYPE_CONFIG[s.source_type] ?? SOURCE_TYPE_CONFIG.custom;
              const Icon = cfg.icon;
              return (
                <Card
                  key={s.id}
                  className={`relative overflow-hidden ${!s.is_active ? "opacity-60" : ""}`}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </Badge>
                        {!s.is_active && (
                          <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Provider: {s.provider ?? "—"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Every {s.fetch_interval_hours}h
                      </span>
                      <span>
                        {s.last_fetched_at
                          ? `Fetched ${formatDateTime(s.last_fetched_at)}`
                          : "Never fetched"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Market Signals KPI row ─────────────────────────────────────────────── */}
      {marketSources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Market Signals — Latest Values</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {marketSources.slice(0, 8).map((s) => {
              const latest = latestBySource[s.id];
              return (
                <Card key={s.id}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-0.5 truncate">{s.name}</p>
                    <p className="text-xl font-bold tabular-nums">
                      {latest?.value != null
                        ? latest.value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </p>
                    <p className={`text-sm font-medium tabular-nums ${changeColor(latest?.change_percent ?? null)}`}>
                      {latest?.change_percent != null
                        ? `${latest.change_percent >= 0 ? "+" : ""}${latest.change_percent.toFixed(2)}%`
                        : "No data"}
                    </p>
                    {latest?.recorded_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(latest.recorded_at)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Sparkline table ───────────────────────────────────────────────────── */}
      {activeSources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Recent Data — Weekly Snapshots</h2>
          <div className="space-y-6">
            {activeSources
              .filter((s) => (recentDataBySource[s.id]?.length ?? 0) > 0)
              .map((s) => {
                const points = getSparklinePoints(recentDataBySource[s.id] ?? []);
                return (
                  <div key={s.id}>
                    <p className="text-sm font-medium mb-2">{s.name}</p>
                    <div className="rounded-lg border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Symbol
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Value
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Change %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {points.map((dp) => (
                            <tr key={dp.id} className="hover:bg-muted/20">
                              <td className="px-3 py-1.5 tabular-nums text-muted-foreground">
                                {formatDate(dp.recorded_at)}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">
                                {dp.symbol ?? "—"}
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                                {dp.value != null
                                  ? dp.value.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : "—"}
                              </td>
                              <td
                                className={`px-3 py-1.5 text-right tabular-nums font-medium ${changeColor(dp.change_percent)}`}
                              >
                                {dp.change_percent != null
                                  ? `${dp.change_percent >= 0 ? "+" : ""}${dp.change_percent.toFixed(2)}%`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

            {activeSources.every((s) => (recentDataBySource[s.id]?.length ?? 0) === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No data points recorded in the last 30 days. Add data via the API or a fetch job.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── Correlations (client island) ──────────────────────────────────────── */}
      <CorrelationsSection
        sources={allSources}
        initialCorrelations={topCorrelations}
        sourceNameMap={sourceNameMap}
      />
    </div>
  );
}
