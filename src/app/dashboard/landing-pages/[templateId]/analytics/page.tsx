"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Users,
  MousePointerClick,
  CalendarCheck,
  TrendingUp,
  Clock,
  ScrollText,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  cta_clicks: number;
  cta_click_rate: number;
  lead_form_submissions: number;
  bookings_initiated: number;
  bookings_completed: number;
  booking_conversion_rate: number;
  avg_time_on_page: number;
  avg_scroll_depth: number;
}

interface DailyRow {
  date: string;
  views: number;
  unique_visitors: number;
  cta_clicks: number;
  bookings_initiated: number;
  bookings_completed: number;
}

interface TrafficSource {
  source: string;
  views: number;
  percentage: number;
}

interface Referrer {
  domain: string;
  views: number;
}

interface Funnel {
  views: number;
  cta_clicks: number;
  bookings_initiated: number;
  bookings_completed: number;
  drop_off_rates: {
    view_to_click: number;
    click_to_initiate: number;
    initiate_to_complete: number;
  };
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  daily: DailyRow[];
  traffic_sources: TrafficSource[];
  top_referrers: Referrer[];
  funnel: Funnel;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const SOURCE_LABELS: Record<string, string> = {
  organic_search: "Organic Search",
  direct: "Direct",
  social: "Social Media",
  referral: "Referral",
  affiliate: "Affiliate",
  email: "Email",
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3",
      highlight ? "border-gold/20 bg-gold/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
    )}>
      <div className="flex items-center gap-2 text-xs text-silver/50">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className={cn("text-2xl font-bold font-display", highlight ? "text-gold" : "text-cream")}>
        {value}
      </p>
      {sub && <p className="text-xs text-silver/40">{sub}</p>}
    </div>
  );
}

// ── Simple bar chart (CSS-based, no charting lib needed) ───────────────────────

function MiniBarChart({ data }: { data: DailyRow[] }) {
  if (data.length === 0) return (
    <div className="flex h-32 items-center justify-center text-sm text-silver/40">No data for this period</div>
  );

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-0.5 h-28 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end group relative"
          title={`${d.date}: ${d.views} views`}
        >
          <div
            className="w-full rounded-sm bg-gold/30 group-hover:bg-gold/60 transition-colors"
            style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: d.views > 0 ? "2px" : "0" }}
          />
          {/* Tooltip on hover */}
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-cosmos-900 border border-white/10 rounded px-2 py-1 text-[10px] text-cream whitespace-nowrap z-10">
            {d.date}: {d.views} views, {d.bookings_completed} booked
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Funnel Row ─────────────────────────────────────────────────────────────────

function FunnelStep({ label, count, total, dropOff }: { label: string; count: number; total: number; dropOff?: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-cream/80">{label}</span>
        <span className="font-semibold text-cream">{fmt(count)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-gold/60 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {dropOff !== undefined && (
        <p className="text-[11px] text-silver/40">{dropOff}% dropped off before this step</p>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function LandingPageAnalyticsPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [templateId, period]);

  useEffect(() => { load(); }, [load]);

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-cosmos-950 text-cream pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-cosmos-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/landing-pages" className="p-1.5 rounded-lg text-silver/50 hover:text-cream hover:bg-white/[0.04] transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <BarChart3 className="size-4 text-gold/70" />
          <h1 className="text-sm font-semibold text-cream">Landing Page Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "text-silver/50 hover:text-cream border border-transparent"
              )}
            >
              {p.label}
            </button>
          ))}
          <Link href={`/dashboard/landing-pages/${templateId}/builder`}>
            <Button size="sm" variant="outline" className="border-white/10 text-silver/60 hover:text-cream text-xs">
              Builder
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-silver/40 text-sm">Loading analytics…</div>
        ) : !data || s?.total_views === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <BarChart3 className="size-10 text-silver/20" />
            <p className="text-silver/50 text-sm">No data yet for this period</p>
            <p className="text-silver/30 text-xs max-w-xs">
              Start sharing your landing page to see analytics. Views, clicks, and conversions will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard icon={Eye} label="Total Views" value={fmt(s!.total_views)} />
              <StatCard icon={Users} label="Unique Visitors" value={fmt(s!.unique_visitors)} />
              <StatCard icon={MousePointerClick} label="CTA Clicks" value={fmt(s!.cta_clicks)} sub={`${s!.cta_click_rate}% click rate`} />
              <StatCard icon={CalendarCheck} label="Bookings" value={fmt(s!.bookings_completed)} />
              <StatCard icon={TrendingUp} label="Conversion" value={`${s!.booking_conversion_rate}%`} highlight />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Clock} label="Avg. Time on Page" value={fmtTime(s!.avg_time_on_page)} />
              <StatCard icon={ScrollText} label="Avg. Scroll Depth" value={`${s!.avg_scroll_depth}%`} />
            </div>

            {/* ── Views Over Time ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold text-cream mb-4">Views Over Time</h2>
              <MiniBarChart data={data.daily} />
              <div className="flex justify-between mt-2 text-[10px] text-silver/30">
                <span>{data.daily[0]?.date ?? ""}</span>
                <span>{data.daily[data.daily.length - 1]?.date ?? ""}</span>
              </div>
            </div>

            {/* ── Conversion Funnel ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold text-cream mb-5">Conversion Funnel</h2>
              <div className="space-y-4">
                <FunnelStep label="Page Views" count={data.funnel.views} total={data.funnel.views} />
                <FunnelStep label="CTA Clicks" count={data.funnel.cta_clicks} total={data.funnel.views} dropOff={data.funnel.drop_off_rates.view_to_click} />
                <FunnelStep label="Bookings Started" count={data.funnel.bookings_initiated} total={data.funnel.views} dropOff={data.funnel.drop_off_rates.click_to_initiate} />
                <FunnelStep label="Bookings Completed" count={data.funnel.bookings_completed} total={data.funnel.views} dropOff={data.funnel.drop_off_rates.initiate_to_complete} />
              </div>
            </div>

            {/* ── Traffic Sources + Referrers ── */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Traffic Sources */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h2 className="text-sm font-semibold text-cream mb-4">Traffic Sources</h2>
                {data.traffic_sources.length === 0 ? (
                  <p className="text-xs text-silver/40">No source data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.traffic_sources.map((src) => (
                      <div key={src.source}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-cream/70">{SOURCE_LABELS[src.source] ?? src.source}</span>
                          <span className="text-silver/50">{src.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gold/50" style={{ width: `${src.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Referrers */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h2 className="text-sm font-semibold text-cream mb-4">Top Referrers</h2>
                {data.top_referrers.length === 0 ? (
                  <p className="text-xs text-silver/40">No referral data yet</p>
                ) : (
                  <div className="space-y-2">
                    {data.top_referrers.slice(0, 8).map((ref, i) => (
                      <div key={ref.domain} className="flex items-center justify-between text-xs">
                        <span className="text-silver/50 w-5">{i + 1}.</span>
                        <span className="flex-1 text-cream/70 truncate">{ref.domain}</span>
                        <span className="text-silver/50 ml-2">{ref.views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
