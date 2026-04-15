import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bell, AlertTriangle, Info, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alerts — Mundane" };

type Alert = {
  id: string;
  title: string;
  message: string;
  priority: string;
  entity_id: string | null;
  is_read: boolean;
  triggered_at: string;
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="size-4 text-red-500 shrink-0" />,
  high: <AlertTriangle className="size-4 text-orange-500 shrink-0" />,
  medium: <Info className="size-4 text-yellow-500 shrink-0" />,
  low: <Info className="size-4 text-blue-400 shrink-0" />,
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardMundaneAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_alert_notifications")
    .select("id, title, message, priority, entity_id, is_read, triggered_at")
    .eq("user_id", user.id);

  if (filter === "unread") query = query.eq("is_read", false);
  if (filter === "read") query = query.eq("is_read", true);

  const { data, error } = await query
    .order("triggered_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="text-destructive text-sm">Failed to load alerts: {error.message}</div>;
  }

  const alerts = (data ?? []) as Alert[];
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  // Entity name map
  const entityIds = Array.from(new Set(alerts.map((a) => a.entity_id).filter(Boolean) as string[]));
  const entityMap: Record<string, { name: string; flag: string | null }> = {};
  if (entityIds.length > 0) {
    const { data: ents } = await admin
      .from("mundane_entities")
      .select("id, name, flag_emoji")
      .in("id", entityIds);
    for (const e of ents ?? []) entityMap[e.id] = { name: e.name, flag: e.flag_emoji };
  }

  const FILTERS = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Read", value: "read" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="size-6 text-amber-500" />
          Alerts
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold px-2 py-0.5 ml-1">
              {unreadCount} unread
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">
          Notifications triggered by your alert rules and watched entities.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((opt) => (
          <Link key={opt.value} href={`/dashboard/mundane/alerts?filter=${opt.value}`}>
            <Badge
              variant={filter === opt.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No alerts {filter !== "all" ? `(${filter})` : "yet"}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 shadow-sm ${
                alert.is_read ? "bg-card" : "bg-amber-50/40 border-amber-200"
              }`}
            >
              {PRIORITY_ICON[alert.priority] ?? (
                <Info className="size-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium leading-snug">{alert.title}</p>
                  {!alert.is_read && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-100 text-amber-700 border-amber-300"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{formatDateTime(alert.triggered_at)}</span>
                  {alert.entity_id && entityMap[alert.entity_id] && (
                    <Link
                      href={`/community/mundane/${alert.entity_id}`}
                      className="hover:text-foreground"
                    >
                      {entityMap[alert.entity_id].flag ?? "🌐"} {entityMap[alert.entity_id].name}
                    </Link>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize shrink-0 ${
                  PRIORITY_BADGE[alert.priority] ?? ""
                }`}
              >
                {alert.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
