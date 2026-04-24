// POST /api/admin/affiliate-campaigns/[id]/archive
//
// Admin emergency override. Forces an affiliate-owned campaign to
// status='archived' on behalf of the owning affiliate. Used when the
// campaign owner is unreachable and the campaign needs to be taken
// down (fraudulent redirect, dispute, etc.). Writes an
// admin_action_log row and notifies the affiliate + diviner.
//
// Body: { reason: string } — 5-500 chars.
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/07-reporting-and-dashboards.md (Part G)
// Spec: docs/specs/affiliate-commission-system.md §5 Flow K

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { notifyAffiliate } from "@/lib/affiliate-notifications";
import { getAffiliateAccountForJunction } from "@/lib/affiliate-accounts";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return problem(403, "Forbidden");

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const reason = typeof b.reason === "string" ? b.reason.trim() : "";
  if (reason.length < 5 || reason.length > 500) {
    return problem(
      422,
      "Validation error",
      "reason is required (5-500 characters)",
    );
  }

  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select(
      `id, name, status, owner_type, owner_affiliate_id, owner_affiliate_type,
       diviner_id, diviner:diviners ( id, user_id, display_name )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return problem(404, "Campaign not found");
  if (
    campaign.owner_type !== "affiliate" ||
    campaign.owner_affiliate_type !== "diviner_affiliate"
  ) {
    return problem(
      422,
      "Unsupported campaign type",
      "Admin archive is only supported for affiliate-owned campaigns.",
    );
  }
  if (campaign.status === "archived") {
    return problem(409, "Campaign already archived");
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

  // Audit log.
  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: user.id,
      action_kind: "affiliate_campaign_archived",
      target_resource_type: "affiliate_campaigns",
      target_resource_id: id,
      reason,
    });
  } catch (err) {
    console.error("[admin force-archive] audit log failed", {
      campaignId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // Dual notification.
  try {
    const diviner = Array.isArray(campaign.diviner)
      ? campaign.diviner[0]
      : campaign.diviner;
    const campaignLabel = (campaign.name as string) ?? "a campaign";

    const account = await getAffiliateAccountForJunction(
      admin,
      campaign.owner_affiliate_id as string,
    );
    if (account?.user_id) {
      await notifyAffiliate({
        admin,
        userId: account.user_id,
        affiliateAccountId: account.id,
        toEmail: account.email,
        kind: "admin.override.campaign_archived",
        title: `Campaign "${campaignLabel}" was archived by an administrator`,
        body: `An administrator has archived your campaign "${campaignLabel}". Reason: ${reason}. The share link will no longer work and no new commissions will be credited through it.`,
        actionUrl: "/affiliate/campaigns",
      });
    }

    const divinerUserId = (diviner as { user_id?: string } | null)?.user_id;
    if (divinerUserId) {
      await createNotification({
        userId: divinerUserId,
        title: `Affiliate campaign archived by admin`,
        body: `An administrator has archived the affiliate campaign "${campaignLabel}" on your product. Reason: ${reason}.`,
        type: "billing",
        actionUrl: `/dashboard/campaigns`,
      });
    }
  } catch (err) {
    console.error("[admin force-archive] notification failed", {
      campaignId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      data: {
        campaign_id: id,
        status: "archived",
      },
    },
    { status: 200 },
  );
}
