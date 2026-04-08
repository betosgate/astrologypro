import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]/payouts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_id, diviner_id, amount_cents, method, reference, proof_url, notes, paid_at, created_by, created_at"
    )
    .eq("affiliate_id", id)
    .order("paid_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

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

// POST /api/admin/affiliates/[id]/payouts
// Body: { amount_cents, paid_at, method?, reference?, proof_url?, notes?, commission_ids? }
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
    amount_cents,
    paid_at,
    method,
    reference,
    proof_url,
    notes,
    commission_ids,
  } = body as Record<string, unknown>;

  if (typeof amount_cents !== "number" || amount_cents <= 0 || typeof paid_at !== "string" || paid_at.trim() === "") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "amount_cents (positive number) and paid_at (ISO date string) are required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify affiliate exists and get diviner_id
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
    amount_cents,
    paid_at,
    created_by: user.id,
  };
  if (typeof method === "string" && method.trim()) insertPayload.method = method.trim();
  if (typeof reference === "string" && reference.trim()) insertPayload.reference = reference.trim();
  if (typeof proof_url === "string" && proof_url.trim()) insertPayload.proof_url = proof_url.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();

  const { data: payout, error } = await admin
    .from("affiliate_payouts")
    .insert(insertPayload)
    .select("id, affiliate_id, diviner_id, amount_cents, method, reference, paid_at, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  // Link commission_ids if provided
  if (Array.isArray(commission_ids) && commission_ids.length > 0) {
    const items = (commission_ids as string[]).map((cid) => ({
      payout_id: payout.id,
      commission_id: cid,
    }));
    await admin.from("affiliate_payout_items").insert(items);

    // Mark linked commissions as paid
    await admin
      .from("affiliate_commissions")
      .update({ status: "paid" })
      .in("id", commission_ids as string[]);
  }

  return NextResponse.json({ data: payout }, { status: 201 });
}
