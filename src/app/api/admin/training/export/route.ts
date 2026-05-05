import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/training/export?entity_type=<type>&ids=a,b,c&status=&search=
 * POST /api/admin/training/export  (body: { entity_type, ids })
 *
 * Streams a CSV export of training rows. Used by the Training Management
 * standardization task to match the Users admin pattern.
 *
 * Query params (GET):
 *   entity_type : program | category | lesson | quiz  (required)
 *   ids         : comma-separated IDs to restrict to the user's selection.
 *                 If omitted, the export applies the current filter set.
 *   status      : all | active | inactive              (optional)
 *   search      : free-text match on name/title/description
 *
 * POST body:
 *   { entity_type, ids }  — used for export-selected (avoids URL length
 *                           limits with large selections).
 *
 * Response: `text/csv; charset=utf-8` with a Content-Disposition attachment
 *           header. Always includes a header row. Fields are quoted and
 *           double-quotes are escaped.
 *
 * Errors: 401 unauth, 422 bad type, 500 db error.
 */

type EntityType = "program" | "category" | "lesson" | "quiz";

const ENTITY_TABLE: Record<EntityType, string> = {
  program: "training_programs",
  category: "training_categories",
  lesson: "training_lessons",
  quiz: "training_quizzes",
};

// Column set per entity — drives both the CSV header and the SELECT clause.
const ENTITY_COLUMNS: Record<EntityType, string[]> = {
  program: [
    "id",
    "name",
    "description",
    "priority",
    "is_active",
    "is_sequential",
    "allowed_roles",
    "created_at",
  ],
  category: [
    "id",
    "training_id",
    "name",
    "description",
    "priority",
    "is_active",
    "is_sequential",
    "created_at",
  ],
  lesson: [
    "id",
    "category_id",
    "title",
    "description",
    "video_url",
    "duration_mins",
    "priority",
    "is_active",
    "created_at",
  ],
  quiz: [
    "id",
    "lesson_id",
    "title",
    "pass_score",
    "is_active",
    "created_at",
  ],
};

// Human-readable CSV header labels (same order as ENTITY_COLUMNS).
const ENTITY_HEADERS: Record<EntityType, string[]> = {
  program: [
    "ID",
    "Name",
    "Description",
    "Priority",
    "Active",
    "Sequential",
    "Allowed Roles",
    "Created At",
  ],
  category: [
    "ID",
    "Program ID",
    "Name",
    "Description",
    "Priority",
    "Active",
    "Sequential",
    "Created At",
  ],
  lesson: [
    "ID",
    "Category ID",
    "Title",
    "Description",
    "Video URL",
    "Duration (mins)",
    "Priority",
    "Active",
    "Created At",
  ],
  quiz: [
    "ID",
    "Lesson ID",
    "Title",
    "Pass Score",
    "Active",
    "Created At",
  ],
};

function isEntityType(v: unknown): v is EntityType {
  return v === "program" || v === "category" || v === "lesson" || v === "quiz";
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "boolean") {
    s = value ? "true" : "false";
  } else if (Array.isArray(value)) {
    s = value.join("; ");
  } else if (typeof value === "object") {
    s = JSON.stringify(value);
  } else {
    s = String(value);
  }
  // RFC 4180: quote fields containing commas, quotes, CR, or LF. Escape
  // embedded quotes by doubling them.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(
  entityType: EntityType,
  rows: Array<Record<string, unknown>>,
): string {
  const columns = ENTITY_COLUMNS[entityType];
  const headers = ENTITY_HEADERS[entityType];

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(columns.map((col) => escapeCsvCell(row[col])).join(","));
  }
  return lines.join("\r\n");
}

async function fetchRows(
  entityType: EntityType,
  opts: {
    ids?: string[];
    status?: string | null;
    search?: string | null;
    createdFrom?: string | null;
    createdTo?: string | null;
    access?: string | null;
    programId?: string | null;
    categoryId?: string | null;
    lessonId?: string | null;
  },
) {
  const admin = createAdminClient();
  const columns = ENTITY_COLUMNS[entityType].join(", ");

  let query = admin
    .from(ENTITY_TABLE[entityType])
    .select(columns)
    .order("priority", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (opts.ids && opts.ids.length > 0) {
    query = query.in("id", opts.ids);
  }

  if (opts.status === "active") {
    query = query.eq("is_active", true);
  } else if (opts.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (entityType === "program") {
    if (opts.createdFrom) query = query.gte("created_at", opts.createdFrom);
    if (opts.createdTo) query = query.lte("created_at", `${opts.createdTo}T23:59:59`);
    if (opts.access === "all_access") {
      query = query.eq("allowed_roles", "{}");
    } else if (opts.access) {
      query = query.contains("allowed_roles", [opts.access]);
    }
  }

  if (entityType === "category") {
    if (opts.programId) query = query.eq("training_id", opts.programId);
    if (opts.createdFrom) query = query.gte("created_at", opts.createdFrom);
    if (opts.createdTo) query = query.lte("created_at", `${opts.createdTo}T23:59:59`);
  }

  if (entityType === "lesson") {
    if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
    if (opts.createdFrom) query = query.gte("created_at", opts.createdFrom);
    if (opts.createdTo) query = query.lte("created_at", `${opts.createdTo}T23:59:59`);
  }

  if (entityType === "quiz") {
    if (opts.lessonId) query = query.eq("lesson_id", opts.lessonId);
    if (opts.createdFrom) query = query.gte("created_at", opts.createdFrom);
    if (opts.createdTo) query = query.lte("created_at", `${opts.createdTo}T23:59:59`);
  }

  if (opts.search) {
    // ILIKE match on the primary name/title field, and description where
    // applicable. Keeps the export filter aligned with the in-page search.
    const pattern = `%${opts.search.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    if (entityType === "program") {
      query = query.ilike("name", pattern);
    } else if (entityType === "category") {
      query = query.ilike("name", pattern);
    } else if (entityType === "lesson") {
      query = query.ilike("title", pattern);
    } else {
      query = query.ilike("title", pattern);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

function csvResponse(entityType: EntityType, csv: string) {
  const filename = `training-${entityType}s-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const entity_type = sp.get("entity_type");

  if (!isEntityType(entity_type)) {
    return NextResponse.json(
      { error: "entity_type must be one of: program, category, lesson, quiz." },
      { status: 422 },
    );
  }

  const idsParam = sp.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    const rows = await fetchRows(entity_type, {
      ids,
      status: sp.get("status"),
      search: sp.get("search"),
      createdFrom: sp.get("created_from"),
      createdTo: sp.get("created_to"),
      access: sp.get("access"),
      programId: sp.get("program_id"),
      categoryId: sp.get("category_id"),
      lessonId: sp.get("lesson_id"),
    });
    const csv = buildCsv(entity_type, rows);
    return csvResponse(entity_type, csv);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entity_type?: unknown; ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isEntityType(body.entity_type)) {
    return NextResponse.json(
      { error: "entity_type must be one of: program, category, lesson, quiz." },
      { status: 422 },
    );
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array of strings." },
      { status: 422 },
    );
  }

  try {
    const rows = await fetchRows(body.entity_type, { ids });
    const csv = buildCsv(body.entity_type, rows);
    return csvResponse(body.entity_type, csv);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
