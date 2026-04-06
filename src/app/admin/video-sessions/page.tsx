import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Activity, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Video Sessions — Admin",
};

async function getStats() {
  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: total },
    { count: live },
    { count: endedToday },
    { count: created },
  ] = await Promise.all([
    admin
      .from("video_sessions")
      .select("id", { count: "exact", head: true }),
    admin
      .from("video_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),
    admin
      .from("video_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ended")
      .gte("ended_at", todayStart.toISOString()),
    admin
      .from("video_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "created"),
  ]);

  return {
    total: total ?? 0,
    live: live ?? 0,
    endedToday: endedToday ?? 0,
    created: created ?? 0,
  };
}

async function getRecentSessions() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("video_sessions")
    .select(
      `id, room_name, status, duration_seconds, created_at,
       diviners(id, display_name),
       clients(id, full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

const STATUS_STYLES: Record<string, string> = {
  created: "bg-gray-500/20 text-gray-300",
  waiting: "bg-blue-500/20 text-blue-300",
  live: "bg-green-500/20 text-green-300",
  ended: "bg-gray-500/20 text-gray-400",
  cancelled: "bg-red-500/20 text-red-300",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function AdminVideoSessionsPage() {
  const [stats, recent] = await Promise.all([getStats(), getRecentSessions()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Video Sessions</h1>
        <p className="text-muted-foreground text-sm">
          Live reading session activity across all diviners.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Video className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Activity className="size-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{stats.live}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ended Today</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.endedToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready / Unused</CardTitle>
            <XCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.created}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No video sessions yet.
            </p>
          ) : (
            <div className="divide-y">
              {recent.map((session) => {
                const diviner = session.diviners as { display_name?: string | null } | null;
                const client = session.clients as { full_name?: string | null } | null;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 px-6 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium">
                        {session.room_name ?? session.id.slice(0, 8) + "…"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {diviner?.display_name ?? "Unknown diviner"}
                        {client?.full_name ? ` — ${client.full_name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(session.duration_seconds)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[session.status] ?? "bg-gray-500/20 text-gray-400"}`}
                      >
                        {session.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Session details are managed by each diviner from their{" "}
        <Link href="/dashboard/video" className="underline hover:text-foreground">
          dashboard
        </Link>
        .
      </p>
    </div>
  );
}
