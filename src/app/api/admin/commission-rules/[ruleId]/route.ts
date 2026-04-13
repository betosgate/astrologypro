import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

// PATCH /api/admin/commission-rules/[ruleId]
// Update a commission rule (is_active, commission_value, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { ruleId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const {
    is_active,
    commission_type,
    commission_value,
    min_order_amount_cents,
    max_commission_cents,
    valid_from,
    valid_until,
    priority,
    notes,
    product_id,
    product_type,
  } = body as Record<string, unknown>;

  const updatePayload: Record<string, unknown> = {};

  if (typeof is_active === "boolean") updatePayload.is_active = is_active;
  if (typeof commission_type === "string" && ["percentage", "fixed"].includes(commission_type)) {
    updatePayload.commission_type = commission_type;
  }
  if (typeof commission_value === "number" && commission_value >= 0) {
    updatePayload.commission_value = commission_value;
  }
  if (typeof min_order_amount_cents === "number") updatePayload.min_order_amount_cents = min_order_amount_cents;
  if (max_commission_cents === null || typeof max_commission_cents === "number") {
    updatePayload.max_commission_cents = max_commission_cents;
  }
  if (typeof valid_from === "string") updatePayload.valid_from = valid_from.trim() || null;
  if (typeof valid_until === "string") updatePayload.valid_until = valid_until.trim() || null;
  if (typeof priority === "number") updatePayload.priority = priority;
  if (typeof notes === "string") updatePayload.notes = notes.trim() || null;
  if (typeof product_id === "string") updatePayload.product_id = product_id.trim() || null;
  if (typeof product_type === "string") updatePayload.product_type = product_type.trim() || null;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "No updatable fields provided", status: 422 },
      { status: 422 }
    );
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: updatePayload.commission_type,
      commissionValue: updatePayload.commission_value,
    });
  } catch (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", status: 422, detail: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("affiliate_commission_rules")
    .update(updatePayload)
    .eq("id", ruleId)
    .select(
      "id, affiliate_id, diviner_id, commission_type, commission_value, is_active, priority, valid_from, valid_until, notes, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Rule not found or update failed", status: 404, detail: error?.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// DELETE /api/admin/commission-rules/[ruleId]
// Soft-delete: set is_active = false
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { ruleId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("affiliate_commission_rules")
    .update({ is_active: false })
    .eq("id", ruleId)
    .select("id, is_active, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Rule not found", status: 404, detail: error?.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
