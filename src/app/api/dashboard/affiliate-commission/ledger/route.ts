import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/ledger
// Query params: affiliate_id?, status?, limit?, cursor? (id tie-breaker)
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const affiliateId = searchParams.get("affiliate_id");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor"); // id of last item from prev page

  const admin = createAdminClient();
  let query = admin
    .from("commission_ledger_entries")
    .select(
      "id, affiliate_user_id, booking_id, order_amount_cents, commission_amount_cents, commission_rule_id, status, description, period_start, period_end, approved_at, created_at"
    )
    .eq("diviner_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (affiliateId) query = query.eq("affiliate_user_id", affiliateId);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/dashboard/affiliate-commission/ledger
// Body: { affiliate_user_id, booking_id?, order_amount_cents, description?, period_start?, period_end? }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const {
    affiliate_user_id,
    booking_id,
    order_amount_cents,
    description,
    period_start,
    period_end,
  } = body as Record<string, unknown>;

  if (
    typeof affiliate_user_id !== "string" || affiliate_user_id.trim() === "" ||
    typeof order_amount_cents !== "number" || order_amount_cents <= 0
  ) {
    return NextResponse.json(
      { error: "affiliate_user_id (string) and order_amount_cents (positive number) are required." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Find the active commission rule for this diviner
  const { data: rule } = await admin
    .from("commission_rules")
    .select("id, rule_type, rate")
    .eq("diviner_user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let commissionAmountCents: number;
  let ruleId: string | null = null;

  if (rule) {
    ruleId = rule.id as string;
    if (rule.rule_type === "percentage") {
      commissionAmountCents = Math.round((order_amount_cents * Number(rule.rate)) / 100);
    } else {
      // fixed: rate is stored as cents
      commissionAmountCents = Math.round(Number(rule.rate));
    }
  } else {
    // No rule found; commission = 0, still record manually
    commissionAmountCents = 0;
  }

  const insertPayload: Record<string, unknown> = {
    diviner_user_id: user.id,
    affiliate_user_id,
    order_amount_cents,
    commission_amount_cents: commissionAmountCents,
    commission_rule_id: ruleId,
    status: "pending",
  };
  if (typeof booking_id === "string" && booking_id.trim() !== "") {
    insertPayload.booking_id = booking_id;
  }
  if (typeof description === "string" && description.trim() !== "") {
    insertPayload.description = description.trim();
  }
  if (typeof period_start === "string" && period_start.trim() !== "") {
    insertPayload.period_start = period_start;
  }
  if (typeof period_end === "string" && period_end.trim() !== "") {
    insertPayload.period_end = period_end;
  }

  const { data, error } = await admin
    .from("commission_ledger_entries")
    .insert(insertPayload)
    .select(
      "id, affiliate_user_id, booking_id, order_amount_cents, commission_amount_cents, commission_rule_id, status, description, period_start, period_end, created_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "create_ledger_entry",
    entity_type: "commission_ledger_entries",
    entity_id: data.id,
    after_state: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}
