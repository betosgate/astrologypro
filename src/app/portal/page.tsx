import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Play, Search, User } from "lucide-react";

export const metadata = {
  title: "My Portal - Dashboard",
};

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  // Fetch upcoming bookings and recent recordings in parallel
  const [upcomingResult, recordingsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, status, recording_share_id, services(name), diviners(display_name, username)"
      )
      .eq("client_id", client.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, recording_share_id, recording_url, services(name), diviners(display_name)"
      )
      .eq("client_id", client.id)
      .eq("status", "completed")
      .not("recording_url", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(3),
  ]);

  const upcomingBookings = upcomingResult.data ?? [];
  const recentRecordings = recordingsResult.data ?? [];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {client.display_name}
        </h1>
        <p className="text-muted-foreground">
          Here is what is happening with your sessions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Upcoming Bookings
            </CardTitle>
            <CardDescription>Your next scheduled sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No upcoming bookings. Find a diviner to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {booking.services?.name ?? "Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {booking.diviners?.display_name ?? "Diviner"} &middot;{" "}
                        {formatDateTime(booking.scheduled_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={statusColors[booking.status] ?? ""}
                        variant="outline"
                      >
                        {booking.status}
                      </Badge>
                      {booking.status === "confirmed" && booking.diviners?.username && (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/${booking.diviners.username}/session/${booking.id}`}
                          >
                            Join
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Recordings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="size-5" />
              Recent Recordings
            </CardTitle>
            <CardDescription>Watch your past session recordings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecordings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recordings available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentRecordings.map((recording: any) => (
                  <div
                    key={recording.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {recording.services?.name ?? "Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {recording.diviners?.display_name ?? "Diviner"} &middot;{" "}
                        {formatDateTime(recording.scheduled_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/session/${recording.recording_share_id}/recording`}>
                        <Play className="mr-1 size-3" />
                        Watch
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-between" asChild>
              <Link href="/discover">
                <span className="flex items-center gap-2">
                  <Search className="size-4" />
                  Find a Diviner
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-between" asChild>
              <Link href="/portal/profile">
                <span className="flex items-center gap-2">
                  <User className="size-4" />
                  Update Profile
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
