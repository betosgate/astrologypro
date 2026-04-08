import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/diviner-plans ─────────────────────────────────────────────
// Returns all plans with features array parsed.

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach active subscriber count per plan
  const plansWithCount = await Promise.all(
    (data ?? []).map(async (plan) => {
      const { count } = await admin
        .from("diviner_plan_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan.id)
        .in("status", ["active", "trialing"]);

      return {
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        active_subscriber_count: count ?? 0,
      };
    })
  );

  return NextResponse.json({ plans: plansWithCount });
}

// ─── POST /api/admin/diviner-plans ────────────────────────────────────────────
// Creates a new plan.

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: {
    name?: unknown;
    slug?: unknown;
    description?: unknown;
    price_cents?: unknown;
    currency?: unknown;
    billing_interval?: unknown;
    stripe_price_id?: unknown;
    features?: unknown;
    is_active?: unknown;
    sort_order?: unknown;
  } = await req.json();

  const { name, slug, description, price_cents, currency, billing_interval, stripe_price_id, features, is_active, sort_order } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    return NextResponse.json({ error: "slug is required" }, { status: 422 });
  }
  if (typeof price_cents !== "number" || price_cents < 0) {
    return NextResponse.json({ error: "price_cents must be a non-negative integer" }, { status: 422 });
  }
  if (!Array.isArray(features)) {
    return NextResponse.json({ error: "features must be an array" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diviner_plans")
    .insert({
      name: (name as string).trim(),
      slug: (slug as string).trim(),
      description: typeof description === "string" ? description : null,
      price_cents,
      currency: typeof currency === "string" ? currency : "usd",
      billing_interval: typeof billing_interval === "string" ? billing_interval : "month",
      stripe_price_id: typeof stripe_price_id === "string" ? stripe_price_id : null,
      features,
      is_active: typeof is_active === "boolean" ? is_active : true,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
