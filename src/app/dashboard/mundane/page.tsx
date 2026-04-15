import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  Bell,
  BookOpen,
  Users,
  Calendar,
  Sparkles,
  Star,
  Eye,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  Info,
  Telescope,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mundane Astrology — My Dashboard" };

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

// ─── Badge colour maps ───────────────────────────────────────────────────────

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

const ASTRO_TYPE_BADGE: Record<string, string> = {
  eclipse: "bg-purple-100 text-purple-700 border-purple-200",
  ingress: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-indigo-100 text-indigo-700 border-indigo-200",
  conjunction: "bg-amber-100 text-amber-700 border-amber-200",
  station: "bg-pink-100 text-pink-700 border-pink-200",
  retrograde: "bg-rose-100 text-rose-700 border-rose-200",
  direct: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="size-3.5 text-red-500 shrink-0" />,
  high: <AlertTriangle className="size-3.5 text-orange-500 shrink-0" />,
  medium: <Info className="size-3.5 text-yellow-500 shrink-0" />,
  low: <Info className="size-3.5 text-blue-400 shrink-0" />,
};

const TRADITION_BADGE: Record<string, string> = {
  western: "bg-violet-100 text-violet-700 border-violet-200",
  vedic: "bg-amber-100 text-amber-700 border-amber-200",
  hybrid: "bg-teal-100 text-teal-700 border-teal-200",
};

// ─── Types ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

type WatchlistRow = {
  id: string;
  entity_ids: string[] | null;
};

type EntityRow = {
  id: string;
  name: string;
  flag_emoji: string | null;
  entity_type: string;
};

// ─── Page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ tradition?: string }>;
}

export default async function DashboardMundanePage({ searchParams }: PageProps) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Tradition toggle (URL param, UI only — calculation integration is Phase 2)
  const params = await searchParams;
  const tradition = (params.tradition ?? "western") as "western" | "vedic" | "hybrid";

  // Date helpers
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const in7Str = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  // ── Parallel fetches ──────────────────────────────────────────────────────
  const [
    todayAstroRes,
    alertsUnreadRes,
    watchlistRes,
    openProjectsRes,
    upcomingForecastsRes,
    next7AstroRes,
  ] = await Promise.all([
    // 1. Today's astronomical events
    admin
      .from("mundane_astro_events")
      .select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc")
      .gte("event_datetime_utc", `${todayStr}T00:00:00Z`)
      .lt("event_datetime_utc", `${tomorrowStr}T00:00:00Z`)
      .order("event_datetime_utc"),

    // 2. Active (unread) alerts — count + top 3
    admin
      .from("mundane_alert_notifications")
      .select("id, title, message, priority, triggered_at")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("triggered_at", { ascending: false })
      .limit(3),

    // 3. Watchlist(s) — grab all for this user
    admin
      .from("mundane_watchlists")
      .select("id, entity_ids")
      .eq("user_id", user.id),

    // 4. Open research projects (not completed), limit 5
    admin
      .from("mundane_research_projects")
      .select("id, title, project_type, status, created_at")
      .neq("status", "completed")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5),

    // 5+6. Upcoming forecast windows (7 days)
    admin
      .from("mundane_forecasts")
      .select("id, title, entity_id, forecast_period_start, forecast_period_end, confidence_level, outcome_status")
      .eq("outcome_status", "open")
      .gte("forecast_period_start", todayStr)
      .lte("forecast_period_start", in7Str)
      .order("forecast_period_start")
      .limit(10),

    // 7. Next-7-day astro events — count
    admin
      .from("mundane_astro_events")
      .select("id", { count: "exact", head: true })
      .gte("event_datetime_utc", now.toISOString())
      .lte("event_datetime_utc", `${in7Str}T23:59:59Z`),
  ]);

  const todayAstroEvents = (todayAstroRes.data ?? []) as AnyRow[];
  const unreadAlerts = (alertsUnreadRes.data ?? []) as AnyRow[];
  const unreadCount = unreadAlerts.length; // top-3 displayed; badge from count

  // Watchlist — collect unique entity IDs across all watchlists
  const watchlistRows = (watchlistRes.data ?? []) as WatchlistRow[];
  const watchedEntityIds = Array.from(
    new Set(watchlistRows.flatMap((w) => w.entity_ids ?? []))
  );

  // Fetch entity details for watched IDs (max first 12 for display)
  let watchedEntities: EntityRow[] = [];
  if (watchedEntityIds.length > 0) {
    const entRes = await admin
      .from("mundane_entities")
      .select("id, name, flag_emoji, entity_type")
      .in("id", watchedEntityIds.slice(0, 12))
      .order("name");
    watchedEntities = (entRes.data ?? []) as EntityRow[];
  }

  const openProjects = (openProjectsRes.data ?? []) as AnyRow[];

  // Recent notes — fetch last 5 from user's projects
  let recentNotes: AnyRow[] = [];
  if (openProjects.length > 0) {
    const projectIds = openProjects.map((p: AnyRow) => p.id);
    const notesRes = await admin
      .from("mundane_project_notes")
      .select("id, project_id, title, body, created_at")
      .in("project_id", projectIds)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentNotes = (notesRes.data ?? []) as AnyRow[];
  }

  const upcomingForecasts = (upcomingForecastsRes.data ?? []) as AnyRow[];

  // Fetch entity names for forecasts that have entity_id
  const forecastEntityIds = Array.from(
    new Set(upcomingForecasts.map((f: AnyRow) => f.entity_id).filter(Boolean))
  );
  const forecastEntityMap: Record<string, string> = {};
  if (forecastEntityIds.length > 0) {
    const fentRes = await admin
      .from("mundane_entities")
      .select("id, name")
      .in("id", forecastEntityIds);
    for (const row of fentRes.data ?? []) {
      forecastEntityMap[row.id] = row.name;
    }
  }

  const next7AstroCount = next7AstroRes.count ?? 0;

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpis = {
    watchedEntities: watchedEntityIds.length,
    unreadAlerts: unreadCount,
    todayAstro: todayAstroEvents.length,
    openForecasts: upcomingForecasts.length,
    activeProjects: openProjects.length,
    next7Days: next7AstroCount,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="size-6 text-violet-500" />
            <h1 className="text-2xl font-bold tracking-tight">Mundane Astrology</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            World events, astronomical sky, watchlist, and research.
          </p>
        </div>

        {/* Tradition toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Tradition:</span>
          <div className="flex rounded-md border overflow-hidden text-xs font-medium">
            {(["western", "vedic", "hybrid"] as const).map((t) => (
              <Link
                key={t}
                href={`?tradition=${t}`}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  tradition === t
                    ? "bg-violet-600 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
          <Badge
            variant="outline"
            className={`text-[11px] capitalize ${TRADITION_BADGE[tradition] ?? ""}`}
          >
            {tradition}
          </Badge>
        </div>
      </div>

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Watched Entities",
            value: kpis.watchedEntities,
            icon: <Eye className="size-4 text-violet-500" />,
            href: "/dashboard/mundane/entities",
          },
          {
            label: "Unread Alerts",
            value: kpis.unreadAlerts,
            icon: <Bell className="size-4 text-amber-500" />,
            href: "/dashboard/mundane/alerts",
            amber: kpis.unreadAlerts > 0,
          },
          {
            label: "Today's Events",
            value: kpis.todayAstro,
            icon: <Sparkles className="size-4 text-purple-500" />,
            href: "/dashboard/mundane/event-calendar",
          },
          {
            label: "Open Forecasts",
            value: kpis.openForecasts,
            icon: <TrendingUp className="size-4 text-blue-500" />,
            href: "/dashboard/mundane/forecasts",
          },
          {
            label: "Active Projects",
            value: kpis.activeProjects,
            icon: <BookOpen className="size-4 text-rose-500" />,
            href: "/dashboard/mundane/research",
          },
          {
            label: "Sky: Next 7 Days",
            value: kpis.next7Days,
            icon: <Telescope className="size-4 text-emerald-500" />,
            href: "/dashboard/mundane/event-calendar",
          },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card
              className={`hover:bg-muted/30 transition-colors cursor-pointer h-full ${
                kpi.amber ? "border-amber-300 bg-amber-50/60" : ""
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  {kpi.icon}
                </div>
                <p
                  className={`text-2xl font-bold ${
                    kpi.amber ? "text-amber-600" : ""
                  }`}
                >
                  {kpi.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Main 3-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Column 1: Today's Sky ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-purple-500" />
                  Today&apos;s Sky
                </CardTitle>
                <Link
                  href="/dashboard/mundane/event-calendar"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Calendar →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {todayAstroEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Clear sky today — no major events.
                </p>
              ) : (
                <div className="space-y-2">
                  {todayAstroEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/dashboard/mundane/event-calendar/${ev.id}`}
                      className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded-sm px-1 -mx-1 transition-colors"
                    >
                      <Star className="size-3.5 text-violet-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(ev.event_datetime_utc)}
                          </span>
                          {ev.sign && (
                            <span className="text-xs text-muted-foreground">
                              · {ev.sign}
                            </span>
                          )}
                        </div>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Column 2: Watchlist + Active Alerts ── */}
        <div className="space-y-4">

          {/* Watchlist */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-violet-500" />
                  Watchlist
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                  <Link href="/dashboard/mundane/entities">Manage</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {watchedEntities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No entities on your watchlist yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {watchedEntities.map((e) => (
                    <Link
                      key={e.id}
                      href={`/dashboard/mundane/entities/${e.id}`}
                      className="flex items-center gap-2 py-1.5 rounded-md px-1 hover:bg-muted/50 transition-colors"
                    >
                      {e.flag_emoji ? (
                        <span className="text-xl shrink-0">{e.flag_emoji}</span>
                      ) : (
                        <Users className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {e.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize shrink-0"
                      >
                        {e.entity_type}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className={unreadCount > 0 ? "border-amber-200" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className={`size-4 ${unreadCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                  Active Alerts
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold w-4 h-4">
                      {unreadCount}
                    </span>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                  <Link href="/dashboard/mundane/alerts">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {unreadAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No unread alerts. All clear.
                </p>
              ) : (
                <div className="space-y-2">
                  {unreadAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={`/dashboard/mundane/alerts/${alert.id}`}
                      className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded-sm px-1 -mx-1 transition-colors"
                    >
                      {PRIORITY_ICON[alert.priority] ?? (
                        <Info className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Clock className="size-3 inline mr-0.5" />
                          {formatDate(alert.triggered_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize shrink-0"
                      >
                        {alert.priority}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Column 3: Research + Notes ── */}
        <div className="space-y-4">

          {/* Open Projects */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-rose-500" />
                  Open Projects
                </CardTitle>
                <Link
                  href="/dashboard/mundane/research"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  All projects →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {openProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No open research projects.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {openProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/mundane/research/${p.id}`}
                      className="flex items-center gap-2 py-1.5 rounded-md px-1 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">
                          {p.title}
                        </p>
                        <span className="text-xs text-muted-foreground capitalize">
                          {p.project_type?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize shrink-0 ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-sky-500" />
                Recent Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent notes. Open a project to add notes.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentNotes.map((note) => {
                    const project = openProjects.find(
                      (p: AnyRow) => p.id === note.project_id
                    );
                    return (
                      <Link
                        key={note.id}
                        href={`/dashboard/mundane/research/${note.project_id}`}
                        className="block py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded-sm px-1 transition-colors"
                      >
                        {note.title && (
                          <p className="text-sm font-medium truncate">{note.title}</p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {note.body.slice(0, 100)}
                          {note.body.length > 100 ? "…" : ""}
                        </p>
                        {project && (
                          <p className="text-[10px] text-violet-600 mt-0.5 truncate">
                            {project.title}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom: Upcoming Forecast Windows ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-blue-500" />
              Upcoming Forecast Windows
              <span className="text-xs text-muted-foreground font-normal">
                (next 7 days)
              </span>
            </CardTitle>
            <Link
              href="/dashboard/mundane/forecasts"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All forecasts →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {upcomingForecasts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No forecast windows opening in the next 7 days.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Title
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                      Period Start
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Confidence
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Entity
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingForecasts.map((fc) => (
                    <tr
                      key={fc.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={undefined}
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/dashboard/mundane/forecasts/${fc.id}`}
                          className="font-medium hover:text-violet-600 transition-colors line-clamp-1 after:absolute after:inset-0"
                        >
                          {fc.title}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground text-xs">
                        <Link href={`/dashboard/mundane/forecasts/${fc.id}`} className="block">
                          {formatDate(fc.forecast_period_start)}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/dashboard/mundane/forecasts/${fc.id}`} className="block">
                          {fc.confidence_level ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                CONFIDENCE_BADGE[fc.confidence_level] ?? ""
                              }`}
                            >
                              {fc.confidence_level}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground truncate max-w-[120px]">
                        <Link href={`/dashboard/mundane/forecasts/${fc.id}`} className="block">
                          {fc.entity_id ? forecastEntityMap[fc.entity_id] ?? "—" : "—"}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <Link href={`/dashboard/mundane/forecasts/${fc.id}`} className="block">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              OUTCOME_BADGE[fc.outcome_status] ?? ""
                            }`}
                          >
                            {fc.outcome_status?.replace(/_/g, " ")}
                          </Badge>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
