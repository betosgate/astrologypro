/**
 * @deprecated Legacy temporary community natal renderer.
 *
 * Preserved per tasks/22.04.2026/community-natal-toolkit-rendering master
 * task: "Do not delete the existing temporary community natal/family chart
 * UI during this work. If a page is replaced with the shared toolkit
 * renderer, comment out the old JSX/code block with a clear legacy note
 * so it can be reviewed or restored if needed."
 *
 * Replaced by the shared HoroscopeToolkitPage in sibling `page.tsx`
 * (Task 02 - "Render Self Natal Chart With Shared Horoscope Toolkit").
 *
 * This file intentionally keeps the `"use client"` directive and default
 * export so the original implementation remains inspectable and
 * compilable, but it is NOT routed: Next.js only routes the reserved
 * filename `page.tsx` in this folder. This module is dead code at
 * runtime. Do not import from it.
 */
/* eslint-disable */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Telescope,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityOption {
  label: string;
  lat: number;
  lng: number;
  tzone: string;
}

interface BirthInput {
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  cityQuery: string;
  cityLabel: string;
  lat: string;
  lng: string;
  tzone: string;
}

interface Planet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  isRetro?: boolean | string;
  retro?: boolean | string;
  normDegree?: number;
  [key: string]: unknown;
}

interface House {
  house: number;
  sign: string;
  degree: number;
  normDegree?: number;
  [key: string]: unknown;
}

interface Aspect {
  aspecting_planet: string;
  aspected_planet: string;
  type: string;
  orb: number;
  diff?: number;
  [key: string]: unknown;
}

interface SpecialPoint {
  sign: string;
  degree: number;
  house?: number;
  normDegree?: number;
  [key: string]: unknown;
}

interface AstroData {
  planets: Planet[];
  houses: House[];
  aspects: Aspect[];
  ascendant: SpecialPoint;
  midheaven: SpecialPoint;
  vertex: SpecialPoint;
  lilith?: SpecialPoint;
  [key: string]: unknown;
}

interface BirthRecord {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: string;
  cityLabel: string;
}

interface ChartResult {
  astroData: AstroData;
  chartUrl: string | null;
  birth: BirthRecord;
}

interface SavedChart {
  id: string;
  city_label: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  birth_hour: number;
  birth_min: number;
  lat: number;
  lon: number;
  tzone: string;
  chart_url: string | null;
  astro_data: AstroData | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDegree(deg: number): string {
  return `${deg.toFixed(2)}°`;
}

function aspectColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("trine") || t.includes("sextile")) return "text-green-600 dark:text-green-400";
  if (t.includes("square") || t.includes("opposition")) return "text-red-500 dark:text-red-400";
  if (t.includes("conjunction")) return "text-blue-500 dark:text-blue-400";
  return "text-muted-foreground";
}

function aspectBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  const t = type.toLowerCase();
  if (t.includes("trine") || t.includes("sextile")) return "default";
  if (t.includes("square") || t.includes("opposition")) return "destructive";
  return "secondary";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AiButtonProps {
  label: string;
  section: string;
  astroData: AstroData;
  focusItem?: string;
}

function AiInterpretationButton({ label, section, astroData, focusItem }: AiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (result) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/nativity-chart/ai-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, astroData, focusItem }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed");
      const interp = json.interpretation;
      setResult(
        typeof interp === "string" ? interp : JSON.stringify(interp, null, 2)
      );
      setOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleFetch}
        disabled={loading}
        className="h-7 gap-1 text-xs"
        aria-label={`Get AI interpretation for ${label}`}
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Sparkles className="size-3" />
        )}
        {result ? (open ? "Hide" : "Show") : "AI Interpretation"}
        {result && !loading && (open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
      {open && result && (
        <div className="mt-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
          {result}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NativityChartPage() {
  const [form, setForm] = useState<BirthInput>({
    day: "", month: "", year: "", hour: "", min: "",
    cityQuery: "", cityLabel: "", lat: "", lng: "", tzone: "",
  });
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);
  const [chartResult, setChartResult] = useState<ChartResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Fetch chart history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/community/nativity-chart/history");
      if (res.ok) {
        const json = await res.json();
        setSavedCharts(json.charts ?? []);
      }
    } catch {
      // non-fatal
    } finally {
      setHistoryLoaded(true);
    }
  }

  // City autocomplete
  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCitySuggestions([]);
      return;
    }
    setCityLoading(true);
    try {
      const res = await fetch(`/api/community/nativity-chart/city-search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setCitySuggestions(json.results ?? []);
      setShowSuggestions(true);
    } catch {
      setCitySuggestions([]);
    } finally {
      setCityLoading(false);
    }
  }, []);

  function handleCityInput(val: string) {
    setForm((prev) => ({ ...prev, cityQuery: val, cityLabel: "", lat: "", lng: "", tzone: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCities(val), 300);
  }

  function selectCity(city: CityOption) {
    setForm((prev) => ({
      ...prev,
      cityQuery: city.label,
      cityLabel: city.label,
      lat: String(city.lat),
      lng: String(city.lng),
      tzone: city.tzone,
    }));
    setCitySuggestions([]);
    setShowSuggestions(false);
  }

  function setField(field: keyof BirthInput, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cityLabel || !form.lat || !form.lng || !form.tzone) {
      setError("Please select a city from the suggestions.");
      return;
    }
    setLoading(true);
    setError(null);
    setChartResult(null);

    try {
      const res = await fetch("/api/community/nativity-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: parseInt(form.day, 10),
          month: parseInt(form.month, 10),
          year: parseInt(form.year, 10),
          hour: parseInt(form.hour, 10),
          min: parseInt(form.min, 10),
          lat: parseFloat(form.lat),
          lon: parseFloat(form.lng),
          tzone: form.tzone,
          cityLabel: form.cityLabel,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chart generation failed");
      setChartResult(json as ChartResult);
      // Refresh history
      fetchHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function loadSavedChart(saved: SavedChart) {
    if (!saved.astro_data) return;
    setChartResult({
      astroData: saved.astro_data,
      chartUrl: saved.chart_url,
      birth: {
        day: saved.birth_day,
        month: saved.birth_month,
        year: saved.birth_year,
        hour: saved.birth_hour,
        min: saved.birth_min,
        lat: saved.lat,
        lon: saved.lon,
        tzone: saved.tzone,
        cityLabel: saved.city_label,
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { astroData, chartUrl, birth } = chartResult ?? {};

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <Telescope className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Nativity Birth Chart</h1>
        </div>
        <p className="text-muted-foreground">
          Generate your Western natal chart with planetary placements, house cusps, and AI interpretations.
        </p>
      </div>

      {/* Birth details form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Birth Details</CardTitle>
          <CardDescription>Enter birth date, time, and place to generate the natal chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Date row */}
            <div className="space-y-1.5">
              <Label>Birth Date</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="sr-only" htmlFor="birth-day">Day</Label>
                  <Input
                    id="birth-day"
                    placeholder="Day"
                    type="number"
                    min={1}
                    max={31}
                    value={form.day}
                    onChange={(e) => setField("day", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="sr-only" htmlFor="birth-month">Month</Label>
                  <Input
                    id="birth-month"
                    placeholder="Month"
                    type="number"
                    min={1}
                    max={12}
                    value={form.month}
                    onChange={(e) => setField("month", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="sr-only" htmlFor="birth-year">Year</Label>
                  <Input
                    id="birth-year"
                    placeholder="Year"
                    type="number"
                    min={1900}
                    max={2099}
                    value={form.year}
                    onChange={(e) => setField("year", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Time row */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> Birth Time
              </Label>
              <div className="grid grid-cols-2 gap-3 max-w-[200px]">
                <div>
                  <Label className="sr-only" htmlFor="birth-hour">Hour</Label>
                  <Input
                    id="birth-hour"
                    placeholder="Hour (0-23)"
                    type="number"
                    min={0}
                    max={23}
                    value={form.hour}
                    onChange={(e) => setField("hour", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="sr-only" htmlFor="birth-min">Minute</Label>
                  <Input
                    id="birth-min"
                    placeholder="Min (0-59)"
                    type="number"
                    min={0}
                    max={59}
                    value={form.min}
                    onChange={(e) => setField("min", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* City autocomplete */}
            <div className="space-y-1.5 relative">
              <Label htmlFor="city-input" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Birth City
              </Label>
              <div className="relative">
                <Input
                  id="city-input"
                  placeholder="Type city name..."
                  autoComplete="off"
                  value={form.cityQuery}
                  onChange={(e) => handleCityInput(e.target.value)}
                  onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                />
                {cityLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {showSuggestions && citySuggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto"
                >
                  {citySuggestions.map((city, i) => (
                    <li
                      key={i}
                      role="option"
                      aria-selected={form.cityLabel === city.label}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={() => selectCity(city)}
                    >
                      {city.label}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {city.tzone}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {form.cityLabel && (
                <p className="text-xs text-muted-foreground">
                  Selected: {form.cityLabel} — lat {parseFloat(form.lat).toFixed(4)}, lon {parseFloat(form.lng).toFixed(4)}, tz {form.tzone}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              {loading ? "Generating Chart…" : "Generate Natal Chart"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Results ── */}
      {chartResult && astroData && birth && (
        <div className="space-y-6">
          {/* A. Natal Wheel Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Natal Wheel Chart</CardTitle>
              <CardDescription>
                {birth.cityLabel} — {pad2(birth.day)} {MONTH_NAMES[birth.month - 1]} {birth.year},{" "}
                {pad2(birth.hour)}:{pad2(birth.min)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {chartUrl ? (
                <img
                  src={chartUrl}
                  alt={`Natal wheel chart for ${birth.cityLabel}`}
                  className="max-w-full rounded-md border"
                  style={{ maxHeight: 520 }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">Chart image unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* B. Planets & Ascendant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planets &amp; Angles</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Degree</TableHead>
                    <TableHead>Retro</TableHead>
                    <TableHead className="w-[180px]">Interpretation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {astroData.planets.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sign}</TableCell>
                      <TableCell>{p.house ?? "—"}</TableCell>
                      <TableCell>{formatDegree(p.normDegree ?? p.degree)}</TableCell>
                      <TableCell>
                        {(p.isRetro ?? p.retro) ? (
                          <Badge variant="secondary" className="text-xs">℞</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <AiInterpretationButton
                          label={p.name}
                          section="planets"
                          astroData={astroData}
                          focusItem={p.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Angles */}
                  {(["ascendant", "midheaven", "vertex", "lilith"] as const).map((key) => {
                    const pt = astroData[key] as SpecialPoint | undefined;
                    if (!pt) return null;
                    const label = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <TableRow key={key} className="bg-muted/30">
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell>{pt.sign}</TableCell>
                        <TableCell>{pt.house ?? "—"}</TableCell>
                        <TableCell>{formatDegree(pt.normDegree ?? pt.degree)}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>
                          <AiInterpretationButton
                            label={label}
                            section="ascendant"
                            astroData={astroData}
                            focusItem={label}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* C. Houses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">House Cusps</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Sign</TableHead>
                    <TableHead>Degree</TableHead>
                    <TableHead className="w-[180px]">Interpretation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {astroData.houses.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">House {h.house}</TableCell>
                      <TableCell>{h.sign}</TableCell>
                      <TableCell>{formatDegree(h.normDegree ?? h.degree)}</TableCell>
                      <TableCell>
                        <AiInterpretationButton
                          label={`House ${h.house}`}
                          section="houses"
                          astroData={astroData}
                          focusItem={String(h.house)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* D. Aspects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aspects</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    <TableHead>Aspect</TableHead>
                    <TableHead>Planet</TableHead>
                    <TableHead>Orb</TableHead>
                    <TableHead className="w-[180px]">Interpretation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {astroData.aspects.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{a.aspecting_planet}</TableCell>
                      <TableCell>
                        <Badge variant={aspectBadgeVariant(a.type)} className={`text-xs ${aspectColor(a.type)}`}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.aspected_planet}</TableCell>
                      <TableCell>{(a.diff ?? a.orb)?.toFixed(2)}°</TableCell>
                      <TableCell>
                        <AiInterpretationButton
                          label={`${a.aspecting_planet} ${a.type} ${a.aspected_planet}`}
                          section="aspects"
                          astroData={astroData}
                          focusItem={`${a.aspecting_planet} ${a.type} ${a.aspected_planet}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* E. Dharma & Karma */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dharma &amp; Karma</CardTitle>
              <CardDescription>
                Soul purpose, North Node direction, and karmic patterns in your chart.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AiInterpretationButton
                label="Dharma & Karma"
                section="dharma"
                astroData={astroData}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* F. Chart History */}
      {historyLoaded && savedCharts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Recent Charts</CardTitle>
            <CardDescription>Click a row to reload a previous chart.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedCharts.slice(0, 5).map((sc) => (
                  <TableRow
                    key={sc.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => loadSavedChart(sc)}
                  >
                    <TableCell>{sc.city_label}</TableCell>
                    <TableCell>
                      {pad2(sc.birth_day)} {MONTH_NAMES[sc.birth_month - 1]} {sc.birth_year}
                    </TableCell>
                    <TableCell>
                      {pad2(sc.birth_hour)}:{pad2(sc.birth_min)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); loadSavedChart(sc); }}
                      >
                        Load
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
