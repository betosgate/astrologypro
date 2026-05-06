/**
 * A conversion is ripe for payout 24 hours after the booking's session
 * ENDS — not after the booking is created or paid for. Per Phase 2
 * master decision §4.
 *
 * Booking session end = scheduled_at + duration_minutes.
 *
 * For non-booking conversions (subscription / general products without
 * a session), the function returns `created_at + 24h`. Phase 2 doesn't
 * actually pay subscription conversions (out of scope), but the helper
 * is still safe.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/04-payout-trigger-and-execution.md
 */
export function computeRipenessAt(input: {
  bookingScheduledAt: string | Date | null;
  bookingDurationMinutes: number | null;
  conversionCreatedAt: string | Date;
}): Date {
  const HOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  if (input.bookingScheduledAt) {
    const start = new Date(input.bookingScheduledAt).getTime();
    const durMs = (input.bookingDurationMinutes ?? 60) * 60 * 1000;
    return new Date(start + durMs + HOLD_MS);
  }

  const created =
    typeof input.conversionCreatedAt === "string"
      ? new Date(input.conversionCreatedAt).getTime()
      : input.conversionCreatedAt.getTime();
  return new Date(created + HOLD_MS);
}
