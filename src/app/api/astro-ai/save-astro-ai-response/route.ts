import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/astro-ai/save-astro-ai-response
 *
 * In-house replacement for the legacy NestJS/MongoDB endpoint at
 *   https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/save-astro-AI-Response
 *
 * Spec source:
 *   tasks/24.04.2026/astro-toolkit/astro_ai_save_response_logic_nextjs.md
 *   tasks/24.04.2026/astro-toolkit/astro_ai_implementation_logic.md
 *
 * Behaviour
 * ─────────
 * - Auth required: must be a logged-in Supabase user. Anonymous saves are
 *   rejected with 401 — the row's user_id pins ownership for later updates
 *   and "my reports" listings.
 * - INSERT path: when the request omits `_id`, a new row is created with
 *   `user_id` = the authenticated user. The new row id is returned.
 * - UPDATE path: when `_id` is supplied, the row is updated in place. The
 *   row's existing `user_id` must match the authenticated user. Any other
 *   case is a 403 — never reveal whether the row exists.
 *
 * Field mapping
 * ─────────────
 * The legacy NestJS payload uses camelCase. We map to the canonical
 * snake_case columns documented in the migration. Two pre-existing
 * legacy field names are tolerated to keep existing call sites working:
 *
 *   freeNatalWheelChartForTrasit   ← typo in production payloads (kept)
 *   freeNatalWheelChartForTransit  ← corrected name (also accepted)
 *
 * Both map to `free_natal_wheel_chart_transit`. Same idea for the
 * partner / P2 variants. The endpoint never throws on unknown extra
 * fields — they're simply ignored. Missing fields fall back to the
 * column's default (empty object/array/NULL).
 *
 * Response shape
 * ──────────────
 *   { status: "success", res: <row> }
 *   { status: "error",   message: <human-readable> }
 *
 * The shape mirrors the legacy NestJS endpoint so the existing client-
 * side callers in src/app/admin/horoscope/page.tsx can be repointed
 * without changing how they consume the response.
 */

type SaveBody = Record<string, unknown> & {
  _id?: string | null;
};

/**
 * Coerces an unknown value to a string suitable for a TEXT column.
 * Returns `null` for empty / non-string inputs so we never pass
 * `undefined` (PostgREST rejects) and never store the literal "null".
 */
function asTextOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Coerces an unknown value to a JSONB-safe object/array. JSONB columns
 * are NOT NULL with defaults so we coerce anything non-object to the
 * appropriate empty shape.
 */
function asJsonObject(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function asJsonArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Picks the first defined string field from a list of candidate keys. */
function pickFirstText(
  body: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const k of keys) {
    const t = asTextOrNull(body[k]);
    if (t !== null) return t;
  }
  return null;
}

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
    const body = (await request.json().catch(() => null)) as SaveBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const incomingId = typeof body._id === "string" ? body._id.trim() : null;

    // ── Build the column-aligned payload ──────────────────────────────────
    const dbPayload = {
      condition: asJsonObject(body.condition),
      toolname: asTextOrNull(body.toolname),
      ai_response: asJsonObject(body.ai_response),
      json_condition: asTextOrNull(body.json_condition),
      chat_response: asJsonObject(body.chat_response),
      chat_questions: asJsonArray(body.chat_questions),
      natal_chart: asJsonObject(body.natal_chart),
      // Legacy field is `formData` (camelCase) on the wire.
      form_data: asJsonObject(body.formData ?? body.form_data),
      astro_api_data: asJsonObject(body.astro_api_data),
      summary: asTextOrNull(body.summary),
      free_natal_wheel_chart: asTextOrNull(body.freeNatalWheelChart),
      // The existing production payload misspells "Transit" as "Trasit".
      // Accept both so legacy callers keep working AND new callers can use
      // the corrected spelling.
      free_natal_wheel_chart_transit: pickFirstText(body, [
        "freeNatalWheelChartForTransit",
        "freeNatalWheelChartForTrasit",
      ]),
      free_natal_wheel_chart_self: pickFirstText(body, [
        "freeNatalWheelChartForself",
        "freeNatalWheelChartSelf",
      ]),
      free_natal_wheel_chart_partner: pickFirstText(body, [
        "freeNatalWheelChartForPartner",
        "freeNatalWheelChartPartner",
      ]),
      // Legacy "P2 = partner" variants used by the romantic-forecast flow
      // in src/app/admin/horoscope/page.tsx.
      free_natal_wheel_chart_p2: asTextOrNull(body.freeNatalWheelChartP2),
      free_natal_wheel_chart_transit_p2: pickFirstText(body, [
        "freeNatalWheelChartForTransitP2",
        "freeNatalWheelChartForTrasitP2",
      ]),
      response_share_url: asTextOrNull(body.response_share_url),
    };

    // ── Persist ────────────────────────────────────────────────────────────
    const admin = createAdminClient();

    if (incomingId) {
      // Object-level authorization: the row's existing user_id must match
      // the authenticated user. We never disclose whether a row exists for
      // a foreign id — both "wrong owner" and "no such row" map to 403.
      const { data: existing, error: existingErr } = await admin
        .from("astro_ai_responses")
        .select("id, user_id")
        .eq("id", incomingId)
        .maybeSingle();

      if (existingErr) {
        console.error(
          "[astro-ai/save] existence-check failed:",
          existingErr
        );
        return NextResponse.json(
          { status: "error", message: existingErr.message },
          { status: 500 }
        );
      }
      if (!existing || existing.user_id !== user.id) {
        return NextResponse.json(
          { status: "error", message: "Not allowed to update this record" },
          { status: 403 }
        );
      }

      const { data: updated, error: updateErr } = await admin
        .from("astro_ai_responses")
        .update(dbPayload)
        .eq("id", incomingId)
        .select()
        .single();

      if (updateErr) {
        console.error("[astro-ai/save] update failed:", updateErr);
        return NextResponse.json(
          { status: "error", message: updateErr.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ status: "success", res: updated });
    }

    // INSERT path — never trust a client-supplied user_id.
    const { data: inserted, error: insertErr } = await admin
      .from("astro_ai_responses")
      .insert([{ ...dbPayload, user_id: user.id }])
      .select()
      .single();

    if (insertErr) {
      console.error("[astro-ai/save] insert failed:", insertErr);
      return NextResponse.json(
        { status: "error", message: insertErr.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ status: "success", res: inserted });
  } catch (err) {
    console.error("[astro-ai/save] unexpected error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong!",
      },
      { status: 500 }
    );
  }
}
