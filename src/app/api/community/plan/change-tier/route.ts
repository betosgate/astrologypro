/**
 * POST /api/community/plan/change-tier (DEPRECATED)
 *
 * This endpoint has been split into three safer routes:
 *
 *   POST /api/community/plan/change-tier/preview
 *     Classifies payment state and returns prorated upgrade preview.
 *   POST /api/community/plan/change-tier/checkout
 *     Creates a recurring Stripe Checkout session for non-subscribers.
 *   POST /api/community/plan/change-tier/confirm
 *     Finalizes a tier upgrade for active subscribers after confirmation.
 *
 * The old route updated pm_tier_id before Stripe confirmed payment and had
 * no branch for one-time/manual users. It now returns 410 Gone to force
 * callers onto the new flow.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      type: "https://httpstatuses.io/410",
      title: "Endpoint deprecated",
      status: 410,
      detail:
        "Use /api/community/plan/change-tier/preview to start a tier change, then /change-tier/confirm (active subscribers) or /change-tier/checkout (new subscription).",
      replacements: {
        preview: "/api/community/plan/change-tier/preview",
        confirm: "/api/community/plan/change-tier/confirm",
        checkout: "/api/community/plan/change-tier/checkout",
      },
    },
    { status: 410 }
  );
}
