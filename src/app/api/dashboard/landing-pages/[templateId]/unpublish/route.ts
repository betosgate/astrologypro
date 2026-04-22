/**
 * DEPRECATED — replaced by POST /api/dashboard/landing-pages/[templateId]/toggle-live.
 *
 * Under V2 there is no separate unpublish path. The dashboard sends a single
 * `{ is_published: boolean }` to toggle-live and that writes
 * `diviner_services.is_published` directly. This stub stays only so an old
 * client that still calls this URL gets a clear error instead of a 404.
 *
 * Removed in Deploy 2 of docs/tasks/2026-04-21/landing-page-simplification.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function gone() {
  return NextResponse.json(
    {
      type: "about:blank",
      title: "Endpoint removed",
      status: 410,
      detail:
        "POST /unpublish is no longer available. Use POST /toggle-live with `{ \"is_published\": false }` instead.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return gone();
}

export async function GET() {
  return gone();
}
