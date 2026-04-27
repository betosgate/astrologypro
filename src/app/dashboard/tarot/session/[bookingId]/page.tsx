/**
 * /dashboard/tarot/session/[bookingId]
 *
 * Diviner-facing tarot session route scoped to a booking. Resolves the
 * booking's service template to a spread, then redirects to the dashboard
 * reading surface with booking context in the query string.
 */

import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDivinerOrAdminForBooking } from "@/lib/require-diviner-or-admin-for-booking";
import {
  isToolkitEnabled,
  resolveTarotSpreadId,
} from "@/lib/service-toolkit-mapping";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarot Session - AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function DashboardTarotSessionPage({ params }: PageProps) {
  const { bookingId } = await params;

  if (!isToolkitEnabled()) notFound();

  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const template = booking.service_templates;
  if (!template || template.category !== "tarot") {
    redirect(`/service/session/${bookingId}`);
  }

  const admin = createAdminClient();
  const resolved = await resolveTarotSpreadId(admin, template.slug);
  if (!resolved) notFound();

  const url = new URL(
    `/service/tarot/readings/${resolved.spreadId}`,
    "http://placeholder.local",
  );
  url.searchParams.set("bookingId", bookingId);
  url.searchParams.set("fromBooking", "1");
  redirect(`${url.pathname}${url.search}`);
}
