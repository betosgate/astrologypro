import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["course", "service", "newsletter", "generic"] as const;
type CtaType = (typeof VALID_TYPES)[number];

export async function GET(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: blocks, error } = await admin
    .from("blog_cta_blocks")
    .select("id, name, title, body, text, cta_label, cta_url, type, linked_entity_id, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  // Attach click counts
  const blockIds = (blocks ?? []).map((b) => b.id);
  let clickCounts: Record<string, number> = {};

  if (blockIds.length > 0) {
    const { data: clicks } = await admin
      .from("blog_cta_clicks")
      .select("cta_block_id")
      .in("cta_block_id", blockIds);

    for (const row of clicks ?? []) {
      if (row.cta_block_id) {
        clickCounts[row.cta_block_id] = (clickCounts[row.cta_block_id] ?? 0) + 1;
      }
    }
  }

  const result = (blocks ?? []).map((b) => ({
    ...b,
    click_count: clickCounts[b.id] ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const {
    name,
    title,
    text,
    body: bodyText,
    cta_text,
    cta_label,
    cta_url,
    type = "generic",
    linked_entity_id,
    active_flag,
    is_active,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!cta_url?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: "cta_url is required" },
      { status: 422 }
    );
  }
  if (!VALID_TYPES.includes(type as CtaType)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  const ctaLabel = cta_label?.trim() || cta_text?.trim() || "Learn More";
  const blockName = name?.trim() || title.trim();
  const activeFlag = active_flag ?? is_active ?? true;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_cta_blocks")
    .insert({
      name: blockName,
      title: title.trim(),
      body: bodyText?.trim() || null,
      text: text?.trim() || bodyText?.trim() || null,
      cta_label: ctaLabel,
      cta_url: cta_url.trim(),
      type,
      linked_entity_id: linked_entity_id || null,
      is_active: activeFlag,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Database error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
