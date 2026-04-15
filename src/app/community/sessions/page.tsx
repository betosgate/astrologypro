import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Sessions - AstrologyPro Community" };
export const dynamic = "force-dynamic";

const DISPLAY_FOR_LABELS: Record<string, string> = {
  public: "Public",
  members: "Members",
  students: "Students",
  members_and_guests: "Members & Guests",
};

const DISPLAY_FOR_COLORS: Record<string, string> = {
  public: "bg-blue-500/10 text-blue-500",
  members: "bg-green-500/10 text-green-600",
  students: "bg-purple-500/10 text-purple-500",
  members_and_guests: "bg-amber-500/10 text-amber-600",
};

export default async function CommunitySessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const isMysterySchool = member.membership_type === "mystery_school";

  // Determine which display_for values apply to this member
  const displayForValues = ["public", "members"];
  if (isMysterySchool) displayForValues.push("students");
  displayForValues.push("members_and_guests");

  const { data: allEvents } = await supabase
    .from("calendar_events")
    .select("id, title, description, category, start_at, end_at, display_for, priority, is_active")
    .eq("is_active", true)
    .in("display_for", displayForValues)
    .order("start_at", { ascending: true });

  const now = new Date();
  const events = allEvents ?? [];

  const upcoming = events.filter((e) => e.start_at && new Date(e.start_at) >= now);
  const past = events.filter((e) => e.start_at && new Date(e.start_at) < now).reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isMysterySchool ? "Live Classes & Study Circles" : "Group Sessions & Ceremonies"}
        </h1>
        <p className="text-muted-foreground">
          {isMysterySchool
            ? "Weekly live classes and peer practice groups."
            : "New Moon, Full Moon, and wisdom circle gatherings."}
        </p>
      </div>

      {/* Upcoming events */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <span className="text-sm text-muted-foreground">({upcoming.length})</span>
        </div>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((event) => (
              <Card key={event.id} className="border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{event.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={DISPLAY_FOR_COLORS[event.display_for] ?? ""}
                    >
                      {DISPLAY_FOR_LABELS[event.display_for] ?? event.display_for}
                    </Badge>
                  </div>
                  {event.category && (
                    <Badge variant="secondary" className="w-fit text-xs">{event.category}</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.description && (
                    <CardDescription className="text-sm">{event.description}</CardDescription>
                  )}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {event.start_at && (
                      <p>Starts: <span className="font-medium text-foreground">{formatDateTime(event.start_at)}</span></p>
                    )}
                    {event.end_at && (
                      <p>Ends: <span className="font-medium text-foreground">{formatDateTime(event.end_at)}</span></p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past events */}
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Events</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((event) => (
              <Card key={event.id} className="opacity-70">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-snug">{event.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={DISPLAY_FOR_COLORS[event.display_for] ?? ""}
                    >
                      {DISPLAY_FOR_LABELS[event.display_for] ?? event.display_for}
                    </Badge>
                  </div>
                  {event.category && (
                    <span className="text-xs text-muted-foreground">{event.category}</span>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  {event.start_at && (
                    <p>{formatDateTime(event.start_at)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
