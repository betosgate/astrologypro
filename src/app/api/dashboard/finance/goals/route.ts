import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner?.id) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 404 });
  }

  const { data: goals } = await admin
    .from("diviner_finance_goals")
    .select("monthly_revenue_goal_cents, tax_reserve_percent, updated_at")
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  return NextResponse.json({
    monthlyGoalCents: goals?.monthly_revenue_goal_cents ?? 500000,
    taxReservePercent: Number(goals?.tax_reserve_percent ?? 25),
    updatedAt: goals?.updated_at ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { monthlyGoalDollars?: number; taxReservePercent?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const { monthlyGoalDollars, taxReservePercent } = body;

  if (
    monthlyGoalDollars !== undefined &&
    (typeof monthlyGoalDollars !== "number" || monthlyGoalDollars < 0 || monthlyGoalDollars > 1000000)
  ) {
    return NextResponse.json({ error: "monthlyGoalDollars must be 0–1,000,000" }, { status: 422 });
  }

  if (
    taxReservePercent !== undefined &&
    (typeof taxReservePercent !== "number" || taxReservePercent < 0 || taxReservePercent > 60)
  ) {
    return NextResponse.json({ error: "taxReservePercent must be 0–60" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner?.id) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (monthlyGoalDollars !== undefined) {
    updatePayload.monthly_revenue_goal_cents = Math.round(monthlyGoalDollars * 100);
  }
  if (taxReservePercent !== undefined) {
    updatePayload.tax_reserve_percent = taxReservePercent;
  }

  const { error } = await admin
    .from("diviner_finance_goals")
    .upsert({ diviner_id: diviner.id, ...updatePayload }, { onConflict: "diviner_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
