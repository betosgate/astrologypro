import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ diviner_id: string }> };

// ─── GET /api/admin/diviner-plans/[diviner_id]/subscription ──────────────────
// Returns the current plan subscription for a diviner.

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { diviner_id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_plan_subscriptions")
    .select("*, diviner_plans(*)")
    .eq("diviner_id", diviner_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscription: data });
}

// ─── PUT /api/admin/diviner-plans/[diviner_id]/subscription ──────────────────
// Upserts the plan subscription for a diviner.
// Body: { plan_id: string }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { diviner_id } = await params;

  const body: { plan_id?: unknown } = await req.json();
  const { plan_id } = body;

  if (!plan_id || typeof plan_id !== "string") {
    return NextResponse.json({ error: "plan_id is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Verify plan exists
  const { data: plan, error: planErr } = await admin
    .from("diviner_plans")
    .select("id")
    .eq("id", plan_id)
    .maybeSingle();

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { data, error } = await admin
    .from("diviner_plan_subscriptions")
    .upsert(
      {
        diviner_id,
        plan_id,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "diviner_id" }
    )
    .select("*, diviner_plans(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscription: data });
}
