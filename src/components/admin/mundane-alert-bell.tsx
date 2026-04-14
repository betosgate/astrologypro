import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * MundaneAlertBell — server component.
 * Queries mundane_alert_notifications for the current user's unread count and
 * renders a Bell icon with a red badge when there are unread notifications.
 * Links to /admin/mundane/alerts.
 */
export async function MundaneAlertBell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { count } = await supabase
    .from("mundane_alert_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const unread = count ?? 0;

  return (
    <Link
      href="/admin/mundane/alerts"
      className="relative inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={unread > 0 ? `${unread} unread alert${unread === 1 ? "" : "s"}` : "Mundane alerts"}
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
