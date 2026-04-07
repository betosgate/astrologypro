import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Building2, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mundane Astrology — Dashboard" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
};

type MundaneEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  is_forecast: boolean;
  forecast_confidence: string | null;
  location: string | null;
};

export default async function DashboardMundanePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [entitiesRes, eventsRes] = await Promise.all([
    admin
      .from("mundane_entities")
      .select("id, name, entity_type, flag_emoji, region")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(20),
    admin
      .from("mundane_events")
      .select("id, title, event_type, event_date, is_forecast, forecast_confidence, location")
      .eq("is_public", true)
      .order("event_date", { ascending: false })
      .limit(20),
  ]);

  const entities = (entitiesRes.data ?? []) as Entity[];
  const events = (eventsRes.data ?? []) as MundaneEvent[];

  const upcomingEvents = events.filter((ev) => ev.event_date >= new Date().toISOString().slice(0, 10));
  const recentEvents = events.filter((ev) => ev.event_date < new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="size-6 text-violet-500" />
          Mundane Astrology
        </h1>
        <p className="text-muted-foreground">World entities, events, and astrological timing.</p>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border bg-card px-4 py-3 min-w-[100px]">
          <p className="text-xs text-muted-foreground">Entities</p>
          <p className="mt-0.5 text-2xl font-bold">{entities.length}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 min-w-[100px]">
          <p className="text-xs text-muted-foreground">Upcoming Events</p>
          <p className="mt-0.5 text-2xl font-bold">{upcomingEvents.length}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 min-w-[100px]">
          <p className="text-xs text-muted-foreground">Historical Events</p>
          <p className="mt-0.5 text-2xl font-bold">{recentEvents.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entity cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-blue-500" />
            <h2 className="text-base font-semibold">World Entities</h2>
          </div>
          {entities.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No entities in the registry yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {entities.map((e) => (
                <Card key={e.id} className="hover:bg-muted/30 transition-colors cursor-default">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    {e.flag_emoji && <span className="text-2xl shrink-0">{e.flag_emoji}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.name}</p>
                      {e.region && <p className="text-xs text-muted-foreground truncate">{e.region}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{e.entity_type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Events timeline */}
        <div className="space-y-4">
          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-500" />
                <h2 className="text-base font-semibold">Upcoming Events</h2>
              </div>
              <div className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <Card key={ev.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ev.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{formatDate(ev.event_date)}</span>
                            {ev.location && (
                              <span className="text-xs text-muted-foreground">{ev.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-xs capitalize">{ev.event_type.replace("_", " ")}</Badge>
                          {ev.is_forecast && (
                            <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50">Forecast</Badge>
                          )}
                          {ev.forecast_confidence && (
                            <Badge variant="outline" className={`text-xs capitalize ${CONFIDENCE_BADGE[ev.forecast_confidence] ?? ""}`}>
                              {ev.forecast_confidence}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Recent Events</h2>
            </div>
            {recentEvents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No historical events recorded yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((ev) => (
                  <Card key={ev.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ev.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{formatDate(ev.event_date)}</span>
                            {ev.location && (
                              <span className="text-xs text-muted-foreground">{ev.location}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">{ev.event_type.replace("_", " ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
