"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Globe, CalendarDays, MapPin } from "lucide-react";
import { AstroWheel, type PlanetData, type AspectData } from "./astro-wheel";

// ─── Types ──────────────────────────────────────────────────────────────────────

type EntitySummary = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
  is_active: boolean;
  chart_count: number;
};

type ChartSummary = {
  id: string;
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string | null;
  is_primary: boolean;
};

type ChartFull = {
  id: string;
  entity_id: string;
  chart_title: string;
  chart_type: string;
  event_date: string;
  event_time: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  chart_url: string | null;
  is_primary: boolean;
};

type EntityFull = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  flag_emoji: string | null;
  natal_chart_data?: NatalChartPayload | null;
};

type NatalChartPayload = {
  planets?: Record<string, { longitude?: number; sign?: string; degree?: number }>;
  houses?: number[];
  aspects?: Array<{ planet1: string; planet2: string; type: string; orb: number }>;
  [key: string]: unknown;
};

type ChartStudioClientProps = {
  initialEntityId?: string;
  initialChartId?: string;
};

// ─── Sample chart data for UI development ───────────────────────────────────────

const SAMPLE_PLANETS: PlanetData[] = [
  { name: "Sun", longitude: 280, symbol: "\u2609" },
  { name: "Moon", longitude: 120, symbol: "\u263D" },
  { name: "Mercury", longitude: 265, symbol: "\u263F" },
  { name: "Venus", longitude: 310, symbol: "\u2640" },
  { name: "Mars", longitude: 45, symbol: "\u2642" },
  { name: "Jupiter", longitude: 185, symbol: "\u2643" },
  { name: "Saturn", longitude: 335, symbol: "\u2644" },
  { name: "Uranus", longitude: 50, symbol: "\u2645" },
  { name: "Neptune", longitude: 355, symbol: "\u2646" },
  { name: "Pluto", longitude: 298, symbol: "\u2647" },
];

const SAMPLE_HOUSES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "\u2609",
  Moon: "\u263D",
  Mercury: "\u263F",
  Venus: "\u2640",
  Mars: "\u2642",
  Jupiter: "\u2643",
  Saturn: "\u2644",
  Uranus: "\u2645",
  Neptune: "\u2646",
  Pluto: "\u2647",
  "North Node": "\u260A",
  "South Node": "\u260B",
  Chiron: "\u26B7",
};

const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// ─── Aspect detection (same logic as wheel, for table display) ──────────────────

const ASPECT_DEFS = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "sextile", angle: 60, orb: 8 },
  { name: "square", angle: 90, orb: 8 },
  { name: "trine", angle: 120, orb: 8 },
  { name: "opposition", angle: 180, orb: 8 },
];

function detectAspects(planets: PlanetData[]): AspectData[] {
  const detected: AspectData[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;
      for (const aspect of ASPECT_DEFS) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          detected.push({
            planet1: planets[i].name,
            planet2: planets[j].name,
            type: aspect.name,
            orb: Math.round(orb * 100) / 100,
          });
          break;
        }
      }
    }
  }
  return detected;
}

function longitudeToSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  const deg = Math.floor(longitude % 30);
  const min = Math.floor((longitude % 1) * 60);
  return `${deg}\u00B0${min > 0 ? min + "'" : ""} ${ZODIAC_NAMES[signIndex]}`;
}

function getHouseForLongitude(longitude: number, houses: number[]): number {
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    const start = houses[i];
    const end = houses[next];
    if (end > start) {
      if (longitude >= start && longitude < end) return i + 1;
    } else {
      // wraps around 360
      if (longitude >= start || longitude < end) return i + 1;
    }
  }
  return 1;
}

// ─── Aspect type styling ────────────────────────────────────────────────────────

function aspectBadgeColor(type: string): string {
  switch (type) {
    case "conjunction": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "trine": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "sextile": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "square": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "opposition": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ChartStudioClient({
  initialEntityId,
  initialChartId,
}: ChartStudioClientProps) {
  // Left panel state
  const [entitySearch, setEntitySearch] = useState("");
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialEntityId ?? null);
  const [entityCharts, setEntityCharts] = useState<ChartSummary[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Center + Right panel state
  const [selectedChartId, setSelectedChartId] = useState<string | null>(initialChartId ?? null);
  const [chartData, setChartData] = useState<ChartFull | null>(null);
  const [entityData, setEntityData] = useState<EntityFull | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Derived chart display data
  const [planets, setPlanets] = useState<PlanetData[]>(SAMPLE_PLANETS);
  const [houses, setHouses] = useState<number[]>(SAMPLE_HOUSES);
  const [aspects, setAspects] = useState<AspectData[]>([]);
  const [usingSample, setUsingSample] = useState(true);

  // ─── Fetch entities ─────────────────────────────────────────────────────

  const fetchEntities = useCallback(async (search: string) => {
    setEntitiesLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", "1");

      const res = await fetch(`/api/admin/mundane/entities?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch entities");
      const data = await res.json();
      setEntities(data.entities ?? []);
    } catch {
      setEntities([]);
    } finally {
      setEntitiesLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntities(entitySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [entitySearch, fetchEntities]);

  // ─── Fetch charts for selected entity ───────────────────────────────────

  useEffect(() => {
    if (!selectedEntityId) {
      setEntityCharts([]);
      return;
    }
    setChartsLoading(true);
    fetch(`/api/admin/mundane/chart-studio?entity_id=${selectedEntityId}`)
      .then((r) => r.json())
      .then((data) => setEntityCharts(data.charts ?? []))
      .catch(() => setEntityCharts([]))
      .finally(() => setChartsLoading(false));
  }, [selectedEntityId]);

  // ─── Fetch full chart data ──────────────────────────────────────────────

  useEffect(() => {
    if (!selectedChartId) return;
    setChartLoading(true);
    fetch(`/api/admin/mundane/chart-studio?chart_id=${selectedChartId}`)
      .then((r) => r.json())
      .then((data) => {
        setChartData(data.chart ?? null);
        setEntityData(data.entity ?? null);

        // Try to extract planet data from entity natal_chart_data
        const natalData = data.entity?.natal_chart_data as NatalChartPayload | null;
        if (natalData?.planets) {
          const planetList: PlanetData[] = [];
          for (const [name, info] of Object.entries(natalData.planets)) {
            if (info?.longitude != null) {
              planetList.push({
                name,
                longitude: info.longitude,
                symbol: PLANET_SYMBOLS[name] ?? "\u2B24",
              });
            }
          }
          if (planetList.length > 0) {
            setPlanets(planetList);
            setHouses(natalData.houses ?? SAMPLE_HOUSES);
            setAspects(natalData.aspects ?? detectAspects(planetList));
            setUsingSample(false);
            return;
          }
        }

        // Fallback to sample data
        setPlanets(SAMPLE_PLANETS);
        setHouses(SAMPLE_HOUSES);
        setAspects(detectAspects(SAMPLE_PLANETS));
        setUsingSample(true);
      })
      .catch(() => {
        setChartData(null);
        setEntityData(null);
      })
      .finally(() => setChartLoading(false));
  }, [selectedChartId]);

  // Initialize aspects from sample if no chart selected
  useEffect(() => {
    if (!selectedChartId && aspects.length === 0) {
      setAspects(detectAspects(SAMPLE_PLANETS));
    }
  }, [selectedChartId, aspects.length]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 h-full">
      {/* ── Left Panel: Entity & Chart Selector ────────────────────────────── */}
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Entity Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {entitiesLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 max-h-[250px] overflow-y-auto">
                {entities.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setSelectedEntityId(e.id);
                      setSelectedChartId(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedEntityId === e.id
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {e.flag_emoji && <span>{e.flag_emoji}</span>}
                      <span className="font-medium truncate">{e.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4">{e.entity_type}</Badge>
                      {e.chart_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {e.chart_count} chart{e.chart_count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {entities.length === 0 && !entitiesLoading && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No entities found
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts for selected entity */}
        {selectedEntityId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Charts</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : entityCharts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No charts for this entity
                </p>
              ) : (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {entityCharts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChartId(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedChartId === c.id
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="font-medium truncate">{c.chart_title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4">{c.chart_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{c.event_date}</span>
                        {c.is_primary && (
                          <Badge className="text-[10px] h-4 bg-amber-500/20 text-amber-500 border-amber-500/30">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Center Panel: Chart Wheel ──────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-start gap-3">
        {usingSample && !chartLoading && (
          <div className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1.5 text-center">
            Showing sample chart data. Select an entity with calculated natal data for a real chart.
          </div>
        )}

        {chartLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="size-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <AstroWheel planets={planets} houses={houses} aspects={aspects} />
        )}

        {chartData && (
          <div className="text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{chartData.chart_title}</span>
            {" \u2014 "}
            {chartData.event_date}
            {chartData.event_time ? ` ${chartData.event_time}` : ""}
          </div>
        )}
      </div>

      {/* ── Right Panel: Info Tables ──────────────────────────────────────── */}
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
        {/* Chart metadata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Chart Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {entityData ? (
              <>
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="font-medium">
                    {entityData.flag_emoji ?? ""} {entityData.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4">{entityData.entity_type}</Badge>
                </div>
                {chartData && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4" />
                      <span>
                        {chartData.event_date}
                        {chartData.event_time ? ` ${chartData.event_time}` : ""}
                        {chartData.timezone ? ` (${chartData.timezone})` : ""}
                      </span>
                    </div>
                    {(chartData.latitude != null && chartData.longitude != null) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4" />
                        <span>{chartData.latitude?.toFixed(4)}, {chartData.longitude?.toFixed(4)}</span>
                      </div>
                    )}
                    {chartData.notes && (
                      <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        {chartData.notes}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {usingSample ? "Sample chart displayed" : "Select a chart to view details"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Planet positions table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Planet Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Planet</th>
                    <th className="text-left pb-2 font-medium">Sign</th>
                    <th className="text-right pb-2 font-medium">Deg</th>
                    {houses.length === 12 && (
                      <th className="text-right pb-2 font-medium">House</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {planets.map((p) => (
                    <tr key={p.name}>
                      <td className="py-1.5">
                        <span className="mr-1">{p.symbol}</span>
                        {p.name}
                      </td>
                      <td className="py-1.5">{longitudeToSign(p.longitude)}</td>
                      <td className="py-1.5 text-right text-muted-foreground">
                        {p.longitude.toFixed(2)}\u00B0
                      </td>
                      {houses.length === 12 && (
                        <td className="py-1.5 text-right text-muted-foreground">
                          {getHouseForLongitude(p.longitude, houses)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Aspects table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Aspects ({aspects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aspects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No aspects detected</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-2 font-medium">Aspect</th>
                      <th className="text-left pb-2 font-medium">Planets</th>
                      <th className="text-right pb-2 font-medium">Orb</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {aspects.map((a, i) => (
                      <tr key={`${a.planet1}-${a.planet2}-${i}`}>
                        <td className="py-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${aspectBadgeColor(a.type)}`}>
                            {a.type}
                          </span>
                        </td>
                        <td className="py-1.5">
                          {a.planet1} - {a.planet2}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground">
                          {a.orb}\u00B0
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View in entity detail */}
        {selectedEntityId && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(`/admin/mundane/entities/${selectedEntityId}`, "_blank")}
          >
            View Entity Detail
          </Button>
        )}
      </div>
    </div>
  );
}
