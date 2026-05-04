// PATCH /api/affiliate/campaigns/[id]
//
// Affiliate archives one of their own campaigns. Only accepts the single
// status transition `{ status: 'archived' }` — other lifecycle actions
// on affiliate-owned campaigns are out of scope for Phase 1.
//
// Archive is a soft-delete (spec §5 Flow I):
//   - status flips to 'archived'; `/r/<code>` returns the "link no
//     longer active" page on future clicks
//   - No commissions are credited for any future conversion via this
//     campaign (creditAffiliateConversion gates on campaign.status='active'
//     via resolveAffiliateFromRef)
//   - Existing `campaign_conversions` rows stay intact. The FK from
//     conversions.campaign_id is ON DELETE RESTRICT, so even a hard-delete
//     via SQL would now error
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/06-revoked-link-and-archive-behavior.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const b = (body ?? {}) as Record<string, unknown>;

  if (b.status !== "archived") {
    return problem(
      422,
      "Validation error",
      "Only { status: 'archived' } is accepted on this endpoint.",
    );
  }

  // Ownership: the campaign must be affiliate-owned. Phase 1 (per-diviner)
  // matches via the caller's junctionIds; Phase 1.5 (general) matches via
  // the caller's account.id.
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, status, owner_type, owner_affiliate_id, owner_affiliate_type, owner_affiliate_account_id",
    )
    .eq("id", id)
    .maybeSingle();

  const isOwnedPerDiviner =
    !!campaign &&
    campaign.owner_affiliate_type === "diviner_affiliate" &&
    ctx.junctionIds.includes(campaign.owner_affiliate_id as string);

  const isOwnedGeneral =
    !!campaign &&
    campaign.owner_affiliate_type === "general" &&
    campaign.owner_affiliate_account_id === ctx.account.id;

  if (
    !campaign ||
    campaign.owner_type !== "affiliate" ||
    (!isOwnedPerDiviner && !isOwnedGeneral)
  ) {
    // Hide existence of foreign campaigns — 404, not 403.
    return problem(404, "Campaign not found");
  }

  if (campaign.status === "archived") {
    return NextResponse.json({ data: { id, status: "archived" } });
  }

  const { error: updateErr } = await admin
    .from("affiliate_campaigns")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return problem(500, "Database error", updateErr.message);
  }

  console.log("[affiliate/campaigns] archived", {
    campaign_id: id,
    affiliate_account_id: ctx.account.id,
  });

  return NextResponse.json({ data: { id, status: "archived" } });
}
