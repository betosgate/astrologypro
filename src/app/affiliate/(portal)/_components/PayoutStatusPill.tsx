"use client";

/**
 * Reusable pill for rendering a conversion's payout_status (or a payout's
 * lifecycle status). Used in both the conversions list and the payout
 * history table.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export type PayoutStatusValue =
  | "unpaid"
  | "ripe"
  | "paying"
  | "paid"
  | "offset_applied"
  | "blocked"
  // Payout-row statuses
  | "dry_run"
  | "pending"
  | "completed"
  | "failed"
  | "disputed";

const LABELS: Record<PayoutStatusValue, string> = {
  unpaid: "Holding",
  ripe: "Ready to pay",
  paying: "Processing",
  paid: "Paid",
  offset_applied: "Offset (refunded)",
  blocked: "Reversed",
  dry_run: "Dry run",
  pending: "Processing",
  completed: "Paid",
  failed: "Failed",
  disputed: "Disputed",
};

const TONES: Record<PayoutStatusValue, string> = {
  unpaid: "border border-zinc-300 text-zinc-700",
  ripe: "bg-zinc-200 text-zinc-800",
  paying: "bg-zinc-200 text-zinc-800",
  paid: "bg-emerald-600 text-white",
  offset_applied: "border border-amber-400 text-amber-700",
  blocked: "bg-red-600 text-white",
  dry_run: "border border-blue-300 text-blue-700",
  pending: "bg-zinc-200 text-zinc-800",
  completed: "bg-emerald-600 text-white",
  failed: "bg-red-600 text-white",
  disputed: "bg-amber-500 text-white",
};

export function PayoutStatusPill({
  status,
}: {
  status: string | null | undefined;
}) {
  const key = (status ?? "unpaid") as PayoutStatusValue;
  const label = LABELS[key] ?? String(status ?? "unknown");
  const tone =
    TONES[key] ?? "border border-zinc-300 text-zinc-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
