/**
 * /admin/session/[bookingId] - compatibility smart router.
 *
 * Older "Open Service" links pointed here. New diviner-facing links use
 * /service/session/[bookingId]. This route keeps bookmarked/admin links
 * working and redirects into the standalone service surface.
 *
 * Auth: delegates to requireDivinerOrAdminForBooking — same guard used by
 * the concrete session pages. Unauthenticated / unauthorized callers are
 * bounced before redirect.
 */

import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireDivinerOrAdminForBooking,
} from "@/lib/require-diviner-or-admin-for-booking";
import {
  isToolkitEnabled,
  resolveToolkitForBooking,
} from "@/lib/service-toolkit-mapping";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open Service - AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function SmartSessionRouter({ params }: PageProps) {
  const { bookingId } = await params;

  // Rollout gate (CLAUDE.md section 8). Flipping the flag must stop new traffic to
  // the toolkit, not just hide UI. UI buttons go away via getSessionLinkForBooking,
  // but a bookmarked URL would still hit this router — 404 it.
  if (!isToolkitEnabled()) notFound();

  // Auth + load booking in one call. Will redirect on its own if denied.
  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const templateSlug = booking.service_templates?.slug ?? null;
  const category = booking.service_templates?.category ?? null;

  if (!templateSlug || !category) {
    // Booking exists but isn't tied to a template — nothing to open.
    notFound();
  }

  const admin = createAdminClient();
  const resolution = await resolveToolkitForBooking(admin, {
    bookingId,
    templateSlug,
    category,
    routeBasePath: "/service",
  });

  if (!resolution) {
    // Valid booking, but service has no toolkit mapping (tarot catalogue gap).
    // UI is supposed to hide the link in this case — we reach here only if
    // someone guessed the URL. 404 is correct.
    notFound();
  }

  // Fire-and-forget telemetry stamp. Don't block the redirect if it fails.
  void admin
    .from("bookings")
    .update({ toolkit_session_opened_at: new Date().toISOString() })
    .eq("id", bookingId)
    .is("toolkit_session_opened_at", null)
    .then(() => undefined);

  redirect(resolution.sessionPath);
}
