import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Info, Clock, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="size-5 text-red-500" />,
  high: <AlertTriangle className="size-5 text-orange-500" />,
  medium: <Info className="size-5 text-yellow-500" />,
  low: <Info className="size-5 text-blue-400" />,
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardMundaneAlertDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: alert, error } = await admin
    .from("mundane_alert_notifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !alert) notFound();

  // Fetch linked entity if present
  let entity: { id: string; name: string; flag_emoji: string | null } | null = null;
  if (alert.entity_id) {
    const { data: e } = await admin
      .from("mundane_entities")
      .select("id, name, flag_emoji")
      .eq("id", alert.entity_id)
      .maybeSingle();
    entity = e;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane/alerts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to alerts
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {PRIORITY_ICON[alert.priority] ?? <Bell className="size-5 text-muted-foreground" />}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
            {!alert.is_read && (
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                NEW
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="size-3.5" />
            <span>{formatDateTime(alert.triggered_at)}</span>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${PRIORITY_BADGE[alert.priority] ?? ""}`}
            >
              {alert.priority}
            </Badge>
          </div>
        </div>
      </div>

      {/* Message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alert Message</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm whitespace-pre-wrap">{alert.message}</p>
        </CardContent>
      </Card>

      {/* Entity link */}
      {entity && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Related Entity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href={`/dashboard/mundane/entities/${entity.id}`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="text-xl">{entity.flag_emoji ?? "🌐"}</span>
              <span className="font-medium">{entity.name}</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Alert rule / metadata if present */}
      {alert.alert_rule_id && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alert Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1 text-sm text-muted-foreground">
            <p>Rule ID: <span className="font-mono text-xs">{alert.alert_rule_id}</span></p>
            <p>Status: <span className={alert.is_read ? "text-muted-foreground" : "text-amber-600 font-medium"}>
              {alert.is_read ? "Read" : "Unread"}
            </span></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
