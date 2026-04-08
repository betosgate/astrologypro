import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  source: "user_activity" | "admin_activity" | "security_events";
  user_id: string;
  user_email?: string;
  event_category?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  actor_id?: string;
  created_at: string;
}

// ─── GET /api/admin/reports/activity ─────────────────────────────────────────
// Query params:
//   source       user_activity | admin_activity | security_events  (default: user_activity)
//   category     filter by event_category (user_activity only)
//   event_type   filter by event_type
//   user_id      filter to one user
//   date_after   created_at lower bound (ISO)
//   cursor       keyset: "<created_at>__<id>"
//   limit        default 50

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const source = (searchParams.get("source") ?? "user_activity") as
    | "user_activity"
    | "admin_activity"
    | "security_events";
  const category   = searchParams.get("category") ?? "";
  const eventType  = searchParams.get("event_type") ?? "";
  const userId     = searchParams.get("user_id") ?? "";
  const dateAfter  = searchParams.get("date_after") ?? "";
  const cursor     = searchParams.get("cursor") ?? "";
  const limitRaw   = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit      = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);

  const db = createAdminClient();

  // Decode cursor: "<created_at>__<id>"
  let cursorAt: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const sep = cursor.lastIndexOf("__");
    if (sep !== -1) {
      cursorAt = cursor.slice(0, sep);
      cursorId  = cursor.slice(sep + 2);
    }
  }

  try {
    if (source === "user_activity") {
      let q = db
        .from("user_activity_log")
        .select("id, user_id, actor_id, event_category, event_type, metadata, ip_address, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .order("id",          { ascending: false })
        .limit(limit);

      if (userId)    q = q.eq("user_id", userId);
      if (category)  q = q.eq("event_category", category);
      if (eventType) q = q.eq("event_type", eventType);
      if (dateAfter) q = q.gte("created_at", dateAfter);
      if (cursorAt && cursorId) {
        q = q.or(`created_at.lt.${cursorAt},and(created_at.eq.${cursorAt},id.lt.${cursorId})`);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as Array<Record<string, unknown>>;

      // Collect unique user_ids to fetch emails
      const userIds = [...new Set(rows.map((r) => r.user_id as string).filter(Boolean))];
      const emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: authRows } = await db.rpc("get_auth_users_by_ids", {
          user_ids: userIds,
        }) as { data: Array<{ user_id: string; email: string }> | null };
        for (const u of authRows ?? []) {
          emailMap[u.user_id] = u.email;
        }
      }

      const items: ActivityItem[] = rows.map((r) => ({
        id:             r.id as string,
        source:         "user_activity",
        user_id:        r.user_id as string,
        user_email:     emailMap[r.user_id as string],
        event_category: r.event_category as string | undefined,
        event_type:     r.event_type as string,
        metadata:       r.metadata as Record<string, unknown> | undefined,
        ip_address:     r.ip_address as string | undefined,
        actor_id:       r.actor_id as string | undefined,
        created_at:     r.created_at as string,
      }));

      const last = items[items.length - 1];
      const next_cursor =
        items.length === limit && last
          ? `${last.created_at}__${last.id}`
          : null;

      return NextResponse.json({ items, next_cursor, total_count: count ?? 0 });

    } else if (source === "admin_activity") {
      let q = db
        .from("admin_activity_log")
        .select(
          "id, admin_user_id, target_user_id, action_type, details, ip_address, created_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .order("id",          { ascending: false })
        .limit(limit);

      if (userId)    q = q.eq("target_user_id", userId);
      if (eventType) q = q.eq("action_type", eventType);
      if (dateAfter) q = q.gte("created_at", dateAfter);
      if (cursorAt && cursorId) {
        q = q.or(`created_at.lt.${cursorAt},and(created_at.eq.${cursorAt},id.lt.${cursorId})`);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as Array<Record<string, unknown>>;

      // Fetch admin emails
      const adminIds = [...new Set(rows.map((r) => r.admin_user_id as string).filter(Boolean))];
      const emailMap: Record<string, string> = {};
      if (adminIds.length > 0) {
        const { data: authRows } = await db.rpc("get_auth_users_by_ids", {
          user_ids: adminIds,
        }) as { data: Array<{ user_id: string; email: string }> | null };
        for (const u of authRows ?? []) {
          emailMap[u.user_id] = u.email;
        }
      }

      const items: ActivityItem[] = rows.map((r) => ({
        id:             r.id as string,
        source:         "admin_activity",
        user_id:        r.admin_user_id as string,
        user_email:     emailMap[r.admin_user_id as string],
        event_category: "admin",
        event_type:     r.action_type as string,
        metadata:       r.details as Record<string, unknown> | undefined,
        ip_address:     r.ip_address as string | undefined,
        actor_id:       r.admin_user_id as string | undefined,
        created_at:     r.created_at as string,
      }));

      const last = items[items.length - 1];
      const next_cursor =
        items.length === limit && last
          ? `${last.created_at}__${last.id}`
          : null;

      return NextResponse.json({ items, next_cursor, total_count: count ?? 0 });

    } else {
      // security_events
      let q = db
        .from("user_security_events")
        .select(
          "id, user_id, event_type, ip_address, metadata, actor_user_id, created_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .order("id",          { ascending: false })
        .limit(limit);

      if (userId)    q = q.eq("user_id", userId);
      if (eventType) q = q.eq("event_type", eventType);
      if (dateAfter) q = q.gte("created_at", dateAfter);
      if (cursorAt && cursorId) {
        q = q.or(`created_at.lt.${cursorAt},and(created_at.eq.${cursorAt},id.lt.${cursorId})`);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as Array<Record<string, unknown>>;

      const userIds = [...new Set(rows.map((r) => r.user_id as string).filter(Boolean))];
      const emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: authRows } = await db.rpc("get_auth_users_by_ids", {
          user_ids: userIds,
        }) as { data: Array<{ user_id: string; email: string }> | null };
        for (const u of authRows ?? []) {
          emailMap[u.user_id] = u.email;
        }
      }

      const items: ActivityItem[] = rows.map((r) => ({
        id:             r.id as string,
        source:         "security_events",
        user_id:        r.user_id as string,
        user_email:     emailMap[r.user_id as string],
        event_category: "security",
        event_type:     r.event_type as string,
        metadata:       r.metadata as Record<string, unknown> | undefined,
        ip_address:     r.ip_address as string | undefined,
        actor_id:       r.actor_user_id as string | undefined,
        created_at:     r.created_at as string,
      }));

      const last = items[items.length - 1];
      const next_cursor =
        items.length === limit && last
          ? `${last.created_at}__${last.id}`
          : null;

      return NextResponse.json({ items, next_cursor, total_count: count ?? 0 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
