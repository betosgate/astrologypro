import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_REPORT_TYPES = [
  "monthly_digest",
  "eclipse_report",
  "ingress_report",
  "leader_watch",
  "custom",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_publications")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Publication not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    title?: string;
    subtitle?: string;
    report_type?: string;
    entity_ids?: string[];
    date_range_start?: string | null;
    date_range_end?: string | null;
    content_blocks?: Array<{ type: string; title: string; content: string }>;
    is_published?: boolean;
  };

  // Validate report_type if provided
  if (body.report_type !== undefined && !(VALID_REPORT_TYPES as readonly string[]).includes(body.report_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: `report_type must be one of: ${VALID_REPORT_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  // Build the update payload — only include defined fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) patch.title = body.title.trim();
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
  if (body.report_type !== undefined) patch.report_type = body.report_type;
  if (body.entity_ids !== undefined) patch.entity_ids = body.entity_ids;
  if (body.date_range_start !== undefined) patch.date_range_start = body.date_range_start;
  if (body.date_range_end !== undefined) patch.date_range_end = body.date_range_end;
  if (body.content_blocks !== undefined) patch.content_blocks = body.content_blocks;
  if (body.is_published !== undefined) {
    patch.is_published = body.is_published;
    patch.published_at = body.is_published ? new Date().toISOString() : null;
    if (body.is_published) {
      // Generate a share token if not already set
      const { data: existing } = await createAdminClient()
        .from("mundane_publications")
        .select("share_token")
        .eq("id", params.id)
        .single();
      if (!existing?.share_token) {
        patch.share_token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      }
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_publications")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Publication not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Hard delete
  const { error } = await admin
    .from("mundane_publications")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
