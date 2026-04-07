import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/commissions/[commissionId]/refund
// Record a refund against a commission. Full refund reverses commission; partial creates adjustment.
// Body: { refund_amount_cents: number }
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

  const { refund_amount_cents } = body as Record<string, unknown>;

  if (
    typeof refund_amount_cents !== "number" ||
    !Number.isInteger(refund_amount_cents) ||
    refund_amount_cents <= 0
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "refund_amount_cents must be a positive integer.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch commission
  const { data: commission, error: fetchError } = await admin
    .from("affiliate_commissions")
    .select("id, affiliate_id, commission_amount_cents, status, refund_amount_cents")
    .eq("id", commissionId)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Commission not found", status: 404 },
      { status: 404 }
    );
  }

  if (commission.status === "reversed") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Commission already reversed",
        status: 422,
        detail: "Cannot refund a commission that has already been reversed.",
      },
      { status: 422 }
    );
  }

  const commissionAmountCents = Number(commission.commission_amount_cents);
  const alreadyRefunded = Number(commission.refund_amount_cents ?? 0);
  const isFullRefund = refund_amount_cents >= commissionAmountCents - alreadyRefunded;

  const commissionUpdate: Record<string, unknown> = {
    refunded_at: new Date().toISOString(),
    refund_amount_cents: alreadyRefunded + refund_amount_cents,
  };

  let adjustmentCreated = false;
  let newStatus = commission.status as string;

  if (isFullRefund) {
    commissionUpdate.status = "reversed";
    newStatus = "reversed";

    // Insert history record for the reversal
    await admin.from("affiliate_commission_history").insert({
      commission_id: commissionId,
      old_status: commission.status,
      new_status: "reversed",
      changed_by: user.id,
      reason: `Full refund of ${refund_amount_cents} cents`,
    });
  } else {
    // Partial refund — create a debit adjustment
    const { error: adjError } = await admin
      .from("affiliate_commission_adjustments")
      .insert({
        commission_id: commissionId,
        affiliate_id: commission.affiliate_id,
        adjustment_type: "refund_recalc",
        amount_cents: -refund_amount_cents, // debit (negative)
        reason: `Partial refund recalculation: ${refund_amount_cents} cents refunded`,
        approved_by: user.id,
      });

    if (!adjError) {
      adjustmentCreated = true;
    }
  }

  // Update commission
  const { data, error: updateError } = await admin
    .from("affiliate_commissions")
    .update(commissionUpdate)
    .eq("id", commissionId)
    .select("id, status, refunded_at, refund_amount_cents, updated_at")
    .single();

  if (updateError || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: updateError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    commission_id: commissionId,
    new_status: newStatus,
    adjustment_created: adjustmentCreated,
    refund_amount_cents,
    total_refunded_cents: Number(data.refund_amount_cents),
  });
}
