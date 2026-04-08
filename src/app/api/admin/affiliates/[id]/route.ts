import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_affiliates")
    .select(
      "id, diviner_id, user_id, name, email, phone, status, notes, default_commission_type, default_commission_value, created_by, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// PATCH /api/admin/affiliates/[id]
// Updatable fields: status, notes, default_commission_type, default_commission_value, name, email, phone
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
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

  const {
    status,
    notes,
    default_commission_type,
    default_commission_value,
    name,
    email,
    phone,
  } = body as Record<string, unknown>;

  const allowedStatuses = ["pending", "active", "suspended", "blocked"];
  const allowedCommissionTypes = ["percentage", "fixed"];

  if (status !== undefined && !allowedStatuses.includes(status as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid status value" },
      { status: 422 }
    );
  }
  if (default_commission_type !== undefined && !allowedCommissionTypes.includes(default_commission_type as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid commission type" },
      { status: 422 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (typeof status === "string") updatePayload.status = status;
  if (typeof notes === "string") updatePayload.notes = notes.trim() || null;
  if (typeof default_commission_type === "string") updatePayload.default_commission_type = default_commission_type;
  if (typeof default_commission_value === "number") updatePayload.default_commission_value = default_commission_value;
  if (typeof name === "string" && name.trim()) updatePayload.name = name.trim();
  if (typeof email === "string" && email.trim()) updatePayload.email = email.trim().toLowerCase();
  if (typeof phone === "string") updatePayload.phone = phone.trim() || null;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "No updatable fields provided" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("diviner_affiliates")
    .update(updatePayload)
    .eq("id", id)
    .select("id, diviner_id, name, email, phone, status, notes, default_commission_type, default_commission_value, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
