/**
 * Server-only auth guard for the new toolkit session routes.
 *
 * Access rule (CLAUDE.md §3, §13, §22 — data-level, not UI-level):
 *   - An admin can open any booking's session page.
 *   - Otherwise, only the diviner on the booking (`bookings.owner_id` ==
 *     the current user's diviner.id) can open it.
 *   - Everyone else is redirected to /login or /dashboard with a reason.
 *
 * Returns the loaded booking row (joined to service_templates) so the caller
 * doesn't have to re-query. Throws via `redirect()` on the unauthorized paths.
 *
 * NEVER import this from a client component — it awaits server-only primitives.
 */

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export interface BookingForSession {
  id: string;
  owner_id: string | null;
  /** legacy column — still populated during the owner_id rename */
  diviner_id?: string | null;
  client_id: string | null;
  service_id: string | null;
  scheduled_at: string | null;
  status: string | null;
  questionnaire_responses: Record<string, unknown> | null;
  partner_birth_data: Record<string, unknown> | null;
  services: {
    id: string;
    name: string;
    slug: string;
    template_id: string | null;
  } | null;
  service_templates: {
    id: string;
    slug: string;
    category: string;
    name: string;
  } | null;
  clients: {
    id: string;
    full_name: string | null;
    birth_date: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_lat: number | string | null;
    birth_lng: number | string | null;
    birth_timezone: string | null;
  } | null;
}

export interface AuthorizedBookingContext {
  user: User;
  booking: BookingForSession;
  role: "admin" | "diviner";
}

const BOOKING_SELECT = `
  id,
  owner_id,
  diviner_id,
  client_id,
  service_id,
  scheduled_at,
  status,
  questionnaire_responses,
  partner_birth_data,
  services:services!bookings_service_id_fkey (
    id,
    name,
    slug,
    template_id,
    service_templates:service_templates!services_template_id_fkey (
      id,
      slug,
      category,
      name
    )
  ),
  clients:clients!bookings_client_id_fkey (
    id,
    full_name,
    birth_date,
    birth_time,
    birth_city,
    birth_lat,
    birth_lng,
    birth_timezone
  )
`;

/**
 * Loads the booking + related rows using the admin client (bypasses RLS so
 * we can inspect owner_id ourselves). Returns null if the row doesn't exist.
 */
async function loadBooking(bookingId: string): Promise<BookingForSession | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !data) return null;

  // Flatten the nested service_templates for easier consumption downstream.
  // Supabase returns it under services.service_templates — we lift it.
  // biome-ignore lint: explicit any — Supabase typed nested join is awkward
  const services = (data as any).services ?? null;
  const service_templates = services?.service_templates ?? null;
  if (services) delete services.service_templates;

  return {
    ...(data as unknown as BookingForSession),
    services,
    service_templates,
  };
}

async function getDivinerIdForUser(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Main guard. Call this at the top of a server component/page for
 * /dashboard/session/[bookingId], the category-specific dashboard session
 * routes, or their legacy /admin aliases. It will either return the loaded
 * booking + user, or redirect and never return.
 */
export async function requireDivinerOrAdminForBooking(
  bookingId: string,
): Promise<AuthorizedBookingContext> {
  // 1. Must be signed in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/session/${bookingId}`)}`);
  }

  // 2. Load the booking first — we'll need it for the diviner check.
  const booking = await loadBooking(bookingId);
  if (!booking) {
    // Don't leak whether the booking exists — send to dashboard.
    redirect("/dashboard?reason=not_found");
  }

  // 3. Admins get through regardless.
  const admin = await requireAdmin();
  if (admin && admin.id === user.id) {
    return { user, booking, role: "admin" };
  }

  // 4. Otherwise must be the diviner assigned to this booking.
  const divinerId = await getDivinerIdForUser(user.id);
  if (!divinerId) {
    redirect("/dashboard?reason=not_a_diviner");
  }
  const ownerId = booking.owner_id ?? booking.diviner_id ?? null;
  if (ownerId !== divinerId) {
    redirect("/dashboard?reason=forbidden");
  }

  return { user, booking, role: "diviner" };
}
