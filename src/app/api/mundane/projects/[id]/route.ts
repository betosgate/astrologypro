import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
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

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mundane_research_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Project not found" },
      { status: 404 }
    );
  }

  // Object-level auth: must be owner or is_public
  const row = data as { created_by: string; is_public: boolean };
  if (row.created_by !== user.id && !row.is_public) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
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

  const { id } = await params;
  const admin = createAdminClient();

  // Ownership check
  const { data: existing, error: fetchErr } = await admin
    .from("mundane_research_projects")
    .select("created_by")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Project not found" },
      { status: 404 }
    );
  }
  const ex = existing as { created_by: string };
  if (ex.created_by !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const body = await req.json() as Partial<{
    title: string;
    description: string | null;
    project_type: string;
    status: string;
    entity_ids: string[];
    leader_ids: string[];
    is_public: boolean;
  }>;

  const { data, error } = await admin
    .from("mundane_research_projects")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
