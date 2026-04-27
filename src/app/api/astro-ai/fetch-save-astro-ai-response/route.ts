import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/astro-ai/fetch-save-astro-ai-response
 *
 * In-house replacement for the legacy NestJS/MongoDB fetch endpoint that
 * returned a previously-saved AI report by id.
 *
 * Spec source:
 *   tasks/24.04.2026/astro-toolkit/astro_ai_implementation_logic.md
 *
 * Behaviour
 * ─────────
 * - Auth required: must be a logged-in Supabase user. Anonymous fetches
 *   are rejected with 401. We deliberately do NOT scope the row by
 *   `user_id` — the row's UUID is the share-link key. Owners and
 *   recipients of the share link can both fetch. RLS on
 *   `astro_ai_responses` (authenticated SELECT all) enforces the same
 *   rule at the database boundary.
 * - The body shape mirrors the legacy NestJS endpoint:
 *     { "_id": "<uuid>" }
 *   Both `_id` and `id` are accepted as the lookup key for caller
 *   convenience (the new Postgres column is named `id`, the legacy
 *   client used `_id`).
 *
 * Response shape
 * ──────────────
 *   { status: "success", res: <row> }
 *   { status: "error",   message: <human-readable> }
 *
 * Identical to the legacy NestJS endpoint so existing client-side
 * callers can be repointed without changing how they consume the
 * response.
 */

type FetchBody = {
  _id?: string | null;
  id?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── Body ───────────────────────────────────────────────────────────────
    const body = (await request.json().catch(() => null)) as FetchBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const rawId =
      typeof body._id === "string"
        ? body._id.trim()
        : typeof body.id === "string"
        ? body.id.trim()
        : "";
    if (!rawId) {
      return NextResponse.json(
        { status: "error", message: "Missing _id" },
        { status: 400 }
      );
    }

    // Validate UUID shape before hitting the DB so a malformed input
    // returns a clean 400 instead of a Postgres error string.
    if (!UUID_RE.test(rawId)) {
      return NextResponse.json(
        { status: "error", message: "Invalid _id format (expected UUID)" },
        { status: 400 }
      );
    }

    // ── Fetch ──────────────────────────────────────────────────────────────
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("astro_ai_responses")
      .select("*")
      .eq("id", rawId)
      .maybeSingle();

    if (error) {
      console.error("[astro-ai/fetch] read failed:", error);
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { status: "error", message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: "success", res: row });
  } catch (err) {
    console.error("[astro-ai/fetch] unexpected error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong!",
      },
      { status: 500 }
    );
  }
}
