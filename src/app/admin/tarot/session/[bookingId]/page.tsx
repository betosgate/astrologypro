/**
 * /admin/tarot/session/[bookingId]
 *
 * Diviner-facing tarot reading page scoped to a specific booking.
 *
 * Strategy: redirect to the dashboard tarot reading page,
 * which ALREADY renders exactly one spread (single-spread UI). Extra query
 * params carry the booking context for later enhancement (persistence,
 * "reading for <client name>" banner). The existing page ignores unknown
 * params, so no code change to the reading client is required.
 *
 * Auth: requireDivinerOrAdminForBooking. The dashboard smart router also
 * enforces this, but callers CAN bookmark this URL directly, so we guard here
 * too.
 */

import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireDivinerOrAdminForBooking,
} from "@/lib/require-diviner-or-admin-for-booking";
import {
  isToolkitEnabled,
  resolveTarotSpreadId,
} from "@/lib/service-toolkit-mapping";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarot Session — AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function TarotSessionPage({ params }: PageProps) {
  const { bookingId } = await params;

  // Rollout gate — see service-toolkit-mapping.ts isToolkitEnabled().
  if (!isToolkitEnabled()) notFound();

  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const template = booking.service_templates;
  if (!template || template.category !== "tarot") {
    // Wrong category — this route is tarot-only. Use the smart router.
    redirect(`/service/session/${bookingId}`);
  }

  const admin = createAdminClient();
  const resolved = await resolveTarotSpreadId(admin, template.slug);
  if (!resolved) {
    // Service has no spread configured (gap we intentionally didn't fill).
    // UI is supposed to hide the link in this case; reaching here is a
    // direct-URL attempt. Don't leak details.
    notFound();
  }

  // Build the redirect URL — existing page reads only spreadId, and ignores
  // bookingId + fromBooking. They're included for later enhancements
  // (reading persistence, client-name banner) without breaking today.
  const url = new URL(
    `/service/tarot/readings/${resolved.spreadId}`,
    "http://placeholder.local",
  );
  url.searchParams.set("bookingId", bookingId);
  url.searchParams.set("fromBooking", "1");
  redirect(`${url.pathname}${url.search}`);
}
