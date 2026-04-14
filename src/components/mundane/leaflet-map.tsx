"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MapEntity = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  flag_emoji: string | null;
  latitude: number;
  longitude: number;
  forecast_count: number;
};

export type MapEvent = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
  severity: string;
  category: string;
  latitude: number;
  longitude: number;
};

export type MapForecast = {
  id: string;
  title: string;
  entity_id: string;
  confidence_level: string;
  outcome_status: string;
};

export type SignalOverlayPoint = {
  entity_id: string;
  name: string;
  flag_emoji: string | null;
  lat: number;
  lng: number;
  score: number;
  score_date: string;
};

export type LeafletMapProps = {
  entities: MapEntity[];
  events: MapEvent[];
  forecasts: MapForecast[];
  filters: {
    entityTypes: Set<string>;
    showEvents: boolean;
    showForecasts: boolean;
    severities: Set<string>;
  };
  signalPoints?: SignalOverlayPoint[];
};

// ─── Color helpers ─────────────────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  country: "#3b82f6",     // blue
  city: "#22d3ee",        // cyan
  leader: "#f59e0b",      // amber
  institution: "#a855f7", // purple
  market: "#10b981",      // emerald
  commodity: "#ec4899",   // pink
  organization: "#6366f1",// indigo
  other: "#6b7280",       // gray
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",   // red
  medium: "#f97316", // orange
  low: "#eab308",    // yellow
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
  speculative: "#6b7280",
};

function entityColor(type: string): string {
  return ENTITY_COLORS[type] ?? ENTITY_COLORS.other;
}

function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.low;
}

function confidenceColor(level: string): string {
  return CONFIDENCE_COLORS[level] ?? CONFIDENCE_COLORS.low;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<string, string> = {
  low: "#22c55e",    // green
  medium: "#f59e0b", // amber
  high: "#ef4444",   // red
};

function signalColor(score: number): string {
  if (score <= 3) return SIGNAL_COLORS.low;
  if (score <= 6) return SIGNAL_COLORS.medium;
  return SIGNAL_COLORS.high;
}

function signalLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}

export function LeafletMap({ entities, events, forecasts, filters, signalPoints }: LeafletMapProps) {
  // Build forecast lookup by entity_id
  const forecastsByEntity = useMemo(() => {
    const map: Record<string, MapForecast[]> = {};
    for (const f of forecasts) {
      if (f.entity_id) {
        if (!map[f.entity_id]) map[f.entity_id] = [];
        map[f.entity_id].push(f);
      }
    }
    return map;
  }, [forecasts]);

  // Filtered entities
  const visibleEntities = useMemo(
    () => entities.filter((e) => filters.entityTypes.has(e.entity_type)),
    [entities, filters.entityTypes]
  );

  // Filtered events
  const visibleEvents = useMemo(
    () =>
      filters.showEvents
        ? events.filter((ev) => filters.severities.has(ev.severity))
        : [],
    [events, filters.showEvents, filters.severities]
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
      style={{ background: "#1a1a2e" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Forecast rings (pulsing effect via CSS) */}
      {filters.showForecasts &&
        visibleEntities.map((entity) => {
          const entityForecasts = forecastsByEntity[entity.id];
          if (!entityForecasts?.length) return null;
          // Use the highest confidence level for color
          const best = entityForecasts.reduce((a, b) => {
            const order = ["high", "medium", "low", "speculative"];
            return order.indexOf(a.confidence_level) <= order.indexOf(b.confidence_level) ? a : b;
          });
          return (
            <CircleMarker
              key={`forecast-ring-${entity.id}`}
              center={[entity.latitude, entity.longitude]}
              radius={18 + entityForecasts.length * 3}
              pathOptions={{
                color: confidenceColor(best.confidence_level),
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.08,
                dashArray: "6 4",
              }}
            >
              <Popup>
                <div className="min-w-[180px] text-xs">
                  <p className="font-bold text-sm mb-1">
                    {entity.flag_emoji ?? ""} {entity.name} — Forecasts
                  </p>
                  <ul className="space-y-1">
                    {entityForecasts.map((f) => (
                      <li key={f.id}>
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: confidenceColor(f.confidence_level) }}
                        />
                        {f.title} ({f.confidence_level})
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {/* Entity markers */}
      {visibleEntities.map((entity) => {
        const baseRadius = 6;
        const forecastBonus = Math.min(entity.forecast_count * 2, 8);
        return (
          <CircleMarker
            key={`entity-${entity.id}`}
            center={[entity.latitude, entity.longitude]}
            radius={baseRadius + forecastBonus}
            pathOptions={{
              color: entityColor(entity.entity_type),
              weight: 2,
              fillColor: entityColor(entity.entity_type),
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="min-w-[160px] text-xs">
                <p className="font-bold text-sm">
                  {entity.flag_emoji ?? ""} {entity.name}
                </p>
                <p className="text-muted-foreground capitalize">
                  {entity.entity_type}
                  {entity.region ? ` — ${entity.region}` : ""}
                </p>
                <p className="mt-1">
                  Active forecasts: <strong>{entity.forecast_count}</strong>
                </p>
                <Link
                  href={`/admin/mundane/entities/${entity.id}`}
                  className="mt-1 inline-block text-blue-500 hover:underline"
                >
                  View entity details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Signal overlay dots */}
      {signalPoints && signalPoints.map((sp) => (
        <CircleMarker
          key={`signal-${sp.entity_id}`}
          center={[sp.lat, sp.lng]}
          radius={9}
          pathOptions={{
            color: signalColor(sp.score),
            weight: 2,
            fillColor: signalColor(sp.score),
            fillOpacity: 0.55,
          }}
        >
          <Popup>
            <div className="min-w-[160px] text-xs">
              <p className="font-bold text-sm">
                {sp.flag_emoji ?? ""} {sp.name}
              </p>
              <p className="text-muted-foreground">Signal Overlay</p>
              <p className="mt-1">
                Stress score: <strong>{sp.score.toFixed(1)}</strong>{" "}
                <span style={{ color: signalColor(sp.score) }}>
                  ({signalLabel(sp.score)})
                </span>
              </p>
              <p className="text-muted-foreground text-[10px] mt-0.5">As of {sp.score_date}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Event markers */}
      {visibleEvents.map((ev) => (
        <CircleMarker
          key={`event-${ev.id}`}
          center={[ev.latitude, ev.longitude]}
          radius={4}
          pathOptions={{
            color: severityColor(ev.severity),
            weight: 1.5,
            fillColor: severityColor(ev.severity),
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div className="min-w-[160px] text-xs">
              <p className="font-bold text-sm">{ev.title}</p>
              <p className="text-muted-foreground">
                {ev.event_date} — {ev.category}
              </p>
              {ev.location && <p>{ev.location}</p>}
              <p className="mt-1 capitalize">Severity: {ev.severity}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
