"use client";

import { useEffect, useState, useCallback } from "react";

interface Bucket {
  affiliateAccountId: string;
  email: string;
  ytdPaidDollars: number;
  conversionCount: number;
  stripeRequirementsDue: string[];
}

interface Response {
  year?: number;
  threshold?: number;
  issued?: Bucket[];
  approaching?: Bucket[];
  atRisk?: Bucket[];
  totals?: {
    issuedCount: number;
    approachingCount: number;
    atRiskCount: number;
    totalIssuedAmountCents: number;
  };
}

/**
 * Compact widget for /admin/reports/finance-ops summarizing 1099-NEC
 * exposure: how many affiliates are issued / approaching / at risk.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/05-1099-tracker.md
 */
export function Form1099TrackerWidget({ year }: { year?: number }) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const y = year ?? new Date().getUTCFullYear();
      const res = await fetch(`/api/admin/reports/1099-tracker?year=${y}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as Response;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data?.totals) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        Loading 1099 tracker…
      </div>
    );
  }

  const t = data.totals;
  const issuedDollars = (t.totalIssuedAmountCents / 100).toLocaleString(
    undefined,
    { style: "currency", currency: "USD" },
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          1099-NEC tracker · {data.year}
        </h3>
        <p className="text-xs text-zinc-500">Threshold $600</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-semibold text-emerald-700">
            {t.issuedCount}
          </p>
          <p className="text-xs text-zinc-500">Issued ({issuedDollars})</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-amber-700">
            {t.approachingCount}
          </p>
          <p className="text-xs text-zinc-500">Approaching ($540+)</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-red-700">
            {t.atRiskCount}
          </p>
          <p className="text-xs text-zinc-500">At risk (tax info due)</p>
        </div>
      </div>
      {t.atRiskCount > 0 && data.atRisk && data.atRisk.length > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-zinc-700">
            Show at-risk affiliates
          </summary>
          <ul className="mt-2 space-y-1">
            {data.atRisk.map((a) => (
              <li
                key={a.affiliateAccountId}
                className="flex items-center justify-between"
              >
                <span className="text-zinc-700">{a.email}</span>
                <span className="text-red-700">
                  {a.stripeRequirementsDue.join(", ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
