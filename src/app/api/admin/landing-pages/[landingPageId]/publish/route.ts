/**
 * DEPRECATED — admin no longer publishes or unpublishes landing pages.
 *
 * Under V2 the publish gate lives on `diviner_services.is_published` and is
 * toggled by the owning diviner from their dashboard. The admin controls
 * only `services.is_active` and `diviner_services.is_enabled` (via separate
 * endpoints). The page-level publish lifecycle is gone.
 *
 * Admin moderation (flagging individual blocks) still lives under
 * /api/admin/landing-pages/[landingPageId]/sections — that stays operational
 * through Deploy 1. Removed in Deploy 2 of
 * docs/tasks/2026-04-21/landing-page-simplification.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      type: "about:blank",
      title: "Endpoint removed",
      status: 410,
      detail:
        "Admin publish/unpublish is no longer available. Diviners toggle Live/Offline themselves. Admin controls services.is_active and diviner_services.is_enabled.",
    },
    { status: 410 },
  );
}
