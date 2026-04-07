import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["course", "service", "newsletter", "generic"] as const;
type CtaType = (typeof VALID_TYPES)[number];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();

  const {
    name,
    title,
    text,
    body: bodyText,
    cta_text,
    cta_label,
    cta_url,
    type,
    linked_entity_id,
    active_flag,
    is_active,
  } = body;

  if (type !== undefined && !VALID_TYPES.includes(type as CtaType)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name?.trim() || null;
  if (title !== undefined) update.title = title?.trim();
  if (bodyText !== undefined) update.body = bodyText?.trim() || null;
  if (text !== undefined) update.text = text?.trim() || null;
  if (cta_label !== undefined) update.cta_label = cta_label?.trim();
  if (cta_text !== undefined) update.cta_label = cta_text?.trim();
  if (cta_url !== undefined) update.cta_url = cta_url?.trim();
  if (type !== undefined) update.type = type;
  if (linked_entity_id !== undefined) update.linked_entity_id = linked_entity_id || null;
  if (active_flag !== undefined) update.is_active = active_flag;
  if (is_active !== undefined) update.is_active = is_active;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_cta_blocks")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "CTA block not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const admin = createAdminClient();
  // Soft delete: set is_active = false
  const { data, error } = await admin
    .from("blog_cta_blocks")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "CTA block not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ id, is_active: false });
}
