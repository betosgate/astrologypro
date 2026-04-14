import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe, Building2, CalendarDays, Users, BookOpen,
  TrendingUp, Star, Telescope, ScrollText, Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mundane Astrology — Dashboard" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-yellow-100 text-yellow-700 border-yellow-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

const SIGNAL_COLOR: Record<string, string> = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

const ASTRO_TYPE_BADGE: Record<string, string> = {
  eclipse: "bg-purple-100 text-purple-700 border-purple-200",
  ingress: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-indigo-100 text-indigo-700 border-indigo-200",
  conjunction: "bg-amber-100 text-amber-700 border-amber-200",
  station: "bg-pink-100 text-pink-700 border-pink-200",
  retrograde: "bg-rose-100 text-rose-700 border-rose-200",
  direct: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type Entity = { id: string; name: string; entity_type: string; flag_emoji: string | null; region: string | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default async function DashboardMundanePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  const [
    entitiesRes,
    leadersRes,
    upcomingEventsRes,
    recentEventsRes,
    astroEventsRes,
    forecastsRes,
    projectsRes,
  ] = await Promise.all([
    admin.from("mundane_entities").select("id, name, entity_type, flag_emoji, region")
      .eq("is_active", true).order("name").limit(16),
    admin.from("mundane_leaders").select("id, full_name, office_title, is_current, birth_data_confidence")
      .eq("is_public", true).eq("is_current", true).order("full_name").limit(8),
    admin.from("mundane_events").select("id, title, event_type, event_date, is_forecast, forecast_confidence, location")
      .eq("is_public", true).gte("event_date", today).order("event_date").limit(6),
    admin.from("mundane_events").select("id, title, event_type, event_date, is_forecast, location")
      .eq("is_public", true).lt("event_date", today).order("event_date", { ascending: false }).limit(5),
    admin.from("mundane_astro_events").select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc")
      .gte("event_datetime_utc", new Date().toISOString())
      .lte("event_datetime_utc", new Date(Date.now() + 180 * 86400000).toISOString())
      .order("event_datetime_utc").limit(8),
    admin.from("mundane_forecasts").select("id, title, entity_id, forecast_period_start, forecast_period_end, confidence_level, signal_strength, outcome_status, is_public")
      .eq("is_public", true).eq("outcome_status", "open")
      .gte("forecast_period_end", today).order("forecast_period_start").limit(6),
    admin.from("mundane_research_projects").select("id, title, project_type, status, created_at")
      .eq("status", "active").order("created_at", { ascending: false }).limit(4),
  ]);

  const entities = (entitiesRes.data ?? []) as Entity[];
  const leaders = (leadersRes.data ?? []) as AnyRow[];
  const upcomingEvents = (upcomingEventsRes.data ?? []) as AnyRow[];
  const recentEvents = (recentEventsRes.data ?? []) as AnyRow[];
  const astroEvents = (astroEventsRes.data ?? []) as AnyRow[];
  const forecasts = (forecastsRes.data ?? []) as AnyRow[];
  const projects = (projectsRes.data ?? []) as AnyRow[];

  const counts = {
    entities: entitiesRes.data?.length ?? 0,
    leaders: leadersRes.data?.length ?? 0,
    upcomingEvents: upcomingEvents.length,
    astroEvents: astroEvents.length,
    forecasts: forecasts.length,
    projects: projects.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Globe className="size-6 text-violet-500" />
          <h1 className="text-2xl font-bold tracking-tight">Mundane Astrology</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          World entities, astronomical events, forecasts, and research.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Entities", value: counts.entities, icon: <Building2 className="size-4 text-violet-500" />, href: "/admin/mundane/entities" },
          { label: "Leaders", value: counts.leaders, icon: <Users className="size-4 text-blue-500" />, href: "/admin/mundane/leaders" },
          { label: "Upcoming Events", value: counts.upcomingEvents, icon: <CalendarDays className="size-4 text-emerald-500" />, href: "/admin/mundane/events" },
          { label: "Astro Events", value: counts.astroEvents, icon: <Telescope className="size-4 text-purple-500" />, href: "/admin/mundane/event-calendar" },
          { label: "Open Forecasts", value: counts.forecasts, icon: <TrendingUp className="size-4 text-amber-500" />, href: "/admin/mundane/forecasts" },
          { label: "Research Projects", value: counts.projects, icon: <BookOpen className="size-4 text-rose-500" />, href: "/admin/mundane/research" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-full">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ---- LEFT: Upcoming Astro Events ---- */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Telescope className="size-4 text-purple-500" />
              <h2 className="text-base font-semibold">Upcoming Astro Events</h2>
            </div>
            <Link href="/admin/mundane/event-calendar" className="text-xs text-muted-foreground hover:text-foreground">View calendar →</Link>
          </div>
          {astroEvents.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No upcoming events.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {astroEvents.map((ev) => (
                <Card key={ev.id} className="hover:bg-muted/20 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">{ev.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{formatDateTime(ev.event_datetime_utc)}</span>
                          {ev.sign && <span className="text-xs text-muted-foreground">· {ev.sign}</span>}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize shrink-0 ${ASTRO_TYPE_BADGE[ev.event_type] ?? ""}`}
                      >
                        {ev.event_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ---- CENTER: Open Forecasts ---- */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-amber-500" />
              <h2 className="text-base font-semibold">Open Forecasts</h2>
            </div>
            <Link href="/admin/mundane/forecasts" className="text-xs text-muted-foreground hover:text-foreground">All forecasts →</Link>
          </div>
          {forecasts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No open forecasts.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {forecasts.map((fc) => (
                <Card key={fc.id} className="hover:bg-muted/20 transition-colors">
                  <CardContent className="py-3 px-4">
                    <p className="text-sm font-medium leading-snug">{fc.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(fc.forecast_period_start)} → {formatDate(fc.forecast_period_end)}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {fc.confidence_level && (
                        <Badge variant="outline" className={`text-[10px] capitalize ${CONFIDENCE_BADGE[fc.confidence_level] ?? ""}`}>
                          {fc.confidence_level}
                        </Badge>
                      )}
                      {fc.signal_strength && (
                        <span className={`text-[10px] font-semibold uppercase ${SIGNAL_COLOR[fc.signal_strength] ?? ""}`}>
                          ● {fc.signal_strength} signal
                        </span>
                      )}
                      <Badge variant="outline" className={`text-[10px] capitalize ${OUTCOME_BADGE[fc.outcome_status] ?? ""}`}>
                        {fc.outcome_status?.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ---- RIGHT: Research Projects + Leaders ---- */}
        <div className="space-y-4 lg:col-span-1">
          {/* Research Projects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="size-4 text-rose-500" />
                <h2 className="text-base font-semibold">Active Research</h2>
              </div>
              <Link href="/admin/mundane/research" className="text-xs text-muted-foreground hover:text-foreground">All projects →</Link>
            </div>
            {projects.length === 0 ? (
              <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No active projects.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <Link key={p.id} href={`/admin/mundane/research/${p.id}`}>
                    <Card className="hover:bg-muted/20 transition-colors cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <p className="text-sm font-medium leading-snug truncate">{p.title}</p>
                        <span className="text-xs text-muted-foreground capitalize">{p.project_type?.replace("_", " ")}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Current World Leaders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-blue-500" />
                <h2 className="text-base font-semibold">Current Leaders</h2>
              </div>
              <Link href="/admin/mundane/leaders" className="text-xs text-muted-foreground hover:text-foreground">All leaders →</Link>
            </div>
            {leaders.length === 0 ? (
              <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No leaders on record.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {leaders.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.full_name}</p>
                      {l.office_title && <p className="text-xs text-muted-foreground truncate">{l.office_title}</p>}
                    </div>
                    {l.birth_data_confidence && (
                      <Badge variant="outline" className="text-[10px] shrink-0">{l.birth_data_confidence}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Bottom: Entities + Events ---- */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Entity grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-violet-500" />
              <h2 className="text-base font-semibold">World Entities</h2>
            </div>
            <Link href="/admin/mundane/entities" className="text-xs text-muted-foreground hover:text-foreground">Manage →</Link>
          </div>
          {entities.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No entities in the registry yet.</CardContent></Card>
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
          {/* Upcoming world events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-emerald-500" />
                <h2 className="text-base font-semibold">Upcoming World Events</h2>
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
                            {ev.location && <span className="text-xs text-muted-foreground">· {ev.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
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

          {/* Recent historical events */}
          {recentEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Recent Historical Events</h2>
              </div>
              <div className="space-y-2">
                {recentEvents.map((ev) => (
                  <Card key={ev.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ev.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{formatDate(ev.event_date)}</span>
                            {ev.location && <span className="text-xs text-muted-foreground">· {ev.location}</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">{ev.event_type.replace("_", " ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {upcomingEvents.length === 0 && recentEvents.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <CalendarDays className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                No world events recorded yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
