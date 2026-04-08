import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]/commissions
// Query: status?, limit?, cursor?
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("affiliate_commissions")
    .select(
      "id, affiliate_id, diviner_id, link_id, order_reference, order_amount_cents, commission_type, commission_rate, commission_amount_cents, status, approved_at, approved_by, notes, is_locked, created_at, updated_at"
    )
    .eq("affiliate_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/admin/affiliates/[id]/commissions
// Manual commission entry by admin
// Body: { order_amount_cents, commission_type, commission_rate, commission_amount_cents, order_reference?, notes? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const {
    order_amount_cents,
    commission_type,
    commission_rate,
    commission_amount_cents,
    order_reference,
    notes,
  } = body as Record<string, unknown>;

  if (
    typeof order_amount_cents !== "number" ||
    typeof commission_type !== "string" ||
    !["percentage", "fixed"].includes(commission_type) ||
    typeof commission_rate !== "number" ||
    typeof commission_amount_cents !== "number"
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "order_amount_cents, commission_type, commission_rate, and commission_amount_cents are required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify affiliate exists and get its diviner_id
  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id, diviner_id")
    .eq("id", id)
    .single();

  if (affError || !affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    affiliate_id: id,
    diviner_id: affiliate.diviner_id,
    order_amount_cents,
    commission_type,
    commission_rate,
    commission_amount_cents,
    status: "pending",
    approved_by: user.id,
  };
  if (typeof order_reference === "string" && order_reference.trim()) insertPayload.order_reference = order_reference.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();

  const { data, error } = await admin
    .from("affiliate_commissions")
    .insert(insertPayload)
    .select("id, affiliate_id, diviner_id, order_amount_cents, commission_type, commission_rate, commission_amount_cents, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
