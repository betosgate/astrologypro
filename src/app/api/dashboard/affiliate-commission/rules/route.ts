import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliate-commission/rules
// Returns the authenticated diviner's commission rules
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("commission_rules")
    .select("id, rule_name, rule_type, rate, currency, applies_to, is_active, created_at, updated_at")
    .eq("diviner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/dashboard/affiliate-commission/rules
// Body: { rule_name, rule_type, rate, applies_to, currency? }
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

  const { rule_name, rule_type, rate, applies_to, currency } = body as Record<string, unknown>;

  if (
    typeof rule_name !== "string" || rule_name.trim() === "" ||
    typeof rule_type !== "string" || !["percentage", "fixed"].includes(rule_type) ||
    typeof rate !== "number" || rate < 0 ||
    typeof applies_to !== "string" || !["all", "booking", "subscription"].includes(applies_to)
  ) {
    return NextResponse.json(
      { error: "Invalid input: rule_name, rule_type (percentage|fixed), rate (number >= 0), and applies_to (all|booking|subscription) are required." },
      { status: 422 }
    );
  }

  if (rule_type === "percentage" && rate > 100) {
    return NextResponse.json({ error: "Percentage rate must be between 0 and 100." }, { status: 422 });
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: rule_type,
      commissionValue: rate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("commission_rules")
    .insert({
      diviner_user_id: user.id,
      rule_name: rule_name.trim(),
      rule_type,
      rate,
      applies_to,
      currency: typeof currency === "string" ? currency.toLowerCase() : "usd",
      is_active: true,
    })
    .select("id, rule_name, rule_type, rate, currency, applies_to, is_active, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "create_rule",
    entity_type: "commission_rules",
    entity_id: data.id,
    after_state: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}
