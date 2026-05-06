"use client";

/**
 * Renders a yellow banner above the earnings list when the affiliate has
 * an outstanding refund-after-payout offset. Pure presentation — caller
 * fetches /api/affiliate/earnings-summary and passes the cents.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export function OffsetBanner({
  offsetCents,
  offsetLastChangedAt,
  nextCycleEstimateCents,
}: {
  offsetCents: number;
  offsetLastChangedAt: string | null;
  nextCycleEstimateCents: number;
}) {
  if (!offsetCents || offsetCents <= 0) return null;
  const offsetDollars = (offsetCents / 100).toFixed(2);
  const nextDollars = (nextCycleEstimateCents / 100).toFixed(2);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Refund offset: −${offsetDollars}</p>
      <p className="mt-1">
        A previously paid-out booking was refunded after the payout had
        already left. Your next earnings cycle will be reduced by this
        amount before transfer (estimated next payout: ${nextDollars}).
      </p>
      {offsetLastChangedAt && (
        <p className="mt-1 text-xs text-amber-800">
          Last updated: {new Date(offsetLastChangedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
