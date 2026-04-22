/**
 * DEPRECATED — preview now happens by opening the public URL with
 * `?preview=true`. The public route at src/app/[username]/services/[slug]/page.tsx
 * authenticates the viewer against the owning diviner and renders the same
 * page that the public would see, minus the `is_published` gate. No separate
 * preview API is needed.
 *
 * Removed in Deploy 2 of docs/tasks/2026-04-21/landing-page-simplification.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      type: "about:blank",
      title: "Endpoint removed",
      status: 410,
      detail:
        "Preview is served by the public route directly. Open /:username/services/:slug?preview=true while signed in as the owning diviner.",
    },
    { status: 410 },
  );
}
