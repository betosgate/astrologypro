// ═════════════════════════════════════════════════════════════════════
//  Booking Call PIN — helpers
//
//  A booking's call_pin is a 6-digit numeric string that a client enters
//  on the shared central Chime number to route to the correct diviner.
//
//  Invariants (DB-enforced by ux_bookings_active_call_pin partial unique
//  index — see migration 20260421000002):
//    • At any moment, no two bookings with status ∈
//      {pending, confirmed, in_progress} share the same PIN.
//    • Terminal statuses (completed, canceled, no_show) may recycle a
//      PIN once they are no longer "active".
//
//  This module is the single place PINs are generated. Call
//  generateBookingCallPin() from any booking creation path.
//
//  Rollout gating:
//    PIN generation always runs (additive, nullable column — safe for
//    existing flows). The PIN is advertised to the client (email/Gcal/
//    confirmation page) only when getActiveCentralChimeNumber() returns
//    a row. In other words: the presence of an active row in
//    chime_central_numbers is the on/off switch. To disable the shared-
//    number path, set every row in chime_central_numbers to status
//    = 'retired' (or leave the table empty).
// ═════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

/** Non-terminal booking statuses — must match the partial unique index
 *  in supabase/migrations/20260421000002_booking_call_pin.sql. */
export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
] as const;

/** Max attempts before we give up and return null. With 6 digits and a
 *  realistic active-booking count of <10k, collision probability per
 *  attempt is <1%; 10 tries is effectively unlimited. */
const MAX_ATTEMPTS = 10;

export interface GeneratedCallPin {
  pin: string; // always 6 chars, numeric, zero-padded
  generatedAt: string; // ISO timestamp
}

/**
 * Generate a random 6-digit PIN, zero-padded.
 * Not cryptographic — the security value is in rate limiting on the
 * IVR side, not in PIN entropy.
 */
function randomSixDigitPin(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/**
 * Return true if any non-terminal booking currently holds this PIN.
 * Uses the partial index ux_bookings_active_call_pin for the lookup.
 */
async function isPinTaken(
  supabase: SupabaseClient,
  pin: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("call_pin", pin)
    .in("status", [...ACTIVE_BOOKING_STATUSES])
    .limit(1)
    .maybeSingle();

  if (error) {
    // PGRST116 (no rows) surfaces as data=null, not an error; any other
    // error — treat as "taken" to stay on the safe side (the caller
    // will retry). This avoids handing back a PIN we can't verify.
    return true;
  }

  return data != null;
}

/**
 * Generate a collision-free 6-digit PIN for a new booking.
 *
 * Returns the PIN + timestamp; the caller is responsible for persisting
 * both on the booking row (call_pin + call_pin_generated_at).
 *
 * Returns null after MAX_ATTEMPTS of unique-violation / collision —
 * should effectively never happen. The caller should log a warning
 * and proceed without a PIN (the column is nullable; the flag-guarded
 * UI simply won't advertise one).
 *
 * Idempotency note: this function does NOT write to the DB. Persistence
 * is the caller's job so that it happens in the same INSERT statement
 * as the rest of the booking (atomic). The partial unique index is the
 * authoritative collision guard on write.
 */
export async function generateBookingCallPin(
  supabase: SupabaseClient
): Promise<GeneratedCallPin | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const pin = randomSixDigitPin();
    const taken = await isPinTaken(supabase, pin);
    if (!taken) {
      return { pin, generatedAt: new Date().toISOString() };
    }
  }
  return null;
}

/**
 * Get the current active central Chime number (the one advertised on
 * booking confirmations and used for PIN-based routing).
 *
 * Returns null if no active row exists or the table cannot be read —
 * callers must fall back to the per-diviner number in that case.
 *
 * If multiple active rows exist (e.g. multi-region rollout), returns
 * the first one ordered by created_at. Extend with region-aware
 * selection when that is needed.
 */
export async function getActiveCentralChimeNumber(
  supabase: SupabaseClient
): Promise<{ phoneNumber: string; phoneArn: string | null } | null> {
  const { data, error } = await supabase
    .from("chime_central_numbers")
    .select("phone_number, phone_arn")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    phoneNumber: data.phone_number,
    phoneArn: data.phone_arn ?? null,
  };
}

