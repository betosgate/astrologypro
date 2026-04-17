"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, MousePointerClick, Users, Bot, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Summary {
  total_campaigns: number;
  active_campaigns: number;
  total_clicks: number;
  human_clicks: number;
  unique_clicks: number;
  bot_clicks: number;
  unique_rate: number;
  total_conversions: number;
  total_commission_cents: number;
  conversion_rate: number;
}

interface DailyRow { date: string; total_clicks: number; unique_clicks: number; bot_clicks: number; }
interface TopCampaign { campaign_id: string; name: string; status: string; destination_type: string | null; channel: string | null; clicks: number; conversions: number; }
interface DeviceRow { device_type: string; clicks: number; percentage: number; }
interface CountryRow { country_code: string; country_name: string; clicks: number; percentage: number; }
interface SourceRow { source: string; clicks: number; percentage: number; }
interface ChannelRow { channel: string; campaigns: number; clicks: number; conversions: number; revenue: number; }

interface AdminAnalyticsData {
  period: string;
  summary: Summary;
  daily: DailyRow[];
  top_campaigns: TopCampaign[];
  by_device: DeviceRow[];
  by_country: CountryRow[];
  by_source: SourceRow[];
  channel_performance: ChannelRow[];
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

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
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

// ── CSS bar chart ──────────────────────────────────────────────────────────────

function DailyBarChart({ data }: { data: DailyRow[] }) {
  if (data.length === 0) {
    return <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No data for this period</div>;
  }
  const maxClicks = Math.max(...data.map((d) => d.total_clicks), 1);
  return (
    <div className="flex items-end gap-0.5 h-28 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.date}: ${d.total_clicks} clicks`}>
          <div
            className="w-full rounded-sm bg-primary/30 group-hover:bg-primary/60 transition-colors"
            style={{ height: `${(d.total_clicks / maxClicks) * 100}%`, minHeight: d.total_clicks > 0 ? "2px" : "0" }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-md">
            {d.date}: {d.total_clicks} clicks · {d.unique_clicks} unique
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

// ── Period selector ────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All time", value: "all" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", draft: "secondary", paused: "outline", completed: "default", expired: "destructive",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminCampaignAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const s = data?.summary;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campaigns"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Platform Campaign Analytics</h1>
          </div>
        </div>
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
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading analytics…</div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <BarChart3 className="size-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No analytics data available</p>
        </div>
      ) : (
        <>
          {/* ── Summary ── */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={BarChart3} label="Total Campaigns" value={fmt(s!.total_campaigns)} sub={`${s!.active_campaigns} active`} />
            <StatCard icon={MousePointerClick} label="Human Clicks" value={fmt(s!.human_clicks)} sub={`${s!.unique_rate}% unique`} />
            <StatCard icon={Users} label="Unique Clicks" value={fmt(s!.unique_clicks)} />
            <StatCard icon={TrendingUp} label="Conversions" value={fmt(s!.total_conversions)} sub={`${s!.conversion_rate}% rate`} />
            <StatCard icon={Bot} label="Bot Clicks" value={fmt(s!.bot_clicks)} sub="filtered out" />
          </div>

          {/* Commission */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmtCents(s!.total_commission_cents)}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Daily Chart ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Platform Clicks Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyBarChart data={data.daily} />
              {data.daily.length > 1 && (
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{data.daily[0]?.date}</span>
                  <span>{data.daily[data.daily.length - 1]?.date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Top Campaigns ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Campaigns by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_campaigns.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No campaign clicks yet</p>
              ) : (
                <div className="space-y-2">
                  {data.top_campaigns.map((c, i) => (
                    <div key={c.campaign_id} className="flex items-center justify-between gap-4 py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="text-[10px] px-1 py-0">{c.status}</Badge>
                            {c.destination_type && (
                              <span className="text-[10px] text-muted-foreground">{c.destination_type}</span>
                            )}
                            {c.channel && (
                              <span className="text-[10px] text-muted-foreground capitalize">{c.channel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{fmt(c.clicks)} clicks</p>
                        <p className="text-xs text-muted-foreground">{c.conversions} conv</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Device + Country ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">By Device</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.by_device.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No device data</p>
                ) : data.by_device.map((row) => (
                  <HBarRow key={row.device_type} label={row.device_type} clicks={row.clicks} percentage={row.percentage} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />By Country
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.by_country.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No country data</p>
                ) : data.by_country.map((row) => (
                  <HBarRow key={row.country_code} label={row.country_name} clicks={row.clicks} percentage={row.percentage} color="bg-blue-500/50" />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Source + Channel ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">By Source</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.by_source.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No source data</p>
                ) : data.by_source.map((row) => (
                  <HBarRow key={row.source} label={row.source} clicks={row.clicks} percentage={row.percentage} color="bg-emerald-500/50" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Channel Performance</CardTitle></CardHeader>
              <CardContent>
                {data.channel_performance.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No channel data</p>
                ) : (
                  <div className="space-y-2">
                    {data.channel_performance.map((row) => (
                      <div key={row.channel} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div>
                          <span className="font-medium capitalize">{row.channel}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{row.campaigns} campaign{row.campaigns !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <span>{fmt(row.clicks)} clicks</span>
                          <span className="mx-1">·</span>
                          <span>{row.conversions} conv</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
