import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { createFinanceOperationNote, logFinanceAdminAction } from "@/lib/finance-ops";

export const dynamic = "force-dynamic";

// POST /api/admin/commissions/[commissionId]/adjust
// Create a debit/credit adjustment for a commission
// Body: { adjustment_type: 'credit'|'debit'|'reversal'|'refund_recalc', amount_cents: number, reason: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ commissionId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { commissionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const { adjustment_type, amount_cents, reason } = body as Record<string, unknown>;

  const validTypes = ["credit", "debit", "reversal", "refund_recalc"];
  if (typeof adjustment_type !== "string" || !validTypes.includes(adjustment_type)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: `adjustment_type must be one of: ${validTypes.join(", ")}`,
      },
      { status: 422 }
    );
  }

  if (typeof amount_cents !== "number" || !Number.isInteger(amount_cents)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "amount_cents must be an integer (positive = credit, negative = debit).",
      },
      { status: 422 }
    );
  }

  if (typeof reason !== "string" || reason.trim().length === 0) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "reason is required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify commission exists and get its affiliate_id
  const { data: commission, error: fetchError } = await admin
    .from("affiliate_commissions")
    .select("id, affiliate_id, status")
    .eq("id", commissionId)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Commission not found", status: 404 },
      { status: 404 }
    );
  }

  const { data: adjustment, error: insertError } = await admin
    .from("affiliate_commission_adjustments")
    .insert({
      commission_id: commissionId,
      affiliate_id: commission.affiliate_id,
      adjustment_type,
      amount_cents,
      reason: reason.trim(),
      approved_by: user.id,
    })
    .select("id, commission_id, affiliate_id, adjustment_type, amount_cents, reason, approved_by, created_at")
    .single();

  if (insertError || !adjustment) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: insertError?.message },
      { status: 500 }
    );
  }

  // Fire-and-forget activity log
  logActivity({
    userId: commission.affiliate_id,
    actorId: user.id,
    eventCategory: "admin",
    eventType: "commission_adjustment_created",
    metadata: {
      commission_id: commissionId,
      adjustment_id: adjustment.id,
      adjustment_type,
      amount_cents,
      reason: reason.trim(),
    },
  });

  await createFinanceOperationNote({
    createdByUserId: user.id,
    noteType: "manual_adjustment",
    note: `Affiliate commission adjustment ${adjustment_type} for commission ${commissionId}: ${amount_cents} cents. ${reason.trim()}`,
    status: "resolved",
  });

  await logFinanceAdminAction({
    adminUserId: user.id,
    targetUserId: commission.affiliate_id,
    actionType: "finance_affiliate_commission_adjusted",
    details: {
      commissionId,
      adjustmentId: adjustment.id,
      adjustmentType: adjustment_type,
      amountCents: amount_cents,
      reason: reason.trim(),
    },
  });

  return NextResponse.json(
    {
      adjustment_id: adjustment.id,
      commission_id: commissionId,
      amount_cents: adjustment.amount_cents,
    },
    { status: 201 }
  );
}
