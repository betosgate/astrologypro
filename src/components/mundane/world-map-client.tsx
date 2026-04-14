"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Activity, Zap, MapPin } from "lucide-react";
import { WorldMapSignalOverlay, type SignalPoint } from "./world-map-signal-overlay";
import type { MapEntity, MapEvent, MapForecast } from "./leaflet-map";

// ─── Dynamic import — Leaflet cannot run during SSR ────────────────────────────

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-zinc-900 rounded-lg">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <span className="ml-3 text-sm text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
);

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_ENTITY_TYPES = ["country", "city", "leader", "institution", "market", "commodity", "organization", "other"] as const;
const ALL_SEVERITIES = ["high", "medium", "low"] as const;

const ENTITY_TYPE_COLORS: Record<string, string> = {
  country: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  city: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  leader: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  institution: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  market: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  commodity: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  organization: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const SEVERITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface WorldMapClientProps {
  entities: MapEntity[];
  events: MapEvent[];
  forecasts: MapForecast[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorldMapClient({ entities, events, forecasts }: WorldMapClientProps) {
  // Filter state
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<string>>(
    () => new Set(ALL_ENTITY_TYPES)
  );
  const [showEvents, setShowEvents] = useState(true);
  const [showForecasts, setShowForecasts] = useState(true);
  const [selectedSeverities, setSelectedSeverities] = useState<Set<string>>(
    () => new Set(ALL_SEVERITIES)
  );

  // Signal overlay state
  const [signalPoints, setSignalPoints] = useState<SignalPoint[] | null>(null);

  // Derived counts
  const visibleEntityCount = useMemo(
    () => entities.filter((e) => selectedEntityTypes.has(e.entity_type)).length,
    [entities, selectedEntityTypes]
  );

  const activeForecastCount = forecasts.length;
  const recentEventCount = events.length;

  // Toggle helpers
  function toggleEntityType(type: string) {
    setSelectedEntityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function toggleSeverity(sev: string) {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ─── Signal Overlay Controls ─────────────────────────────────────────── */}
      <WorldMapSignalOverlay onSignalsChange={setSignalPoints} />

      {/* ─── Filter Bar ──────────────────────────────────────────────────────── */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Entity type filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Entities:
              </span>
              {ALL_ENTITY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleEntityType(type)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-opacity ${
                    ENTITY_TYPE_COLORS[type] ?? ENTITY_TYPE_COLORS.other
                  } ${selectedEntityTypes.has(type) ? "opacity-100" : "opacity-30"}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-zinc-700 hidden sm:block" />

            {/* Event severity filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Events:
              </span>
              <button
                onClick={() => setShowEvents((v) => !v)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity border-zinc-600 text-zinc-300 ${
                  showEvents ? "opacity-100 bg-zinc-700/50" : "opacity-30"
                }`}
              >
                {showEvents ? "On" : "Off"}
              </button>
              {showEvents &&
                ALL_SEVERITIES.map((sev) => (
                  <button
                    key={sev}
                    onClick={() => toggleSeverity(sev)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-opacity ${
                      SEVERITY_BADGE[sev]
                    } ${selectedSeverities.has(sev) ? "opacity-100" : "opacity-30"}`}
                  >
                    {sev}
                  </button>
                ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-zinc-700 hidden sm:block" />

            {/* Forecast toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Forecasts:
              </span>
              <button
                onClick={() => setShowForecasts((v) => !v)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity border-zinc-600 text-zinc-300 ${
                  showForecasts ? "opacity-100 bg-zinc-700/50" : "opacity-30"
                }`}
              >
                {showForecasts ? "On" : "Off"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Map ─────────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-[500px] rounded-lg overflow-hidden border border-zinc-800">
        <LeafletMap
          entities={entities}
          events={events}
          forecasts={forecasts}
          filters={{
            entityTypes: selectedEntityTypes,
            showEvents,
            showForecasts,
            severities: selectedSeverities,
          }}
        />
      </div>

      {/* ─── Stats Bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="size-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{visibleEntityCount}</p>
              <p className="text-xs text-muted-foreground">Entities Shown</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Activity className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{activeForecastCount}</p>
              <p className="text-xs text-muted-foreground">Active Forecasts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
              <Zap className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{recentEventCount}</p>
              <p className="text-xs text-muted-foreground">Recent Events (90d)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
              <MapPin className="size-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{entities.length}</p>
              <p className="text-xs text-muted-foreground">Total Geo-Located</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Legend ──────────────────────────────────────────────────────────── */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Legend:</span>
            {Object.entries(ENTITY_TYPE_COLORS).map(([type, cls]) => (
              <Badge key={type} variant="outline" className={`capitalize ${cls}`}>
                {type}
              </Badge>
            ))}
            <span className="mx-1">|</span>
            <span className="font-semibold uppercase tracking-wider">Events:</span>
            {Object.entries(SEVERITY_BADGE).map(([sev, cls]) => (
              <Badge key={sev} variant="outline" className={`capitalize ${cls}`}>
                {sev}
              </Badge>
            ))}
            <span className="mx-1">|</span>
            <span className="font-semibold uppercase tracking-wider">Forecast rings:</span>
            <span className="text-red-400">High</span>
            <span className="text-amber-400">Medium</span>
            <span className="text-blue-400">Low</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
