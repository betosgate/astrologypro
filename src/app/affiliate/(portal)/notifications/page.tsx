// /affiliate/notifications
// In-app inbox for the affiliate. Reads `notifications WHERE user_id = me`.
// Newest first. Marks rows as read on click.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

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
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
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

export default async function NotificationsInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/notifications");

  // Use the AUTH context (not service-role) for the read so the RLS
  // policy on `notifications` enforces user_id=auth.uid(). Defense in
  // depth — even though the WHERE clause already does this, RLS is the
  // policy of record.
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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {rows.length === 0
              ? "Nothing yet — new commission events and account updates land here."
              : unreadCount > 0
                ? `${unreadCount} unread, ${rows.length - unreadCount} read.`
                : `${rows.length} total.`}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/affiliate/notifications/preferences">
            <Settings className="mr-2 size-3.5" aria-hidden />
            Preferences
          </Link>
        </Button>
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
              We&rsquo;ll notify you here whenever a referred customer pays,
              when a diviner edits your commission rate, or when an admin
              takes action on one of your campaigns.
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
