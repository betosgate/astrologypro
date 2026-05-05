import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginatedList } from "@/lib/training/admin-list";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, training_id, name, description, priority, is_active, is_sequential, created_at";

const ALLOWED_SORTS: Record<string, string> = {
  name: "name",
  priority: "priority",
  is_active: "is_active",
  created_at: "created_at",
};

/**
 * GET /api/admin/training/categories
 * Server-driven paginated list.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const params = parsePaginationParams(sp);
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");
  const programId = sp.get("program_id");

  const admin = createAdminClient();
  try {
    const result = await paginatedList(
      admin,
      "training_categories",
      SELECT_COLS,
      params,
      ["name"],
      ALLOWED_SORTS,
      { column: "priority", ascending: true },
      (q) => {
        let filtered = q;
        if (programId) filtered = filtered.eq("training_id", programId);
        if (createdFrom) filtered = filtered.gte("created_at", createdFrom);
        if (createdTo) filtered = filtered.lte("created_at", createdTo + "T23:59:59");
        return filtered;
      },
    );
    return NextResponse.json({
      categories: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST /api/admin/training/categories — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    training_id?: string;
    name?: string;
    description?: string | null;
    priority?: number;
    is_active?: boolean;
    is_sequential?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { training_id, name, description, priority, is_active, is_sequential } = body;

  if (!training_id || typeof training_id !== "string") {
    return NextResponse.json({ error: "Training program is required." }, { status: 422 });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_categories")
    .insert({
      training_id,
      name: name.trim(),
      description: description ?? null,
      priority: priority ?? 0,
      is_active: is_active ?? true,
      is_sequential: is_sequential ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
