import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildRitualIdentityKey,
  normalizeRitualTags,
} from "@/lib/community/ritual-identity";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/rituals
 *
 * Lists the current user's ritual configurations.
 *
 * Query params (all optional — when none are provided the response shape
 * stays exactly as it was before pagination was introduced, so existing
 * callers do not break):
 *   - limit  : page size (1..100). When provided, response includes
 *              `count`, `nextOffset`, `hasMore` for infinite-scroll UIs.
 *   - offset : zero-based offset into the result set. Defaults to 0.
 *
 * Ordering is deterministic: `created_at DESC, id DESC`. The `id` tie-
 * breaker (per project rule #16) guarantees stable pagination even when
 * multiple rows share a `created_at` timestamp.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify community membership
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse pagination params. Pagination is opt-in: if no `limit` is
  // supplied we return the full list (legacy behavior).
  const url = new URL(req.url);
  const rawLimit = url.searchParams.get("limit");
  const rawOffset = url.searchParams.get("offset");
  const paginated = rawLimit !== null;

  let limit = 0;
  let offset = 0;

  if (paginated) {
    const parsedLimit = Number.parseInt(rawLimit ?? "", 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return NextResponse.json(
        { error: "limit must be a positive integer" },
        { status: 422 }
      );
    }
    // Cap page size so a malicious client can't ask for the whole table.
    limit = Math.min(parsedLimit, 100);

    if (rawOffset !== null) {
      const parsedOffset = Number.parseInt(rawOffset, 10);
      if (!Number.isFinite(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: "offset must be a non-negative integer" },
          { status: 422 }
        );
      }
      offset = parsedOffset;
    }
  }

  // Build the base query. We always order by (created_at DESC, id DESC)
  // for deterministic pagination — the trailing `id` is the unique tie-
  // breaker required by project rule #16.
  let query = supabase
    .from("user_ritual_configurations")
    .select(
      "id, ritual_name, ritual_tags, created_at, updated_at, last_executed_at, execution_count, current_step, is_complete",
      paginated ? { count: "exact" } : undefined
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (paginated) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rituals = data ?? [];

  if (!paginated) {
    // Legacy callers (and anything we may have missed) keep the old shape.
    return NextResponse.json({ rituals });
  }

  const totalCount = count ?? 0;
  const nextOffset = offset + rituals.length;
  const hasMore = nextOffset < totalCount;

  return NextResponse.json({
    rituals,
    count: totalCount,
    nextOffset,
    hasMore,
  });
}

/**
 * POST /api/community/rituals
 *
 * Idempotent create. If a ritual with the same canonical identity
 * (ritual_name + normalized ritual_tags) already exists for this user,
 * the existing record is returned instead of inserting a duplicate.
 *
 * When multiple historical duplicates exist (older rows from before this
 * change shipped), we deterministically prefer the OLDEST one — that
 * preserves the user's original ritual record and any execution state
 * already attached to it.
 *
 * Response shape:
 *   { ritual: <row>, created: boolean }
 *
 * `created: false` means we resolved to an existing ritual.
 * `created: true`  means we inserted a brand new row.
 *
 * The status code is 200 when reusing, 201 when creating — consistent
 * with HTTP semantics.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { ritual_name, ritual_tags } = body as {
    ritual_name?: string;
    ritual_tags?: string[];
  };

  if (
    typeof ritual_name !== "string" ||
    ritual_name.trim().length === 0 ||
    !Array.isArray(ritual_tags) ||
    ritual_tags.length === 0
  ) {
    return NextResponse.json(
      { error: "ritual_name and ritual_tags are required" },
      { status: 422 }
    );
  }

  // Compute the canonical identity for the request.
  const incomingKey = buildRitualIdentityKey(ritual_name, ritual_tags);
  const incomingNormalizedTags = normalizeRitualTags(ritual_tags);
  if (incomingNormalizedTags.length === 0) {
    return NextResponse.json(
      { error: "ritual_tags must contain at least one non-empty tag" },
      { status: 422 }
    );
  }

  // Look up existing rituals with the same name for this user. We
  // narrow by `ritual_name` in SQL to keep the scan small, then compare
  // the canonical tag set in JS — this avoids relying on the raw tag
  // ordering that was historically stored, which could differ between
  // rows even for the same logical ritual.
  //
  // Order ASC so the first match is the OLDEST duplicate (see doc above).
  const { data: existingRows, error: lookupError } = await supabase
    .from("user_ritual_configurations")
    .select(
      "id, ritual_name, ritual_tags, created_at, updated_at, last_executed_at, execution_count, current_step, is_complete"
    )
    .eq("user_id", user.id)
    .eq("ritual_name", ritual_name.trim())
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  const match = (existingRows ?? []).find(
    (row) =>
      buildRitualIdentityKey(row.ritual_name, row.ritual_tags ?? []) ===
      incomingKey
  );

  if (match) {
    return NextResponse.json(
      { ritual: match, created: false },
      { status: 200 }
    );
  }

  // No duplicate found — insert a new row. We persist the tags exactly
  // as the client sent them (preserving the UI's intentional ordering
  // for display), and rely on `buildRitualIdentityKey` for future
  // dedupe lookups rather than mutating storage.
  const { data: inserted, error: insertError } = await supabase
    .from("user_ritual_configurations")
    .insert({
      user_id: user.id,
      community_member_id: member.id,
      ritual_name: ritual_name.trim(),
      ritual_tags,
    })
    .select(
      "id, ritual_name, ritual_tags, created_at, updated_at, last_executed_at, execution_count, current_step, is_complete"
    )
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(
    { ritual: inserted, created: true },
    { status: 201 }
  );
}
