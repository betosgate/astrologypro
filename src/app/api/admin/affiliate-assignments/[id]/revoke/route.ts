// POST /api/admin/affiliate-assignments/[id]/revoke
//
// Admin emergency override. Forces an affiliate assignment to
// is_active=false on behalf of the owning diviner — for incident
// response (fraud, ToS violation, diviner unreachable). Writes an
// admin_action_log row with the required reason and dual-notifies
// the diviner + affiliate.
//
// Body: { reason: string } — 5-500 chars (enforced by admin_action_log
// CHECK constraint).
//
// Side effects (matching what the diviner-side PATCH would do):
//   - flip is_active=false, set revoked_at + revoked_by = admin user
//   - existing auto_pause_affiliate_campaigns_on_revoke trigger pauses
//     dependent affiliate-owned campaigns
//   - /r/[code] returns the "link no longer active" page
//   - new bookings through these campaigns get no commission stamp
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/07-reporting-and-dashboards.md (Part G)
// Spec: docs/specs/affiliate-commission-system.md §5 Flow K

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import {
  notifyAffiliate,
  resolveAffiliatePrefs,
} from "@/lib/affiliate-notifications";
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

  // Fetch the assignment with everything we need for the revoke + notify.
  const { data: assignment } = await admin
    .from("diviner_service_affiliates")
    .select(
      `id, diviner_id, destination_type, destination_id, affiliate_id,
       affiliate_type, is_active,
       diviner:diviners ( id, user_id, display_name )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!assignment) return problem(404, "Assignment not found");
  if (assignment.affiliate_type !== "diviner_affiliate") {
    return problem(422, "Unsupported affiliate type");
  }
  if (!assignment.is_active) {
    return problem(409, "Assignment already revoked");
  }

  const { error: updateErr } = await admin
    .from("diviner_service_affiliates")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return problem(500, "Database error", updateErr.message);
  }

  // Audit log (fire-and-forget — the revoke is already committed).
  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: user.id,
      action_kind: "affiliate_assignment_revoked",
      target_resource_type: "diviner_service_affiliates",
      target_resource_id: id,
      reason,
    });
  } catch (err) {
    console.error("[admin force-revoke] audit log failed", {
      assignmentId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // Dual notification: diviner + affiliate.
  try {
    const diviner = Array.isArray(assignment.diviner)
      ? assignment.diviner[0]
      : assignment.diviner;

    // Product label resolution.
    let productLabel = `${diviner?.display_name ?? "your"} profile`;
    if (assignment.destination_type === "SERVICE" && assignment.destination_id) {
      const { data: template } = await admin
        .from("service_templates")
        .select("name")
        .eq("id", assignment.destination_id as string)
        .maybeSingle();
      productLabel = (template?.name as string) ?? "a service";
    }

    // Notify the affiliate.
    const account = await getAffiliateAccountForJunction(
      admin,
      assignment.affiliate_id as string,
    );
    if (account?.user_id) {
      await notifyAffiliate({
        admin,
        userId: account.user_id,
        affiliateAccountId: account.id,
        toEmail: account.email,
        kind: "admin.override.assignment_revoked",
        title: `Assignment on ${productLabel} was revoked by an administrator`,
        body: `An administrator has revoked your affiliate assignment on ${productLabel}. Reason: ${reason}. Existing share links will stop working and no new commissions will be credited on future bookings.`,
        actionUrl: "/affiliate/assignments",
      });
    }

    // Notify the diviner. We don't have a diviner-side pref store today,
    // so the in-app notification fires unconditionally via the generic
    // helper. Email omitted to avoid spamming diviners who already
    // consented to admin override by requesting this action in some
    // out-of-band channel.
    const divinerUserId = (diviner as { user_id?: string } | null)?.user_id;
    if (divinerUserId) {
      await createNotification({
        userId: divinerUserId,
        title: `Affiliate assignment revoked by admin`,
        body: `An administrator has revoked the affiliate assignment on ${productLabel}. Reason: ${reason}.`,
        type: "billing",
        actionUrl: `/dashboard/affiliates`,
      });
    }

    // Reference to keep helper-used linter quiet; real per-kind pref
    // respect for diviners will arrive with a unified notification
    // overhaul in a later sprint.
    void resolveAffiliatePrefs;
  } catch (err) {
    console.error("[admin force-revoke] notification failed", {
      assignmentId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      data: {
        assignment_id: id,
        is_active: false,
      },
    },
    { status: 200 },
  );
}
