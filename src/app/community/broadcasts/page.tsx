import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { Radio, Calendar, PlayCircle } from "lucide-react";
import { BroadcastRsvpButton } from "@/components/community/broadcast-rsvp-button";

export const metadata = { title: "Broadcasts & Live Events - AstrologyPro Community" };
export const dynamic = "force-dynamic";

type BroadcastStatus = "active" | "draft" | "archived";

interface Broadcast {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  status: BroadcastStatus | string;
  priority: number;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <Badge className="animate-pulse bg-red-500 text-white hover:bg-red-600">
        ● LIVE
      </Badge>
    );
  }
  if (status === "upcoming") {
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">UPCOMING</Badge>;
  }
  return <Badge variant="secondary">ON DEMAND</Badge>;
}

function buildGoogleCalendarUrl(title: string, description: string, dateStr: string): string {
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1 hr
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description ?? "",
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function CommunityBroadcastsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  // Fetch directly via admin client — server component, no HTTP round-trip needed
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("broadcasting")
    .select("id, title, short_description, description, status, priority, created_at, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const broadcasts: Broadcast[] = error ? [] : (data ?? []);

  // Fetch current user's RSVPs + counts for all broadcasts in one query
  // Using the user-scoped supabase client so RLS restricts to the current user
  const broadcastIds = broadcasts.map((b) => b.id);
  let userRsvpMap: Record<string, string> = {};
  let goingCountMap: Record<string, number> = {};
  let maybeCountMap: Record<string, number> = {};

  if (broadcastIds.length > 0) {
    // User's own RSVPs
    const { data: myRsvps } = await supabase
      .from("broadcast_rsvps")
      .select("broadcast_id, rsvp_status")
      .in("broadcast_id", broadcastIds);

    for (const r of myRsvps ?? []) {
      userRsvpMap[r.broadcast_id] = r.rsvp_status;
    }

    // Aggregate counts via admin client (bypasses RLS to count all users)
    const { data: allRsvps } = await admin
      .from("broadcast_rsvps")
      .select("broadcast_id, rsvp_status")
      .in("broadcast_id", broadcastIds);

    for (const r of allRsvps ?? []) {
      if (r.rsvp_status === "going") {
        goingCountMap[r.broadcast_id] = (goingCountMap[r.broadcast_id] ?? 0) + 1;
      } else if (r.rsvp_status === "maybe") {
        maybeCountMap[r.broadcast_id] = (maybeCountMap[r.broadcast_id] ?? 0) + 1;
      }
    }
  }

  // Broadcasts don't have a premiere_at column based on the admin API —
  // they are created with a status field. Treat status values accordingly.
  // "active" = on-demand / published. If the schema later adds live/upcoming
  // values, the StatusBadge component already handles them.
  const live = broadcasts.filter((b) => b.status === "live");
  const upcoming = broadcasts.filter((b) => b.status === "upcoming");
  const onDemand = broadcasts.filter((b) => b.status === "active");

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcasts &amp; Live Events</h1>
        <p className="text-muted-foreground">
          Watch live sessions, upcoming events, and on-demand recordings.
        </p>
      </div>

      {/* Live Now */}
      {live.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-red-500" />
            <h2 className="text-lg font-semibold">Live Now</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {live.map((b) => (
              <Card key={b.id} className="border-red-300 ring-1 ring-red-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{b.title}</CardTitle>
                    <StatusBadge status={b.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {b.short_description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {b.short_description}
                    </CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Started: <span className="font-medium text-foreground">{formatDateTime(b.updated_at)}</span>
                  </p>
                  <Button size="sm" className="w-full">
                    <PlayCircle className="mr-1.5 size-4" />
                    Watch Live
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Upcoming</h2>
            <span className="text-sm text-muted-foreground">({upcoming.length})</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b) => (
              <Card key={b.id} className="border-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{b.title}</CardTitle>
                    <StatusBadge status={b.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {b.short_description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {b.short_description}
                    </CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Scheduled: <span className="font-medium text-foreground">{formatDateTime(b.updated_at)}</span>
                  </p>
                  <BroadcastRsvpButton
                    broadcastId={b.id}
                    initialStatus={(userRsvpMap[b.id] as "going" | "maybe" | "not_going") ?? null}
                    initialCounts={{ going: goingCountMap[b.id] ?? 0, maybe: maybeCountMap[b.id] ?? 0 }}
                  />
                  <a
                    href={buildGoogleCalendarUrl(
                      b.title,
                      b.short_description ?? b.description ?? "",
                      b.updated_at
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="mr-1.5 size-4" />
                      Add to Calendar
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* On Demand / Past */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PlayCircle className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">On Demand</h2>
          {onDemand.length > 0 && (
            <span className="text-sm text-muted-foreground">({onDemand.length})</span>
          )}
        </div>

        {onDemand.length === 0 && live.length === 0 && upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No broadcasts available yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : onDemand.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No on-demand recordings yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onDemand.map((b) => (
              <Card key={b.id} className="opacity-90 hover:opacity-100 transition-opacity">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-snug">{b.title}</CardTitle>
                    <StatusBadge status="on_demand" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {b.short_description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {b.short_description}
                    </CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDateTime(b.updated_at)}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <PlayCircle className="mr-1.5 size-4" />
                    Watch Recording
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
