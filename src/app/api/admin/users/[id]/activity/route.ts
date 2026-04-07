import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/users/[id]/activity ───────────────────────────────────────
// Returns combined, merged activity timeline for ONE user:
//   - user_activity_log  (user_id = id)
//   - admin_activity_log (target_user_id = id)
//   - user_security_events (user_id = id)
// All merged and sorted by created_at DESC, cursor-paginated.
//
// Query params:
//   cursor   keyset: "<created_at>__<id>__<source>"
//   limit    default 50

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const cursor   = searchParams.get("cursor") ?? "";
  const limitRaw = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit    = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);

  // Decode cursor: "<created_at>__<id>__<source>"
  let cursorAt: string | null = null;
  if (cursor) {
    const parts = cursor.split("__");
    if (parts.length >= 1) cursorAt = parts[0];
  }

  const db = createAdminClient();

  // Fetch from all three tables in parallel, fetching more than limit so we can
  // merge-sort and return the correct page.
  const fetchLimit = limit + 1; // +1 to detect next page

  const [uaRes, aaRes, seRes] = await Promise.all([
    db
      .from("user_activity_log")
      .select("id, user_id, actor_id, event_category, event_type, metadata, ip_address, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .order("id",          { ascending: false })
      .limit(fetchLimit)
      .then((r) => r),

    db
      .from("admin_activity_log")
      .select("id, admin_user_id, target_user_id, action_type, details, ip_address, created_at")
      .eq("target_user_id", id)
      .order("created_at", { ascending: false })
      .order("id",          { ascending: false })
      .limit(fetchLimit)
      .then((r) => r),

    db
      .from("user_security_events")
      .select("id, user_id, event_type, ip_address, metadata, actor_user_id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .order("id",          { ascending: false })
      .limit(fetchLimit)
      .then((r) => r),
  ]);

  // Normalise rows into a common shape
  type Merged = {
    id: string;
    source: "user_activity" | "admin_activity" | "security_events";
    event_category?: string;
    event_type: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    actor_id?: string;
    created_at: string;
  };

  const rows: Merged[] = [];

  for (const r of (uaRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      id:             r.id as string,
      source:         "user_activity",
      event_category: r.event_category as string | undefined,
      event_type:     r.event_type as string,
      metadata:       r.metadata as Record<string, unknown> | undefined,
      ip_address:     r.ip_address as string | undefined,
      actor_id:       r.actor_id as string | undefined,
      created_at:     r.created_at as string,
    });
  }

  for (const r of (aaRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      id:             r.id as string,
      source:         "admin_activity",
      event_category: "admin",
      event_type:     r.action_type as string,
      metadata:       r.details as Record<string, unknown> | undefined,
      ip_address:     r.ip_address as string | undefined,
      actor_id:       r.admin_user_id as string | undefined,
      created_at:     r.created_at as string,
    });
  }

  for (const r of (seRes.data ?? []) as Array<Record<string, unknown>>) {
    rows.push({
      id:             r.id as string,
      source:         "security_events",
      event_category: "security",
      event_type:     r.event_type as string,
      metadata:       r.metadata as Record<string, unknown> | undefined,
      ip_address:     r.ip_address as string | undefined,
      actor_id:       r.actor_user_id as string | undefined,
      created_at:     r.created_at as string,
    });
  }

  // Merge-sort descending by created_at, then id (string compare — UUID tie-break)
  rows.sort((a, b) => {
    const dt = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (dt !== 0) return dt;
    return b.id.localeCompare(a.id);
  });

  // Apply cursor filter — skip everything before (and including) cursor row
  let filtered = rows;
  if (cursorAt) {
    const cursorTime = new Date(cursorAt).getTime();
    filtered = rows.filter((r) => new Date(r.created_at).getTime() < cursorTime);
  }

  const page = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;
  const last = page[page.length - 1];
  const next_cursor =
    hasMore && last ? `${last.created_at}__${last.id}__${last.source}` : null;

  return NextResponse.json({ items: page, next_cursor, total_count: rows.length });
}
