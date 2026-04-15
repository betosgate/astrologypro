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

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const reportType = sp.get("report_type") ?? "";
  const isPublished = sp.get("is_published") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_publications")
    .select(
      "id, title, subtitle, report_type, entity_ids, date_range_start, date_range_end, is_published, published_at, share_token, created_at, updated_at",
      { count: "exact" }
    );

  if (reportType && (VALID_REPORT_TYPES as readonly string[]).includes(reportType)) {
    query = query.eq("report_type", reportType);
  }
  if (isPublished === "true") {
    query = query.eq("is_published", true);
  } else if (isPublished === "false") {
    query = query.eq("is_published", false);
  }

  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    publications: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
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
    date_range_start?: string;
    date_range_end?: string;
    content_blocks?: Array<{ type: string; title: string; content: string }>;
  };

  const { title, subtitle, report_type, entity_ids, date_range_start, date_range_end, content_blocks } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }

  const resolvedType = report_type ?? "monthly_digest";
  if (!(VALID_REPORT_TYPES as readonly string[]).includes(resolvedType)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: `report_type must be one of: ${VALID_REPORT_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_publications")
    .insert({
      title: title.trim(),
      subtitle: subtitle ?? null,
      report_type: resolvedType,
      entity_ids: entity_ids ?? [],
      date_range_start: date_range_start ?? null,
      date_range_end: date_range_end ?? null,
      content_blocks: content_blocks ?? [],
      is_published: false,
      created_by: adminUser.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
