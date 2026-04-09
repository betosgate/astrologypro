import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/training/bulk
 *
 * Shared bulk-action endpoint for the Training Management surface. Handles
 * multi-row activate/deactivate and delete across all four training entity
 * types (programs, categories, lessons, quizzes).
 *
 * Body:
 *   {
 *     entity_type: "program" | "category" | "lesson" | "quiz",
 *     ids: string[],
 *     action: "activate" | "deactivate" | "delete"
 *   }
 *
 * Response (200):
 *   { updated: number, deleted: number, skipped: string[] }
 *
 * Delete safety:
 *   - program delete is blocked when the program still has categories
 *     (matches the single-row DELETE guard in programs/[id]/route.ts).
 *   - other entity deletes have no relational guard here; the client should
 *     use the existing per-row delete endpoint for any case where a soft
 *     confirmation is needed.
 *
 * Errors: 401 unauth, 422 bad body, 500 db error.
 */

type EntityType = "program" | "category" | "lesson" | "quiz";

const ENTITY_TABLE: Record<EntityType, string> = {
  program: "training_programs",
  category: "training_categories",
  lesson: "training_lessons",
  quiz: "training_quizzes",
};

function isEntityType(v: unknown): v is EntityType {
  return v === "program" || v === "category" || v === "lesson" || v === "quiz";
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    entity_type?: unknown;
    ids?: unknown;
    action?: unknown;
  };
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

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array of strings." },
      { status: 422 },
    );
  }

  const ids: string[] = body.ids.filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "ids contains no valid string IDs." },
      { status: 422 },
    );
  }

  const action = body.action;
  if (action !== "activate" && action !== "deactivate" && action !== "delete") {
    return NextResponse.json(
      { error: "action must be one of: activate, deactivate, delete." },
      { status: 422 },
    );
  }

  const table = ENTITY_TABLE[body.entity_type];
  const admin = createAdminClient();

  if (action === "activate" || action === "deactivate") {
    const { data, error } = await admin
      .from(table)
      .update({ is_active: action === "activate" })
      .in("id", ids)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      updated: data?.length ?? 0,
      deleted: 0,
      skipped: [],
    });
  }

  // action === "delete"
  // Program delete has a relational guard: cannot delete a program that still
  // has categories (mirrors the single-row DELETE guard). Skipped ids are
  // reported back so the UI can show which rows were blocked.
  const skipped: string[] = [];
  let deleteIds = ids;

  if (body.entity_type === "program") {
    const { data: blockedCats } = await admin
      .from("training_categories")
      .select("training_id")
      .in("training_id", ids);

    const blockedSet = new Set(
      (blockedCats ?? []).map((c) => c.training_id as string),
    );
    for (const id of ids) {
      if (blockedSet.has(id)) skipped.push(id);
    }
    deleteIds = ids.filter((id) => !blockedSet.has(id));
  }

  if (deleteIds.length === 0) {
    return NextResponse.json({ updated: 0, deleted: 0, skipped });
  }

  const { data, error } = await admin
    .from(table)
    .delete()
    .in("id", deleteIds)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    updated: 0,
    deleted: data?.length ?? 0,
    skipped,
  });
}
