/**
 * /dashboard/session/[bookingId] - diviner-facing smart router.
 *
 * This is the canonical "Open Service" entrypoint from the diviner dashboard.
 * It resolves the booking's mapped service template and redirects to the
 * category-specific dashboard session route. The admin smart router remains
 * available as a compatibility alias, but dashboard-owned URLs avoid putting
 * non-admin diviners through the admin route shell.
 */

import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDivinerOrAdminForBooking } from "@/lib/require-diviner-or-admin-for-booking";
import {
  isToolkitEnabled,
  resolveToolkitForBooking,
} from "@/lib/service-toolkit-mapping";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open Service - AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function DashboardSessionRouter({ params }: PageProps) {
  const { bookingId } = await params;

  if (!isToolkitEnabled()) notFound();

  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const templateSlug = booking.service_templates?.slug ?? null;
  const category = booking.service_templates?.category ?? null;

  if (!templateSlug || !category) notFound();

  const admin = createAdminClient();
  const resolution = await resolveToolkitForBooking(admin, {
    bookingId,
    templateSlug,
    category,
    routeBasePath: "/dashboard",
  });

  if (!resolution) notFound();

  void admin
    .from("bookings")
    .update({ toolkit_session_opened_at: new Date().toISOString() })
    .eq("id", bookingId)
    .is("toolkit_session_opened_at", null)
    .then(() => undefined);

  redirect(resolution.sessionPath);
}
