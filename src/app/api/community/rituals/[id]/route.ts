import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/community/rituals/[id] — fetch a single ritual configuration + matching invocations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the ritual (object-level auth: user_id must match)
  const { data: ritual, error } = await supabase
    .from("user_ritual_configurations")
    .select(
      "id, user_id, ritual_name, ritual_tags, created_at, updated_at, last_executed_at, execution_count, current_step, is_complete"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !ritual)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch matching ritual_invocations from admin table (requires service role to bypass RLS)
  const admin = createAdminClient();
  const { data: invocations } = await admin
    .from("ritual_invocations")
    .select("id, name, description, instructions, priority")
    .in("name", ritual.ritual_tags)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  return NextResponse.json({
    ritual,
    invocations: invocations ?? [],
  });
}

// PATCH /api/community/rituals/[id] — update execution state
// Body: { current_step?: number, is_complete?: boolean, reset?: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the ritual belongs to this user (object-level authorization)
  const { data: existing, error: fetchError } = await supabase
    .from("user_ritual_configurations")
    .select("id, execution_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { current_step, is_complete, reset } = body as {
    current_step?: number;
    is_complete?: boolean;
    reset?: boolean;
  };

  const admin = createAdminClient();

  let updatePayload: Record<string, unknown>;

  if (reset) {
    // Reset: clear progress, keep execution_count
    updatePayload = {
      current_step: 0,
      is_complete: false,
    };
  } else if (is_complete) {
    // Completion: bump execution_count, set last_executed_at
    updatePayload = {
      current_step: current_step ?? 0,
      is_complete: true,
      execution_count: (existing.execution_count ?? 0) + 1,
      last_executed_at: new Date().toISOString(),
    };
  } else {
    // Progress update: just move the step pointer
    updatePayload = {
      current_step: current_step ?? 0,
    };
  }

  const { data: updated, error: updateError } = await admin
    .from("user_ritual_configurations")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, ritual_name, ritual_tags, last_executed_at, execution_count, current_step, is_complete"
    )
    .single();

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ritual: updated });
}

// DELETE /api/community/rituals/[id] — delete a ritual configuration
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("user_ritual_configurations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // enforce object-level authorization

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
