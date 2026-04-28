"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, ChevronDown, ChevronRight, ChevronLeft, Star, Sun, Moon,
  Calendar as CalendarIcon, Heart, Users, Briefcase, Eye, Zap,
  Sparkles, CircleDot, Clock, MapPin, Printer, ArrowUp, RotateCcw,
  X, Maximize2, Search, Link, User, Home,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import "./horoscope-tables.css";

// ─── Extracted modules ──────────────────────────────────────────────────────
import {
  PLANET_SYMBOLS, ZODIAC_SYMBOLS, ASPECT_SYMBOLS, PLANET_ORDER,
  PLANET_IMAGES, LADDER_PLANET_IMAGES, ASTRO_HEADER_IMAGES, ASPECT_IMAGES,
  PLANET_KEYWORDS, ASPECT_KEYWORDS, ASPECT_TYPE_WORDS,
  MONTH_NAMES, RELATIONSHIP_AI_SECTIONS, HOURS, MINUTES,
} from "./constants";
import type {
  TabType, TabDef, CityOption, BirthInput, FormState,
  DecanRow, DecanPossibility, DecanAi, DecanSection,
} from "./types";
import {
  parseDecimalTz, parseBirth, freeWheelBody, pad, getPlanetDegree,
  getAspectOrbColor, getPlanetInterpClass, getRelationshipBgClass, parseAspectTitle,
  getMonthName, convertTo12HourFormat, emptyBirth, defaultForm, orderPlanetEntries,
  normalizeInterpretationText,
} from "./utils";
import {
  fetchWithRetry, callCompute, callAI, callPlanetReturn,
  callNatalWheel, callDecanLookup, saveAstroAiResponse,
} from "./api";
import { buildAiPrompts } from "./build-ai-prompts";
import { formStateFromSavedFormData } from "./saved-form-data";
import { hydrateSavedAstroReport } from "./saved-report-data";
import {
  ManualPlanetIcon, ManualZodiacIcon, PlanetSymbol, AspectSymbol,
  ZodiacSymbol, AstroHeaderParts, SmartHeading, WordAssociationChips,
  OrbCircle, AspectsLegend,
} from "./components/astro-icons";
import { ShowMoreModal, ChartImageModal, useShowMore } from "./components/show-more-modal";
import { SectionSkeleton, SectionError } from "./components/section-states";
import { RelationshipSection } from "./components/relationship-section";
import { CityAutocomplete } from "./components/city-autocomplete";
import { DatePicker, TimePicker } from "./components/date-time-pickers";

// ─── Inline definitions removed — now imported from ./constants, ./types, ./utils, ./api, ./build-ai-prompts, and ./components/* ──







const TABS: TabDef[] = [
  { slug: "western_horoscope_v2", label: "Nativity Birth Chart", type: "single", extras: ["area_of_inquiry"], icon: Star, description: "Full natal chart with AI interpretations of ascendant, houses, planets, aspects, and dharma/karma." },
  { slug: "solar_return_v2", label: "Solar Return", type: "single", extras: ["area_of_inquiry"], icon: Sun, description: "Annual solar return chart with details, planets, house cusps, and planet aspects." },
  { slug: "tropical_transits_weekly_v2", label: "Weekly Transits", type: "single", extras: ["future_week", "area_of_inquiry"], icon: CalendarIcon, description: "Tropical transit report for any given week with AI narrative." },
  { slug: "tropical_transits_monthly_v3", label: "Monthly Transits + Lunar Return", type: "single", extras: ["future_month", "area_of_inquiry"], icon: Moon, description: "Monthly transits combined with lunar return data and AI interpretation." },
  { slug: "romantic_forecast_report_tropical_v2", label: "Romantic Relationships", type: "two-person", extras: ["area_of_inquiry"], icon: Heart, description: "Synastry and composite chart analysis for romantic compatibility." },
  { slug: "friendship_report_tropical_v2", label: "Friendship Relationships", type: "two-person", extras: ["area_of_inquiry"], icon: Users, description: "Relationship chart analysis for friendship and platonic connections." },
  { slug: "business_partner_v2", label: "Business Relationship", type: "two-person", extras: ["area_of_inquiry"], icon: Briefcase, description: "Synastry chart analysis for business partnerships and professional compatibility." },
  { slug: "horary_chart_v2", label: "Predictive Event (Horary)", type: "single", extras: ["question"], icon: Eye, description: "Horary chart for a specific question — timing and astrological guidance." },
  { slug: "jupiter_return_v2", label: "Jupiter Return", type: "single", extras: ["area_of_inquiry"], icon: Sparkles, description: "Jupiter return date calculation with detailed natal interpretation." },
  { slug: "saturn_return_v2", label: "Saturn Return", type: "single", extras: ["area_of_inquiry"], icon: CircleDot, description: "Saturn return analysis — karmic lessons and life restructuring." },
  { slug: "mars_return_v2", label: "Mars Return", type: "single", extras: ["area_of_inquiry"], icon: Zap, description: "Mars return chart — energy, drive, and action cycles." },
  { slug: "uranus_return_v2", label: "Uranus Opposition", type: "single", extras: ["area_of_inquiry"], icon: Star, description: "Uranus opposition analysis — midlife awakening and liberation themes." },
];

const RELATIONSHIP_SLUG_TO_MODE = {
  romantic_forecast_report_tropical_v2: "romantic",
  friendship_report_tropical_v2: "friendship",
  business_partner_v2: "business",
} as const;

const RELATIONSHIP_SLUG_TO_REPORT_TYPE = {
  romantic_forecast_report_tropical_v2: "romantic",
  friendship_report_tropical_v2: "friendship",
  business_partner_v2: "partnership",
} as const;

function isRelationshipSlug(
  slug: string
): slug is keyof typeof RELATIONSHIP_SLUG_TO_REPORT_TYPE {
  return slug in RELATIONSHIP_SLUG_TO_REPORT_TYPE;
}





function ordinalDecan(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : "3rd";
}

function ordinalHouse(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

function extractPlanetReturnText(value: unknown, expectedKey?: string): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (expectedKey && expectedKey in record) {
    return extractPlanetReturnText(record[expectedKey], expectedKey);
  }

  for (const nestedValue of Object.values(record)) {
    const resolved = extractPlanetReturnText(nestedValue, expectedKey);
    if (resolved) return resolved;
  }

  return null;
}

function getPlanetReturnDisplay(tab: string, responseData: unknown, fallbackReturnDate?: string | null): string | null {
  if (fallbackReturnDate?.trim()) return fallbackReturnDate.trim();

  const planetKey = `${tab.split("_")[0]}_return`;
  const resolved = extractPlanetReturnText(responseData, planetKey);

  if (!resolved) return null;
  if (resolved === planetKey || resolved === tab) return null;

  return resolved;
}

function getPlanetReturnDisplayFromAi(tab: string, aiData: unknown): string | null {
  if (!aiData || typeof aiData !== "object") return null;

  const chartData = (aiData as Record<string, any>)?.chart_data;
  if (!chartData || typeof chartData !== "object") return null;

  if (tab === "uranus_return_v2") {
    const opposition = chartData.next_uranus_opposition;
    return typeof opposition === "string" && opposition.trim() ? opposition.trim() : null;
  }

  const planetKey = `next_${tab.split("_")[0]}_return`;
  const returnValue = chartData[planetKey];
  return typeof returnValue === "string" && returnValue.trim() ? returnValue.trim() : null;
}

function parseAiJsonResponse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;

  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim(),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }

  return raw;
}

function formatInterpretationText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((entry) => formatInterpretationText(entry))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("interpretation" in record) return formatInterpretationText(record.interpretation);
    if ("data" in record) return formatInterpretationText(record.data);
    if ("forecast" in record) return formatInterpretationText(record.forecast);
    if ("text" in record) return formatInterpretationText(record.text);

    return Object.entries(record)
      .filter(([key]) => key !== "index")
      .map(([key, entry]) => {
        const text = formatInterpretationText(entry);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

function formatPlanetReturnDate(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Some upstream responses append a timezone label like "IST".
  // For the UI we only need the calendar date.
  const leadingIsoDateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\b/);
  if (leadingIsoDateMatch) {
    const parsedDate = parse(leadingIsoDateMatch[1], "yyyy-MM-dd", new Date());
    if (isValid(parsedDate)) return format(parsedDate, "MMM d, yyyy");
  }

  const dateFormats = [
    "yyyy-MM-dd",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ssXXX",
    "MMM d, yyyy",
    "MMMM d, yyyy",
  ];

  for (const pattern of dateFormats) {
    const parsedDate = parse(trimmed, pattern, new Date());
    if (isValid(parsedDate)) return format(parsedDate, "MMM d, yyyy");
  }

  const fallbackParsedDate = new Date(trimmed);
  if (isValid(fallbackParsedDate)) return format(fallbackParsedDate, "MMM d, yyyy");

  return trimmed;
}

function formatPlanetBirthPosition(planets: any[] | undefined, planetName: string): string | null {
  const planet = planets?.find((item: any) => item.name?.toLowerCase() === planetName.toLowerCase());
  if (!planet) return null;

  const degree = Number(planet.norm_degree ?? planet.full_degree);
  const roundedDegree = Number.isFinite(degree) ? Math.round(degree) : null;
  const sign = planet.sign ? String(planet.sign) : null;
  const house = Number(planet.house);
  const houseLabel = Number.isFinite(house) ? ordinalHouse(house) : null;

  if (roundedDegree == null || !sign || !houseLabel) return null;

  return `${planetName} at ${roundedDegree}° ${sign} in the ${houseLabel} House`;
}

function DecanAiBlock({ title, data, loading }: { title: string; data: DecanAi | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (loading) {
    return (
      <div className="space-y-1.5 animate-pulse">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">{title}</p>
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-3/5" />
      </div>
    );
  }
  if (!data) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">{title}</p>
      <p className="text-sm leading-relaxed text-foreground">{data.short_format}</p>
      {expanded && <p className="text-sm leading-relaxed text-muted-foreground mt-1">{data.long_format}</p>}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="horoscope-show-more"
      >
        {expanded ? "Show Less" : "Read More"}
      </button>
    </div>
  );
}

function DecanImage({ src, alt, onFull }: { src: string; alt: string; onFull: (src: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative group/img bg-slate-950 border-b border-white/5 flex justify-center min-h-[160px]">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 animate-pulse gap-2">
          <Loader2 className="size-6 animate-spin text-amber-500/40" />
          <span className="text-[10px] uppercase tracking-widest text-amber-500/20 font-bold">Loading Vision...</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "max-h-[600px] w-full object-contain shadow-2xl transition-all duration-700 ease-in-out hover:scale-[1.01]",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      />
      {loaded && (
        <button
          className="absolute bottom-6 right-6 p-2 rounded-full bg-slate-900/80 border border-white/10 text-amber-500 hover:bg-slate-800 transition-all shadow-lg active:scale-90"
          onClick={() => onFull(src)}
          title="Open Full Image"
        >
          <Maximize2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function DecanModal({ planet, sign, open, onClose }: {
  planet: string; sign: string; open: boolean; onClose: () => void;
}) {
  const [rows, setRows] = useState<DecanRow[]>([]);
  const [sections, setSections] = useState<Record<number, DecanSection>>({});
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  // Reset fullscreen state when the main modal is closed
  useEffect(() => {
    if (!open) setFullscreenImg(null);
  }, [open]);
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image');

  // Fetch decan rows from the new decan-info API which returns cached descriptions
  // (and auto-generates + persists via AI if missing on the server side)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRows([]);
    setSections({});
    setRowError(null);
    setLoadingRows(true);

    (async () => {
      try {
        const { results } = await callDecanLookup(sign, planet);
        if (cancelled) return;
        if (!results.length) { setRowError("No decan data found for this planet/sign combination."); setLoadingRows(false); return; }
        setRows(results);
        setLoadingRows(false);

        // Build sections from the cached (or freshly AI-generated) descriptions
        // returned by the server. No client-side AI calls needed.
        const newSections: Record<number, DecanSection> = {};
        for (const row of results) {
          newSections[row.decan] = {
            planetAi: (row.planet_sign_short_desc || row.planet_sign_long_desc)
              ? { short_format: row.planet_sign_short_desc ?? "", long_format: row.planet_sign_long_desc ?? "" }
              : null,
            daemonAi: (row.daemon_short_desc || row.daemon_long_desc)
              ? { short_format: row.daemon_short_desc ?? "", long_format: row.daemon_long_desc ?? "" }
              : null,
            tarotAi: (row.tarot_short_desc || row.tarot_long_desc)
              ? { short_format: row.tarot_short_desc ?? "", long_format: row.tarot_long_desc ?? "" }
              : null,
            loading: false,
          };
        }
        if (!cancelled) setSections(newSections);
      } catch (e: unknown) {
        if (cancelled) return;
        setRowError(e instanceof Error ? e.message : "Failed to load decan data");
        setLoadingRows(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planet, sign]);

  return (
    <>
      <ChartImageModal
        src={fullscreenImg || ""}
        open={!!fullscreenImg}
        onClose={() => {
          setFullscreenImg(null);
          onClose();
        }}
      />
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-950 border-white/10" showCloseButton={false}>
          {/* Custom Close Icon - Fixed to top-right (hide when image is fullscreen) */}
          {!fullscreenImg && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
              aria-label="Close modal"
            >
              <X className="size-5 transition-transform group-hover:rotate-90" />
            </button>
          )}

          {/* Sticky Header Section */}
          <div className="px-6 py-5 border-b border-white/5 bg-slate-900/40 pr-16 shrink-0 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg font-bold gold-text">
                {PLANET_IMAGES[planet] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={PLANET_IMAGES[planet]} alt={planet} className="size-7 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                )}
                <span>{planet} Decans in {sign}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Toggle Switch */}
            <div className="flex bg-slate-950/80 p-1 rounded-lg border border-white/10 ml-4">
              <button
                onClick={() => setViewMode('image')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                  viewMode === 'image'
                    ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                Image
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                  viewMode === 'text'
                    ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                Text
              </button>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">

            {loadingRows && (
              <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-amber-500" />
                <span className="text-sm">Loading decan data…</span>
              </div>
            )}

            {rowError && (
              <div className="py-4 text-sm text-destructive">{rowError}</div>
            )}

            {rows.length > 0 && (
              <div className="space-y-6">
                {rows.map((row) => {
                  const sec = sections[row.decan];
                  return (
                    <div key={row.decan} className="rounded-lg border overflow-hidden bg-slate-900/20">
                      {/* Decan header */}
                      {/* <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-600">{ordinalDecan(row.decan)} Decan</span>
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400 ml-auto">{planet} in {sign}</Badge>
                      </div> */}

                      {/* Content based on viewMode */}
                      {viewMode === 'image' ? (
                        <div className="p-0 animate-in fade-in duration-500">
                          {row.decan_img ? (
                            <DecanImage
                              src={row.decan_img}
                              alt={`${ordinalDecan(row.decan)} Decan Imagery`}
                              onFull={(src) => setFullscreenImg(src)}
                            />
                          ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground bg-slate-900/40">
                              <Eye className="size-8 mb-3 opacity-20" />
                              <p className="text-sm">No imagery available for this decan.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {/* Static labels row */}
                          <div className="grid grid-cols-2 gap-px bg-white/5">
                            <div className="bg-slate-950 px-4 py-3 space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">Greek Daemon</p>
                              <p className="text-sm font-medium text-slate-200">{row.greek_daemon || "—"}</p>
                            </div>
                            <div className="bg-slate-950 px-4 py-3 space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">Tarot Card</p>
                              <p className="text-sm font-medium text-slate-200">{row.tarot_name || "—"}</p>
                            </div>
                          </div>

                          {/* Static description if present */}
                          {row.description && (
                            <div className="px-4 py-4 bg-slate-900/30">
                              <p className="text-xs text-slate-400 leading-relaxed italic">{row.description}</p>
                            </div>
                          )}

                          {/* AI sections */}
                          <div className="px-4 py-5 space-y-6 bg-slate-950">
                            <DecanAiBlock
                              title={`${planet} in ${ordinalDecan(row.decan)} Decan of ${sign}`}
                              data={sec?.planetAi ?? null}
                              loading={sec?.loading ?? true}
                            />
                            <DecanAiBlock
                              title={`Greek Daemon: ${row.greek_daemon}`}
                              data={sec?.daemonAi ?? null}
                              loading={sec?.loading ?? true}
                            />
                            <DecanAiBlock
                              title={`Tarot: ${row.tarot_name}`}
                              data={sec?.tarotAi ?? null}
                              loading={sec?.loading ?? true}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Planets Section ──────────────────────────────────────────────────────────

function normalizeDecanValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function PlanetsSection({ planets, aiData, areaOfInquiry, checkDacen, onDecanClick }: {
  planets: any[]; aiData: any; areaOfInquiry?: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();

  if (!planets) return null;


  // Keep the standard planets in a fixed visual sequence, then append any remaining bodies.
  const ordered = orderPlanetEntries(planets ?? [], PLANET_ORDER);

  // Build AI map: name → interpretation
  const aiMap: Record<string, string> = {};
  if (Array.isArray(aiData)) {
    for (const item of aiData) {
      if (item?.name) aiMap[item.name] = normalizeInterpretationText(item.interpretation);
    }
  }

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />

      {/* Table */}
      <div className="horoscope-table-container">
        <div className="horoscope-table-header">
          <h3>Planet Information</h3>
        </div>
        <div className="horoscope-table-wrapper">
          <table className="horoscope-table">
            <thead>
              <tr>
                {["Planet", "Sign", "Full Degree", "House", "Norm Degree", "Speed", "Retro?"].map((h) => (
                  <th key={h} className="text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.map((p, i) => (
                <tr key={p.name}>
                  <td className="td-planet">
                    <div className="flex items-center gap-2">
                      <PlanetSymbol name={p.name} />
                    </div>
                  </td>
                  <td><ZodiacSymbol sign={p.sign} /></td>
                  <td className="td-mono">{Number(p.full_degree).toFixed(2)}°</td>
                  <td>{p.house}</td>
                  <td className="td-mono">{Number(p.norm_degree).toFixed(2)}°</td>
                  <td className="td-mono">{Number(p.speed).toFixed(2)}</td>
                  <td className="text-white font-medium">
                    {p.is_retro === "true" ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI interpretations */}
      {!aiData && <SectionSkeleton title="Planet Interpretations" />}
      {aiData === "error" && <SectionError title="Planet Interpretations" />}
      {Array.isArray(aiData) && aiData.length > 0 && (
        <div className="space-y-3">
          {ordered.map((p) => {
            const interp = aiMap[p.name];
            if (!interp) return null;
            const hasDecan = checkDacen(p.name, p.sign);
            const planetImg = ASTRO_HEADER_IMAGES[p.name];
            return (
              <div key={p.name} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(182, 199, 227, 0.17)' }}>
                {/* Interpretation Header — centered as Name → Icon → Decan */}
                <div className="horoscope-interp-header px-4 py-2.5" style={{ borderBottom: '1px solid rgba(182, 199, 227, 0.17)' }}>
                  <div className="flex items-center justify-center gap-3 flex-wrap text-center">
                    <h4 className="uppercase tracking-wide" style={{ fontFamily: "'Roboto', sans-serif", color: '#232c3c' }}>{p.name}</h4>
                    {planetImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={planetImg} alt={p.name} className="size-[30px] object-contain shrink-0" />
                    ) : (
                      <ManualPlanetIcon name={p.name} size="size-8" />
                    )}
                    {hasDecan && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onDecanClick(p.name, p.sign)}
                            className="size-9 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-90 group"
                            aria-label={`Open decan information for ${p.name} in ${p.sign}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                              alt=""
                              className="size-6 cursor-pointer transition-transform group-hover:scale-110 brightness-110"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                          Decan Insights
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                {/* Interpretation Content — Planet-specific gradient */}
                <div className={cn("px-4 py-3", getPlanetInterpClass(p.name))}>
                  <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px' }}>{interp}</p>
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => trigger(p.name, interp, p, areaOfInquiry, undefined, false, "planet")}
                      className="horoscope-show-more"
                    >Show More</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Houses Section ───────────────────────────────────────────────────────────

function HousesSection({ houses, planets, aiData, areaOfInquiry }: { houses: any[]; planets: any[]; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  if (!houses) return null;

  function extractHouseInterpretationEntries(input: unknown) {
    const parsedInput = parseAiJsonResponse(input);
    const baseItems = Array.isArray(parsedInput)
      ? parsedInput
      : parsedInput && typeof parsedInput === "object"
        ? Object.entries(parsedInput as Record<string, unknown>).map(([houseKey, value]) => ({
          house: houseKey,
          value,
        }))
        : [];

    return baseItems
      .map((entry: any, index: number) => {
        let rawItem = entry;
        let fallbackHouse: string | number | null = entry?.house ?? null;

        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const keys = Object.keys(entry);
          if (keys.length === 1 && /^\d+$/.test(keys[0] ?? "")) {
            fallbackHouse = keys[0];
            rawItem = entry[keys[0]];
          } else if ("value" in entry && entry.value && typeof entry.value === "object" && !Array.isArray(entry.value)) {
            rawItem = entry.value;
          }
        }

        const item = rawItem && typeof rawItem === "object" ? rawItem as Record<string, unknown> : {};
        const houseSource = item.house ?? fallbackHouse;
        const houseMatch = String(houseSource ?? "").match(/\d+/);
        const houseNumber = houseMatch ? Number(houseMatch[0]) : null;
        const text = normalizeInterpretationText(
          item.interpretation ?? item.data ?? item.forecast ?? rawItem,
        );

        return {
          item,
          index,
          houseNumber: Number.isFinite(houseNumber) ? houseNumber : null,
          text,
        };
      })
      .filter(({ text }) => Boolean(text));
  }

  // Map house number → planets in that house
  const houseMap: Record<number, string[]> = {};
  if (planets) {
    for (const p of planets) {
      const h = Number(p.house);
      if (!houseMap[h]) houseMap[h] = [];
      houseMap[h].push(p.name);
    }
  }

  const aiMap: Record<string | number, string> = {};
  if (Array.isArray(aiData)) {
    for (const item of aiData) {
      if (item?.house !== undefined) aiMap[item.house] = normalizeInterpretationText(item.interpretation);
    }
  }

  const houseInterpretations = extractHouseInterpretationEntries(aiData);

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />

      {/* House table */}
      <div className="horoscope-table-container">
        <div className="horoscope-table-header">
          <h3>House Information</h3>
        </div>
        <div className="horoscope-table-wrapper">
          <table className="horoscope-table house-information-table">
            <thead>
              <tr>
                {["House", "Sign", "Degree"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {houses.map((h: any, i: number) => (
                <tr key={`house-row-${h.house ?? i}-${i}`}>
                  <td className="font-semibold text-center">House {h.house}</td>
                  <td>
                    <div className="flex justify-center">
                      <ZodiacSymbol sign={h.sign} />
                    </div>
                  </td>
                  <td className="td-mono text-center">{Number(h.degree).toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Analysis - Exact Mockup Replication [Paper-and-Ink Style] */}
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="p-8 overflow-x-auto">
          <div className="flex flex-col gap-1 min-w-[850px] font-sans">

            {houses.map((h: any, houseIndex: number) => {
              const hNum = Number(h.house);
              const gridPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "Node", "Part of Fortune", "Chiron"];

              // Special Rule: H1 and H12 only icon. Others follow Staircase (H2=1, H3=2... H11=10)
              const skipBlocks = hNum === 1 || hNum === 12;

              // Map house to the specific planet sequence AS PER IMAGE
              // H1-H9: Sun, Moon, Mercury, Venus, Mars, Saturn, Jupiter, Uranus, Neptune (idx 0-8)
              // H10: Node (idx 10), H11: Part of Fortune (idx 11), H12: Chiron (idx 12)
              // Note: Skipping Pluto (idx 9) to match the 12-house track in the reference image
              let planetIdx = hNum - 1;
              if (hNum === 10) planetIdx = 10; // Node
              if (hNum === 11) planetIdx = 11; // Part of Fortune
              if (hNum === 12) planetIdx = 12; // Chiron

              const pName = gridPlanets[planetIdx] || "Sun";
              const pImg = LADDER_PLANET_IMAGES[pName] ?? PLANET_IMAGES[pName];
              const forcedIconIdx = skipBlocks ? 0 : (hNum - 1);

              return (
                <div key={`house-track-${h.house ?? houseIndex}-${houseIndex}`} className="flex items-center gap-4 py-0 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  {/* Mockup-style House Header: [House N] [Sign Icon] [Degree] */}
                  <div className="flex items-center gap-4 w-40 shrink-0 h-8">
                    <div className="w-12">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">H{h.house}</p>
                    </div>

                    <div className="flex items-center justify-between flex-1">
                      <span className="text-black text-xl leading-none">
                        {ZODIAC_SYMBOLS[h.sign] ?? "•"}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-slate-500 ml-2">
                        {Number(h.full_degree || h.degree).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Ladder Track - Gap minimized to match mockup */}
                  {/* Ladder Track - Rectangular & Extremely Compact */}
                  <div className="flex gap-0.5 flex-1 items-center justify-start ml-2">
                    {Array.from({ length: forcedIconIdx + 1 }).map((_, colIdx) => {
                      const isIcon = colIdx === forcedIconIdx;

                      if (isIcon) {
                        return (
                          <div key="icon" className="w-10 h-6 flex items-center justify-center shrink-0">
                            {pImg && pName !== "Part of Fortune" ? (
                              <img src={pImg} alt={pName} className="size-5 object-contain" />
                            ) : (
                              <span className="flex items-center justify-center">
                                {pName === "Part of Fortune" ? (
                                  <div className="size-4 border border-amber-600 rounded-full flex items-center justify-center translate-y-[1px]">
                                    <span className="text-[9px] font-black leading-none -translate-y-[0.5px] text-amber-600">✕</span>
                                  </div>
                                ) : (
                                  <span className={cn(
                                    "text-lg font-bold",
                                    pName === "Node" ? "text-indigo-600" :
                                      pName === "Chiron" ? "text-emerald-600" :
                                        "text-amber-600"
                                  )}>
                                    {PLANET_SYMBOLS[pName] ?? "✦"}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={colIdx} className="w-10 h-6 bg-black shrink-0" />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* AI interpretations */}
      {!aiData && <SectionSkeleton title="House Interpretations" />}
      {aiData === "error" && <SectionError title="House Interpretations" />}
      {houseInterpretations.length > 0 && (
        <div className="space-y-3">
          {houseInterpretations.map(({ item, index, houseNumber, text }) => {
            const hRaw = houses.find((h: any) => Number(h.house) === houseNumber);
            const sign = hRaw?.sign ?? "";
            const houseLabel = houseNumber ?? index + 1;
            return (
              <div key={`house-interpretation-${houseLabel}-${index}`} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(182, 199, 227, 0.17)' }}>
                <div className="horoscope-interp-header px-4 py-2.5 flex justify-center" style={{ borderBottom: '1px solid rgba(182, 199, 227, 0.17)' }}>
                  <h4 className="uppercase tracking-wide text-center w-full" style={{ fontFamily: "'Roboto', sans-serif", color: '#232c3c' }}>House {houseLabel}</h4>
                </div>
                <div className="interp-gradient-default px-4 py-3">
                  <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px' }}>{text}</p>
                  <div className="mt-3 flex justify-center">
                    <button onClick={() => trigger(`House ${houseLabel}`, text, { ...item, sign }, areaOfInquiry, undefined, false, "house")} className="horoscope-show-more">Show More</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Aspects Section ──────────────────────────────────────────────────────────

function AspectsSection({ aspects, planets, aiData, areaOfInquiry, isSolarReturn }: { aspects: any[]; planets: any[]; aiData: any; areaOfInquiry?: string; isSolarReturn?: boolean }) {
  const { modal, trigger, close } = useShowMore();

  if (!aspects) return null;

  const parsedAiData = parseAiJsonResponse(aiData);
  const aspectInterpretations = (
    Array.isArray(parsedAiData)
      ? parsedAiData
      : parsedAiData && typeof parsedAiData === "object"
        ? Object.values(parsedAiData as Record<string, unknown>)
        : []
  )
    .map((entry: any, index: number) => {
      let item = entry;

      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const keys = Object.keys(entry);
        if (keys.length === 1 && entry[keys[0]] && typeof entry[keys[0]] === "object") {
          item = entry[keys[0]];
        }
      }

      const title = typeof item?.title === "string" && item.title.trim()
        ? item.title.trim()
        : `Aspect ${index + 1}`;
      const interpretation = normalizeInterpretationText(
        item?.interpretation ?? item?.data ?? item?.forecast ?? item,
      );

      return {
        item,
        index,
        title,
        interpretation,
      };
    })
    .filter(({ interpretation }) => Boolean(interpretation));

  // Enrich aspects with planet degrees
  const degMap: Record<string, number> = {};
  const signMap: Record<string, string> = {};
  for (const p of (planets ?? [])) {
    degMap[p.name] = Number(p.full_degree);
    signMap[p.name] = p.sign;
  }
  const enriched = aspects.map((a: any) => ({
    ...a,
    aspecting_degree: degMap[a.aspecting_planet] ? parseFloat(degMap[a.aspecting_planet].toFixed(2)) : null,
    aspected_degree: degMap[a.aspected_planet] ? parseFloat(degMap[a.aspected_planet].toFixed(2)) : null,
    color: getAspectOrbColor(Number(a.orb ?? 0), a.type, a.aspecting_planet, a.aspected_planet),
  }));

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      <AspectsLegend />

      <div className="horoscope-table-container">
        <div className={cn("horoscope-table-header py-3", isSolarReturn ? "bg-[#261a1a]" : "bg-black")}>
          <h3 className="text-white">Aspects</h3>
        </div>
        <div className="horoscope-table-wrapper">
          <table className="horoscope-table">
            <thead>
              <tr>
                {["Aspected Planet", "Aspecting Planet", "Orb", "Diff", "Aspected Degree", "Aspecting Degree", "Type"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((a: any, i: number) => (
                <tr key={i}>
                  <td className="text-left"><PlanetSymbol name={a.aspected_planet} /></td>
                  <td className="text-left"><PlanetSymbol name={a.aspecting_planet} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <OrbCircle orb={Number(a.orb ?? 0)} color={a.color} />
                      <span className="td-mono">{Number(a.orb ?? 0).toFixed(2)}°</span>
                    </div>
                  </td>
                  <td className="td-mono text-left">{a.diff}</td>
                  <td className="td-mono text-left">{a.aspected_degree ?? "—"}°</td>
                  <td className="td-mono text-left">{a.aspecting_degree ?? "—"}°</td>
                  <td className="text-left">
                    <AspectSymbol type={a.type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI aspect interpretations with word association */}
      {!aiData && <SectionSkeleton title="Aspect Interpretations" />}
      {aiData === "error" && <SectionError title="Aspect Interpretations" />}
      {aspectInterpretations.length > 0 && (
        <div className="space-y-3">
          {aspectInterpretations.map(({ item, index, title, interpretation }) => {
            // Parse planet/aspect names directly from the AI title — no fuzzy rawAspect lookup
            // e.g. "Moon Conjunction Venus" → p1="Moon", aspectType="Conjunction", p2="Venus"
            const { p1, aspectType: _at, p2 } = parseAspectTitle(title);
            return (
              <div key={`aspect-interpretation-${index}`} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(182, 199, 227, 0.17)' }}>
                {/* Header — white bg with dark text, Angular astroHeaderModifierPipe icon pattern */}
                <div className="horoscope-interp-header px-4 py-2.5 text-center" style={{ borderBottom: '1px solid rgba(182, 199, 227, 0.17)' }}>
                  <AstroHeaderParts title={title} />
                </div>
                {/* Golden-orange gradient interpretation */}
                <div className="interp-gradient-default px-4 py-3">
                  <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px', color: '#000' }}>{interpretation}</p>
                  <div className="mt-3 flex justify-center">
                    <button onClick={() => trigger(title, interpretation, item, areaOfInquiry, title)} className="horoscope-show-more">Show More</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dharma & Karma Section ───────────────────────────────────────────────────

function DharmaKarmaSection({ data, rawData, areaOfInquiry, isSolarReturn }: { data: any; rawData?: any; areaOfInquiry?: string; isSolarReturn?: boolean }) {
  const { modal, trigger, close } = useShowMore();

  if (!data && data !== "error") return <SectionSkeleton title="Dharma & Karma" />;
  if (data === "error") return <SectionError title="Dharma & Karma" />;

  const dharma = typeof data === "string" ? null : data?.dharma;
  const karma = typeof data === "string" ? null : data?.karma;

  return (
    <div className="space-y-3">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      {[{ key: "dharma", label: "Dharma", text: dharma }, { key: "karma", label: "Karma", text: karma }].map(({ key, label, text }) => {
        const textContent = normalizeInterpretationText(text);
        return textContent ? (
          <div key={key} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(182, 199, 227, 0.17)' }}>
            <div className="horoscope-interp-header px-4 py-2.5 flex justify-center bg-white" style={{ borderBottom: '1px solid rgba(182, 199, 227, 0.17)' }}>
              <h4 className="text-center w-full text-black font-semibold" style={{ fontFamily: "'Roboto', sans-serif" }}>{label}</h4>
            </div>
            <div className="interp-gradient-default px-4 py-3">
              <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px', color: '#000' }}>{textContent}</p>
              <div className="mt-3 flex justify-center">
                <button onClick={() => trigger(label, textContent, rawData ?? data, areaOfInquiry)} className="horoscope-show-more">Show More</button>
              </div>
            </div>
          </div>
        ) : null;
      })}
      {typeof data === "string" && <p className="text-sm text-muted-foreground px-4 py-3">{data}</p>}
    </div>
  );
}

// ─── Lilith Section ───────────────────────────────────────────────────────────

function LilithSection({ lilith, aiData, areaOfInquiry, checkDacen, onDecanClick }: {
  lilith: any; aiData: any; areaOfInquiry?: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();
  if (!lilith) return null;

  const interp = Array.isArray(aiData)
    ? normalizeInterpretationText(aiData[0]?.interpretation ?? aiData[0]?.data ?? aiData[0])
    : "";

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      <div className="horoscope-table-container">
        <div className="horoscope-table-header flex items-center justify-center gap-2">
          <h3>Lilith</h3>
          <span className="text-amber-500 text-xl">⚸</span>
          {lilith.sign && checkDacen("Lilith", lilith.sign) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDecanClick("Lilith", lilith.sign)}
                  className="rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                    alt=""
                    className="size-5 cursor-pointer hover:scale-125 transition-all hover:brightness-150 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                Decan Information
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="horoscope-table-wrapper">
          <table className="horoscope-table">
            <thead>
              <tr className="horoscope-thead">
                {["Planet", "Sign", "Full Degree", "House", "Norm Degree", "Speed", "Retro?"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="horoscope-tbody-row">
                <td className="px-3 py-2 font-medium"><PlanetSymbol name={lilith.name ?? "Lilith"} /></td>
                <td className="px-3 py-2"><ZodiacSymbol sign={lilith.sign} /></td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.full_degree).toFixed(2)}°</td>
                <td className="px-3 py-2">{lilith.house}</td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.norm_degree).toFixed(2)}°</td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.speed).toFixed(2)}</td>
                <td>
                  <span className={cn("retro-badge-v2", lilith.is_retro === "true" ? "retro" : "direct")}>
                    {lilith.is_retro === "true" ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {interp && (
          <div className="interp-gradient-default px-4 py-3 border-t">
            <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px', color: '#000' }}>{interp}</p>
          </div>
        )}
        {!aiData && <div className="px-4 py-3 border-t"><div className="h-3 bg-muted rounded w-3/4 animate-pulse" /></div>}
      </div>
    </div>
  );
}

// ─── Ascendant / Midheaven / Vertex Section ───────────────────────────────────

function AscMidheavenVertexSection({ natalData, aiData, areaOfInquiry, isSolarReturn }: { natalData: any; aiData: any; areaOfInquiry?: string; isSolarReturn?: boolean }) {
  const { modal, trigger, close } = useShowMore();

  const keys = ["ascendant", "midheaven", "vertex"];
  const aiMap: Record<string, string> = {};
  if (Array.isArray(aiData)) {
    for (const item of aiData) {
      for (const k of keys) {
        const normalized = normalizeInterpretationText(item?.[k]);
        if (normalized) aiMap[k] = normalized;
      }
    }
  }

  if (!aiData && aiData !== "error") return <SectionSkeleton title="Ascendant · Midheaven · Vertex" />;
  if (aiData === "error") return <SectionError title="Ascendant · Midheaven · Vertex" />;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(182, 199, 227, 0.17)' }}>
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      <div className="horoscope-section-header px-4 py-3 text-center bg-black text-white border-none">
        <h3 className="text-[20px] font-semibold text-center w-full text-white" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 600, lineHeight: '26px' }}>Ascendant · Midheaven · Vertex</h3>
      </div>
      <div>
        <div className="horoscope-table-wrapper border-b border-white/5">
          <table className="horoscope-table asc-midheaven-vertex-table">
            <thead>
              <tr>
                {["Ascendant", "Midheaven", "Vertex"].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {keys.map((key) => {
                  const degree = natalData?.[key];
                  return (
                    <td key={key} className="td-mono">
                      {degree ? (
                        typeof degree === "object"
                          ? `${degree.sign ?? ""} ${Number(degree.degree ?? 0).toFixed(2)}°`
                          : `${Number(degree).toFixed(2)}°`
                      ) : "—"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        {keys.map((key) => {
          const interp = aiMap[key];
          return (
            <div key={key}>
              <div className="horoscope-interp-header px-4 py-2 flex items-center justify-center" style={{ borderBottom: '1px solid rgba(182, 199, 227, 0.17)' }}>
                <h4 className="uppercase tracking-wider text-center w-full" style={{ fontFamily: "'Roboto', sans-serif", color: '#232c3c' }}>{key}</h4>
              </div>
              <div className="interp-gradient-default px-4 py-3">
                <p className="text-[20px] leading-relaxed" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                  {interp ?? <span className="italic" style={{ color: '#666' }}>Loading…</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Natal Charts Row ─────────────────────────────────────────────────────────

function NatalChartsRow({ svgs, labels, onExpandImg }: {
  svgs: (string | null)[]; labels: string[]; onExpandImg: (src: string) => void;
}) {
  const activeItems = svgs.map((s, i) => ({ s, l: labels[i] })).filter(item => item.s);
  if (!activeItems.length) return null;

  const renderImg = (src: string, label: string) => {
    const isP2 = label.toLowerCase().includes("person 2") || label.toLowerCase().includes("transit");
    const Icon = isP2 ? Heart : User;
    return (
      <div className="flex-1 min-w-[200px] max-w-[calc(50%-0.5rem)] border rounded-lg p-2 bg-background cursor-pointer hover:ring-2 ring-amber-400 transition" onClick={() => onExpandImg(src)}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
          <Icon className="size-4 text-amber-500" />
          <span className="truncate">{label}</span>
          <Eye className="ml-auto size-5 text-amber-500 opacity-100" />
        </p>
        {src.startsWith("<svg") ? (
          <div dangerouslySetInnerHTML={{ __html: src }} className="overflow-hidden aspect-square flex items-center justify-center grayscale-0" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="w-full h-auto rounded aspect-square object-contain" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-4">
      {activeItems.map((item, i) => (
        <div key={`${String(item.l)}-${i}`} className="contents">
          {renderImg(item.s!, String(item.l))}
        </div>
      ))}
    </div>
  );
}

// ─── Planet Return Summary Table ──────────────────────────────────────────────

function PlanetReturnSummaryTable({ tab, birth, returnDate, natalData, responseData, aiData }: {
  tab: string; birth: BirthInput; returnDate: string | null; natalData: any; responseData?: unknown; aiData?: unknown;
}) {
  const planet = tab.split("_")[0]; // jupiter, saturn, mars, uranus
  const label = planet.charAt(0).toUpperCase() + planet.slice(1);
  const natalDeg = natalData?.planets ? getPlanetDegree(natalData.planets, label) : null;
  const birthPosition = formatPlanetBirthPosition(natalData?.planets, label);
  const rawReturnDisplay = getPlanetReturnDisplay(tab, responseData, returnDate) ?? getPlanetReturnDisplayFromAi(tab, aiData);
  const resolvedReturnDate = tab === "uranus_return_v2"
    ? (rawReturnDisplay ?? null)
    : formatPlanetReturnDate(rawReturnDisplay);
  const nextReturnLabel = tab === "uranus_return_v2" ? "Next Uranus Opposition" : `Next ${label} Return`;

  return (
    <div className="horoscope-table-container">
      <div className="horoscope-table-header">
        <h3>z{label} Return</h3>
      </div>
      <div className="horoscope-table-wrapper">
        <table className="horoscope-table">
          <thead>
            <tr>
              {["Date of Birth", "Place of Birth", "Time of Birth", "House System", `${label} at Birth`, nextReturnLabel].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{birth.dob ? format(parse(birth.dob, "yyyy-MM-dd", new Date()), "PPP") : "—"}</td>
              <td>{birth.city?.label ?? "—"}</td>
              <td>{birth.tob || "—"}</td>
              <td>Whole Sign</td>
              <td>{birthPosition ?? (natalDeg != null ? `${natalDeg.toFixed(2)}°` : "—")}</td>
              <td className="font-semibold text-amber-700 dark:text-amber-300">
                {resolvedReturnDate ?? <span className="text-muted-foreground">Calculating…</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Planet Return AI Interpretation ─────────────────────────────────────────

function PlanetReturnPositions({ chartData }: { chartData: any }) {
  const positions = chartData?.Positions;
  if (!positions || typeof positions !== "object") return null;

  const firstColumns = ["Ascendant", "Jupiter", "Mars", "Mercury", "Moon", "Neptune", "North_Node"];
  const secondColumns = ["Pluto", "Saturn", "South_Node", "Sun", "Uranus", "Venus"];

  const renderHeader = (key: string) => key.replace(/_/g, " ");
  const renderValue = (key: string) => {
    const value = positions[key];
    return typeof value === "string" && value.trim() ? value : "—";
  };

  const renderTable = (columns: string[]) => (
    <div className="horoscope-table-container">
      <div className="horoscope-table-wrapper">
        <table className="horoscope-table horoscope-table-positions">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{renderHeader(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((column) => (
                <td key={column}>{renderValue(column)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 horoscope-section-header text-center">
          <h3
            className="text-sm font-semibold text-center w-full"
            style={{ color: "#fff", fontSize: "large" }}
          >
            Positions
          </h3>
        </div>
      </div>
      {renderTable(firstColumns)}
      {renderTable(secondColumns)}
    </div>
  );
}

function getPlanetReturnAnalysisStyle(tab: string): { background: string; color: string } {
  const planet = tab.split("_")[0];

  switch (planet) {
    case "saturn":
      return {
        background: "linear-gradient(166deg, #000000 0%, #4B4B4B 100%)",
        color: "#fff",
      };
    case "mars":
      return {
        background: "linear-gradient(166deg, #FF0000 0%, #B22222 100%)",
        color: "#fff",
      };
    case "uranus":
      return {
        background: "linear-gradient(166deg, #0000FF 0%, #1E90FF 100%)",
        color: "#fff",
      };
    case "jupiter":
    default:
      return {
        background: "linear-gradient(180deg, #0f22ff 0%, #2147ff 100%)",
        color: "#fff",
      };
  }
}

function PlanetReturnInterpretation({ tab, aiData, areaOfInquiry }: { tab: string; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  if (!aiData && aiData !== "error") return <SectionSkeleton title="Return Interpretation" />;
  if (aiData === "error") return <SectionError title="Return Interpretation" />;

  const interp = aiData?.title_and_interpretation?.interpretation ?? aiData?.interpretation ?? null;
  const title = aiData?.title_and_interpretation?.title ?? `${tab.split("_")[0].charAt(0).toUpperCase() + tab.split("_")[0].slice(1)} Return`;
  const isPlanetReturnTab = ["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(tab);
  const analysisStyle = getPlanetReturnAnalysisStyle(tab);

  if (isPlanetReturnTab) {
    return (
      <div className="rounded-lg border overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="bg-white px-6 py-5 text-center border-b border-slate-200">
          <h3
            className="font-semibold text-slate-900"
            style={{ fontFamily: "'Roboto', sans-serif", fontSize: "22px", lineHeight: "30px" }}
          >
            {title}
          </h3>
        </div>
        <div
          className="px-8 py-8 space-y-8"
          style={{
            background: analysisStyle.background,
            color: analysisStyle.color,
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          {interp && typeof interp === "object" ? (
            Object.entries(interp).map(([k, v]) => (
              <div key={k} className="space-y-1.5">
                <p
                  className="text-white"
                  style={{ fontSize: "18px", lineHeight: "30px", fontWeight: 400 }}
                >
                  <span style={{ fontWeight: 700 }}>{k} :</span> {String(v)}
                </p>
              </div>
            ))
          ) : interp ? (
            <p
              className="text-white"
              style={{ fontSize: "18px", lineHeight: "30px", fontWeight: 400 }}
            >
              {String(interp)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      <div className="px-4 py-2.5 horoscope-section-header text-center">
        <h3 className="text-sm font-semibold text-center w-full">{title}</h3>
      </div>
      <div className="divide-y">
        {interp && typeof interp === "object" ? (
          Object.entries(interp).map(([k, v]) => (
            <div key={k} className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-center w-full" style={{ color: '#000' }}>{k}</h4>
              <p className="leading-relaxed" style={{ color: '#000' }}>{String(v)}</p>
              <div className="mt-1.5 flex justify-center">
                <button onClick={() => trigger(k, String(v), interp, areaOfInquiry)} className="horoscope-show-more">Show More</button>
              </div>
            </div>
          ))
        ) : interp ? (
          <div className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
            <p className="leading-relaxed">{String(interp)}</p>
          </div>
        ) : null}
        {!isPlanetReturnTab && aiData && typeof aiData === "object" && aiData.chart_data && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Chart Data</p>
            <pre className="text-xs font-mono bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(aiData.chart_data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Solar Return Section ─────────────────────────────────────────────────────

function SolarReturnSection({ details, planets, cusps, aspects, planetReport, aspectsReport, aiData, areaOfInquiry, checkDacen, onDecanClick }: {
  details: any; planets: any; cusps: any; aspects: any;
  planetReport?: any; aspectsReport?: any;
  aiData: any; areaOfInquiry?: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();

  // aiData: only solar_return_details comes from AI Lambda now
  const detailsAi = unwrapSolarReturnAiResponse(aiData?.solar_return_details ?? null);
  // planet/aspects data come from AstrologyAPI results directly
  const planetAi = null; // not used anymore — see planetReport prop
  const aspectsAi = null; // not used anymore — see aspectsReport prop

  function unwrapSolarReturnAiResponse(input: unknown): unknown {
    const parsed = parseAiJsonResponse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "ai_response" in parsed) {
      return parseAiJsonResponse((parsed as Record<string, unknown>).ai_response);
    }
    return parsed;
  }

  function formatSolarReturnAiTitle(value: string, fallback: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "0") return fallback;
    return trimmed
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function extractSolarReturnAiCards(input: unknown, fallbackTitle: string) {
    const parsed = unwrapSolarReturnAiResponse(input);
    const sourceItems = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({ [key]: value }))
        : parsed
          ? [{ [fallbackTitle]: parsed }]
          : [];

    return sourceItems.flatMap((entry: any, index: number) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        const text = normalizeInterpretationText(entry);
        return text ? [{ title: `${fallbackTitle} ${index + 1}`, text, raw: entry }] : [];
      }

      const explicitTitle = entry.title ?? entry.name ?? entry.heading;
      const explicitText = normalizeInterpretationText(
        entry.interpretation ?? entry.data ?? entry.forecast ?? entry.text,
      );
      if (explicitText) {
        return [{
          title: formatSolarReturnAiTitle(String(explicitTitle ?? `${fallbackTitle} ${index + 1}`), fallbackTitle),
          text: explicitText,
          raw: entry,
        }];
      }

      return Object.entries(entry)
        .filter(([key]) => !["index", "title", "name", "heading"].includes(key))
        .map(([key, value]) => ({
          title: formatSolarReturnAiTitle(key, `${fallbackTitle} ${index + 1}`),
          text: normalizeInterpretationText(value),
          raw: entry,
        }))
        .filter((card) => card.text);
    });
  }

  function renderAiCards(data: any, title: string, showMore = true) {
    if (!data) return <SectionSkeleton title={title} />;
    if (data === "error") return <SectionError title={title} />;
    const items = extractSolarReturnAiCards(data, title);
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <div key={`${item.title}-${i}`} className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center">
              <SmartHeading title={item.title} textSize="text-[22px]" iconSize="size-7" className="text-black" />
            </div>
            <div className="interp-gradient-default px-4 py-3 pb-8" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
              <p className="leading-relaxed">{String(item.text)}</p>
              {showMore && (
                <div className="mt-2 flex justify-center border-t border-black/10 pt-2">
                  <button onClick={() => trigger(item.title, String(item.text), item.raw, areaOfInquiry)} className="horoscope-show-more">Show More</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const planetList: any[] = Array.isArray(planets) ? planets : (planets?.planets ?? []);
  const cuspObj = cusps ?? {};
  const houseList: any[] = Array.isArray(cuspObj.houses) ? cuspObj.houses : [];
  const aspectList: any[] = Array.isArray(aspects) ? aspects : (aspects?.aspects ?? []);

  return (
    <div className="space-y-5">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />

      {/* 1. Solar Return Details */}
      {details && (
        <div className="horoscope-table-container">
          <div className="horoscope-table-header">
            <h3>Solar Return Details</h3>
          </div>
          <div className="horoscope-table-wrapper">
            <table className="horoscope-table">
              <thead>
                <tr>
                  {["Native Birth Date", "Solar Return Date"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{details.native_birth_date ?? details.date_of_birth ?? "—"}</td>
                  <td className="font-semibold text-amber-500">{details.solar_return_date ?? details.return_date ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Solar Return Planets table */}
      {planetList.length > 0 && (
        <div className="horoscope-table-container">
          <div className="horoscope-table-header">
            <h3>Solar Return Planets</h3>
          </div>
          <div className="horoscope-table-wrapper">
            <table className="horoscope-table">
              <thead>
                <tr>
                  {["Planet", "House", "Full Degree", "Sign", "Norm Degree", "Speed", "Retro?"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planetList.map((p: any, i: number) => (
                  <tr key={p.name ?? i}>
                    <td className="td-planet"><PlanetSymbol name={p.name} /></td>
                    <td className="text-center">{p.house ?? "—"}</td>
                    <td className="td-mono">{Number(p.full_degree ?? 0).toFixed(2)}°</td>
                    <td><ZodiacSymbol sign={p.sign} /></td>
                    <td className="td-mono">{Number(p.norm_degree ?? 0).toFixed(2)}°</td>
                    <td className="td-mono">{Number(p.speed ?? 0).toFixed(2)}</td>
                    <td>
                      <span className={cn("retro-badge-v2", p.is_retro === "true" || p.is_retro === true ? "retro" : "direct")}>
                        {p.is_retro === "true" || p.is_retro === true ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Solar Return Planet Report — from AstrologyAPI solar_return_planet_report
           Shape: [{name, forecast:[str,str,...], full_degree?, sign?, house?}]
           Ported from Angular solar-return-v2 getHttpHoroscopePost("solar_return_planet_report") */}
      {planetReport !== null && planetReport !== undefined && (() => {
        const items: any[] = Array.isArray(planetReport) ? planetReport : [];
        if (items.length === 0) return null;
        return (
          <div className="space-y-2">
            <div className="horoscope-section-header bg-black py-4 text-center rounded-lg mb-4">
              <h3 className="text-white text-[20px] font-semibold uppercase tracking-wide">Solar Return Planet Interpretations</h3>
            </div>
            {items.map((p: any, i: number) => {
              const forecasts: string[] = Array.isArray(p.forecast) ? p.forecast : (p.forecast ? [String(p.forecast)] : []);
              return (
                <div key={p.name ?? i} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-4 horoscope-interp-header relative flex items-center justify-center min-h-[64px]">
                    <div className="flex items-center gap-4">
                      <SmartHeading title={p.name ?? `Planet ${i + 1}`} textSize="text-2xl" iconSize="size-10" className="text-black" />
                      {p.name && p.sign && checkDacen(p.name, p.sign) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onDecanClick(p.name, p.sign)}
                              className="rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                                alt=""
                                className="size-8 cursor-pointer hover:scale-125 transition-all hover:brightness-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                            Decan Information
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {p.house && (
                      <div className="absolute right-4 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 font-bold uppercase tracking-widest px-3 py-1">
                          {`House ${p.house}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="interp-gradient-default px-4 py-3 pb-8 space-y-1.5" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                    {forecasts.map((f: string, fi: number) => (
                      <p key={fi} className="leading-relaxed">{f}</p>
                    ))}
                    {forecasts.length === 0 && <p className="italic">No forecast available.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 4. Solar Return House Cusps section */}
      {(cuspObj.ascendant || cuspObj.midheaven || cuspObj.vertex || houseList.length > 0) && (
        <div className="space-y-2">
          <div className="horoscope-table-container">
            <div className="horoscope-table-header">
              <h3>Solar Return House Cusps</h3>
            </div>

            {/* Critical Points Subset */}
            {(cuspObj.ascendant || cuspObj.midheaven || cuspObj.vertex) && (
              <div className="horoscope-table-wrapper border-b border-white/5">
                <table className="horoscope-table">
                  <thead>
                    <tr>
                      {["Ascendant", "Midheaven", "Vertex"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[cuspObj.ascendant, cuspObj.midheaven, cuspObj.vertex].map((val, i) => (
                        <td key={i}>
                          {val ? (
                            typeof val === "object" ? (
                              <div className="flex items-center gap-3">
                                <ZodiacSymbol sign={val?.sign} />
                                <span className="td-mono">{Number(val?.degree ?? 0).toFixed(2)}°</span>
                              </div>
                            ) : (
                              <span className="td-mono">{Number(val).toFixed(2)}°</span>
                            )
                          ) : "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Regular Houses Subset */}
            {houseList.length > 0 && (
              <div className="horoscope-table-wrapper">
                <table className="horoscope-table">
                  <thead>
                    <tr>
                      {["House", "Sign", "Degree"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {houseList.map((h: any, i: number) => (
                      <tr key={`house-${i}`}>
                        <td className="font-medium">House {h.house}</td>
                        <td><ZodiacSymbol sign={h.sign} /></td>
                        <td className="td-mono">{Number(h.degree ?? 0).toFixed(2)}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {aiData && renderAiCards(detailsAi, "Solar Return Details Interpretation", false)}
        </div>
      )}

      {/* 5. Solar Return Planet Aspects table */}
      {aspectList.length > 0 && (
        <div className="horoscope-table-container">
          <div className="horoscope-table-header">
            <h3>Solar Return Planet Aspects</h3>
          </div>
          <div className="horoscope-table-wrapper">
            <table className="horoscope-table">
              <thead>
                <tr>
                  {["SR Planet", "Natal Planet", "Type", "Orb"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aspectList.map((a: any, i: number) => (
                  <tr key={i}>
                    <td className="td-planet"><PlanetSymbol name={a.solar_return_planet ?? a.aspecting_planet ?? a.planet1 ?? "—"} /></td>
                    <td className="td-planet"><PlanetSymbol name={a.natal_planet ?? a.aspected_planet ?? a.planet2 ?? "—"} /></td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        {ASPECT_IMAGES[a.type] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ASPECT_IMAGES[a.type]} alt={a.type} className="size-4 object-contain" />
                        )}
                        {a.type}
                      </span>
                    </td>
                    <td className="td-mono">{Number(a.orb ?? 0).toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Solar Return Aspects Report — Unified Grouping */}
      {aspectsReport !== null && aspectsReport !== undefined && (() => {
        const items: any[] = Array.isArray(aspectsReport) ? aspectsReport : [];
        if (items.length === 0) return null;

        // Group reciprocal aspects to prevent duplicate headers
        const seenAspects = new Set();
        const groupedItems = items.filter(a => {
          const srP = a.solar_return_planet ?? a.aspecting_planet ?? "";
          const nP = a.natal_planet ?? a.aspected_planet ?? "";
          const type = a.type ?? "";

          // Create a unique key regardless of order (e.g., Uranus-Neptune-Opposition)
          const key = [srP, nP].sort().join("-") + "-" + type;

          if (seenAspects.has(key)) return false;
          seenAspects.add(key);
          return true;
        });

        return (
          <div className="space-y-2">
            <div className="horoscope-section-header bg-black py-4 text-center rounded-lg mb-4">
              <h3 className="text-white text-[20px] font-semibold uppercase tracking-wide">Solar Return Planet Aspects Interpretations</h3>
            </div>
            {groupedItems.map((a: any, i: number) => {
              const srPlanet = a.solar_return_planet ?? a.aspecting_planet ?? "";
              const nPlanet = a.natal_planet ?? a.aspected_planet ?? "";
              const aType = a.type ?? "";

              // Construct a unified title for the parser
              const unifiedTitle = `${srPlanet} ${aType} ${nPlanet}`;
              const forecast = a.forecast ?? a.interpretation ?? "";

              return (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-3 horoscope-interp-header text-center">
                    <AstroHeaderParts title={unifiedTitle} />
                  </div>

                  <div className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                    <p className="leading-relaxed text-center">
                      {String(forecast)}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={() => trigger(unifiedTitle, String(forecast), a, areaOfInquiry, unifiedTitle)}
                        className="horoscope-show-more"
                      >
                        Show More
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}


    </div>
  );
}

// ─── Transit Section ──────────────────────────────────────────────────────────

type TransitAiCard = {
  date: string | null;
  title: string;
  interpretation: string;
  raw: unknown;
};

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function extractTransitAiCards(input: unknown): TransitAiCard[] {
  const cards: TransitAiCard[] = [];

  function collect(node: unknown, inheritedDate: string | null = null) {
    const parsed = parseAiJsonResponse(node);
    if (parsed !== node) {
      collect(parsed, inheritedDate);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((entry) => collect(entry, inheritedDate));
      return;
    }

    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const date =
      pickString(record, ["date", "transit_date", "month", "period"]) ??
      inheritedDate;

    for (const key of ["transits", "items", "entries", "data"]) {
      if (Array.isArray(record[key])) collect(record[key], date);
    }

    const title =
      pickString(record, ["aspecttitle", "aspectTitle", "aspect_title", "heading", "title", "aspect"]) ??
      "";
    const interpretation = normalizeInterpretationText(
      record.interpretation ??
      record.interpret ??
      record.body_text ??
      record.body ??
      record.content ??
      record.description ??
      record.text ??
      record.forecast
    );

    if (!title && !interpretation) return;

    cards.push({
      date,
      title: title || "Transit Interpretation",
      interpretation,
      raw: node,
    });
  }

  collect(input);
  return cards.filter((card) => card.interpretation.trim());
}

function TransitSection({ data, lunarMetrics, aiData, lunarAiData, tabSlug, areaOfInquiry, checkDacen, onDecanClick, transitWheelSvg, setChartModal }: {
  data: any; lunarMetrics?: any; aiData: any; lunarAiData?: any; tabSlug: string; areaOfInquiry?: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
  transitWheelSvg?: string | null;
  setChartModal: (src: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();
  const isWeekly = tabSlug === "tropical_transits_weekly_v2";
  const label = isWeekly ? "Weekly Transits" : "Monthly Transits";
  const isMonthlyV3 = tabSlug === "tropical_transits_monthly_v3";
  const monthlyTransitAiCards = isMonthlyV3 ? extractTransitAiCards(aiData) : [];

  function toTimestamp(value: unknown): number {
    if (typeof value !== "string" || !value.trim()) return Number.POSITIVE_INFINITY;
    const direct = Date.parse(value);
    if (!Number.isNaN(direct)) return direct;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    return Number.POSITIVE_INFINITY;
  }

  // Normalise transit relation rows — handles both Lambda and AstrologyAPI shapes
  const transitRows: any[] = (() => {
    if (!data) return [];
    const sourceRows = isMonthlyV3 && Array.isArray(data?.unique_transits)
      ? data.unique_transits
      : Array.isArray(data?.transit_relation)
        ? data.transit_relation
        : Array.isArray(data?.transits)
          ? data.transits
          : Array.isArray(data)
            ? data
            : null;

    if (sourceRows) {
      if (!isMonthlyV3) return sourceRows;

      const excludedBodies = new Set(["lilith", "ascendant", "asc", "midheaven", "mc", "vertex"]);
      const allowedAspectTypes = new Set(["conjunction", "opposition", "square", "trine", "sextile"]);

      return sourceRows
        .filter((row: any) => {
          const tPlanet = String(row?.transit_planet ?? row?.transiting_planet ?? "").trim().toLowerCase();
          const nPlanet = String(row?.natal_planet ?? row?.aspected_planet ?? "").trim().toLowerCase();
          const aspectType = String(row?.type ?? row?.aspect ?? "").trim().toLowerCase();

          if (!tPlanet || !nPlanet || !aspectType) return false;
          if (excludedBodies.has(tPlanet) || excludedBodies.has(nPlanet)) return false;
          if (tPlanet === "moon" || nPlanet === "moon") return false;
          if (!allowedAspectTypes.has(aspectType)) return false;

          return true;
        })
        .sort((a: any, b: any) => {
          const aTime = toTimestamp(a?.date ?? a?.transit_date ?? "");
          const bTime = toTimestamp(b?.date ?? b?.transit_date ?? "");
          if (aTime !== bTime) return aTime - bTime;

          const aTransit = String(a?.transit_planet ?? a?.transiting_planet ?? "");
          const bTransit = String(b?.transit_planet ?? b?.transiting_planet ?? "");
          if (aTransit !== bTransit) return aTransit.localeCompare(bTransit);

          const aNatal = String(a?.natal_planet ?? a?.aspected_planet ?? "");
          const bNatal = String(b?.natal_planet ?? b?.aspected_planet ?? "");
          if (aNatal !== bNatal) return aNatal.localeCompare(bNatal);

          return String(a?.type ?? a?.aspect ?? "").localeCompare(String(b?.type ?? b?.aspect ?? ""));
        });
    }

    if (data?.transit_planet && typeof data.transit_planet === "object") {
      return Object.entries(data.transit_planet).flatMap(([tPlanet, aspects]: [string, any]) =>
        Object.entries(aspects ?? {}).map(([nPlanet, detail]: [string, any]) => ({
          transit_planet: tPlanet, natal_planet: nPlanet,
          type: detail?.aspect_type ?? detail?.type ?? "",
          orb: detail?.orb ?? "",
          date: detail?.date ?? "",
          ...(typeof detail === "object" ? detail : {}),
        }))
      );
    }
    return [];
  })();

  const lunarRows: any[] = (() => {
    const src = lunarMetrics ?? data?.lunar_data ?? data?.lunar_metrics;
    if (!src) return [];
    if (Array.isArray(src)) return src;
    if (typeof src === "object") return Object.values(src);
    return [];
  })();

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />

      {/* Transit Chart Image Section */}
      {transitWheelSvg && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 horoscope-section-header text-center flex items-center justify-center gap-2">
            <h3 className="text-[20px] font-semibold text-center w-full text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>Western Chart Horoscope</h3>
          </div>
          <div className="p-6 bg-slate-950 flex justify-center border-b border-white/5">
            <div className="relative group max-w-lg w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transitWheelSvg}
                alt="Transit Chart"
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform duration-700 hover:scale-[1.02] cursor-pointer"
                onClick={() => setChartModal(transitWheelSvg)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Future Lunar Metrics Table — specifically for monthly v3 */}
      {tabSlug === "tropical_transits_monthly_v3" && lunarMetrics && (
        <div className="space-y-6">
          <div className="horoscope-table-container">
            <div className="horoscope-table-header">
              <h3>Future Lunar Metrics</h3>
            </div>
            <div className="horoscope-table-wrapper">
              <table className="horoscope-table">
                <thead>
                  <tr>
                    {["Month", "Moon Day", "Moon Illumination", "Moon Phase", "Moon Sign"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {(() => {
                        const mStr = String(lunarMetrics.month || "");
                        if (mStr.includes("-")) {
                          const [, m] = mStr.split("-").map(Number);
                          return getMonthName(m);
                        }
                        return mStr || "—";
                      })()}
                    </td>
                    <td>{lunarMetrics.moon_day ?? "—"}</td>
                    <td>{lunarMetrics.moon_illumination != null ? `${lunarMetrics.moon_illumination}%` : "—"}</td>
                    <td>{lunarMetrics.moon_phase ?? "—"}</td>
                    <td>{lunarMetrics.moon_sign ? <ZodiacSymbol sign={lunarMetrics.moon_sign} /> : "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Lunar AI Interpretations (Monthly v3) */}
          {lunarAiData && typeof lunarAiData === "object" ? (
            <div className="space-y-6">
              {[
                { key: "moon_sign_interpretation", label: "Moon Sign Interpretation", val: lunarMetrics?.moon_sign, title: "Moon Sign" },
                { key: "moon_phase_interpretation", label: "Moon Phase Interpretation", val: lunarMetrics?.moon_phase, title: "Moon Phase" },
                { key: "moon_age_interpretation", label: "Moon Age Interpretation", val: `${lunarMetrics?.moon_day ?? lunarMetrics?.day ?? "—"} days old`, title: "Moon Age" },
                { key: "moon_day_interpretation", label: "Moon Day Interpretation", val: lunarMetrics?.moon_day, title: "Moon Day" },
                { key: "moon_illumination_interpretation", label: "Moon Illumination Interpretation", val: `${lunarMetrics?.moon_illumination}%`, title: "Moon Illumination" },
              ].map((sec) => {
                const content = lunarAiData[sec.key];
                if (!content || typeof content !== "string") return null;
                const fullTitle = `${sec.label}${sec.val ? `: ${sec.val}` : ""}`;
                return (
                  <div key={sec.key} className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center">
                      <SmartHeading title={fullTitle} textSize="text-[22px]" iconSize="size-7" className="text-black" />
                    </div>
                    <div className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                      <p className="leading-relaxed line-clamp-3">{content}</p>
                      <div className="mt-2 flex justify-center border-t border-black/10 pt-2">
                        <button
                          onClick={() => trigger(fullTitle, content, null, areaOfInquiry)}
                          className="horoscope-show-more"
                        >
                          Show More
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <SectionSkeleton title="Moon Sign Interpretation" />
              <SectionSkeleton title="Moon Phase Interpretation" />
              <SectionSkeleton title="Moon Age Interpretation" />
            </div>
          )}
        </div>
      )}

      {/* Future Tropical Transits Monthly Relation Table — specifically for monthly v3 */}
      {tabSlug === "tropical_transits_monthly_v3" && transitRows.length > 0 && (
        <div className="space-y-4">
          <div className="horoscope-table-container">
            <div className="horoscope-table-header">
              <h3>Future Tropical Transits Monthly Relation</h3>
            </div>
            <div className="horoscope-table-wrapper">
              <table className="horoscope-table">
                <thead>
                  <tr>
                    {["Date", "Natal Planet", "Type", "Transit Planet"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transitRows.map((row: any, i: number) => {
                    const tPlanet = row.transit_planet ?? row.transiting_planet ?? "";
                    const nPlanet = row.natal_planet ?? row.aspected_planet ?? "";
                    const aspType = row.type ?? row.aspect ?? "";
                    const dt = row.date ?? row.transit_date ?? "";
                    return (
                      <tr key={i}>
                        <td className="td-mono">{dt || "—"}</td>
                        <td>{nPlanet ? <PlanetSymbol name={nPlanet} /> : "—"}</td>
                        <td><AspectSymbol type={aspType} /></td>
                        <td>{tPlanet ? <PlanetSymbol name={tPlanet} /> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!aiData && (
            <SectionSkeleton title="Future Tropical Transits Monthly Relation Interpretation" />
          )}
          {aiData === "error" && (
            <SectionError title="Future Tropical Transits Monthly Relation Interpretation" />
          )}
          {monthlyTransitAiCards.length > 0 && (
            <div className="space-y-3">
              {monthlyTransitAiCards.map((card, i) => (
                <div key={`${card.date ?? "date"}-${card.title}-${i}`} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-center">

                      <SmartHeading title={card.title} textSize="text-[22px]" iconSize="size-7" className="text-black" />
                    </div>
                  </div>
                  <div className="interp-gradient-default px-4 py-3 pb-8" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                    <p className="leading-relaxed whitespace-pre-line">{card.interpretation}</p>
                    <div className="mt-2 flex justify-center pt-2 border-t border-black/10">
                      <button
                        onClick={() => trigger(card.title, card.interpretation, card.raw, areaOfInquiry)}
                        className="horoscope-show-more"
                      >
                        Show More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly / Monthly Transit Relation Table */}
      {tabSlug !== "tropical_transits_monthly_v3" && transitRows.length > 0 && (
        <div className="horoscope-table-container">
          <div className="horoscope-table-header">
            <h3>
              {tabSlug === "tropical_transits_weekly_v2" ? "Future Tropical Transits Weekly Relation" : `${label} — Transit Aspects`}
            </h3>
          </div>
          <div className="horoscope-table-wrapper">
            <table className="horoscope-table">
              <thead>
                <tr>
                  {(() => {
                    const headers = tabSlug === "tropical_transits_weekly_v2"
                      ? ["Date", "Transit Planet", "Aspect", "Natal Planet"]
                      : ["Transit Planet", "Aspect", "Natal Planet", "Orb", "Date"];
                    return headers.map((h) => (
                      <th key={h}>{h}</th>
                    ));
                  })()}
                </tr>
              </thead>
              <tbody>
                {transitRows.map((row: any, i: number) => {
                  const tPlanet = row.transit_planet ?? row.transiting_planet ?? row.planet ?? "";
                  const nPlanet = row.natal_planet ?? row.aspected_planet ?? "";
                  const aspType = row.type ?? row.aspect_type ?? row.aspect ?? "";
                  const orb = row.orb != null ? `${Number(row.orb).toFixed(2)}°` : "—";
                  const dt = row.date ?? row.transit_date ?? "";

                  return (
                    <tr key={i}>
                      {tabSlug === "tropical_transits_weekly_v2" ? (
                        <>
                          <td className="td-mono">{dt || "—"}</td>
                          <td>{tPlanet ? <PlanetSymbol name={tPlanet} /> : "—"}</td>
                          <td><AspectSymbol type={aspType} /></td>
                          <td>{nPlanet ? <PlanetSymbol name={nPlanet} /> : "—"}</td>
                        </>
                      ) : (
                        <>
                          <td>{tPlanet ? <PlanetSymbol name={tPlanet} /> : "—"}</td>
                          <td><AspectSymbol type={aspType} /></td>
                          <td>{nPlanet ? <PlanetSymbol name={nPlanet} /> : "—"}</td>
                          <td className="td-mono">{orb}</td>
                          <td className="td-mono">{dt || "—"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lunar Return Metrics (monthly only) */}
      {tabSlug !== "tropical_transits_monthly_v3" && !isWeekly && lunarRows.length > 0 && (
        <div className="horoscope-table-container">
          <div className="horoscope-table-header">
            <h3>Lunar Return Metrics</h3>
          </div>
          <div className="horoscope-table-wrapper">
            <table className="horoscope-table">
              <thead>
                <tr>
                  {["Date / Month", "Moon Day", "Illumination", "Phase", "Moon Sign"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lunarRows.map((row: any, i: number) => (
                  <tr key={i}>
                    <td>{row.date ?? row.month ?? `Month ${i + 1}`}</td>
                    <td>{row.moon_day ?? row.day ?? "—"}</td>
                    <td>{row.moon_illumination != null ? `${Number(row.moon_illumination).toFixed(1)}%` : (row.illumination ?? "—")}</td>
                    <td>{row.moon_phase ?? row.phase ?? "—"}</td>
                    <td>{row.moon_sign ? <ZodiacSymbol sign={row.moon_sign} /> : (row.sign ? <ZodiacSymbol sign={row.sign} /> : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI interpretation cards */}
      {!isMonthlyV3 && !aiData && <SectionSkeleton title={`${label} Interpretation`} />}
      {!isMonthlyV3 && aiData === "error" && <SectionError title={`${label} Interpretation`} />}
      {!isMonthlyV3 && Array.isArray(aiData) && aiData.map((item: any, i: number) => {
        const title = item.aspecttitle ?? item.title ?? item.aspect ?? "";
        const interpretation = normalizeInterpretationText(item.interpretation ?? item.data ?? "");
        if (!interpretation) return null;

        const RelationshipHeading = () => {
          const planets = Object.keys(PLANET_IMAGES);
          const aspects = Object.keys(ASPECT_IMAGES);
          const foundPlanets = planets.filter(p => new RegExp(`\\b${p}\\b`, "i").test(title));
          const foundAspect = aspects.find(a => new RegExp(`\\b${a}\\b`, "i").test(title));

          if (foundPlanets.length >= 2 && foundAspect) {
            const p1 = foundPlanets.find(p => title.toLowerCase().indexOf(p.toLowerCase()) < title.toLowerCase().indexOf(foundAspect.toLowerCase()));
            const p2 = foundPlanets.find(p => title.toLowerCase().indexOf(p.toLowerCase()) > title.toLowerCase().indexOf(foundAspect.toLowerCase()));
            if (p1 && p2) {
              return (
                <div className="flex items-center justify-center gap-3">
                  <PlanetSymbol name={p1} />
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                    <AspectSymbol type={foundAspect} showText={false} />
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">{foundAspect}</span>
                  </div>
                  <PlanetSymbol name={p2} />
                </div>
              );
            }
          }

          const relMatch = title.match(/(\b[A-Z][a-z]+\b)\s+(\b[A-Z][a-z]+\b)\s+(\b[A-Z][a-z]+\b)/);
          if (relMatch) {
            const [, p1, asp, p2] = relMatch;
            return (
              <div className="flex items-center justify-center gap-3">
                <PlanetSymbol name={p1} />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                  <AspectSymbol type={asp} showText={false} />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">{asp}</span>
                </div>
                <PlanetSymbol name={p2} />
              </div>
            );
          }
          return <span className="uppercase tracking-widest font-bold text-amber-500/80">{title || `${label} ${i + 1}`}</span>;
        };

        return (
          <div key={i} className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center">
              <div className="text-sm font-semibold text-center w-full">
                <SmartHeading title={title} textSize="text-[22px]" iconSize="size-7" className="text-black" />
              </div>
            </div>
            <div className="interp-gradient-default px-4 py-3 pb-8" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
              <p className="leading-relaxed whitespace-pre-line">{interpretation}</p>
              <div className="mt-2 flex justify-center pt-2 border-t border-black/10">
                <button
                  onClick={() => trigger(title || `${label} ${i + 1}`, interpretation, item, areaOfInquiry)}
                  className="horoscope-show-more"
                >
                  Show More
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {tabSlug !== "tropical_transits_monthly_v3" && !isWeekly && lunarAiData && (() => {
        const items: any[] = Array.isArray(lunarAiData) ? lunarAiData : (typeof lunarAiData === "object" ? [lunarAiData] : []);
        return items.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold px-1">Lunar Return AI Interpretation</h3>
            {items.map((item: any, i: number) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <div className="px-4 py-2.5 horoscope-section-header flex items-center justify-center gap-2">
                  <h4 className="text-sm font-semibold text-center w-full">{item.title ?? `Lunar Return ${i + 1}`}</h4>
                  {(() => {
                    const titleStr = String(item.title ?? "");
                    const match = titleStr.match(/(\b[A-Z][a-z]+\b)\s+in\s+(\b[A-Z][a-z]+\b)/);
                    if (match) {
                      const p = match[1];
                      const s = match[2];
                      if (checkDacen(p, s)) {
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onDecanClick(p, s)}
                                className="rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                                  alt=""
                                  className="size-5 cursor-pointer hover:scale-125 transition-all hover:brightness-150 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                              Decan Information
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                <div className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                  <p className="leading-relaxed">{normalizeInterpretationText(item.interpretation ?? item.data ?? item)}</p>
                  <div className="mt-2 flex justify-center">
                    <button onClick={() => trigger(item.title ?? "Lunar Return", normalizeInterpretationText(item.interpretation ?? item.data ?? item), item, areaOfInquiry)} className="horoscope-show-more">Show More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {data && transitRows.length === 0 && !Array.isArray(aiData) && (
        <details className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">{label} Raw Data</summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}


// ─── Horary Section ───────────────────────────────────────────────────────────

function HorarySection({ data, slug, areaOfInquiry, checkDacen, onDecanClick }: {
  data: any; slug: string; areaOfInquiry?: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  if (!data) return <SectionSkeleton title="Horary Chart Interpretation" />;
  if (data === "error") return <SectionError title="Horary Chart Interpretation" />;

  // Unwrap nested `data` key returned by AI
  const inner = data?.data ?? data;

  // Correct paths per AI response schema:
  //   inner.astrological_aspect.aspect  = [{title, data}]
  //   inner.astrological_aspect.planet  = [{title, data}]
  //   inner.astrological_aspect.house   = [{title, data}]
  //   inner.summary.answer              = [{title, data}]
  //   inner.summary.recommendation      = [{title, data}]
  //   inner.summary.recommendation_on_date_and_timeline = [{timeline_title, timeline_data}]
  const astroAspect = inner?.astrological_aspect ?? {};
  const aspectItems: any[] = Array.isArray(astroAspect?.aspect) ? astroAspect.aspect : [];
  const planetItems: any[] = Array.isArray(astroAspect?.planet) ? astroAspect.planet : [];
  const houseItems: any[] = Array.isArray(astroAspect?.house) ? astroAspect.house : [];

  const summary = inner?.summary ?? {};
  const timelineItems: any[] = Array.isArray(summary?.recommendation_on_date_and_timeline) ? summary.recommendation_on_date_and_timeline : [];
  const answerItems: any[] = Array.isArray(summary?.answer) ? summary.answer : [];
  const recommendItems: any[] = Array.isArray(summary?.recommendation) ? summary.recommendation : [];

  // Helper to extract a range title like "Between May 2026 and July 2026"
  const getTimelineRangeTitle = () => {
    const dateStrings: string[] = [];
    const spanRegex = /<span class="timedata">([^<]+)<\/span>/g;
    timelineItems.forEach(item => {
      let m;
      while ((m = spanRegex.exec(item.timeline_data)) !== null) {
        dateStrings.push(m[1]);
      }
    });

    if (dateStrings.length === 0) return "Recommendation on Date and Timeline";

    const parsedDates = dateStrings.map(d => {
      // "May 5th, 2026" -> "May 5 2026"
      const clean = d.replace(/(st|nd|rd|th)/, "").replace(",", "");
      return new Date(clean);
    }).filter(d => !isNaN(d.getTime()));

    if (parsedDates.length === 0) return "Recommendation on Date and Timeline";

    parsedDates.sort((a, b) => a.getTime() - b.getTime());
    const start = parsedDates[0];
    const end = parsedDates[parsedDates.length - 1];

    const fmt = (d: Date) => d.toLocaleString("en-US", { month: "long", year: "numeric" });
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `For ${fmt(start)}`;
    }
    return `Between ${fmt(start)} and ${fmt(end)}`;
  };



  const contentStyle: React.CSSProperties = {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "20px",
    fontWeight: 400,
    lineHeight: "26px",
  };

  // Render text that may contain <span class="timedata">…</span> HTML from the AI
  function HtmlText({ html, className }: { html: string; className?: string }) {
    return (
      <p
        className={className ?? "leading-relaxed"}
        dangerouslySetInnerHTML={{ __html: html ?? "" }}
      />
    );
  }

  // A single card with White Header + Gradient Body, wrapped in a Slate container
  function HoraryCard({ title, content, itemObj }: { title?: string; content: any; itemObj?: any }) {
    if (!content) return null;

    const renderTitleWithIcons = (t: string) => {
      // Split into words while keeping spaces
      const tokens = t.split(/(\s+)/);
      return (
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight text-center flex flex-wrap items-center justify-center">
          {tokens.map((token, i) => {
            if (/^\s+$/.test(token)) return <span key={i} className="inline-block w-[0.25em]"></span>;
            const clean = token.replace(/[(),]/g, "");
            const icon = PLANET_IMAGES[clean] || LADDER_PLANET_IMAGES[clean] || ASPECT_IMAGES[clean] || ASTRO_HEADER_IMAGES[clean];
            return (
              <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                {token}
                {icon && <img src={icon} alt={clean} className="size-6 md:size-7 object-contain" />}
              </span>
            );
          })}
        </h2>
      );
    };

    return (
      <div className="bg-[#232c3c] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex flex-col border border-black/10">
          {title && (
            <div className="bg-white py-3 px-6 flex items-center justify-center">
              {renderTitleWithIcons(title)}
            </div>
          )}
          <div className={cn(getRelationshipBgClass(title ?? "", slug), "text-center p-6")} style={contentStyle}>
            {typeof content === "string" ? <HtmlText html={content} /> : content}
          </div>
        </div>
      </div>
    );
  }

  // A group section with a dark header bar + multiple HoraryCards below
  function GroupSection({ sectionTitle, sectionPath, items }: { sectionTitle: string; sectionPath: string; items: any[] }) {
    if (!items.length) return null;
    return (
      <div className="space-y-4" data-section-path={sectionPath} data-section-label={sectionTitle}>
        <div className="px-4 py-3 bg-[#111827] border border-white/10 rounded-lg text-center shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            {sectionTitle}
          </h3>
        </div>
        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <HoraryCard
              key={i}
              title={item.title}
              content={item.data ?? item.text ?? String(item)}
              itemObj={item}
            />
          ))}
        </div>
      </div>
    );
  }

  const hasContent = timelineItems.length > 0 || houseItems.length > 0 || planetItems.length > 0 || aspectItems.length > 0 || answerItems.length > 0 || recommendItems.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-4">

      {/* ── Section 1: Recommendation on Date & Timeline ─────────────────── */}
      {timelineItems.length > 0 && (
        <div className="space-y-4" data-section-path="summary.recommendation_on_date_and_timeline" data-section-label="Timeline Section">
          <div className="px-4 py-3 bg-[#111827] border border-white/10 rounded-lg text-center shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Recommendation on Date and Timeline
            </h3>
          </div>
          <HoraryCard
            title={getTimelineRangeTitle()}
            content={
              <div className="space-y-6">
                {timelineItems.map((s, idx) => {
                  // Strip leading "Between <span class="timedata">...</span>", "On <span class="timedata">...</span>", etc.
                  const cleanedBody = s.timeline_data.replace(/^\s*(Between|During|On|From|Starting|In|Throughout)\s+(the period of|the month of|the dates of)?\s*<span class="timedata">[^<]+<\/span>(,)?\s*/i, "");
                  return (
                    <div key={idx} className={idx > 0 ? "pt-6 border-t border-black/10" : ""}>
                      <HtmlText html={cleanedBody} />
                    </div>
                  );
                })}
              </div>
            }
          />
        </div>
      )}

      {/* ── Section 2: Aspect ────────────────────────────────────────────── */}
      <GroupSection sectionTitle="Aspect" sectionPath="astrological_aspect.aspect" items={aspectItems} />

      {/* ── Section 3: Planet ────────────────────────────────────────────── */}
      <GroupSection sectionTitle="Planet" sectionPath="astrological_aspect.planet" items={planetItems} />

      {/* ── Section 4: House ─────────────────────────────────────────────── */}
      <GroupSection sectionTitle="House" sectionPath="astrological_aspect.house" items={houseItems} />

      {/* ── Section 5a: Summary — Answer ─────────────────────────────────── */}
      {answerItems.length > 0 && (
        <GroupSection sectionTitle="Summary" sectionPath="summary.answer" items={answerItems} />
      )}

      {/* ── Section 5b: Summary — Recommendations ────────────────────────── */}
      {recommendItems.length > 0 && (
        <GroupSection sectionTitle="Recommendations" sectionPath="summary.recommendation" items={recommendItems} />
      )}

      {/* Fallback raw data when nothing parsed correctly */}
      {!hasContent && (
        <details className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">
            Horary Chart Raw Data
          </summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// ─── Tab Bar (horizontal scrollable with arrow buttons) ──────────────────────

function TabBar({
  currentSlug,
  onSelect,
  tabs,
  disabled = false,
}: {
  currentSlug: string;
  onSelect: (slug: string) => void;
  tabs: TabDef[];
  disabled?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  // Scroll active tab into view when slug changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLButtonElement>("[data-active='true']");
    activeBtn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [currentSlug]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  }

  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex items-center gap-1 px-2 py-2">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={cn(
            "shrink-0 flex items-center justify-center size-7 rounded-full border transition-all",
            canScrollLeft
              ? "bg-background text-foreground hover:bg-muted border-border"
              : "opacity-25 cursor-not-allowed border-transparent"
          )}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Scrollable pill row */}
        <div
          ref={scrollRef}
          className="flex flex-1 gap-1 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.slug === currentSlug;
            const tabDisabled = disabled && !active;
            return (
              <button
                key={tab.slug}
                data-active={active}
                disabled={tabDisabled}
                onClick={() => {
                  if (!tabDisabled) onSelect(tab.slug);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-all",
                  active
                    ? "bg-amber-500 text-white font-medium shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  tabDisabled && "cursor-not-allowed opacity-45 hover:bg-muted hover:text-muted-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={cn(
            "shrink-0 flex items-center justify-center size-7 rounded-full border transition-all",
            canScrollRight
              ? "bg-background text-foreground hover:bg-muted border-border"
              : "opacity-25 cursor-not-allowed border-transparent"
          )}
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── BirthBlock ───────────────────────────────────────────────────────────────

function BirthBlock({ title, value, onChange, disabled }: { title?: string; value: BirthInput; onChange: (v: BirthInput) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{title}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</Label>
          <DatePicker value={value.dob} onChange={(v) => onChange({ ...value, dob: v })} disabled={disabled} />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time of Birth</Label>
          <TimePicker value={value.tob} onChange={(v) => onChange({ ...value, tob: v })} disabled={disabled} />
        </div>
        <CityAutocomplete value={value.city} onChange={(c) => onChange({ ...value, city: c })} disabled={disabled} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export interface HoroscopeToolkitPageProps {
  basePath?: string;
  allowedSlugs?: string[];
  initialPrefill?: string | null;
  initialSavedFormData?: unknown;
  initialSavedReport?: unknown;
  autoSubmitPrefill?: boolean;
  readOnlyBirthData?: boolean;
  communityNatalFamilyMemberId?: string | null;
  /**
   * Community relationship-report linkage. When BOTH ids are set AND the
   * active toolkit slug is one of the relationship slugs (romantic /
   * friendship / business), a successful generation will POST the full
   * payload to /api/community/saved-reports/relationship/link so the
   * report can be hydrated from DB on the next View. Admin paths leave
   * these null and the save call is skipped.
   */
  communityRelationshipPersonAId?: string | null;
  communityRelationshipPersonBId?: string | null;
}

export function HoroscopeToolkitPage({
  basePath = "/admin/horoscope",
  allowedSlugs,
  initialPrefill = null,
  initialSavedFormData = null,
  initialSavedReport = null,
  autoSubmitPrefill = true,
  readOnlyBirthData = false,
  communityNatalFamilyMemberId = null,
  communityRelationshipPersonAId = null,
  communityRelationshipPersonBId = null,
}: HoroscopeToolkitPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultRef = useRef<HTMLDivElement>(null);

  const matchedAllowedTabs = allowedSlugs?.length
    ? allowedSlugs
      .map((slug) => TABS.find((tab) => tab.slug === slug))
      .filter((tab): tab is TabDef => Boolean(tab))
    : TABS;
  const visibleTabs = matchedAllowedTabs.length ? matchedAllowedTabs : TABS;
  const fallbackTab = visibleTabs[0] ?? TABS[0];
  const requestedSlug = searchParams.get("tab");
  const currentSlug =
    requestedSlug && visibleTabs.some((tab) => tab.slug === requestedSlug)
      ? requestedSlug
      : fallbackTab.slug;
  const currentTab = visibleTabs.find((t) => t.slug === currentSlug) ?? fallbackTab;
  const initialForm = useMemo<FormState>(
    () => formStateFromSavedFormData(initialSavedReport ?? initialSavedFormData),
    [initialSavedFormData, initialSavedReport]
  );
  const initialSavedToolkitState = useMemo(
    () => hydrateSavedAstroReport(initialSavedReport, currentSlug),
    [initialSavedReport, currentSlug]
  );

  const [form, setForm] = useState<FormState>(() => initialForm);
  const isFormValid = (() => {
    const p1 = form.person1;
    if (!p1.dob || !p1.tob || !p1.city) return false;
    if (currentTab.type === "two-person") {
      const p2 = form.person2;
      if (!p2.dob || !p2.tob || !p2.city) return false;
    }
    if (currentTab.extras?.includes("question") && !form.question.trim()) return false;
    return true;
  })();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any> | null>(() => initialSavedToolkitState.results);
  const [natalSvg, setNatalSvg] = useState<string | null>(() => initialSavedToolkitState.natalSvg);
  const [natalSvgTransit, setNatalSvgTransit] = useState<string | null>(() => initialSavedToolkitState.natalSvgTransit);
  const [natalSvgP2, setNatalSvgP2] = useState<string | null>(() => initialSavedToolkitState.natalSvgP2);
  const [natalSvgTransitP2, setNatalSvgTransitP2] = useState<string | null>(() => initialSavedToolkitState.natalSvgTransitP2);
  const [returnDate, setReturnDate] = useState<string | null>(() => initialSavedToolkitState.returnDate);
  const [progress, setProgress] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showChartBtn, setShowChartBtn] = useState(() => initialSavedToolkitState.showChartButton);
  const [chartModal, setChartModal] = useState<string | null>(null);
  const [transitChartSvg, setTransitChartSvg] = useState<string | null>(() => initialSavedToolkitState.transitChartSvg);
  const [dacenPsibality, setDacenPsibality] = useState<DecanPossibility[]>([]);
  const [decanPlanet, setDecanPlanet] = useState<{ name: string; sign: string } | null>(null);
  const [excludedHoraryDates, setExcludedHoraryDates] = useState<string>("");
  const [isSuggestingDate, setIsSuggestingDate] = useState(false);

  useEffect(() => {
    if (!initialSavedReport) return;

    setResults(initialSavedToolkitState.results);
    setNatalSvg(initialSavedToolkitState.natalSvg);
    setNatalSvgTransit(initialSavedToolkitState.natalSvgTransit);
    setNatalSvgP2(initialSavedToolkitState.natalSvgP2);
    setNatalSvgTransitP2(initialSavedToolkitState.natalSvgTransitP2);
    setTransitChartSvg(initialSavedToolkitState.transitChartSvg);
    setReturnDate(initialSavedToolkitState.returnDate);
    setShowChartBtn(initialSavedToolkitState.showChartButton);
    setProgress([]);
    setLoading(false);
    setError(null);
    setShowScrollTop(true);
  }, [initialSavedReport, initialSavedToolkitState]);

  const checkDacen = (planetName: string, signName: string) => {
    const normalizedPlanet = normalizeDecanValue(planetName);
    const normalizedSign = normalizeDecanValue(signName);
    if (!normalizedPlanet || !normalizedSign || !dacenPsibality?.length) return false;
    return dacenPsibality.some((item) => {
      const itemPlanet = normalizeDecanValue(item.planet);
      const itemSign = normalizeDecanValue(item.sign_name ?? item.signs);
      return itemPlanet === normalizedPlanet && itemSign === normalizedSign;
    });
  };

  // Reset on tab change
  useEffect(() => {
    setResults(initialSavedToolkitState.results); setNatalSvg(initialSavedToolkitState.natalSvg); setNatalSvgTransit(initialSavedToolkitState.natalSvgTransit);
    setNatalSvgP2(initialSavedToolkitState.natalSvgP2); setNatalSvgTransitP2(initialSavedToolkitState.natalSvgTransitP2);
    setReturnDate(initialSavedToolkitState.returnDate); setError(null); setProgress([]); setForm(initialForm);
    setShowScrollTop(false); setShowChartBtn(initialSavedToolkitState.showChartButton); setTransitChartSvg(initialSavedToolkitState.transitChartSvg);
  }, [currentSlug, initialForm, initialSavedToolkitState]);

  // Booking-session prefill + auto-submit.
  // When the diviner is routed here from /admin/horoscope/session/[bookingId],
  // that server route redirects with `?tab=<slug>&prefill=<encoded-FormState>`.
  // We decode the prefill, apply it to the form, then auto-fire the reading so
  // the diviner lands directly on the rendered result — no second click.
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const prefillParam = searchParams.get("prefill") ?? initialPrefill;
  useEffect(() => {
    if (!prefillParam) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(prefillParam)) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed }));
      if (autoSubmitPrefill) setPendingAutoSubmit(true);
    } catch {
      // malformed prefill — ignore so the diviner can fill the form by hand
    }
    // Re-apply when the tab changes so restricted community wrappers keep the
    // saved pair/self data while switching between compatible report tabs.
  }, [prefillParam, currentSlug, autoSubmitPrefill]);

  // Fire handleSubmit once the prefill has populated the form and it's valid.
  // We can't call handleSubmit() in the same effect that calls setForm() —
  // setForm is async, so handleSubmit would read the old form from closure.
  // Instead we flip the flag, wait for the next render where isFormValid is
  // recomputed against the new form, then fire exactly once.
  useEffect(() => {
    if (!pendingAutoSubmit) return;
    if (!isFormValid) return;
    if (loading) return;
    setPendingAutoSubmit(false);
    void handleSubmit();
    // handleSubmit is a hoisted function declaration referenced intentionally;
    // we don't want this effect to re-fire when it happens to re-identify.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSubmit, isFormValid, loading]);

  // Pre-fetch decan possibilities (distinct planet+sign pairs)
  useEffect(() => {
    fetchWithRetry("/api/astro-decan/fetch-planet-signs", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.results && Array.isArray(data.results)) {
          setDacenPsibality(data.results as DecanPossibility[]);
        }
      })
      .catch(() => { });
  }, []);

  // Scroll listener
  useEffect(() => {
    const el = resultRef.current?.closest("[data-scroll]") as HTMLElement | null;
    const container = document.querySelector(".result-scroll-container") as HTMLElement | null;
    const target = container ?? window;
    function onScroll() {
      const scrollY = target === window ? window.scrollY : (target as HTMLElement).scrollTop;
      setShowScrollTop(scrollY > 400);
    }
    target.addEventListener("scroll", onScroll);
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  function setTab(slug: string) {
    if (
      communityRelationshipPersonAId &&
      communityRelationshipPersonBId &&
      isRelationshipSlug(slug)
    ) {
      const url = new URL(basePath, window.location.origin);
      url.searchParams.set("mode", RELATIONSHIP_SLUG_TO_MODE[slug]);
      url.searchParams.delete("tab");
      router.push(`${url.pathname}${url.search}`);
      return;
    }
    const separator = basePath.includes("?") ? "&" : "?";
    router.push(`${basePath}${separator}tab=${slug}`);
  }
  function addProgress(msg: string) { setProgress((p) => [...p, msg]); }

  function validateForm(): string | null {
    const p1 = form.person1;
    if (!p1.dob) return "Date of birth is required";
    if (!p1.tob) return "Time of birth is required";
    if (!p1.city) return "Please select a city from the dropdown";
    if (currentTab.type === "two-person") {
      if (!form.person2.dob) return "Partner date of birth is required";
      if (!form.person2.tob) return "Partner time of birth is required";
      if (!form.person2.city) return "Please select partner city from the dropdown";
    }
    if (currentTab.extras?.includes("question") && !form.question.trim()) return "Please enter your question for the horary chart";
    return null;
  }

  function scrollToTop() {
    const container = document.querySelector(".result-scroll-container");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function scrollToChart() {
    const el = document.getElementById("natal-charts-row");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function printResult() {
    const el = resultRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const styles = Array.from(document.styleSheets).map((ss) => {
      try { return Array.from(ss.cssRules).map((r) => r.cssText).join("\n"); } catch { return ""; }
    }).join("\n");
    win.document.write(`<html><head><style>${styles}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  const handleSuggestAnotherDate = async (newExclusion: string, _sectionPath: string, _sectionName: string) => {
    if (isSuggestingDate) return;
    setIsSuggestingDate(true);
    setExcludedHoraryDates(prev => prev ? `${prev}, ${newExclusion}` : newExclusion);

    try {
      // Small delay to ensure state update is processed
      await new Promise(r => setTimeout(r, 100));

      const birth1 = parseBirth(form.person1);
      const initialData = { ...birth1, city: form.person1?.city ?? "", question: form.question };
      const collected = { ...results, ...initialData, horary_chart_data: results?.natal_chart_data ?? natalData };

      const prompts = buildAiPrompts(collected, currentTab.slug, form.areaOfInquiry || undefined, (excludedHoraryDates ? `${excludedHoraryDates}, ${newExclusion}` : newExclusion));
      const horaryPrompt = prompts.find(p => p.key === "horary_chart_question");

      if (!horaryPrompt) throw new Error("Horary prompt not found");

      const aiPayload = {
        condition: { system_content: horaryPrompt.system, user_content: horaryPrompt.user },
        toolname: "other",
        json: horaryPrompt.json,
      };

      const aiRes = await callAI(aiPayload, form.areaOfInquiry || undefined);
      const fullRes = parseAiJsonResponse(aiRes.ai_response) as any;

      setResults(prev => {
        const prevAi = prev?.ai_interpretations ?? {};
        return {
          ...prev!,
          ai_interpretations: { ...prevAi, horary_chart_question: fullRes }
        };
      });
    } catch (err) {
      toast.error("Failed to generate another date. Please try again.");
    } finally {
      setIsSuggestingDate(false);
    }
  };

  async function handleSubmit(e?: React.FormEvent, keepExclusions = false) {
    if (e) e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResults({}); // Initialize results so the section shows up immediately
    setNatalSvg(null);
    setNatalSvgTransit(null);
    setNatalSvgP2(null);
    setNatalSvgTransitP2(null);
    setTransitChartSvg(null);
    setReturnDate(null);
    setProgress([]);
    if (!keepExclusions) {
      setExcludedHoraryDates("");
    }

    // ── Saved-data short-circuit ─────────────────────────────────────────
    // Before kicking off live compute + AI generation (which is slow and
    // costs money on the AI side), ask the server whether we already have
    // a saved astro_ai_responses row for this exact (toolname, person
    // identity). If yes, hydrate all sections directly from the saved
    // payload and return — no live calls, no token spend.
    //
    // Why we don't do this lookup at module scope:
    //   The toolkit prefills form data from `?prefill=` or from server
    //   props on first paint, but the user can also tweak person1/person2
    //   between submits (different DOB, different city, etc.). Doing the
    //   lookup at submit time guarantees we match what was actually
    //   submitted, not the initial prefill.
    //
    // We swallow lookup errors and fall through to live generation —
    // a server hiccup must never block the toolkit.
    try {
      addProgress("Checking for saved report…");
      const matchRes = await fetchWithRetry("/api/admin/horoscope/match-saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolname: currentTab.slug,
          type: currentTab.type,
          person1: form.person1,
          person2: currentTab.type === "two-person" ? form.person2 : null,
          extras: {
            areaOfInquiry: form.areaOfInquiry || undefined,
            question: form.question || undefined,
            futureWeek: form.futureWeek || undefined,
            futureMonth: form.futureMonth || undefined,
          },
        }),
      });
      const matchJson = await matchRes.json().catch(() => ({}));
      if (matchRes.ok && matchJson?.found && matchJson.res) {
        const hydrated = hydrateSavedAstroReport(matchJson.res, currentTab.slug);
        if (hydrated.results) {
          addProgress("Loaded saved report ✓");
          setResults(hydrated.results);
          setNatalSvg(hydrated.natalSvg);
          setNatalSvgTransit(hydrated.natalSvgTransit);
          setNatalSvgP2(hydrated.natalSvgP2);
          setNatalSvgTransitP2(hydrated.natalSvgTransitP2);
          setTransitChartSvg(hydrated.transitChartSvg);
          setReturnDate(hydrated.returnDate);
          setShowChartBtn(hydrated.showChartButton);
          setShowScrollTop(true);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to live generation on any lookup failure.
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: Record<string, any> = {};

    try {
      const birth1 = parseBirth(form.person1);
      const isTwoPerson = currentTab.type === "two-person";
      const birth2 = isTwoPerson ? parseBirth(form.person2) : null;

      // Check if this report already exists
      const checkFormData = isTwoPerson ? {
        self: { ...form.person1, ...birth1 },
        partner: { ...form.person2, ...birth2 },
      } : {
        ...form.person1,
        ...birth1,
      };

      addProgress("Checking for existing report...");
      const checkRes = await fetch("/api/admin/searched-toolkit/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolname: currentTab.slug,
          form_data: checkFormData,
        }),
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.status === "success" && checkData.result) {
          addProgress("Found existing report! Restoring...");
          const hydrated = hydrateSavedAstroReport(checkData.result, currentTab.slug);

          if (hydrated.results) {
            setResults(hydrated.results);
            setNatalSvg(hydrated.natalSvg);
            setNatalSvgTransit(hydrated.natalSvgTransit);
            setNatalSvgP2(hydrated.natalSvgP2);
            setNatalSvgTransitP2(hydrated.natalSvgTransitP2);
            setTransitChartSvg(hydrated.transitChartSvg);
            setReturnDate(hydrated.returnDate);
            setShowChartBtn(hydrated.showChartButton);
            setLoading(false);
            return; // EXIT EARLY
          }
        }
      }

      // No existing report found, proceed with calculation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collected: Record<string, any> = {};

      // ── Single person ─────────────────────────────────────────────────────
      if (currentTab.type === "single") {
        const initialData = { ...birth1, city: form.person1?.city ?? "" };
        Object.assign(collected, initialData);
        setResults({ ...initialData });

        addProgress("Calculating natal chart…");
        const natalData = await callCompute(
          "western_horoscope",
          birth1 as unknown as Record<string, unknown>
        );
        collected.natal_chart_data = natalData;
        setResults((prev) => ({ ...prev, natal_chart_data: natalData }));

        addProgress("Parallel fetching wheels and data…");

        // Use a task array for non-dependent parallel operations
        const tasks: Promise<unknown>[] = [];

        // Wheels
        tasks.push(
          callCompute("natal_wheel_chart", birth1 as unknown as Record<string, unknown>)
            .then((w) => {
              if (w?.chart_url) {
                collected.freeNatalWheelChart = w.chart_url;
                setNatalSvg(w.chart_url);
                collected.natal_chart_url = w.chart_url;
                setShowChartBtn(true);
              }
            })
            .catch(() => { })
        );
        tasks.push(
          callNatalWheel(
            freeWheelBody(form.person1) as unknown as Record<string, unknown>
          )
            .then((freeResp) => {
              const svg = freeResp?.results?.output;
              if (svg) {
                collected.freeNatalWheelChartForTrasit = svg;
                setNatalSvgTransit(svg);
                collected.natal_transit_svg = svg;
                setShowChartBtn(true);
              }
            })
            .catch(() => { })
        );

        // Tab-specific data
        if (currentTab.slug === "solar_return_v2") {
          const endpoints = [
            { key: "solar_return_details", endpoint: "solar_return_details" },
            { key: "solar_return_planets", endpoint: "solar_return_planets" },
            { key: "solar_return_cusps", endpoint: "solar_return_house_cusps" },
            { key: "solar_return_aspects", endpoint: "solar_return_planet_aspects" },
            { key: "solar_return_planet_report", endpoint: "solar_return_planet_report" },
            { key: "solar_return_aspects_report", endpoint: "solar_return_aspects_report" },
          ];
          tasks.push(
            ...endpoints.map(async ({ key, endpoint }) => {
              try {
                const val = await callCompute(
                  endpoint,
                  birth1 as unknown as Record<string, unknown>
                );
                collected[key] = val;
                setResults((prev) => ({ ...prev, [key]: val }));
              } catch {
                collected[key] = "error";
                setResults((prev) => ({ ...prev, [key]: "error" }));
              }
            })
          );
        }

        if (currentTab.slug === "tropical_transits_weekly_v2") {
          tasks.push(
            (async () => {
              let weekResData: any;
              let isFuture = false;

              if (form.futureWeek) {
                const wd = await callPlanetReturn({
                  steps: "astrology_report_weekly",
                  birth_details: { ...birth1, tzone: form.person1.city!.timezone.offset_string },
                  week_start_date: form.futureWeek,
                });
                weekResData = wd?.astrology_report_weekly ?? wd;
                isFuture = true;
                collected.future_transit_date = form.futureWeek;
              } else {
                weekResData = await callCompute(
                  "tropical_transits/weekly",
                  birth1 as unknown as Record<string, unknown>
                );
              }

              collected.transit_data = weekResData;
              collected.is_future_transit = isFuture;
              setResults((prev) => ({
                ...prev,
                transit_data: weekResData,
                is_future_transit: isFuture,
                future_transit_date: isFuture ? form.futureWeek : undefined,
              }));

              // Fetch Transit Chart Wheel for Weekly (at start_date or today)
              try {
                const stDate = weekResData?.start_date;
                let wheelDate, wheelMonth, wheelYear;

                if (stDate && typeof stDate === "string") {
                  const parts = stDate.split("-").map(Number);
                  if (parts.length === 3) {
                    [wheelYear, wheelMonth, wheelDate] = parts;
                  }
                } else {
                  const d = new Date();
                  wheelDate = d.getDate();
                  wheelMonth = d.getMonth() + 1;
                  wheelYear = d.getFullYear();
                }

                if (wheelDate) {
                  const [bHour, bMin] = form.person1.tob.split(":").map(Number);
                  const transitWheelPayload = {
                    hours: bHour,
                    minutes: bMin,
                    date: wheelDate,
                    month: wheelMonth,
                    year: wheelYear,
                    latitude: form.person1.city!.lat,
                    longitude: form.person1.city!.lng,
                    timezone: parseDecimalTz(form.person1.city!.timezone.offset_string),
                  };
                  const wheelRes = await callNatalWheel(transitWheelPayload);
                  const svg = wheelRes?.results?.output;
                  if (svg) {
                    setTransitChartSvg(svg);
                    collected.transit_chart_svg = svg;
                  }
                }
              } catch (e) {
                console.error("Weekly transit wheel error:", e);
              }
            })()
          );
        }

        if (currentTab.slug === "tropical_transits_monthly_v3") {
          tasks.push(
            (async () => {
              let tYear, tMonth;
              if (form.futureMonth) {
                const [mYear, mMonth] = form.futureMonth.split("-").map(Number);
                tYear = mYear;
                tMonth = mMonth;
                const md = await callPlanetReturn({
                  steps: "astrology_report_monthly",
                  birth_details: { ...birth1, tzone: form.person1.city!.timezone.offset_string },
                  target_year: tYear,
                  target_month: tMonth,
                });
                const val = md?.astrology_report_monthly ?? md;
                const lu = md?.astrology_report_monthly?.lunar_data ?? null;
                collected.transit_data = val;
                collected.lunar_metrics = lu;
                collected.is_future_transit = true;
                collected.future_transit_date = form.futureMonth;
                setResults((prev) => ({
                  ...prev,
                  transit_data: val,
                  lunar_metrics: lu,
                  is_future_transit: true,
                  future_transit_date: form.futureMonth,
                }));
              } else {
                const d = new Date();
                tYear = d.getFullYear();
                tMonth = d.getMonth() + 1;
                const [mt, lu] = await Promise.allSettled([
                  callCompute(
                    "tropical_transits/monthly",
                    birth1 as unknown as Record<string, unknown>
                  ),
                  callCompute("lunar_metrics", birth1 as unknown as Record<string, unknown>),
                ]);
                const mtV = mt.status === "fulfilled" ? mt.value : null;
                const luV = lu.status === "fulfilled" ? lu.value : null;
                collected.transit_data = mtV;
                collected.lunar_metrics = luV;
                collected.is_future_transit = false;
                setResults((prev) => ({
                  ...prev,
                  transit_data: mtV,
                  lunar_metrics: luV,
                  is_future_transit: false,
                }));
              }

              // Fetch Transit Chart Wheel (using month_start_date from report)
              try {
                const reportMonth = (collected.transit_data as any) ?? {};
                const stDate = reportMonth?.month_start_date;
                let wheelDate = 1, wheelMonth = tMonth, wheelYear = tYear;

                if (stDate && typeof stDate === "string") {
                  const parts = stDate.split("-").map(Number);
                  if (parts.length === 3) {
                    [wheelYear, wheelMonth, wheelDate] = parts;
                  }
                }

                const [bHour, bMin] = form.person1.tob.split(":").map(Number);
                const transitWheelPayload = {
                  hours: bHour,
                  minutes: bMin,
                  date: wheelDate,
                  month: wheelMonth,
                  year: wheelYear,
                  latitude: form.person1.city!.lat,
                  longitude: form.person1.city!.lng,
                  timezone: parseDecimalTz(form.person1.city!.timezone.offset_string)
                };
                const wheelRes = await callNatalWheel(transitWheelPayload);
                const svg = wheelRes?.results?.output;
                if (svg) {
                  setTransitChartSvg(svg);
                  collected.transit_chart_svg = svg;
                }
              } catch (e) {
                console.error("Transit wheel error:", e);
              }
            })()
          );
        }

        if (currentTab.slug === "horary_chart_v2") {
          tasks.push(
            (async () => {
              // No longer calling specialized horary_chart compute API per request.
              // We use natal_chart_data as the base for the AI prompt.
              collected.horary_chart_data = natalData;
              collected.question = form.question;
              collected.city = form.person1?.city ?? "";
              setResults((prev) => ({
                ...prev,
                horary_chart_data: natalData,
                question: form.question,
                city: form.person1?.city ?? "",
              }));
            })()
          );
        }

        const planetReturnMap: Record<string, string> = {
          jupiter_return_v2: "jupiter_return",
          saturn_return_v2: "saturn_return",
          mars_return_v2: "mars_return",
        };
        if (planetReturnMap[currentTab.slug]) {
          tasks.push(
            (async () => {
              const steps = planetReturnMap[currentTab.slug];
              const planetName = steps.split("_")[0];
              const planetCap = planetName.charAt(0).toUpperCase() + planetName.slice(1);
              const natalDeg = getPlanetDegree(natalData?.planets, planetCap);
              const normalizedNatalDeg = Number.isFinite(Number(natalDeg))
                ? Number(Number(natalDeg).toFixed(4))
                : null;
              const dateOfBirthWithTime = `${pad(birth1.year)}-${pad(birth1.month)}-${pad(birth1.day)} ${pad(birth1.hour)}:${pad(birth1.min)}:00`;

              try {
                if (normalizedNatalDeg == null) {
                  throw new Error(`Unable to calculate natal degree for ${planetCap}`);
                }

                const planetReturnPayload = {
                  steps,
                  date_of_birth_with_time: dateOfBirthWithTime,
                  natal_deg: normalizedNatalDeg,
                };
                const planetReturnResponse = await callPlanetReturn(planetReturnPayload);
                const resolvedReturnDate = getPlanetReturnDisplay(currentTab.slug, planetReturnResponse, null);

                collected[currentTab.slug] = planetReturnResponse;
                collected.returnDate = resolvedReturnDate;
                setReturnDate(resolvedReturnDate);
                setResults((prev) => ({
                  ...prev,
                  [currentTab.slug]: planetReturnResponse,
                }));
              } catch {
                collected[currentTab.slug] = "error";
                setResults((prev) => ({
                  ...prev,
                  [currentTab.slug]: "error",
                }));
              }
            })()
          );
        }

        await Promise.allSettled(tasks);

        // AI Interpretations — run in parallel and update state individually
        addProgress("Running AI interpretations…");
        const combinedData = {
          ...natalData,
          ...collected,
          returnDate: collected.returnDate ?? returnDate ?? "calculated",
        };
        const prompts = buildAiPrompts(combinedData, currentTab.slug, form.areaOfInquiry || undefined, excludedHoraryDates);

        const aiPromises = prompts.map(async (p) => {
          try {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const aiRes = await callAI(aiPayload, form.areaOfInquiry || undefined);
            let parsed = parseAiJsonResponse(aiRes.ai_response);
            if (currentTab.slug === "uranus_return_v2" && p.key === "uranus_return_v2") {
              const uranusOpposition = getPlanetReturnDisplayFromAi(currentTab.slug, parsed);
              if (uranusOpposition) {
                collected.returnDate = uranusOpposition;
                setReturnDate(uranusOpposition);
              }
            }
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: parsed },
              };
            });
            // Mirror into `collected` so the save-results call can access
            // the final AI data without reading React state.
            collected.ai_interpretations = {
              ...(collected.ai_interpretations as Record<string, unknown> ?? {}),
              [p.key]: parsed,
            };
          } catch {
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: "error" },
              };
            });
          }
        });
        await Promise.allSettled(aiPromises);
      }

      // ── Two person ────────────────────────────────────────────────────────
      if (currentTab.type === "two-person" && birth2) {
        const relBase = {
          person1_birth: birth1,
          person2_birth: birth2,
          persona_city: form.person1?.city ?? "",
          partner_city: form.person2?.city ?? "",
        };
        Object.assign(collected, relBase);
        setResults({ ...relBase });

        addProgress("Fetching relationship charts…");
        const relTasks: Promise<unknown>[] = [];

        // Natal data for Person 1
        relTasks.push(
          callCompute(
            "western_horoscope",
            birth1 as unknown as Record<string, unknown>
          ).then((d) => {
            collected.natal_chart_data = d;
            setResults((prev) => ({ ...prev, natal_chart_data: d }));
          })
        );

        // Natal data for Person 2
        relTasks.push(
          callCompute(
            "western_horoscope",
            birth2 as unknown as Record<string, unknown>
          ).then((d) => {
            collected.natal_chart_data_p2 = d;
            setResults((prev) => ({ ...prev, natal_chart_data_p2: d }));
          })
        );

        // Synastry
        relTasks.push(
          callCompute("synastry_horoscope", {
            p_day: birth1.day,
            p_month: birth1.month,
            p_year: birth1.year,
            p_hour: birth1.hour,
            p_min: birth1.min,
            p_lat: birth1.lat,
            p_lon: birth1.lon,
            p_tzone: birth1.tzone,
            s_day: birth2.day,
            s_month: birth2.month,
            s_year: birth2.year,
            s_hour: birth2.hour,
            s_min: birth2.min,
            s_lat: birth2.lat,
            s_lon: birth2.lon,
            s_tzone: birth2.tzone,
          } as unknown as Record<string, unknown>).then((d) => {
            collected.synastry = d;
            setResults((prev) => ({ ...prev, synastry: d }));
          })
        );

        // Composite
        relTasks.push(
          callCompute("composite_horoscope", {
            p_day: birth1.day,
            p_month: birth1.month,
            p_year: birth1.year,
            p_hour: birth1.hour,

            p_min: birth1.min,
            p_lat: birth1.lat,
            p_lon: birth1.lon,
            p_tzone: birth1.tzone,
            s_day: birth2.day,
            s_month: birth2.month,
            s_year: birth2.year,
            s_hour: birth2.hour,
            s_min: birth2.min,
            s_lat: birth2.lat,
            s_lon: birth2.lon,
            s_tzone: birth2.tzone,
          } as unknown as Record<string, unknown>)
            .then((d) => {
              collected.composite = d;
              setResults((prev) => ({ ...prev, composite: d }));
            })
            .catch(() => { })
        );

        // Wheels
        // Person 1
        relTasks.push(
          callCompute("natal_wheel_chart", birth1 as unknown as Record<string, unknown>)
            .then((w) => {
              if (w?.chart_url) {
                setNatalSvg(w.chart_url);
                collected.natal_chart_url = w.chart_url;
                setShowChartBtn(true);
              }
            })
            .catch(() => { })
        );
        relTasks.push(
          callNatalWheel(freeWheelBody(form.person1) as unknown as Record<string, unknown>)
            .then((r) => {
              if (r?.results?.output) {
                setNatalSvgTransit(r.results.output);
                collected.natal_transit_svg = r.results.output;
                setShowChartBtn(true);
              }
            })
            .catch(() => { })
        );
        // Person 2
        relTasks.push(
          callCompute("natal_wheel_chart", birth2 as unknown as Record<string, unknown>)
            .then((w) => {
              if (w?.chart_url) {
                setNatalSvgP2(w.chart_url);
                collected.natal_chart_url_p2 = w.chart_url;
              }
            })
            .catch(() => { })
        );
        relTasks.push(
          callNatalWheel(freeWheelBody(form.person2) as unknown as Record<string, unknown>)
            .then((r) => {
              if (r?.results?.output) {
                setNatalSvgTransitP2(r.results.output);
                collected.natal_transit_svg_p2 = r.results.output;
              }
            })
            .catch(() => { })
        );

        await Promise.allSettled(relTasks);

        // AI Interpretations
        addProgress("Running relationship AI…");
        const combinedData = { ...(collected.synastry ?? {}), ...collected };
        const prompts = buildAiPrompts(combinedData, currentTab.slug, form.areaOfInquiry || undefined, excludedHoraryDates);
        const aiPromises = prompts.map(async (p) => {
          try {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const aiRes = await callAI(aiPayload, form.areaOfInquiry || undefined);
            const parsed = parseAiJsonResponse(aiRes.ai_response);
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: parsed },
              };
            });
            collected.ai_interpretations = {
              ...(collected.ai_interpretations as Record<string, unknown> ?? {}),
              [p.key]: parsed,
            };
          } catch {
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: "error" },
              };
            });
            collected.ai_interpretations = {
              ...(collected.ai_interpretations as Record<string, unknown> ?? {}),
              [p.key]: "error",
            };
          }
        });
        await Promise.allSettled(aiPromises);
      }

      // ── Save results to the legacy NestJS store (fire-and-forget) ──────
      // The spec for tropical_transits_monthly_v3 (and potentially other tabs
      // in the future) calls for persisting the generated AI interpretations
      // and raw data to avoid repeated AI costs. The external endpoint is the
      // legacy CloudFront-fronted NestJS API. We fire-and-forget because a
      // save failure should not block the user from seeing their results.
      //
      // community-monthly-transit-architecture Task 02 partial (2026-04-27):
      // We ALSO fire the same payload at the local Supabase-backed
      // /api/astro-ai/save-astro-ai-response so the report is reusable
      // via /api/astro-ai/lookup-saved on subsequent visits. Both legacy
      // and local saves are fire-and-forget — neither blocks the user
      // and either failing alone does not affect the displayed result.
      // The legacy save remains in place; the lookup/read repointing is
      // intentionally a follow-up so this UI is not refactored here.
      // ── UNIVERSAL SAVE BLOCK (fire-and-forget) ──────
      // This block captures all AI interpretations, chart URLs, and form data
      // into a single payload and persists it to both legacy and local stores.
      try {

        const formDataPayload = isTwoPerson ? {
          self: { ...form.person1, ...birth1 },
          partner: { ...form.person2, ...birth2 },
        } : {
          ...form.person1,
          ...birth1,
        };
        const astroApiDataPayload = isTwoPerson ? {
          synastry: collected.synastry ?? {},
          composite: collected.composite ?? {},
          self: collected.natal_chart_data ?? {},
          partner: collected.natal_chart_data_p2 ?? {},
        } : (collected.natal_chart_data ?? {});
        const natalChartPayload = isTwoPerson ? {
          self: { status: true, chart_url: collected.natal_chart_url ?? "", msg: "Chart created successfully!" },
          partner: { status: true, chart_url: collected.natal_chart_url_p2 ?? "", msg: "Chart created successfully!" },
        } : {
          status: true,
          chart_url: collected.natal_chart_url ?? "",
          msg: "Chart created successfully!",
        };

        const ai_response_payload: any = {
          ...(collected.ai_interpretations ?? {}),
          natal_chart: natalChartPayload,
          formData: formDataPayload,
          astro_api_data: astroApiDataPayload,
          freeNatalWheelChart: collected.natal_transit_svg ?? collected.transit_chart_svg ?? "",
          freeNatalWheelChartForTransit: collected.natal_transit_svg ?? collected.transit_chart_svg ?? "",
          freeNatalWheelChartForTrasit: collected.natal_transit_svg ?? collected.transit_chart_svg ?? "",
        };

        if (isTwoPerson) {
          ai_response_payload.freeNatalWheelChartP2 = collected.natal_transit_svg_p2 ?? "";
          ai_response_payload.freeNatalWheelChartForTransitP2 = collected.natal_transit_svg_p2 ?? "";
          ai_response_payload.freeNatalWheelChartForTrasitP2 = collected.natal_transit_svg_p2 ?? "";
        }

        const finalSavePayload = {
          toolname: currentTab.slug,
          ai_response: ai_response_payload,
          natal_chart: natalChartPayload,
          formData: formDataPayload,
          astro_api_data: astroApiDataPayload,
          freeNatalWheelChart: collected.natal_chart_url ?? "",
          freeNatalWheelChartForTransit: collected.natal_transit_svg ?? collected.transit_chart_svg ?? "",
          freeNatalWheelChartForTrasit: collected.natal_transit_svg ?? collected.transit_chart_svg ?? "",
          ...(isTwoPerson
            ? {
              freeNatalWheelChartP2: collected.natal_chart_url_p2 ?? "",
              freeNatalWheelChartForTransitP2: collected.natal_transit_svg_p2 ?? "",
              freeNatalWheelChartForTrasitP2: collected.natal_transit_svg_p2 ?? "",
            }
            : {}),
        };

        if (
          communityRelationshipPersonAId &&
          communityRelationshipPersonBId &&
          isRelationshipSlug(currentTab.slug)
        ) {
          addProgress("Saving relationship report…");
          const linkRes = await fetch("/api/community/saved-reports/relationship/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personAId: communityRelationshipPersonAId,
              personBId: communityRelationshipPersonBId,
              reportType: RELATIONSHIP_SLUG_TO_REPORT_TYPE[currentTab.slug],
              payload: finalSavePayload,
            }),
          });

          if (!linkRes.ok) {
            const body = await linkRes.json().catch(() => null);
            throw new Error(
              typeof body?.error === "string"
                ? body.error
                : "Failed to save relationship report"
            );
          }

          router.refresh();
        } else {
          // Local save - Supabase-backed API
          saveAstroAiResponse(finalSavePayload).catch(() => { });
        }

        // Legacy CloudFront save (fire-and-forget)
        fetchWithRetry(
          "https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/save-astro-AI-Response",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalSavePayload),
          },
        ).catch(() => { });

      } catch (saveErr) {
        console.error("Universal save error:", saveErr);
        if (
          communityRelationshipPersonAId &&
          communityRelationshipPersonBId &&
          isRelationshipSlug(currentTab.slug)
        ) {
          throw saveErr;
        }
      }

      addProgress("Done ✓");
      setShowScrollTop(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // ── MutationObserver for Horary Date Recreation ──────────────────────
  useEffect(() => {
    if (currentSlug !== "horary_chart_v2") return;

    if (isSuggestingDate) {
      document.querySelectorAll('.timedata-btn').forEach(btn => (btn as HTMLElement).style.display = 'none');
      return;
    }

    const patchTimeSpans = () => {
      const spans = document.querySelectorAll('.timedata:not([data-timebutton])');
      spans.forEach(span => {
        const sectionContainer = span.closest('[data-section-path]');
        const path = sectionContainer?.getAttribute('data-section-path');
        const label = sectionContainer?.getAttribute('data-section-label');

        span.setAttribute('data-timebutton', 'true');
        const btn = document.createElement('button');
        btn.className = 'timedata-btn';
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        `;
        btn.title = 'Suggest another date';

        btn.onclick = (e) => {
          e.stopPropagation();
          const clone = span.cloneNode(true) as HTMLElement;
          const b = clone.querySelector('.timedata-btn');
          if (b) b.remove();
          const dateText = (clone.textContent || "").trim();
          handleSuggestAnotherDate(dateText, path || "summary.recommendation_on_date_and_timeline", label || "Timeline Section");
        };

        span.appendChild(btn);
      });
    };

    const observer = new MutationObserver(patchTimeSpans);
    observer.observe(document.body, { childList: true, subtree: true });
    patchTimeSpans(); // Initial check

    return () => observer.disconnect();
  }, [currentSlug, results?.ai_interpretations?.horary_chart_question, isSuggestingDate]);
  // ────────────────────────────────────────────────────────────────────────

  const ai = results?.ai_interpretations ?? {};
  const natalData = results?.natal_chart_data;
  const isPlanetReturn = ["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(currentSlug);
  const rawPlanetReturnDisplay = isPlanetReturn
    ? (getPlanetReturnDisplay(currentSlug, results?.[currentSlug], returnDate) ?? getPlanetReturnDisplayFromAi(currentSlug, ai[currentSlug]))
    : null;
  const planetReturnDisplay = isPlanetReturn
    ? (currentSlug === "uranus_return_v2" ? rawPlanetReturnDisplay : formatPlanetReturnDate(rawPlanetReturnDisplay))
    : null;
  const isTwoPersonAiTab = currentTab.type === "two-person";
  const isTransit = ["tropical_transits_weekly_v2", "tropical_transits_monthly_v3"].includes(currentSlug);
  const isHorary = currentSlug === "horary_chart_v2";
  const isSolarReturn = currentSlug === "solar_return_v2";

  return (
    <div className="horoscope-toolkit h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden flex flex-col" style={{ background: '#0a0c10' }}>
      {chartModal && <ChartImageModal src={chartModal} open={!!chartModal} onClose={() => setChartModal(null)} />}

      {/* Suggested date loader overlay */}
      {isSuggestingDate && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-10 py-8 rounded-2xl flex flex-col items-center shadow-2xl border border-white/20">
            <div className="size-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white text-lg font-bold tracking-wide animate-pulse uppercase">
              Generating another date...
            </p>
          </div>
        </div>
      )}

      {/* Horizontal tab bar with scroll arrows */}
      <TabBar currentSlug={currentSlug} onSelect={setTab} tabs={visibleTabs} disabled={loading} />

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto result-scroll-container" onScroll={(e) => setShowScrollTop((e.currentTarget.scrollTop) > 400)}>
        <div className="max-w-none px-6 py-6 space-y-6" ref={resultRef}>

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <currentTab.icon className="size-5 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight">{currentTab.label}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{currentTab.description}</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{currentTab.type === "two-person" ? "Enter Both Persons' Data" : "Enter Birth Data"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {currentTab.type === "single" ? (
                  <BirthBlock value={form.person1} onChange={(v) => setForm((f) => ({ ...f, person1: v }))} disabled={loading || readOnlyBirthData} />
                ) : (
                  <div className="flex flex-col gap-6">
                    <BirthBlock title="Person 1 (Self)" value={form.person1} onChange={(v) => setForm((f) => ({ ...f, person1: v }))} disabled={loading || readOnlyBirthData} />
                    <BirthBlock title="Person 2 (Partner)" value={form.person2} onChange={(v) => setForm((f) => ({ ...f, person2: v }))} disabled={loading || readOnlyBirthData} />
                  </div>
                )}

                {/* Week picker */}
                {currentTab.extras?.includes("future_week") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Select Week (optional — defaults to current week)</Label>
                    <Input type="date" value={form.futureWeek} onChange={(e) => setForm((f) => ({ ...f, futureWeek: e.target.value }))} disabled={loading || readOnlyBirthData} className="h-9 text-sm max-w-xs" />
                  </div>
                )}
                {/* Month picker */}
                {currentTab.extras?.includes("future_month") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Select Month (optional — defaults to current month)</Label>
                    <Input type="month" value={form.futureMonth ? form.futureMonth.slice(0, 7) : ""} onChange={(e) => { const val = e.target.value; setForm((f) => ({ ...f, futureMonth: val ? `${val}-01` : "" })); }} disabled={loading || readOnlyBirthData} className="h-9 text-sm max-w-xs" />
                  </div>
                )}
                {/* Question */}
                {currentTab.extras?.includes("question") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Your Question (required for Horary)</Label>
                    <Textarea value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="e.g. Will I get the job I applied for this month?" rows={3} disabled={loading || readOnlyBirthData} className="text-sm resize-none" />
                  </div>
                )}
                {/* Area of inquiry */}
                {currentTab.extras?.includes("area_of_inquiry") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Area of Inquiry (optional)</Label>
                    <Textarea value={form.areaOfInquiry} onChange={(e) => setForm((f) => ({ ...f, areaOfInquiry: e.target.value }))} placeholder="What would you like to gain clarity on? e.g., Career and purpose, a specific relationship…" rows={3} disabled={loading || readOnlyBirthData} className="text-sm resize-none" />
                  </div>
                )}

                {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}

                {initialSavedReport ? (
                  <Button
                    type="button"
                    disabled={loading || !isFormValid}
                    onClick={() => void handleSubmit(undefined, false)}
                    className={cn(
                      "w-full md:w-auto h-10 px-8 font-semibold transition-all shadow-md",
                      loading || !isFormValid
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                        : "bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg active:scale-95"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Processing Cosmic Data…
                      </>
                    ) : (
                      "Regenerate"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid || readOnlyBirthData}
                    className={cn(
                      "w-full md:w-auto h-10 px-8 font-semibold transition-all shadow-md",
                      loading || !isFormValid || readOnlyBirthData
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                        : "bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg active:scale-95"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Processing Cosmic Data…
                      </>
                    ) : (
                      "Generate Reading"
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Progress log */}
          {loading && progress.length > 0 && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-1">
              {progress.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  {i === progress.length - 1 && loading ? <Loader2 className="size-3.5 animate-spin text-amber-500 shrink-0" /> : <span className="size-3.5 flex items-center justify-center text-amber-500 shrink-0">✓</span>}
                  {msg}
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {results && (
            <TooltipProvider delayDuration={200}>
              {(() => {
                const isMainTransitTab = currentSlug === "tropical_transits_monthly_v3" || currentSlug === "tropical_transits_weekly_v2";

                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Zap className="size-5 text-amber-500" />
                      <h2 className="text-base font-bold">Results</h2>
                      <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">{currentTab.label}</Badge>
                      <button onClick={printResult} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded px-2 py-1">
                        <Printer className="size-3" />Print
                      </button>
                    </div>

                    {/* Return date banner */}
                    {planetReturnDisplay && (
                      <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                          {currentSlug === "uranus_return_v2" ? "Next Uranus Opposition: " : "Return Response: "}
                          <span className="font-bold">{planetReturnDisplay}</span>
                        </p>
                      </div>
                    )}

                    {/* Natal charts — always show first */}
                    <div id="natal-charts-row" className="space-y-6">
                      {(natalSvg || natalSvgTransit) && (
                        <div className="rounded-lg border overflow-hidden">
                          <div className="px-4 py-3 flex items-center justify-center gap-2 bg-black text-white border-none rounded-t-lg">
                            <User className="size-4 text-white" />
                            <h2 className="text-sm font-semibold text-white text-center">
                              {isTwoPersonAiTab ? "Western Chart Horoscope For Self" : "Western Chart Horoscope"}
                            </h2>
                          </div>
                          <div className="p-4">
                            <NatalChartsRow
                              svgs={[natalSvg, natalSvgTransit]}
                              labels={[
                                isTwoPersonAiTab ? "Person 1" : "Natal Wheel Chart",
                                isTwoPersonAiTab ? "Person 1" : "Natal Wheel Chart"
                              ]}
                              onExpandImg={(src) => setChartModal(src)}
                            />
                          </div>
                        </div>
                      )}

                      {isTwoPersonAiTab && (natalSvgP2 || natalSvgTransitP2) && (
                        <div className="rounded-lg border overflow-hidden">
                          <div className="px-4 py-3 flex items-center justify-center gap-2 bg-black text-white border-none rounded-t-lg">
                            <Users className="size-4 text-white" />
                            <h2 className="text-sm font-semibold text-white text-center">Western Chart Horoscope For Partner</h2>
                          </div>
                          <div className="p-4">
                            <NatalChartsRow
                              svgs={[natalSvgP2, natalSvgTransitP2]}
                              labels={[
                                "Person 2",
                                "Person 2"
                              ]}
                              onExpandImg={(src) => setChartModal(src)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─── Planet Return Summary ──────────────────── */}
                    {isPlanetReturn && (
                      <PlanetReturnSummaryTable
                        tab={currentSlug}
                        birth={form.person1}
                        returnDate={returnDate}
                        natalData={natalData}
                        responseData={results?.[currentSlug]}
                        aiData={ai[currentSlug]}
                      />
                    )}
                    {isPlanetReturn && ai[currentSlug]?.chart_data && (
                      <PlanetReturnPositions chartData={ai[currentSlug].chart_data} />
                    )}
                    {isPlanetReturn && (
                      <PlanetReturnInterpretation tab={currentSlug} aiData={ai[currentSlug]} areaOfInquiry={form.areaOfInquiry} />
                    )}

                    {/* ─── Solar Return ───────────────────────────── */}
                    {isSolarReturn && (
                      <SolarReturnSection
                        details={results.solar_return_details}
                        planets={results.solar_return_planets}
                        cusps={results.solar_return_cusps}
                        aspects={results.solar_return_aspects}
                        planetReport={results.solar_return_planet_report}
                        aspectsReport={results.solar_return_aspects_report}
                        aiData={ai}
                        areaOfInquiry={form.areaOfInquiry}
                        checkDacen={checkDacen}
                        onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                      />
                    )}

                    {/* ─── Saturn Return also shows solar return ──── */}
                    {currentSlug === "saturn_return_v2" && results.solar_return_details && (
                      <SolarReturnSection
                        details={results.solar_return_details}
                        planets={results.solar_return_planets}
                        cusps={results.solar_return_cusps}
                        aspects={results.solar_return_aspects}
                        planetReport={results.solar_return_planet_report}
                        aspectsReport={results.solar_return_aspects_report}
                        aiData={null}
                        areaOfInquiry={form.areaOfInquiry}
                        checkDacen={checkDacen}
                        onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                      />
                    )}

                    {/* ─── Transits ───────────────────────────────── */}
                    {isTransit && (
                      <TransitSection
                        data={results.transit_data}
                        lunarMetrics={results.lunar_metrics}
                        aiData={currentSlug === "tropical_transits_weekly_v2" ? ai.tropical_transits_weekly : ai.tropical_transits_monthly}
                        lunarAiData={currentSlug === "tropical_transits_monthly_v3" ? ai.lunar_metrics : undefined}
                        tabSlug={currentSlug}
                        areaOfInquiry={form.areaOfInquiry}
                        checkDacen={checkDacen}
                        onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                        transitWheelSvg={transitChartSvg}
                        setChartModal={setChartModal}
                      />
                    )}

                    {/* ─── Horary ─────────────────────────────────── */}
                    {isHorary && (
                      <HorarySection
                        data={ai.horary_chart_question}
                        slug={currentSlug}
                        areaOfInquiry={form.areaOfInquiry}
                        checkDacen={checkDacen}
                        onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                      />
                    )}

                    {/* ─── Two-person relationship (all 8 AI sections) ─ */}
                    {isTwoPersonAiTab && (
                      <RelationshipSection
                        aiMap={ai}
                        areaOfInquiry={form.areaOfInquiry}
                        tabSlug={currentSlug}
                        checkDacen={checkDacen}
                        onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                        rawData={results}
                      />
                    )}

                    {/* ─── Natal chart sections (single-person tabs only — not two-person relationship tabs) ─ */}
                    {natalData && (
                      <div className="space-y-6">
                        {(!isMainTransitTab && !isTwoPersonAiTab && !isHorary) && (
                          <>
                            <PlanetsSection
                              planets={[
                                ...(natalData?.planets || []),
                                ...(natalData?.node && !(natalData.planets || []).some((p: any) => p.name === "Node") ? [{ name: "Node", ...natalData.node }] : []),
                                ...(natalData?.chiron && !(natalData.planets || []).some((p: any) => p.name === "Chiron") ? [{ name: "Chiron", ...natalData.chiron }] : []),
                                ...(natalData?.fortune && !(natalData.planets || []).some((p: any) => p.name === "Part of Fortune") ? [{ name: "Part of Fortune", ...natalData.fortune }] : []),
                              ]}
                              aiData={ai.western_horoscope_planets}
                              areaOfInquiry={form.areaOfInquiry}
                              checkDacen={checkDacen}
                              onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                            />
                            <div className="rounded-lg border overflow-hidden">
                              <div className="px-4 py-3 flex items-center gap-2 bg-black text-white border-none rounded-t-lg">
                                <Home className="size-4 text-white" />
                                <h2 className="text-sm font-semibold text-white">House Information</h2>
                              </div>
                              <div className="p-4">
                                <HousesSection houses={natalData.houses} planets={natalData.planets} aiData={ai.western_horoscope_houses} areaOfInquiry={form.areaOfInquiry} />
                              </div>
                            </div>
                            <div className="rounded-lg border overflow-hidden">
                              <div className="px-4 py-3 flex items-center gap-2 bg-black text-white border-none rounded-t-lg">
                                <Sparkles className="size-4 text-white" />
                                <h2 className="text-sm font-semibold text-white">Dharma & Karma</h2>
                              </div>
                              <div className="p-4">
                                <DharmaKarmaSection data={ai.dharma_karma} rawData={natalData} areaOfInquiry={form.areaOfInquiry} isSolarReturn={true} />
                              </div>
                            </div>
                            <div className="rounded-lg border overflow-hidden">
                              <div className="px-4 py-3 flex items-center gap-2 bg-black text-white border-none rounded-t-lg">
                                <Link className="size-4 text-white" />
                                <h2 className="text-sm font-semibold text-white">Aspects</h2>
                              </div>
                              <div className="p-4">
                                <AspectsSection aspects={natalData.aspects} planets={natalData.planets} aiData={ai.western_horoscope_aspects} areaOfInquiry={form.areaOfInquiry} isSolarReturn={true} />
                              </div>
                            </div>
                            <AscMidheavenVertexSection natalData={natalData} aiData={ai.western_horoscope_ascendant_midheaven_vertex} areaOfInquiry={form.areaOfInquiry} isSolarReturn={true} />
                            <LilithSection
                              lilith={natalData.lilith}
                              aiData={ai.western_horoscope_lilith}
                              areaOfInquiry={form.areaOfInquiry}
                              checkDacen={checkDacen}
                              onDecanClick={(p, s) => setDecanPlanet({ name: p, sign: s })}
                            />
                          </>
                        )}
                      </div>
                    )}

                  </div>
                );
              })()}
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Floating buttons */}
      {results && (
        <>
          {showChartBtn && (
            <button onClick={scrollToChart} className="fixed bottom-28 right-4 z-50 size-12 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition flex items-center justify-center" title="View Natal Chart">
              <Eye className="size-6" />
            </button>
          )}
          {showScrollTop && (
            <button onClick={scrollToTop} className="fixed bottom-14 right-4 z-50 size-11 rounded-full bg-background border shadow-lg hover:bg-muted transition flex items-center justify-center" title="Scroll to Top">
              <ArrowUp className="size-5" />
            </button>
          )}
          <button onClick={printResult} className="fixed bottom-2 right-4 z-50 size-11 rounded-full bg-background border shadow-lg hover:bg-muted transition flex items-center justify-center" title="Print">
            <Printer className="size-4" />
          </button>
        </>
      )}
      <DecanModal
        planet={decanPlanet?.name ?? ""}
        sign={decanPlanet?.sign ?? ""}
        open={!!decanPlanet}
        onClose={() => setDecanPlanet(null)}
      />
    </div>
  );
}

export default function AdminHoroscopePage() {
  return <HoroscopeToolkitPage />;
}
