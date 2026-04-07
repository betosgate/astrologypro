import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_NOTE_TYPES = ["general", "hypothesis", "observation", "conclusion", "reference"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: projectId } = await params;
  const admin = createAdminClient();

  // Verify project access
  const { data: project, error: projErr } = await admin
    .from("mundane_research_projects")
    .select("created_by, is_public")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Project not found" },
      { status: 404 }
    );
  }

  const p = project as { created_by: string; is_public: boolean };
  if (p.created_by !== user.id && !p.is_public) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const { data, error, count } = await admin
    .from("mundane_project_notes")
    .select("id, title, body, note_type, created_by, created_at, updated_at", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    notes: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: projectId } = await params;
  const admin = createAdminClient();

  // Verify project ownership (only owner can add notes)
  const { data: project, error: projErr } = await admin
    .from("mundane_research_projects")
    .select("created_by")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Project not found" },
      { status: 404 }
    );
  }
  const p = project as { created_by: string };
  if (p.created_by !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    title?: string | null;
    body?: string;
    note_type?: string;
  };

  if (!body.body?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "body is required" },
      { status: 422 }
    );
  }
  if (
    body.note_type &&
    !(VALID_NOTE_TYPES as readonly string[]).includes(body.note_type)
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "note_type is invalid" },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("mundane_project_notes")
    .insert({
      project_id: projectId,
      title: body.title ?? null,
      body: body.body.trim(),
      note_type: body.note_type ?? "general",
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
