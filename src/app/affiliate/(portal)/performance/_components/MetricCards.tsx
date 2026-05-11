"use client";

import { useEffect, useState, useCallback } from "react";

interface Metrics {
  totalClicks: number;
  uniqueClicks: number;
  conversionCount: number;
  conversionRate: number;
  totalCommissionCents: number;
  aovCents: number;
  avgCommCents: number;
  effectiveRate: number;
  reversalRate: number;
  avgDaysToPayout: number;
}

interface Response {
  period?: string;
  metrics?: Metrics;
}

const PERIOD_LABELS: Record<string, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "365d": "Last 365 days",
  all: "All time",
};

function fmtDollars(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * 3×3 grid of headline metrics for the affiliate performance page.
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/01-affiliate-performance.md
 */
export function MetricCards({ period = "30d" }: { period?: string }) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/affiliate/performance?period=${period}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as Response;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data?.metrics) {
    return <p className="text-sm text-zinc-500">Loading metrics…</p>;
  }
  const m = data.metrics;
  const periodLabel = PERIOD_LABELS[period] ?? period;

  const cards = [
    { label: "Total clicks", value: m.totalClicks.toLocaleString() },
    { label: "Unique clicks", value: m.uniqueClicks.toLocaleString() },
    { label: "Conversion rate", value: fmtPct(m.conversionRate) },
    { label: "Conversions", value: m.conversionCount.toLocaleString() },
    { label: "Avg order value", value: fmtDollars(m.aovCents) },
    { label: "Avg commission", value: fmtDollars(m.avgCommCents) },
    { label: "Effective rate", value: fmtPct(m.effectiveRate) },
    { label: "Reversal rate", value: fmtPct(m.reversalRate) },
    { label: "Avg days to payout", value: m.avgDaysToPayout.toFixed(1) },
  ];

  return (
    <section>
      <p className="mb-3 text-sm text-zinc-500">{periodLabel}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
