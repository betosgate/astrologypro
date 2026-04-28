"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, MousePointerClick, Users, Bot, TrendingUp, Globe, MonitorSmartphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CampaignMeta {
  id: string;
  name: string;
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_name: string;
  campaign_code: string | null;
  share_url: string | null;
  status: string;
  created_at: string;
}

interface Summary {
  total_clicks: number;
  unique_clicks: number;
  bot_clicks: number;
  human_clicks: number;
  unique_rate: number;
  conversions: number;
  conversion_rate: number;
  total_commission_cents: number;
  avg_clicks_per_day: number;
}

interface DailyRow {
  date: string;
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
}

interface DeviceRow { device_type: string; clicks: number; percentage: number; }
interface CountryRow { country_code: string; country_name: string; clicks: number; percentage: number; }
interface BrowserRow { browser: string; clicks: number; percentage: number; }
interface SourceRow { source: string; clicks: number; percentage: number; }
interface ReferrerRow { domain: string; clicks: number; }
interface HourlyRow { hour: number; clicks: number; }

interface AnalyticsData {
  campaign: CampaignMeta;
  summary: Summary;
  daily: DailyRow[];
  by_device: DeviceRow[];
  by_country: CountryRow[];
  by_browser: BrowserRow[];
  by_source: SourceRow[];
  top_referrers: ReferrerRow[];
  hourly_heatmap: HourlyRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Bar chart (CSS-only) ───────────────────────────────────────────────────────

function DailyBarChart({ data }: { data: DailyRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }
  const maxClicks = Math.max(...data.map((d) => d.total_clicks), 1);
  return (
    <div className="flex items-end gap-0.5 h-28 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end group relative"
          title={`${d.date}: ${d.total_clicks} clicks, ${d.unique_clicks} unique`}
        >
          <div
            className="w-full rounded-sm bg-primary/30 group-hover:bg-primary/60 transition-colors"
            style={{ height: `${(d.total_clicks / maxClicks) * 100}%`, minHeight: d.total_clicks > 0 ? "2px" : "0" }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-md">
            {d.date}: {d.total_clicks} clicks · {d.unique_clicks} unique{d.conversions > 0 ? ` · ${d.conversions} conv` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Horizontal bar row ─────────────────────────────────────────────────────────

function HBarRow({ label, clicks, percentage, color = "bg-primary/50" }: { label: string; clicks: number; percentage: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate max-w-[60%]">{label}</span>
        <span className="text-muted-foreground text-xs">{fmt(clicks)} · {percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ── Hourly heatmap ─────────────────────────────────────────────────────────────

function HourlyHeatmap({ data }: { data: HourlyRow[] }) {
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);
  return (
    <div className="grid grid-cols-12 gap-1">
      {data.map((d) => {
        const intensity = d.clicks / maxClicks;
        const opacity = d.clicks === 0 ? 0.05 : 0.1 + intensity * 0.9;
        return (
          <div
            key={d.hour}
            className="relative flex flex-col items-center"
            title={`${d.hour}:00 UTC — ${d.clicks} clicks`}
          >
            <div
              className="w-full aspect-square rounded-sm bg-primary cursor-default"
              style={{ opacity }}
            />
            <span className="text-[9px] text-muted-foreground mt-0.5">
              {d.hour === 0 ? "12a" : d.hour < 12 ? `${d.hour}a` : d.hour === 12 ? "12p" : `${d.hour - 12}p`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Period selector ────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All time", value: "all" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "outline",
  archived: "outline",
  expired: "destructive",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/campaigns/${id}/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/campaigns/${id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <h1 className="text-lg font-semibold">
                {data?.campaign.name ?? "Campaign Analytics"}
              </h1>
              {data?.campaign.status && (
                <Badge variant={STATUS_VARIANT[data.campaign.status] ?? "outline"}>
                  {data.campaign.status}
                </Badge>
              )}
            </div>
            {data?.campaign.destination_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                → {data.campaign.destination_name}
                {data.campaign.campaign_code && (
                  <span className="ml-2 font-mono">{data.campaign.campaign_code}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
                period === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Loading analytics…
        </div>
      ) : !data || s?.human_clicks === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <BarChart3 className="size-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No click data for this period</p>
          <p className="text-muted-foreground/60 text-xs max-w-xs">
            Share your campaign URL to start collecting click analytics.
            {data?.campaign.share_url && (
              <span className="block mt-1 font-mono text-[10px] break-all">{data.campaign.share_url}</span>
            )}
          </p>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={MousePointerClick} label="Human Clicks" value={fmt(s!.human_clicks)} sub={`${s!.avg_clicks_per_day}/day avg`} />
            <StatCard icon={Users} label="Unique Clicks" value={fmt(s!.unique_clicks)} sub={`${s!.unique_rate}% unique rate`} />
            <StatCard icon={TrendingUp} label="Conversions" value={fmt(s!.conversions)} sub={`${s!.conversion_rate}% conv rate`} />
            <StatCard icon={Globe} label="Commission" value={fmtCents(s!.total_commission_cents)} />
            <StatCard icon={Bot} label="Bot Clicks" value={fmt(s!.bot_clicks)} sub="filtered out" />
          </div>

          {/* ── Daily Chart ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Clicks Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyBarChart data={data!.daily} />
              {data!.daily.length > 1 && (
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{data!.daily[0]?.date}</span>
                  <span>{data!.daily[data!.daily.length - 1]?.date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Device + Country ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MonitorSmartphone className="size-4 text-muted-foreground" />
                  By Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data!.by_device.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No device data</p>
                ) : data!.by_device.map((row) => (
                  <HBarRow key={row.device_type} label={row.device_type} clicks={row.clicks} percentage={row.percentage} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  By Country
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data!.by_country.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No country data</p>
                ) : data!.by_country.map((row) => (
                  <HBarRow key={row.country_code} label={row.country_name} clicks={row.clicks} percentage={row.percentage} color="bg-blue-500/50" />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Source + Browser ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">By Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data!.by_source.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No source data</p>
                ) : data!.by_source.map((row) => (
                  <HBarRow key={row.source} label={row.source} clicks={row.clicks} percentage={row.percentage} color="bg-emerald-500/50" />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">By Browser</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data!.by_browser.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No browser data</p>
                ) : data!.by_browser.map((row) => (
                  <HBarRow key={row.browser} label={row.browser} clicks={row.clicks} percentage={row.percentage} color="bg-violet-500/50" />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Hourly Heatmap ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Hourly Distribution (UTC)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HourlyHeatmap data={data!.hourly_heatmap} />
              <p className="text-[10px] text-muted-foreground mt-3">Darker = more clicks. Hover each cell for details.</p>
            </CardContent>
          </Card>

          {/* ── Top Referrers ── */}
          {data!.top_referrers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data!.top_referrers.map((r, i) => (
                    <div key={r.domain} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="font-mono text-xs">{r.domain}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{fmt(r.clicks)} clicks</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
