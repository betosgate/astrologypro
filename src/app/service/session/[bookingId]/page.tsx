/**
 * /service/session/[bookingId] - standalone smart router.
 *
 * Canonical "Open Service" entrypoint. It resolves a booking to the mapped
 * service tool without inheriting dashboard/admin navigation chrome.
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

export default async function ServiceSessionRouter({ params }: PageProps) {
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
    routeBasePath: "/service",
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
