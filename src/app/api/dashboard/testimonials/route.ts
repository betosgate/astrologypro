import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "submitted",
  "pending_review",
  "approved",
  "rejected",
  "hidden",
  "pending",
] as const;

type TestimonialStatus = (typeof VALID_STATUSES)[number];

function problemDetail(
  status: number,
  title: string,
  detail: string
): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// GET /api/dashboard/testimonials
// Query params: status, cursor (created_at:id), limit (default 20)
export async function GET(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const sp = req.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const cursor = sp.get("cursor"); // format: "ISO_DATE:UUID"
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? "20")));

  const admin = createAdminClient();

  let query = admin
    .from("testimonials")
    .select(
      "id, client_name, display_alias, rating, text, service_name, service_type, status, is_featured, featured, spam_score, moderation_notes, diviner_response, consent_marketing, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (statusFilter && VALID_STATUSES.includes(statusFilter as TestimonialStatus)) {
    query = query.eq("status", statusFilter);
  }

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split(":");
    if (cursorDate && cursorId) {
      // Keyset: rows where (created_at, id) < (cursorDate, cursorId)
      query = query.or(
        `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    return problemDetail(500, "Internal Server Error", error.message);
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor =
    hasMore && items.length > 0
      ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
      : null;

  return NextResponse.json({ testimonials: items, nextCursor, hasMore });
}

// PATCH /api/dashboard/testimonials
// Body: { id, status?, is_featured?, diviner_response?, moderation_notes? }
export async function PATCH(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  let body: {
    id?: unknown;
    status?: unknown;
    is_featured?: unknown;
    diviner_response?: unknown;
    moderation_notes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const { id, status, is_featured, diviner_response, moderation_notes } = body;

  if (!id || typeof id !== "string") {
    return problemDetail(422, "Validation Error", "Field 'id' is required.");
  }

  // Verify ownership
  const admin = createAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from("testimonials")
    .select("id, diviner_id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return problemDetail(404, "Not Found", "Testimonial not found.");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status as TestimonialStatus)) {
      return problemDetail(
        422,
        "Validation Error",
        `Status must be one of: ${VALID_STATUSES.join(", ")}.`
      );
    }
    updates.status = status;
  }

  if (is_featured !== undefined) {
    if (typeof is_featured !== "boolean") {
      return problemDetail(422, "Validation Error", "is_featured must be a boolean.");
    }
    updates.is_featured = is_featured;
  }

  if (diviner_response !== undefined) {
    updates.diviner_response =
      typeof diviner_response === "string" && diviner_response.trim()
        ? diviner_response.trim()
        : null;
  }

  if (moderation_notes !== undefined) {
    updates.moderation_notes =
      typeof moderation_notes === "string" && moderation_notes.trim()
        ? moderation_notes.trim()
        : null;
  }

  if (Object.keys(updates).length === 1) {
    // only updated_at — nothing to update
    return problemDetail(422, "Validation Error", "No updatable fields provided.");
  }

  const { data: updated, error: updateErr } = await admin
    .from("testimonials")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return problemDetail(500, "Internal Server Error", updateErr.message);
  }

  return NextResponse.json({ testimonial: updated });
}
