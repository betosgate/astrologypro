import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActivityReportClient } from "@/components/admin/activity-report-client";
import type { ActivityItem } from "@/app/api/admin/reports/activity/route";

export const metadata = { title: "Activity Log — Admin" };

type Source = "user_activity" | "admin_activity" | "security_events";
type DateRange = "today" | "7d" | "30d" | "all";

interface ActivityReportSearchParams {
  source?: Source;
  category?: string;
  event_type?: string;
  user_id?: string;
  date_range?: DateRange;
}

function toDateFilter(range: DateRange): string {
  if (range === "all") return "";
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  const days = range === "7d" ? 7 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString();
}

async function mapUserEmails(db: ReturnType<typeof createAdminClient>, userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const emailMap: Record<string, string> = {};
  if (uniqueIds.length === 0) return emailMap;

  const { data: authRows } = (await db.rpc("get_auth_users_by_ids", {
    user_ids: uniqueIds,
  })) as { data: Array<{ user_id: string; email: string }> | null };

  for (const row of authRows ?? []) {
    emailMap[row.user_id] = row.email;
  }
  return emailMap;
}

async function getInitialActivityData(params: ActivityReportSearchParams) {
  const source: Source =
    params.source === "admin_activity" || params.source === "security_events"
      ? params.source
      : "user_activity";
  const filters = {
    category: params.category ?? "",
    eventType: params.event_type ?? "",
    userId: params.user_id ?? "",
    dateRange:
      params.date_range === "today" ||
      params.date_range === "7d" ||
      params.date_range === "30d"
        ? params.date_range
        : "all",
  } satisfies {
    category: string;
    eventType: string;
    userId: string;
    dateRange: DateRange;
  };

  const db = createAdminClient();
  const dateAfter = filters.dateRange === "all" ? "" : toDateFilter(filters.dateRange);

  if (source === "user_activity") {
    let query = db
      .from("user_activity_log")
      .select("id, user_id, actor_id, event_category, event_type, metadata, ip_address, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(50);

    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.category) query = query.eq("event_category", filters.category);
    if (filters.eventType) query = query.eq("event_type", filters.eventType);
    if (dateAfter) query = query.gte("created_at", dateAfter);

    const { data, count } = await query;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const emailMap = await mapUserEmails(db, rows.map((row) => row.user_id as string));
    const items: ActivityItem[] = rows.map((row) => ({
      id: row.id as string,
      source: "user_activity",
      user_id: row.user_id as string,
      user_email: emailMap[row.user_id as string],
      event_category: row.event_category as string | undefined,
      event_type: row.event_type as string,
      metadata: row.metadata as Record<string, unknown> | undefined,
      ip_address: row.ip_address as string | undefined,
      actor_id: row.actor_id as string | undefined,
      created_at: row.created_at as string,
    }));
    const last = items.at(-1);
    return {
      source,
      filters,
      items,
      total: count ?? 0,
      cursor: items.length === 50 && last ? `${last.created_at}__${last.id}` : null,
    };
  }

  if (source === "admin_activity") {
    let query = db
      .from("admin_activity_log")
      .select("id, admin_user_id, target_user_id, action_type, details, ip_address, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(50);

    if (filters.userId) query = query.eq("target_user_id", filters.userId);
    if (filters.eventType) query = query.eq("action_type", filters.eventType);
    if (dateAfter) query = query.gte("created_at", dateAfter);

    const { data, count } = await query;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const emailMap = await mapUserEmails(db, rows.map((row) => row.admin_user_id as string));
    const items: ActivityItem[] = rows.map((row) => ({
      id: row.id as string,
      source: "admin_activity",
      user_id: row.admin_user_id as string,
      user_email: emailMap[row.admin_user_id as string],
      event_category: "admin",
      event_type: row.action_type as string,
      metadata: row.details as Record<string, unknown> | undefined,
      ip_address: row.ip_address as string | undefined,
      actor_id: row.admin_user_id as string | undefined,
      created_at: row.created_at as string,
    }));
    const last = items.at(-1);
    return {
      source,
      filters,
      items,
      total: count ?? 0,
      cursor: items.length === 50 && last ? `${last.created_at}__${last.id}` : null,
    };
  }

  let query = db
    .from("user_security_events")
    .select("id, user_id, event_type, ip_address, metadata, actor_user_id, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (dateAfter) query = query.gte("created_at", dateAfter);

  const { data, count } = await query;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const emailMap = await mapUserEmails(db, rows.map((row) => row.user_id as string));
  const items: ActivityItem[] = rows.map((row) => ({
    id: row.id as string,
    source: "security_events",
    user_id: row.user_id as string,
    user_email: emailMap[row.user_id as string],
    event_category: "security",
    event_type: row.event_type as string,
    metadata: row.metadata as Record<string, unknown> | undefined,
    ip_address: row.ip_address as string | undefined,
    actor_id: row.actor_user_id as string | undefined,
    created_at: row.created_at as string,
  }));
  const last = items.at(-1);
  return {
    source,
    filters,
    items,
    total: count ?? 0,
    cursor: items.length === 50 && last ? `${last.created_at}__${last.id}` : null,
  };
}

export default async function ActivityReportPage({
  searchParams,
}: {
  searchParams: Promise<ActivityReportSearchParams>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const params = await searchParams;
  const { source, filters, items, total, cursor } = await getInitialActivityData(params);

  return (
    <ActivityReportClient
      initialSource={source}
      initialFilters={filters}
      initialItems={items}
      initialCursor={cursor}
      initialTotal={total}
    />
  );
}
