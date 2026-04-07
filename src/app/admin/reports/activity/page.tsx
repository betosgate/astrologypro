import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActivityReportClient } from "@/components/admin/activity-report-client";
import type { ActivityItem } from "@/app/api/admin/reports/activity/route";

export const metadata = { title: "Activity Log — Admin" };

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ActivityReportPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const db = createAdminClient();

  // First page of user_activity_log (default source)
  const { data, count } = await db
    .from("user_activity_log")
    .select("id, user_id, actor_id, event_category, event_type, metadata, ip_address, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .order("id",          { ascending: false })
    .limit(50);

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  // Fetch emails for first-page users
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
    items.length === 50 && last ? `${last.created_at}__${last.id}` : null;

  return (
    <ActivityReportClient
      initialItems={items}
      initialCursor={next_cursor}
      initialTotal={count ?? 0}
    />
  );
}
