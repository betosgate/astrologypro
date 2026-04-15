import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Star } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event Calendar — Mundane" };

const ASTRO_TYPE_BADGE: Record<string, string> = {
  eclipse: "bg-purple-100 text-purple-700 border-purple-200",
  ingress: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-indigo-100 text-indigo-700 border-indigo-200",
  conjunction: "bg-amber-100 text-amber-700 border-amber-200",
  opposition: "bg-orange-100 text-orange-700 border-orange-200",
  station: "bg-pink-100 text-pink-700 border-pink-200",
  retrograde: "bg-rose-100 text-rose-700 border-rose-200",
  direct: "bg-emerald-100 text-emerald-700 border-emerald-200",
  custom: "bg-gray-100 text-gray-700 border-gray-200",
};

type Event = {
  id: string;
  title: string;
  event_type: string;
  planet_primary: string | null;
  planet_secondary: string | null;
  sign: string | null;
  event_datetime_utc: string;
  notes: string | null;
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function formatDay(key: string) {
  return new Date(key + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function DashboardMundaneEventCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("mundane_astro_events")
    .select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc, notes")
    .gte("event_datetime_utc", `${todayStr}T00:00:00Z`)
    .lte("event_datetime_utc", `${in30}T23:59:59Z`)
    .order("event_datetime_utc");

  if (error) {
    return <div className="text-destructive text-sm">Failed to load events: {error.message}</div>;
  }

  const events = (data ?? []) as Event[];

  // Group by day
  const byDay = new Map<string, Event[]>();
  for (const ev of events) {
    const k = dayKey(ev.event_datetime_utc);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(ev);
  }
  const days = Array.from(byDay.keys()).sort();

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
          <Sparkles className="size-6 text-purple-500" />
          Event Calendar
        </h1>
        <p className="text-muted-foreground">Astronomical sky — next 30 days.</p>
      </div>

      {days.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No astronomical events in the next 30 days.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day}>
              <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                {formatDay(day)}
              </h3>
              <div className="space-y-1.5">
                {byDay.get(day)!.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/dashboard/mundane/event-calendar/${ev.id}`}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
                  >
                    <Star className="size-4 text-violet-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug">{ev.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span>{formatTime(ev.event_datetime_utc)}</span>
                        {ev.sign && <span>· {ev.sign}</span>}
                        {ev.planet_primary && <span>· {ev.planet_primary}</span>}
                      </div>
                      {ev.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize shrink-0 ${
                        ASTRO_TYPE_BADGE[ev.event_type] ?? ""
                      }`}
                    >
                      {ev.event_type}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
