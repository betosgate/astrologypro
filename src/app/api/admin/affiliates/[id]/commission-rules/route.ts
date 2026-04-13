import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]/commission-rules
// List commission rules for this affiliate
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("affiliate_commission_rules")
    .select(
      "id, affiliate_id, diviner_id, product_id, product_type, commission_type, commission_value, min_order_amount_cents, max_commission_cents, currency, valid_from, valid_until, is_active, priority, notes, created_by, created_at, updated_at"
    )
    .eq("affiliate_id", id)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST /api/admin/affiliates/[id]/commission-rules
// Create a new commission rule for this affiliate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { id } = await params;

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
    commission_type,
    commission_value,
    product_id,
    product_type,
    valid_from,
    valid_until,
    notes,
    min_order_amount_cents,
    max_commission_cents,
    priority,
  } = body as Record<string, unknown>;

  if (
    typeof commission_type !== "string" ||
    !["percentage", "fixed"].includes(commission_type) ||
    typeof commission_value !== "number" ||
    commission_value < 0
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "commission_type ('percentage'|'fixed') and commission_value (>=0) are required.",
      },
      { status: 422 }
    );
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: commission_type,
      commissionValue: commission_value,
    });
  } catch (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", status: 422, detail: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify affiliate exists
  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id, diviner_id")
    .eq("id", id)
    .single();

  if (affError || !affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found", status: 404 },
      { status: 404 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    affiliate_id: id,
    diviner_id: affiliate.diviner_id,
    commission_type,
    commission_value,
    is_active: true,
    created_by: user.id,
  };

  if (typeof product_id === "string" && product_id.trim()) insertPayload.product_id = product_id.trim();
  if (typeof product_type === "string" && product_type.trim()) insertPayload.product_type = product_type.trim();
  if (typeof valid_from === "string" && valid_from.trim()) insertPayload.valid_from = valid_from.trim();
  if (typeof valid_until === "string" && valid_until.trim()) insertPayload.valid_until = valid_until.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();
  if (typeof min_order_amount_cents === "number") insertPayload.min_order_amount_cents = min_order_amount_cents;
  if (typeof max_commission_cents === "number") insertPayload.max_commission_cents = max_commission_cents;
  if (typeof priority === "number") insertPayload.priority = priority;

  const { data, error } = await admin
    .from("affiliate_commission_rules")
    .insert(insertPayload)
    .select(
      "id, affiliate_id, diviner_id, commission_type, commission_value, product_id, product_type, valid_from, valid_until, is_active, priority, notes, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
