// POST /api/admin/conversions/[id]/reverse
//
// Admin-only. Marks a `campaign_conversions` row as reversed (refund,
// dispute, manual adjustment) and fires the `affiliate.reversal`
// notification. Writes an `admin_action_log` row for audit.
//
// Body: { reason: string } — required, 5-500 chars (enforced by the
// admin_action_log CHECK constraint).
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/05-rate-edit-history-and-notifications.md
// Spec: docs/specs/affiliate-commission-system.md §5 Flow J + §5 Flow K

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reverseConversion } from "@/lib/affiliate-reverse-conversion";

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

  const result = await reverseConversion({
    admin,
    conversionId: id,
    reversedBy: user.id,
    reason,
  });

  if (result.ok !== true) {
    const failure = result;
    if (failure.reason === "not_found") return problem(404, "Conversion not found");
    if (failure.reason === "already_reversed") {
      return problem(409, "Conversion already reversed");
    }
    return problem(500, "Database error", failure.detail);
  }

  // Write audit log (see spec §5 Flow K). Fire-and-forget — we don't want
  // a log-write failure to trip the reversal rollback.
  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: user.id,
      action_kind: "affiliate_conversion_reversed",
      target_resource_type: "campaign_conversions",
      target_resource_id: id,
      reason,
    });
  } catch (err) {
    console.error("[admin/conversions/reverse] audit log failed", {
      conversionId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      data: {
        conversion_id: result.conversionId,
        amount_cents: result.amountCents,
        affiliate_id: result.affiliateId,
      },
    },
    { status: 200 },
  );
}
