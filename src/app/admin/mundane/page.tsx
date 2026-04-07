"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Plus, Building2, CalendarDays, ArrowRight, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
  is_active: boolean;
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

type Tab = "entities" | "events";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

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
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [entitiesLoaded, setEntitiesLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);

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

  useEffect(() => {
    loadEntities();
  }, []);

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "events") loadEvents();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="size-6 text-violet-500" />
            Mundane Astrology
          </h1>
          <p className="text-muted-foreground">Manage entities, events, and mundane research data.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane/entities/new">
              <Building2 className="mr-1.5 size-4" /> New Entity
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/mundane/events/new">
              <Plus className="mr-1.5 size-4" /> New Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-blue-500" />
              <span className="font-medium text-sm">Entity Registry</span>
            </div>
            <p className="text-xs text-muted-foreground">Countries, cities, institutions, markets, and leaders under mundane watch.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/mundane/entities/new"><Plus className="mr-1 size-3.5" /> Add Entity</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-emerald-500" />
              <span className="font-medium text-sm">Mundane Events</span>
            </div>
            <p className="text-xs text-muted-foreground">Historical events, forecasts, ingresses, eclipses, and transit hits.</p>
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link href="/admin/mundane/events/new"><Plus className="mr-1 size-3.5" /> Add Event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-0">
          {(["entities", "events"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-amber-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
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
              <Link href="/admin/mundane-entities">
                View all in registry <ArrowRight className="size-3" />
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
                  href={`/admin/mundane-entities/${e.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/50 transition-colors"
                >
                  {e.flag_emoji && <span className="text-xl shrink-0">{e.flag_emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    {e.region && <p className="text-xs text-muted-foreground truncate">{e.region}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">{e.entity_type}</Badge>
                  {!e.is_active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">Inactive</Badge>
                  )}
                </Link>
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
                      {ev.forecast_confidence && (
                        <Badge variant="outline" className={`text-xs capitalize ${CONFIDENCE_BADGE[ev.forecast_confidence] ?? ""}`}>
                          {ev.forecast_confidence}
                        </Badge>
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
