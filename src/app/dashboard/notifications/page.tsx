// /dashboard/notifications
//
// Diviner inbox for in-app notifications (notifications.user_id =
// auth.uid()). Reads via the AUTH client so RLS is the policy of
// record. Auto-marks unread on mount.
//
// Per-kind preference toggles for diviners are deferred to the
// unified-notifications overhaul — see the inline comment in
// src/app/api/admin/affiliate-assignments/[id]/revoke/route.ts.
//
// Spec: docs/specs/affiliate-commission-system.md §7

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { MarkReadOnMount } from "./mark-read-on-mount";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 1) {
    const m = Math.max(1, Math.floor(diffMs / 60_000));
    return `${m}m ago`;
  }
  if (diffH < 24) {
    return `${Math.floor(diffH)}h ago`;
  }
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardNotificationsInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/notifications");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, type, action_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = notifications ?? [];
  const unreadCount = rows.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <MarkReadOnMount unreadCount={unreadCount} />
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          {rows.length === 0
            ? "Nothing yet — affiliate activity, admin overrides, and account updates land here."
            : unreadCount > 0
              ? `${unreadCount} unread, ${rows.length - unreadCount} read.`
              : `${rows.length} total.`}
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell
              className="mx-auto mb-3 size-10 text-muted-foreground"
              aria-hidden
            />
            <h2 className="text-base font-medium">Inbox is empty</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              You&rsquo;ll see notifications here when an admin overrides one
              of your assignments or campaigns, when an affiliate accepts your
              invitation, and for billing events.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => {
            const inner = (
              <Card
                className={
                  !n.is_read
                    ? "border-primary/40 bg-primary/5"
                    : "hover:bg-muted/40"
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">
                      {n.title as string}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(n.created_at as string)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {(n.body as string | null) ?? ""}
                </CardContent>
              </Card>
            );
            return n.action_url ? (
              <Link
                key={n.id}
                href={n.action_url as string}
                className="block"
                aria-label={(n.title as string) ?? "Notification"}
              >
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
