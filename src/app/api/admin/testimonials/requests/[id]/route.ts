import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/testimonials/requests/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("testimonial_requests")
    .select("*, diviners(display_name)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Testimonial request not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ request: data });
}

// PATCH /api/admin/testimonials/requests/[id] — update status and/or fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const VALID_STATUSES = ["pending", "sent", "completed", "declined"];

  let body: {
    status?: string;
    notes?: string | null;
    requested_to_name?: string;
    requested_to_email?: string;
    requested_to_phone_no?: string | null;
    testimonial_for?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    status,
    notes,
    requested_to_name,
    requested_to_email,
    requested_to_phone_no,
    testimonial_for,
  } = body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes ?? null;
  if (requested_to_name !== undefined) updates.requested_to_name = requested_to_name;
  if (requested_to_email !== undefined)
    updates.requested_to_email = requested_to_email.toLowerCase();
  if (requested_to_phone_no !== undefined)
    updates.requested_to_phone_no = requested_to_phone_no ?? null;
  if (testimonial_for !== undefined)
    updates.testimonial_for = testimonial_for ?? null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonial_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}

// DELETE /api/admin/testimonials/requests/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("testimonial_requests")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
