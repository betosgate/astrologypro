/**
 * Cross-role booking access helper.
 *
 * Reads a booking and decides whether the authenticated Supabase user is
 * allowed to view it, for read-only surfaces that need to be shared
 * between the diviner dashboard, admin console, and the trainee /client
 * self-service view (e.g. /trainee "See Details" drawer).
 *
 * Returned role semantics:
 *   - "admin"   → user is an admin (see lib/admin-auth).
 *   - "diviner" → user is the diviner who owns this booking.
 *   - "client"  → user's authenticated email matches the booking's
 *                 client email (via clients.email or booking client_email).
 *                 "Client" here is any end-user who booked the session —
 *                 trainee, regular client, etc.
 *
 * A null return means the caller is not permitted to view this booking
 * and the route should respond 403. The helper deliberately returns a
 * role (not just a boolean) so callers can gate write operations
 * separately — e.g. only "diviner" | "admin" can reschedule, but
 * "client" may still read.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export type BookingViewerRole = "admin" | "diviner" | "client";

export interface BookingAccessResult {
  role: BookingViewerRole;
  bookingId: string;
  divinerId: string | null;
  clientId: string | null;
}

/**
 * @param admin  a service-role supabase client (createAdminClient)
 * @param bookingId  UUID of the booking being accessed
 * @param user  the authenticated user (supabase.auth.getUser())
 * @param isAdmin  pre-resolved admin flag (caller should use getAdminUser())
 */
export async function resolveBookingViewer(
  admin: SupabaseClient,
  bookingId: string,
  user: User,
  isAdmin: boolean,
): Promise<BookingAccessResult | null> {
  // Admin short-circuit — admins can read any booking.
  if (isAdmin) {
    const { data: booking } = await admin
      .from("bookings")
      .select("id, diviner_id, client_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return null;
    return {
      role: "admin",
      bookingId: booking.id as string,
      divinerId: (booking.diviner_id as string | null) ?? null,
      clientId: (booking.client_id as string | null) ?? null,
    };
  }

  const { data: booking } = await admin
    .from("bookings")
    .select("id, diviner_id, client_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;

  // Diviner path — user.id → diviners.id, compare against booking.diviner_id.
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (diviner?.id && (booking.diviner_id as string | null) === diviner.id) {
    return {
      role: "diviner",
      bookingId: booking.id as string,
      divinerId: (booking.diviner_id as string | null) ?? null,
      clientId: (booking.client_id as string | null) ?? null,
    };
  }

  // Client path — compare the authenticated email against the client row
  // linked to this booking. Email is read from supabase.auth, never from a
  // client-supplied field.
  const authEmail = user.email?.trim().toLowerCase();
  if (authEmail && booking.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("id, email")
      .eq("id", booking.client_id as string)
      .maybeSingle();
    const clientEmail = (client?.email as string | undefined)?.trim().toLowerCase();
    if (clientEmail && clientEmail === authEmail) {
      return {
        role: "client",
        bookingId: booking.id as string,
        divinerId: (booking.diviner_id as string | null) ?? null,
        clientId: (booking.client_id as string | null) ?? null,
      };
    }
  }

  return null;
}
