import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_PROJECT_TYPES = [
  "country_forecast", "election", "geopolitical", "commodity", "weather", "retrospective", "general",
] as const;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_research_projects")
    .select(
      "id, title, description, project_type, status, entity_ids, leader_ids, is_public, created_by, created_at",
      { count: "exact" }
    )
    .eq("created_by", user.id);

  if (status) {
    query = query.eq("status", status);
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
    projects: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    title?: string;
    description?: string | null;
    project_type?: string;
    entity_ids?: string[];
    leader_ids?: string[];
    is_public?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (
    body.project_type &&
    !(VALID_PROJECT_TYPES as readonly string[]).includes(body.project_type)
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "project_type is invalid" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_research_projects")
    .insert({
      title: body.title.trim(),
      description: body.description ?? null,
      project_type: body.project_type ?? "general",
      status: "active",
      entity_ids: body.entity_ids ?? [],
      leader_ids: body.leader_ids ?? [],
      is_public: body.is_public ?? false,
      created_by: user.id,
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
