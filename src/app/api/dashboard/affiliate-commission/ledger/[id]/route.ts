import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// PATCH /api/dashboard/affiliate-commission/ledger/[id]
// Body: { action: "approve" | "reject" }
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }

  const { action } = body as Record<string, unknown>;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("commission_ledger_entries")
    .select("id, diviner_user_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Ledger entry not found" }, { status: 404 });
  }
  if (existing.diviner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot ${action} a ledger entry with status '${existing.status}'` },
      { status: 422 }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const updatePayload: Record<string, unknown> = { status: newStatus };
  if (action === "approve") {
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.approved_by = user.id;
  }

  const { data, error } = await admin
    .from("commission_ledger_entries")
    .update(updatePayload)
    .eq("id", id)
    .select("id, status, approved_at, approved_by")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("affiliate_commission_audit").insert({
    actor_user_id: user.id,
    action: `${action}_ledger_entry`,
    entity_type: "commission_ledger_entries",
    entity_id: id,
    before_state: existing,
    after_state: data,
  });

  return NextResponse.json({ data });
}
