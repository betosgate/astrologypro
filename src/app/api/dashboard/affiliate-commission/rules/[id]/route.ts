import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAffiliateShareWithinCap } from "@/lib/affiliate-share-cap";

export const dynamic = "force-dynamic";

// PATCH /api/dashboard/affiliate-commission/rules/[id]
// Body: { rule_name?, rate?, is_active? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await admin
    .from("commission_rules")
    .select("id, diviner_user_id, rule_type, rate, rule_name, is_active")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  if (existing.diviner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const patch = body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof patch.rule_name === "string" && patch.rule_name.trim() !== "") {
    updates.rule_name = patch.rule_name.trim();
  }
  if (typeof patch.rate === "number") {
    if (patch.rate < 0) {
      return NextResponse.json({ error: "Rate must be >= 0" }, { status: 422 });
    }
    if (existing.rule_type === "percentage" && patch.rate > 100) {
      return NextResponse.json({ error: "Percentage rate must be between 0 and 100" }, { status: 422 });
    }
    updates.rate = patch.rate;
  }
  if (typeof patch.is_active === "boolean") {
    updates.is_active = patch.is_active;
  }

  try {
    await assertAffiliateShareWithinCap({
      commissionType: existing.rule_type,
      commissionValue: typeof patch.rate === "number" ? patch.rate : existing.rate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Affiliate share exceeds allowed cap." },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("commission_rules")
    .update(updates)
    .eq("id", id)
    .select("id, rule_name, rule_type, rate, currency, applies_to, is_active, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "update_rule",
    entity_type: "commission_rules",
    entity_id: id,
    before_state: existing,
    after_state: data,
  });

  return NextResponse.json({ data });
}

// DELETE /api/dashboard/affiliate-commission/rules/[id]
// Soft delete: sets is_active = false
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("commission_rules")
    .select("id, diviner_user_id, is_active")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  if (existing.diviner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("commission_rules")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: "deactivate_rule",
    entity_type: "commission_rules",
    entity_id: id,
    before_state: existing,
    after_state: { is_active: false },
  });

  return NextResponse.json({ ok: true });
}
