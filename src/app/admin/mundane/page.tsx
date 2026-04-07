"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Plus, Building2, CalendarDays, ArrowRight, Loader2, UserRound, BookOpen, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
  is_active: boolean;
  natal_chart_data?: Record<string, unknown> | null;
  birth_data_confidence?: string | null;
};

type MundaneEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  is_forecast: boolean;
  forecast_confidence: string | null;
  is_public: boolean;
};

type Forecast = {
  id: string;
  title: string;
  forecast_period_start: string;
  forecast_period_end: string | null;
  outcome_status: string;
  confidence_level: string | null;
};

type Leader = {
  id: string;
  full_name: string;
  office_title: string | null;
  is_current: boolean;
  birth_data_confidence: string | null;
};

type Tab = "entities" | "events" | "leaders" | "forecasts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Gold-standard entity_type badge colors
const ENTITY_TYPE_BADGE: Record<string, string> = {
  country: "bg-blue-100 text-blue-700 border-blue-200",
  leader: "bg-purple-100 text-purple-700 border-purple-200",
  market: "bg-green-100 text-green-700 border-green-200",
  city: "bg-sky-100 text-sky-700 border-sky-200",
  institution: "bg-indigo-100 text-indigo-700 border-indigo-200",
  commodity: "bg-amber-100 text-amber-700 border-amber-200",
  organization: "bg-violet-100 text-violet-700 border-violet-200",
};

// Birth data confidence badge colors (Astrodatabank standard)
const BIRTH_CONFIDENCE_BADGE: Record<string, string> = {
  AA: "bg-green-100 text-green-700 border-green-200",
  A: "bg-teal-100 text-teal-700 border-teal-200",
  B: "bg-yellow-100 text-yellow-700 border-yellow-200",
  C: "bg-orange-100 text-orange-700 border-orange-200",
  X: "bg-red-100 text-red-700 border-red-200",
};

const OUTCOME_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  partially_confirmed: "bg-teal-100 text-teal-700 border-teal-200",
  invalidated: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-orange-100 text-orange-700 border-orange-200",
  speculative: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminMundanePage() {
  const [tab, setTab] = useState<Tab>("entities");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [events, setEvents] = useState<MundaneEvent[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [loadingForecasts, setLoadingForecasts] = useState(false);
  const [entitiesLoaded, setEntitiesLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [leadersLoaded, setLeadersLoaded] = useState(false);
  const [forecastsLoaded, setForecastsLoaded] = useState(false);

  async function loadEntities() {
    if (entitiesLoaded) return;
    setLoadingEntities(true);
    const res = await fetch("/api/admin/mundane/entities?page=1");
    if (res.ok) {
      const json = await res.json();
      setEntities(json.entities ?? []);
      setEntitiesLoaded(true);
    }
    setLoadingEntities(false);
  }

  async function loadEvents() {
    if (eventsLoaded) return;
    setLoadingEvents(true);
    const res = await fetch("/api/admin/mundane/events?page=1");
    if (res.ok) {
      const json = await res.json();
      setEvents(json.events ?? []);
      setEventsLoaded(true);
    }
    setLoadingEvents(false);
  }

  async function loadLeaders() {
    if (leadersLoaded) return;
    setLoadingLeaders(true);
    const res = await fetch("/api/admin/mundane/leaders?page=1");
    if (res.ok) {
      const json = await res.json();
      setLeaders(json.leaders ?? []);
      setLeadersLoaded(true);
    }
    setLoadingLeaders(false);
  }

  async function loadForecasts() {
    if (forecastsLoaded) return;
    setLoadingForecasts(true);
    const res = await fetch("/api/admin/mundane/forecasts?page=1");
    if (res.ok) {
      const json = await res.json();
      setForecasts(json.forecasts ?? []);
      setForecastsLoaded(true);
    }
    setLoadingForecasts(false);
  }

  useEffect(() => {
    loadEntities();
  }, []);

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "events") loadEvents();
    if (t === "leaders") loadLeaders();
    if (t === "forecasts") loadForecasts();
  }

  const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "entities", label: "Entities", icon: <Building2 className="size-3.5" /> },
    { id: "leaders", label: "Leaders", icon: <UserRound className="size-3.5" /> },
    { id: "forecasts", label: "Forecasts", icon: <BookOpen className="size-3.5" /> },
    { id: "events", label: "Events", icon: <CalendarDays className="size-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="size-6 text-violet-500" />
            Mundane Astrology
          </h1>
          <p className="text-muted-foreground">Manage entities, leaders, forecasts, and mundane research data.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane/entities/new">
              <Building2 className="mr-1.5 size-4" /> New Entity
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane/leaders/new">
              <UserRound className="mr-1.5 size-4" /> New Leader
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/mundane/forecasts/new">
              <Plus className="mr-1.5 size-4" /> New Forecast
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-2 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-blue-500" />
              <span className="font-medium text-sm">Entity Registry</span>
            </div>
            <p className="text-xs text-muted-foreground">Countries, cities, institutions, markets.</p>
            <Button size="sm" variant="outline" asChild className="mt-1">
              <Link href="/admin/mundane/entities/new"><Plus className="mr-1 size-3.5" /> Add Entity</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-2 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-purple-500" />
              <span className="font-medium text-sm">Leader Registry</span>
            </div>
            <p className="text-xs text-muted-foreground">World leaders and notable persons.</p>
            <Button size="sm" variant="outline" asChild className="mt-1">
              <Link href="/admin/mundane/leaders/new"><Plus className="mr-1 size-3.5" /> Add Leader</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-2 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-emerald-500" />
              <span className="font-medium text-sm">Forecast Journal</span>
            </div>
            <p className="text-xs text-muted-foreground">Structured predictions with outcome tracking.</p>
            <Button size="sm" asChild className="mt-1">
              <Link href="/admin/mundane/forecasts/new"><Plus className="mr-1 size-3.5" /> New Forecast</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-2 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-amber-500" />
              <span className="font-medium text-sm">Mundane Events</span>
            </div>
            <p className="text-xs text-muted-foreground">Historical events and ingresses.</p>
            <Button size="sm" asChild className="mt-1">
              <Link href="/admin/mundane/events/new"><Plus className="mr-1 size-3.5" /> Add Event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-0">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-amber-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entities tab */}
      {tab === "entities" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Entities</h2>
            <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
              <Link href="/admin/mundane/entities">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          {loadingEntities ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : entities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <Building2 className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No entities yet</p>
                <Button size="sm" asChild>
                  <Link href="/admin/mundane/entities/new"><Plus className="mr-1.5 size-4" /> Add Entity</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {entities.map((e) => (
                <Link
                  key={e.id}
                  href={`/admin/mundane/entities/${e.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/50 transition-colors"
                >
                  {e.flag_emoji && <span className="text-xl shrink-0">{e.flag_emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    {e.region && <p className="text-xs text-muted-foreground truncate">{e.region}</p>}
                  </div>
                  {/* entity_type badge with color */}
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize shrink-0 ${ENTITY_TYPE_BADGE[e.entity_type] ?? ""}`}
                  >
                    {e.entity_type}
                  </Badge>
                  {/* Natal chart indicator */}
                  {e.natal_chart_data ? (
                    <span title="Natal chart calculated" className="shrink-0">
                      <CheckCircle2 className="size-4 text-green-500" />
                    </span>
                  ) : (
                    <span title="No natal chart" className="size-4 rounded-full border-2 border-muted-foreground/30 shrink-0 inline-block" />
                  )}
                  {/* Birth data confidence */}
                  {e.birth_data_confidence && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${BIRTH_CONFIDENCE_BADGE[e.birth_data_confidence] ?? ""}`}
                    >
                      {e.birth_data_confidence}
                    </Badge>
                  )}
                  {!e.is_active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">Inactive</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaders tab */}
      {tab === "leaders" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Leaders</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
                <Link href="/admin/mundane/leaders">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/admin/mundane/leaders/new"><Plus className="mr-1.5 size-4" /> New Leader</Link>
              </Button>
            </div>
          </div>
          {loadingLeaders ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : leaders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <UserRound className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No leaders yet</p>
                <Button size="sm" asChild>
                  <Link href="/admin/mundane/leaders/new"><Plus className="mr-1.5 size-4" /> Add Leader</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
                >
                  <UserRound className="size-4 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{leader.full_name}</p>
                    {leader.office_title && (
                      <p className="text-xs text-muted-foreground truncate">{leader.office_title}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${leader.is_current ? "text-green-700 border-green-200 bg-green-50" : "text-muted-foreground"}`}
                  >
                    {leader.is_current ? "Current" : "Former"}
                  </Badge>
                  {leader.birth_data_confidence && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${BIRTH_CONFIDENCE_BADGE[leader.birth_data_confidence] ?? ""}`}
                    >
                      {leader.birth_data_confidence}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Forecasts tab */}
      {tab === "forecasts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Forecasts</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
                <Link href="/admin/mundane/forecasts">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/admin/mundane/forecasts/new"><Plus className="mr-1.5 size-4" /> New Forecast</Link>
              </Button>
            </div>
          </div>
          {loadingForecasts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : forecasts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <BookOpen className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No forecasts yet</p>
                <Button size="sm" asChild>
                  <Link href="/admin/mundane/forecasts/new"><Plus className="mr-1.5 size-4" /> New Forecast</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {forecasts.map((forecast) => (
                <div
                  key={forecast.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{forecast.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(forecast.forecast_period_start)}
                        {forecast.forecast_period_end && ` – ${formatDate(forecast.forecast_period_end)}`}
                      </span>
                      {forecast.confidence_level && (
                        <Badge variant="outline" className={`text-xs capitalize ${CONFIDENCE_BADGE[forecast.confidence_level] ?? ""}`}>
                          {forecast.confidence_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize shrink-0 ${OUTCOME_BADGE[forecast.outcome_status] ?? ""}`}
                  >
                    {forecast.outcome_status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events tab */}
      {tab === "events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Mundane Events</h2>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/events/new"><Plus className="mr-1.5 size-4" /> Add Event</Link>
            </Button>
          </div>
          {loadingEvents ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <CalendarDays className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No events yet</p>
                <Button size="sm" asChild>
                  <Link href="/admin/mundane/events/new"><Plus className="mr-1.5 size-4" /> Add Event</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ev.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{ev.event_type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(ev.event_date)}</span>
                      {ev.is_forecast && (
                        <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50">Forecast</Badge>
                      )}
                      {!ev.is_public && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Private</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
