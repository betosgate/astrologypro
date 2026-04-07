import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/affiliates/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Resolve diviner record for ownership check
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  const { data, error } = await admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_at, updated_at"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// PATCH /api/dashboard/affiliates/[id]
// Diviner can update notes, commission settings, status (within allowed transitions)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const { notes, default_commission_type, default_commission_value, status } =
    body as Record<string, unknown>;

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // Verify ownership
  const { data: existing } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const allowedStatuses = ["active", "suspended", "blocked"];
  if (status !== undefined && !allowedStatuses.includes(status as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid status value" },
      { status: 422 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (typeof notes === "string") updatePayload.notes = notes.trim() || null;
  if (typeof default_commission_type === "string") updatePayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") updatePayload.default_commission_value = default_commission_value;
  if (typeof status === "string") updatePayload.status = status;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "No updatable fields provided" },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("diviner_affiliates")
    .update(updatePayload)
    .eq("id", id)
    .select("id, name, email, status, notes, default_commission_type, default_commission_value, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
