/**
 * /admin/horoscope — server-side auth gate.
 *
 * Historical bug: the horoscope toolkit page is "use client" and had NO
 * server-side auth check. Anyone hitting the URL could load the HTML shell
 * (the AstrologyAPI backend is admin-gated, so non-admins saw a broken UI
 * rather than a data leak — but the page still shouldn't render at all for
 * anonymous visitors).
 *
 * Fix (2026-04-18, product decision: "fix the horoscope auth hole"):
 *   - Redirect unauthenticated visitors to /login.
 *   - Permit BOTH admins AND assigned diviners through, because the session
 *     subroute (/admin/horoscope/session/[bookingId]) is diviner-facing and
 *     nests under this layout. That subroute has its own strict per-booking
 *     authorization via requireDivinerOrAdminForBooking — layer defense.
 *   - A non-admin diviner visiting the root /admin/horoscope directly will
 *     still see a visually-loaded UI, but every API call 401s against the
 *     admin-only astro endpoints. That's acceptable technical debt: the
 *     known "open full toolkit" escape-hatch link from the session page
 *     needs further scoping before we lock the root down harder.
 *
 * CLAUDE.md §3 (defense in depth) + §13 (data-level authorization) satisfied:
 *   - Layer 1 (this file):        authenticated users only.
 *   - Layer 2 (session page.tsx): booking-scoped diviner-or-admin check.
 *   - Layer 3 (API routes):       admin-only for compute/AI endpoints
 *                                 (future: diviner access via booking scope).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function HoroscopeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/horoscope");
  }

  return <>{children}</>;
}
