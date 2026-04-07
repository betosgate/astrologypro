import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/affiliates
// Returns the diviner's own affiliates list with commission totals.
// Query params: status?, q?, limit?, cursor?
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  let query = admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_at, updated_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (cursor) query = query.lt("id", cursor);

  const { data: affiliates, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message, status: 500 },
      { status: 500 }
    );
  }

  const hasMore = (affiliates ?? []).length > limit;
  const items = hasMore ? (affiliates ?? []).slice(0, limit) : (affiliates ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  if (items.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  // Enrich with commission totals (total_earned, pending, paid) and payout balance
  const affiliateIds = items.map((a: { id: string }) => a.id);

  const [commissionsResult, payoutsResult] = await Promise.all([
    admin
      .from("affiliate_commissions")
      .select("affiliate_id, commission_amount_cents, status")
      .in("affiliate_id", affiliateIds),
    admin
      .from("affiliate_payouts")
      .select("affiliate_id, amount_cents")
      .in("affiliate_id", affiliateIds),
  ]);

  const commissionMap: Record<string, { total_earned: number; pending: number; approved: number; paid: number }> = {};
  const payoutMap: Record<string, number> = {};

  (commissionsResult.data ?? []).forEach((c: { affiliate_id: string; commission_amount_cents: number; status: string }) => {
    if (!commissionMap[c.affiliate_id]) {
      commissionMap[c.affiliate_id] = { total_earned: 0, pending: 0, approved: 0, paid: 0 };
    }
    const cents = Number(c.commission_amount_cents);
    commissionMap[c.affiliate_id].total_earned += cents;
    if (c.status === "pending") commissionMap[c.affiliate_id].pending += cents;
    else if (c.status === "approved" || c.status === "on_hold") commissionMap[c.affiliate_id].approved += cents;
    else if (c.status === "paid") commissionMap[c.affiliate_id].paid += cents;
  });

  (payoutsResult.data ?? []).forEach((p: { affiliate_id: string; amount_cents: number }) => {
    payoutMap[p.affiliate_id] = (payoutMap[p.affiliate_id] ?? 0) + Number(p.amount_cents);
  });

  const data = items.map((aff) => ({
    ...aff,
    total_earned: commissionMap[aff.id]?.total_earned ?? 0,
    pending_commission: commissionMap[aff.id]?.pending ?? 0,
    approved_commission: commissionMap[aff.id]?.approved ?? 0,
    paid_commission: commissionMap[aff.id]?.paid ?? 0,
    total_paid_out: payoutMap[aff.id] ?? 0,
  }));

  return NextResponse.json({ data, nextCursor, hasMore });
}

// POST /api/dashboard/affiliate-commission/affiliates
// Diviner creates an affiliate under themselves.
// Body: { name, email, phone?, notes?, default_commission_type?, default_commission_value? }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

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
    name,
    email,
    phone,
    notes,
    default_commission_type,
    default_commission_value,
  } = body as Record<string, unknown>;

  if (
    typeof name !== "string" || name.trim() === "" ||
    typeof email !== "string" || email.trim() === ""
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "name and email are required.",
      },
      { status: 422 }
    );
  }

  if (
    default_commission_type !== undefined &&
    !["percentage", "fixed"].includes(default_commission_type as string)
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "default_commission_type must be 'percentage' or 'fixed'.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner.id,
    name: (name as string).trim(),
    email: (email as string).trim().toLowerCase(),
    status: "active",
    created_by: user.id,
  };
  if (typeof phone === "string" && phone.trim()) insertPayload.phone = phone.trim();
  if (typeof notes === "string" && notes.trim()) insertPayload.notes = notes.trim();
  if (typeof default_commission_type === "string") insertPayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") insertPayload.default_commission_value = default_commission_value;

  const { data, error } = await admin
    .from("diviner_affiliates")
    .insert(insertPayload)
    .select(
      "id, diviner_id, name, email, phone, status, default_commission_type, default_commission_value, created_at"
    )
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        type: `https://httpstatuses.io/${statusCode}`,
        title: statusCode === 409 ? "Duplicate affiliate email for this diviner" : "Database error",
        status: statusCode,
        detail: error.message,
      },
      { status: statusCode }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
