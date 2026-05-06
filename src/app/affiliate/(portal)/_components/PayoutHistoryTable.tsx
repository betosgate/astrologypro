"use client";

import { useEffect, useState, useCallback } from "react";
import { PayoutStatusPill } from "./PayoutStatusPill";

interface PayoutRow {
  id: string;
  ripe_total_cents: number;
  offset_applied_cents: number;
  net_transferred_cents: number;
  stripe_transfer_id: string | null;
  status: string;
  failure_reason: string | null;
  created_at: string;
  transferred_at: string | null;
  trigger_source: string;
  notes: string | null;
}

interface ListResponse {
  items?: PayoutRow[];
  total?: number;
}

function formatDollars(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Reads /api/affiliate/payouts and renders a paginated table.
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export function PayoutHistoryTable() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/payouts?limit=20", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ListResponse;
      setRows(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading payout history…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No payouts yet. Your first payout will appear after the 24-hour hold
        on a confirmed conversion completes.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-600">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Net</th>
            <th className="px-3 py-2 font-medium">Gross</th>
            <th className="px-3 py-2 font-medium">Offset</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Stripe transfer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 text-zinc-700">
                {new Date(r.transferred_at ?? r.created_at).toLocaleString()}
              </td>
              <td className="px-3 py-2 font-medium text-zinc-900">
                {formatDollars(r.net_transferred_cents)}
              </td>
              <td className="px-3 py-2 text-zinc-600">
                {formatDollars(r.ripe_total_cents)}
              </td>
              <td className="px-3 py-2 text-zinc-600">
                {r.offset_applied_cents > 0
                  ? `−${formatDollars(r.offset_applied_cents)}`
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <PayoutStatusPill status={r.status} />
              </td>
              <td className="px-3 py-2 font-mono text-xs text-zinc-500">
                {r.stripe_transfer_id ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
