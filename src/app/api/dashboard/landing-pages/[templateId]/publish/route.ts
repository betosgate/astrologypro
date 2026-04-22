/**
 * DEPRECATED — replaced by POST /api/dashboard/landing-pages/[templateId]/toggle-live.
 *
 * Under V2 a single toggle-live endpoint handles both directions via
 * `{ is_published: boolean }`. This stub stays so old clients get a clear
 * 410 instead of a 404.
 *
 * Removed in Deploy 2 of docs/tasks/2026-04-21/landing-page-simplification.
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
        "POST /publish is no longer available. Use POST /toggle-live with `{ \"is_published\": true }` instead.",
    },
    { status: 410 },
  );
}
