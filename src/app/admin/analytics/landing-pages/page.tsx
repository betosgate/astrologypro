"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BarChart3, ArrowLeft, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Overview {
  total_views: number;
  total_bookings: number;
  total_revenue_estimate: number;
  avg_conversion_rate: number;
  top_performing_service: string | null;
  top_performing_diviner: string | null;
}

interface ServiceRow {
  template_id: string;
  template_name: string;
  total_views: number;
  unique_visitors: number;
  total_bookings: number;
  active_diviners: number;
  avg_conversion: number;
  total_revenue_estimate: number;
}

interface DivinerRow {
  diviner_id: string;
  diviner_name: string;
  username: string;
  total_views: number;
  total_bookings: number;
  enabled_services: number;
  avg_conversion: number;
}

interface AdminAnalytics {
  overview: Overview;
  by_service: ServiceRow[];
  by_diviner: DivinerRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── Overview Card ──────────────────────────────────────────────────────────────

function OverviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
      <p className="text-xs text-silver/50">{label}</p>
      <p className="text-2xl font-bold font-display text-cream">{value}</p>
      {sub && <p className="text-xs text-silver/40">{sub}</p>}
    </div>
  );
}

// ── Sortable Table Header ──────────────────────────────────────────────────────

function SortTh({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  onSort: (field: string) => void;
}) {
  return (
    <th
      onClick={() => onSort(field)}
      className="px-3 py-2 text-left text-xs font-medium text-silver/50 cursor-pointer hover:text-cream select-none"
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("size-3", currentSort === field ? "text-gold" : "text-silver/30")} />
      </span>
    </th>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function AdminLandingPageAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [sortBy, setSortBy] = useState("views");
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/landing-pages?period=${period}&sort_by=${sortBy}&sort_dir=desc`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [period, sortBy]);

  useEffect(() => { load(); }, [load]);

  function handleSort(field: string) {
    setSortBy(field);
  }

  const ov = data?.overview;

  return (
    <div className="min-h-screen bg-cosmos-950 text-cream pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-cosmos-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-1.5 rounded-lg text-silver/50 hover:text-cream hover:bg-white/[0.04] transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <BarChart3 className="size-4 text-gold/70" />
          <h1 className="text-sm font-semibold text-cream">Landing Page Analytics</h1>
          <span className="text-[10px] text-silver/40 border border-white/10 rounded-full px-2 py-0.5">Admin</span>
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-silver/40 text-sm">Loading analytics…</div>
        ) : !data ? (
          <div className="flex items-center justify-center py-24 text-silver/40 text-sm">Failed to load analytics</div>
        ) : (
          <>
            {/* ── Overview Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <OverviewCard label="Total Views" value={fmt(ov!.total_views)} />
              <OverviewCard label="Total Bookings" value={fmt(ov!.total_bookings)} />
              <OverviewCard label="Est. Revenue" value={fmtCurrency(ov!.total_revenue_estimate)} />
              <OverviewCard
                label="Avg Conversion"
                value={`${ov!.avg_conversion_rate}%`}
                sub={ov!.top_performing_service ? `Top: ${ov!.top_performing_service}` : undefined}
              />
            </div>

            {/* ── By Service ── */}
            <div>
              <h2 className="text-sm font-semibold text-cream mb-3">By Service Template</h2>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Service</th>
                      <SortTh label="Views" field="views" currentSort={sortBy} onSort={handleSort} />
                      <SortTh label="Bookings" field="bookings" currentSort={sortBy} onSort={handleSort} />
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Diviners</th>
                      <SortTh label="Conv." field="conversion" currentSort={sortBy} onSort={handleSort} />
                      <SortTh label="Est. Revenue" field="revenue" currentSort={sortBy} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.by_service.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-silver/40">No data</td>
                      </tr>
                    ) : data.by_service.map((row) => (
                      <tr key={row.template_id} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 text-cream/80 max-w-[200px] truncate">{row.template_name}</td>
                        <td className="px-3 py-2.5 text-silver/70">{fmt(row.total_views)}</td>
                        <td className="px-3 py-2.5 text-silver/70">{fmt(row.total_bookings)}</td>
                        <td className="px-3 py-2.5 text-silver/70">{row.active_diviners}</td>
                        <td className="px-3 py-2.5 text-silver/70">{row.avg_conversion}%</td>
                        <td className="px-3 py-2.5 text-silver/70">{fmtCurrency(row.total_revenue_estimate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── By Diviner ── */}
            <div>
              <h2 className="text-sm font-semibold text-cream mb-3">By Diviner</h2>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Diviner</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Views</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Bookings</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Services</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-silver/50">Conv.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.by_diviner.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-silver/40">No data</td>
                      </tr>
                    ) : data.by_diviner.map((row) => (
                      <tr key={row.diviner_id} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5">
                          <Link href={`/admin/diviners/${row.diviner_id}`} className="text-cream/80 hover:text-gold transition-colors">
                            {row.diviner_name}
                          </Link>
                          <span className="text-silver/40 text-xs ml-1.5">@{row.username}</span>
                        </td>
                        <td className="px-3 py-2.5 text-silver/70">{fmt(row.total_views)}</td>
                        <td className="px-3 py-2.5 text-silver/70">{fmt(row.total_bookings)}</td>
                        <td className="px-3 py-2.5 text-silver/70">{row.enabled_services}</td>
                        <td className="px-3 py-2.5 text-silver/70">{row.avg_conversion}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
