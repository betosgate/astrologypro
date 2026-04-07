import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/testimonials/[id]
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
    .from("testimonials")
    .select("*, diviners(display_name)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  }

  return NextResponse.json({ testimonial: data });
}

// PUT /api/admin/testimonials/[id] — full update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    diviner_id?: string;
    client_name?: string | null;
    rating?: number | null;
    text?: string;
    service_type?: string | null;
    title?: string | null;
    images?: object[];
    audio?: object[];
    video?: object[];
    is_featured?: boolean;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    diviner_id,
    client_name,
    rating,
    text,
    service_type,
    title,
    images,
    audio,
    video,
    is_featured,
    status,
  } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (!diviner_id) {
    return NextResponse.json({ error: "Diviner is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .update({
      diviner_id,
      client_name: client_name ?? null,
      rating: rating ?? null,
      text: text.trim(),
      service_type: service_type ?? null,
      title: title ?? null,
      images: images ?? [],
      audio: audio ?? [],
      video: video ?? [],
      is_featured: is_featured ?? false,
      status: status ?? "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonial: data });
}

// PATCH /api/admin/testimonials/[id] — update status only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const VALID_STATUSES = [
    "submitted",
    "pending_review",
    "approved",
    "rejected",
    "hidden",
    "pending",
  ];

  let body: {
    status?: string;
    is_featured?: boolean;
    moderation_notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { status, is_featured, moderation_notes } = body;

  if (
    status !== undefined &&
    !VALID_STATUSES.includes(status)
  ) {
    return NextResponse.json(
      {
        error: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (is_featured !== undefined) updates.is_featured = is_featured;
  if (moderation_notes !== undefined) updates.moderation_notes = moderation_notes ?? null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonial: data });
}

// DELETE /api/admin/testimonials/[id]
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
    .from("testimonials")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
