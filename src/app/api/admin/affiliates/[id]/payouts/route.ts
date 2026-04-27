// GET + POST /api/admin/affiliates/[id]/payouts
//
// Phase 2 stub. Payouts are deferred to the Stripe auto-split sprint
// (spec §10 Phase 2). The legacy `affiliate_payouts` table + manual
// payout workflow are retired. When Phase 2 lands this route will
// read payout rows from the new schema and execute Stripe transfers.
//
// Until then GET returns an empty list so the admin per-affiliate
// detail page renders without errors, and POST 410s so any lingering
// UI "Record payout" control fails loudly rather than silently
// writing to nothing.
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/ (Phase 2 deferral)

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    data: [],
    nextCursor: null,
    hasMore: false,
    _phase2_deferred: true,
  });
}

export async function POST() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    {
      type: "https://httpstatuses.io/410",
      title: "Manual payouts retired",
      status: 410,
      detail:
        "The manual affiliate-payout workflow was retired with System A. Stripe auto-split will ship in the next sprint (spec §10 Phase 2).",
    },
    { status: 410 },
  );
}
