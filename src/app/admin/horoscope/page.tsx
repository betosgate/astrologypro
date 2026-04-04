"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  Sun,
  Moon,
  Calendar,
  Heart,
  Users,
  Briefcase,
  Eye,
  Zap,
  Globe,
  Sparkles,
  CircleDot,
} from "lucide-react";

// ─── Tab definitions ────────────────────────────────────────────────────────

type TabType = "single" | "two-person";

interface TabDef {
  slug: string;
  label: string;
  type: TabType;
  extras?: ("area_of_inquiry" | "question" | "future_week" | "future_month")[];
  icon: React.ElementType;
  description: string;
}

const TABS: TabDef[] = [
  {
    slug: "western_horoscope_v2",
    label: "Nativity Birth Chart",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: Star,
    description: "Full natal chart with AI interpretations of ascendant, houses, planets, aspects, and dharma/karma.",
  },
  {
    slug: "solar_return_v2",
    label: "Solar Return",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: Sun,
    description: "Annual solar return chart with details, planets, house cusps, and planet aspects.",
  },
  {
    slug: "tropical_transits_weekly_v2",
    label: "Weekly Transits",
    type: "single",
    extras: ["future_week", "area_of_inquiry"],
    icon: Calendar,
    description: "Tropical transit report for any given week with AI narrative.",
  },
  {
    slug: "tropical_transits_monthly_v3",
    label: "Monthly Transits + Lunar Return",
    type: "single",
    extras: ["future_month", "area_of_inquiry"],
    icon: Moon,
    description: "Monthly transits combined with lunar return data and AI interpretation.",
  },
  {
    slug: "romantic_forecast_report_tropical_v2",
    label: "Romantic Relationships",
    type: "two-person",
    extras: ["area_of_inquiry"],
    icon: Heart,
    description: "Synastry and composite chart analysis for romantic compatibility.",
  },
  {
    slug: "friendship_report_tropical_v2",
    label: "Friendship Relationships",
    type: "two-person",
    extras: ["area_of_inquiry"],
    icon: Users,
    description: "Relationship chart analysis for friendship and platonic connections.",
  },
  {
    slug: "business_partner_v2",
    label: "Business Relationship",
    type: "two-person",
    extras: ["area_of_inquiry"],
    icon: Briefcase,
    description: "Synastry chart analysis for business partnerships and professional compatibility.",
  },
  {
    slug: "horary_chart_v2",
    label: "Predictive Event (Horary)",
    type: "single",
    extras: ["question"],
    icon: Eye,
    description: "Horary chart for a specific question — timing and astrological guidance.",
  },
  {
    slug: "jupiter_return_v2",
    label: "Jupiter Return",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: Sparkles,
    description: "Jupiter return date calculation with detailed natal interpretation.",
  },
  {
    slug: "saturn_return_v2",
    label: "Saturn Return",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: CircleDot,
    description: "Saturn return analysis — karmic lessons and life restructuring.",
  },
  {
    slug: "mars_return_v2",
    label: "Mars Return",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: Zap,
    description: "Mars return chart — energy, drive, and action cycles.",
  },
  {
    slug: "uranus_return_v2",
    label: "Uranus Opposition",
    type: "single",
    extras: ["area_of_inquiry"],
    icon: Star,
    description: "Uranus opposition analysis — midlife awakening and liberation themes.",
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface CityOption {
  label: string;
  lat: number;
  lng: number;
  timezone: { name: string; offset_string: string; utcOffset: string };
}

interface BirthInput {
  dob: string;        // YYYY-MM-DD
  tob: string;        // HH:MM (24h)
  city: CityOption | null;
}

interface FormState {
  person1: BirthInput;
  person2: BirthInput;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;   // YYYY-MM-DD
  futureMonth: string;  // YYYY-MM-DD
}

const emptyBirth = (): BirthInput => ({ dob: "", tob: "", city: null });

const defaultForm = (): FormState => ({
  person1: emptyBirth(),
  person2: emptyBirth(),
  areaOfInquiry: "",
  question: "",
  futureWeek: "",
  futureMonth: "",
});

// ─── City autocomplete ───────────────────────────────────────────────────────

function CityAutocomplete({
  value,
  onChange,
  label = "City (e.g. Atlanta)",
  disabled = false,
}: {
  value: CityOption | null;
  onChange: (c: CityOption | null) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setOptions([]); setOpen(false); return; }
    setLoading(true);
    fetch("/api/admin/astro/city-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    })
      .then((r) => r.json())
      .then((d) => { setOptions(d.results ?? []); setOpen(true); })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  }

  function select(c: CityOption) {
    onChange(c);
    setQuery(c.label);
    setOptions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={handleInput}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Type city name…"
          disabled={disabled}
          className="h-9 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md text-sm max-h-52 overflow-y-auto">
          {options.map((opt, i) => (
            <li
              key={i}
              className="px-3 py-2 cursor-pointer hover:bg-muted truncate"
              onMouseDown={() => select(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {value && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {value.lat.toFixed(4)}, {value.lng.toFixed(4)} · {value.timezone.offset_string}
        </p>
      )}
    </div>
  );
}

// ─── Birth Data form block ───────────────────────────────────────────────────

function BirthBlock({
  title,
  value,
  onChange,
  disabled,
}: {
  title?: string;
  value: BirthInput;
  onChange: (v: BirthInput) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{title}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Date of Birth</Label>
          <Input
            type="date"
            value={value.dob}
            onChange={(e) => onChange({ ...value, dob: e.target.value })}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Time of Birth (24h)</Label>
          <Input
            type="time"
            value={value.tob}
            onChange={(e) => onChange({ ...value, tob: e.target.value })}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
      </div>
      <CityAutocomplete
        value={value.city}
        onChange={(c) => onChange({ ...value, city: c })}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBirth(b: BirthInput) {
  const [year, month, day] = b.dob.split("-").map(Number);
  const [hour, min] = b.tob.split(":").map(Number);
  return { day, month, year, hour, min, lat: b.city!.lat, lon: b.city!.lng, tzone: b.city!.timezone.offset_string };
}

function parseDecimalTz(offset: string): number {
  const sign = offset[0] === "-" ? -1 : 1;
  const [h, m] = offset.slice(1).split(":").map(Number);
  return sign * (h + (m || 0) / 60);
}

function freeWheelBody(b: BirthInput) {
  const [year, month, day] = b.dob.split("-").map(Number);
  const [hours, minutes] = b.tob.split(":").map(Number);
  return {
    hours, minutes, date: day, month, year,
    latitude: b.city!.lat,
    longitude: b.city!.lng,
    timezone: parseDecimalTz(b.city!.timezone.offset_string),
  };
}

async function callCompute(endpoint: string, payload: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, payload }),
  });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}

async function callAI(aiPayload: Record<string, unknown>, areaOfInquiry?: string) {
  const r = await fetch("/api/admin/astro/ai-interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aiPayload, areaOfInquiry }),
  });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}

async function callPlanetReturn(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/planet-return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}

async function callNatalWheel(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/natal-wheel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}

function pad(n: number) { return n.toString().padStart(2, "0"); }

function getMonthNumber(monthStr: string) {
  const m: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
  return m[monthStr.toLowerCase()] ?? 1;
}

function getPlanetDegree(planets: any[], name: string) {
  const p = planets?.find((x: any) => x.name?.toLowerCase() === name.toLowerCase());
  return p?.full_degree ?? null;
}

// ─── AI prompt builders ───────────────────────────────────────────────────────

function buildAiPrompts(data: any, tab: string) {
  const prompts: { key: string; system: string; user: string; json: unknown[] }[] = [];

  if (tab === "western_horoscope_v2") {
    prompts.push({
      key: "western_horoscope_ascendant_midheaven_vertex",
      system: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT",
      user: `Generate western chart details only on ascendant, midheaven, vertex based on given json with minimum 3 sentences on each interpretation (mention significance of degree) with a number as index named index. Response format should be [{"ascendant":"interpretation"},{"midheaven":"interpretation"},{"vertex":"interpretation"}]. Response should not start with 'json' ever and must be within an array`,
      json: [{ ascendant: data.ascendant, midheaven: data.midheaven, vertex: data.vertex, houses: data.houses, aspects: data.aspects, planets: data.planets }],
    });
    prompts.push({
      key: "western_horoscope_aspects",
      system: "give response only in json format as a whole, answer as astrologer not AI BOT",
      user: `Generate western chart details only on aspects based on given json with minimum 3 sentences on each interpretation. Object format: {"title":"heading","interpretation":"Details","orb":data}. Response should not start with 'json' and must be within an array`,
      json: data.aspects,
    });
    prompts.push({
      key: "western_horoscope_houses",
      system: "give response only in json format as a whole, answer as astrologer not AI BOT",
      user: `Generate western chart details only on houses based on given json with minimum 3 sentences on each interpretation. Response must be in proper json format in an array`,
      json: data.houses,
    });
    prompts.push({
      key: "western_horoscope_lilith",
      system: "give response only in json format as a whole, answer as astrologer not AI BOT",
      user: `Generate western chart details only on lilith based on given json with minimum 3 sentences on each interpretation. Json must have only one index called interpretation and that will be string not object. Response must be within an array`,
      json: [data.lilith],
    });
    prompts.push({
      key: "western_horoscope_planets",
      system: "give response only in json format as a whole, answer as astrologer not AI BOT",
      user: `Generate western chart details only on planets based on given json with minimum 10 unique sentences on each planet. Object format: {"name":"planet name","interpretation":"detailed interpretation"}. Response must be within an array`,
      json: data.planets,
    });
    prompts.push({
      key: "dharma_karma",
      system: "give response only in json format as a whole, answer as astrologer not AI BOT",
      user: `Keeping western astrology in mind, provide dharma and karma details based on the planet, aspect and house info. Response must be json format: {"dharma":"paragraph","karma":"paragraph"} with minimum 3 sentences each`,
      json: [{ planet: data.planets, aspect: data.aspects, house: data.houses }],
    });
  }

  if (tab === "solar_return_v2") {
    prompts.push({
      key: "solar_return",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate solar return analysis based on the given data. Include insights on the solar return chart details, planets, house cusps, and aspects. Minimum 3 sentences per section. Response in json array format`,
      json: [data],
    });
  }

  if (tab === "tropical_transits_weekly_v2") {
    prompts.push({
      key: "tropical_transits_weekly",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate weekly transit interpretation based on the given transit data. Provide insights on major planetary movements and their effects. Minimum 3 sentences per transit. Response in json array format`,
      json: [data],
    });
  }

  if (tab === "tropical_transits_monthly_v3") {
    prompts.push({
      key: "tropical_transits_monthly",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate monthly transit interpretation based on the given data. Provide comprehensive insights on major planetary movements, lunar cycles, and their combined effects. Minimum 3 sentences per section. Response in json array format`,
      json: [data],
    });
  }

  if (["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2"].includes(tab)) {
    const context = tab === "romantic_forecast_report_tropical_v2" ? "romantic" : tab === "friendship_report_tropical_v2" ? "friendship" : "business";
    prompts.push({
      key: "synastry_horoscope",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate ${context} relationship synastry analysis based on the given data. Include compatibility insights, major aspects between the two charts, and relationship dynamics. Minimum 3 sentences per section. Response in json array format`,
      json: [data],
    });
    prompts.push({
      key: "composite_horoscope",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate ${context} composite chart analysis. Describe the energy of the relationship as a single entity. Minimum 3 sentences per section. Response in json array format`,
      json: [data],
    });
    prompts.push({
      key: "compatibility_score_or_summary",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate a ${context} compatibility summary with a score out of 10 and detailed explanation based on the synastry and composite data. Format: {"score":number,"summary":"paragraph","strengths":["..."],"challenges":["..."]}`,
      json: [data],
    });
  }

  if (tab === "horary_chart_v2") {
    prompts.push({
      key: "horary_chart_question",
      system: "give response only in json format, answer as astrologer not AI BOT",
      user: `Generate horary chart interpretation for the given question based on the astrological data. Include timing, planetary significators, and recommendations. Format: {"planet":{},"astrological_considerations":{},"recommendations":{},"alternative_timings":{}}`,
      json: [data],
    });
  }

  const returnTabMap: Record<string, string> = {
    "jupiter_return_v2": "jupiter_return_v2",
    "saturn_return_v2": "saturn_return_v2",
    "mars_return_v2": "mars_return_v2",
    "uranus_return_v2": "uranus_return_v2",
  };
  if (returnTabMap[tab]) {
    const planet = tab.split("_")[0];
    const returnDate = data?.returnDate ?? "calculated";
    prompts.push({
      key: returnTabMap[tab],
      system: "give response only in json format as a whole, nothing else answer as astrologer not AI BOT",
      user: `My birth details match the data given. My next ${planet} return date is ${returnDate}. I want to know about ${planet} return — career, relationships, personal growth, health. House system: whole sign. Format: {"chart_data":{},"title_and_interpretation":{"title":"...","interpretation":{"General":"...","Career":"...","Relationships":"...","Personal Growth":"...","Health":"..."}}}. All interpretations minimum 3 sentences. Response must not start with 'json' and be valid JSON`,
      json: [data],
    });
  }

  return prompts;
}

// ─── Result renderer ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResultSection({ title, data }: { title: string; data: any }) {
  const [open, setOpen] = useState(true);

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderValue = (val: any, depth = 0): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic text-xs">—</span>;
    if (typeof val === "string") {
      if (val.length > 200) {
        return <p className="text-sm leading-relaxed text-foreground">{val}</p>;
      }
      return <span className="text-sm text-foreground">{val}</span>;
    }
    if (typeof val === "number" || typeof val === "boolean") {
      return <span className="text-sm font-mono text-amber-600">{String(val)}</span>;
    }
    if (Array.isArray(val)) {
      return (
        <div className="space-y-3">
          {val.map((item, i) => (
            <div key={i} className={cn(depth > 0 ? "pl-3 border-l border-border" : "")}>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === "object") {
      return (
        <div className="space-y-2">
          {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className={cn("space-y-1", depth > 0 ? "" : "")}>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{k.replace(/_/g, " ")}</p>
              <div className={cn(depth > 0 ? "pl-2" : "")}>{renderValue(v, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-xs font-mono text-muted-foreground">{JSON.stringify(val)}</span>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <span className="text-sm font-semibold capitalize">{title.replace(/_/g, " ")}</span>
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {renderValue(data)}
        </div>
      )}
    </div>
  );
}

function ChartSvg({ svg }: { svg: string }) {
  if (!svg) return null;
  // If svg is a data URL or raw SVG string
  if (svg.startsWith("data:") || svg.startsWith("<svg")) {
    return (
      <div className="border rounded-lg p-3 bg-background">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Natal Wheel Chart</p>
        {svg.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={svg} alt="Natal Wheel Chart" className="max-w-full mx-auto" />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: svg }} className="overflow-x-auto" />
        )}
      </div>
    );
  }
  // URL
  return (
    <div className="border rounded-lg p-3 bg-background">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Natal Wheel Chart</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svg} alt="Natal Wheel Chart" className="max-w-full mx-auto rounded" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminHoroscopePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSlug = searchParams.get("tab") ?? TABS[0].slug;
  const currentTab = TABS.find((t) => t.slug === currentSlug) ?? TABS[0];

  const [form, setForm] = useState<FormState>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [natalSvg, setNatalSvg] = useState<string | null>(null);
  const [natalSvgTransit, setNatalSvgTransit] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);

  // Reset results on tab change
  useEffect(() => {
    setResults(null);
    setNatalSvg(null);
    setNatalSvgTransit(null);
    setReturnDate(null);
    setError(null);
    setProgress([]);
    setForm(defaultForm());
  }, [currentSlug]);

  function setTab(slug: string) {
    router.push(`/admin/horoscope?tab=${slug}`);
  }

  function addProgress(msg: string) {
    setProgress((p) => [...p, msg]);
  }

  function validateForm(): string | null {
    const p1 = form.person1;
    if (!p1.dob) return "Date of birth is required";
    if (!p1.tob) return "Time of birth is required";
    if (!p1.city) return "Please select a city from the dropdown";

    if (currentTab.type === "two-person") {
      const p2 = form.person2;
      if (!p2.dob) return "Partner date of birth is required";
      if (!p2.tob) return "Partner time of birth is required";
      if (!p2.city) return "Please select partner city from the dropdown";
    }

    if (currentTab.extras?.includes("question") && !form.question.trim()) {
      return "Please enter your question for the horary chart";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    setResults(null);
    setNatalSvg(null);
    setNatalSvgTransit(null);
    setReturnDate(null);
    setProgress([]);

    const collectedResults: Record<string, unknown> = {};

    try {
      const birth1 = parseBirth(form.person1);

      // ── Single-person tabs ──────────────────────────────────────────────────
      if (currentTab.type === "single") {
        // 1. Natal chart (western_horoscope)
        addProgress("Calculating natal chart data…");
        const natalData = await callCompute("western_horoscope", birth1 as unknown as Record<string, unknown>);
        collectedResults.natal_chart_data = natalData;

        // 2. Natal wheel SVG (AstrologyAPI)
        addProgress("Generating natal wheel (classic)…");
        try {
          const natalWheelData = await callCompute("natal_wheel_chart", birth1 as unknown as Record<string, unknown>);
          if (natalWheelData?.chart_url) setNatalSvg(natalWheelData.chart_url);
          collectedResults.natal_wheel = natalWheelData;
        } catch { /* non-fatal */ }

        // 3. Free natal wheel SVG
        addProgress("Generating natal wheel (free API)…");
        try {
          const freeWheelResp = await callNatalWheel(freeWheelBody(form.person1));
          const svgOut = freeWheelResp?.results?.output;
          if (svgOut) {
            setNatalSvg((prev) => prev ?? svgOut);
            collectedResults.free_natal_wheel = svgOut;
          }
        } catch { /* non-fatal */ }

        // 4. Tab-specific data
        if (currentTab.slug === "solar_return_v2") {
          addProgress("Fetching solar return data…");
          const [details, planets, cusps, aspects] = await Promise.allSettled([
            callCompute("solar_return_details", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_planets", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_house_cusps", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_planet_aspects", birth1 as unknown as Record<string, unknown>),
          ]);
          collectedResults.solar_return_details = details.status === "fulfilled" ? details.value : null;
          collectedResults.solar_return_planets = planets.status === "fulfilled" ? planets.value : null;
          collectedResults.solar_return_house_cusps = cusps.status === "fulfilled" ? cusps.value : null;
          collectedResults.solar_return_planet_aspects = aspects.status === "fulfilled" ? aspects.value : null;
        }

        if (currentTab.slug === "tropical_transits_weekly_v2") {
          addProgress("Fetching weekly transits…");
          if (form.futureWeek) {
            const weekStart = form.futureWeek;
            const weekData = await callPlanetReturn({
              steps: "astrology_report_weekly",
              birth_details: birth1,
              week_start_date: weekStart,
            });
            collectedResults.tropical_transits_weekly = weekData?.astrology_report_weekly ?? weekData;
          } else {
            const weeklyTransit = await callCompute("tropical_transits/weekly", birth1 as unknown as Record<string, unknown>);
            collectedResults.tropical_transits_weekly = weeklyTransit;
          }
          // Transit natal wheel
          addProgress("Generating transit wheel…");
          try {
            const transitWheelBody = { ...freeWheelBody(form.person1) };
            const transitWheelResp = await callNatalWheel(transitWheelBody);
            const svgOut = transitWheelResp?.results?.output;
            if (svgOut) { setNatalSvgTransit(svgOut); collectedResults.transit_natal_wheel = svgOut; }
          } catch { /* non-fatal */ }
        }

        if (currentTab.slug === "tropical_transits_monthly_v3") {
          addProgress("Fetching monthly transits + lunar return…");
          if (form.futureMonth) {
            const [mYear, mMonth] = form.futureMonth.split("-").map(Number);
            const monthData = await callPlanetReturn({
              steps: "astrology_report_monthly",
              birth_details: birth1,
              target_year: mYear,
              target_month: mMonth,
            });
            collectedResults.tropical_transits_monthly = monthData?.astrology_report_monthly ?? monthData;
            collectedResults.lunar_metrics = monthData?.astrology_report_monthly?.lunar_data ?? null;
          } else {
            const [monthlyTransit, lunar] = await Promise.allSettled([
              callCompute("tropical_transits/monthly", birth1 as unknown as Record<string, unknown>),
              callCompute("lunar_metrics", birth1 as unknown as Record<string, unknown>),
            ]);
            collectedResults.tropical_transits_monthly = monthlyTransit.status === "fulfilled" ? monthlyTransit.value : null;
            collectedResults.lunar_metrics = lunar.status === "fulfilled" ? lunar.value : null;
          }
        }

        if (currentTab.slug === "horary_chart_v2") {
          addProgress("Calculating horary chart…");
          const horary = await callCompute("horary_chart", {
            ...birth1,
            question: form.question,
          } as unknown as Record<string, unknown>);
          collectedResults.horary_chart = horary;
        }

        // Planet return tabs
        const planetReturnMap: Record<string, string> = {
          "jupiter_return_v2": "jupiter_return",
          "saturn_return_v2": "saturn_return",
          "mars_return_v2": "mars_return",
          "uranus_return_v2": "uranus_return",
        };

        if (planetReturnMap[currentTab.slug]) {
          const steps = planetReturnMap[currentTab.slug];
          const planetName = steps.split("_")[0]; // "jupiter", "saturn", etc.

          addProgress(`Calculating ${planetName} natal degree…`);
          const horoscopeForPlanet = natalData;
          const natalDeg = getPlanetDegree(horoscopeForPlanet?.planets, planetName.charAt(0).toUpperCase() + planetName.slice(1));

          addProgress(`Calculating ${planetName} return date…`);
          const bod = `${pad(birth1.year)}-${pad(birth1.month)}-${pad(birth1.day)} ${pad(birth1.hour)}:${pad(birth1.min)}:00`;
          const returnData = await callPlanetReturn({
            steps,
            date_of_birth_with_time: bod,
            natal_deg: natalDeg,
          });

          const returnKey = `${planetName}_return`;
          const returnDateVal = returnData?.[returnKey];
          if (returnDateVal) setReturnDate(returnDateVal);
          collectedResults[`${planetName}_return_data`] = returnData;
        }

        // 5. AI interpretations
        addProgress("Running AI interpretations…");
        const combinedData = { ...natalData, ...collectedResults, returnDate: returnDate ?? "calculated" };
        const prompts = buildAiPrompts(combinedData, currentTab.slug);

        const aiResults = await Promise.allSettled(
          prompts.map(async (p) => {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const res = await callAI(aiPayload, form.areaOfInquiry || undefined);
            let parsed = res.ai_response;
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed); } catch { /* keep as string */ }
            }
            return { key: p.key, value: parsed };
          })
        );

        const aiSection: Record<string, unknown> = {};
        for (const r of aiResults) {
          if (r.status === "fulfilled") aiSection[r.value.key] = r.value.value;
        }
        collectedResults.ai_interpretations = aiSection;
      }

      // ── Two-person tabs ─────────────────────────────────────────────────────
      if (currentTab.type === "two-person") {
        const birth2 = parseBirth(form.person2);

        addProgress("Calculating synastry chart…");
        const synastry = await callCompute("synastry_horoscope", {
          ...birth1,
          p_day: birth2.day, p_month: birth2.month, p_year: birth2.year,
          p_hour: birth2.hour, p_min: birth2.min,
          p_lat: birth2.lat, p_lon: birth2.lon, p_tzone: birth2.tzone,
        } as unknown as Record<string, unknown>);
        collectedResults.synastry_horoscope = synastry;

        addProgress("Calculating composite horoscope…");
        try {
          const composite = await callCompute("composite_horoscope", {
            ...birth1,
            p_day: birth2.day, p_month: birth2.month, p_year: birth2.year,
            p_hour: birth2.hour, p_min: birth2.min,
            p_lat: birth2.lat, p_lon: birth2.lon, p_tzone: birth2.tzone,
          } as unknown as Record<string, unknown>);
          collectedResults.composite_horoscope = composite;
        } catch { /* non-fatal */ }

        // Individual natal wheels
        addProgress("Generating natal wheels…");
        await Promise.allSettled([
          callNatalWheel(freeWheelBody(form.person1)).then((r) => {
            const svg = r?.results?.output;
            if (svg) { collectedResults.person1_natal_wheel = svg; setNatalSvg(svg); }
          }),
          callNatalWheel(freeWheelBody(form.person2)).then((r) => {
            const svg = r?.results?.output;
            if (svg) { collectedResults.person2_natal_wheel = svg; setNatalSvgTransit(svg); }
          }),
        ]);

        // AI
        addProgress("Running AI interpretations…");
        const combinedData = { ...synastry, ...collectedResults };
        const prompts = buildAiPrompts(combinedData, currentTab.slug);
        const aiResults = await Promise.allSettled(
          prompts.map(async (p) => {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const res = await callAI(aiPayload, form.areaOfInquiry || undefined);
            let parsed = res.ai_response;
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed); } catch { /* keep as string */ }
            }
            return { key: p.key, value: parsed };
          })
        );
        const aiSection: Record<string, unknown> = {};
        for (const r of aiResults) {
          if (r.status === "fulfilled") aiSection[r.value.key] = r.value.value;
        }
        collectedResults.ai_interpretations = aiSection;
      }

      setResults(collectedResults);
      addProgress("Done ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      {/* Left nav */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-muted/20 overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Astro Toolkit</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.slug === currentSlug;
            return (
              <button
                key={tab.slug}
                onClick={() => setTab(tab.slug)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors",
                  active
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3.5 shrink-0", active ? "text-amber-500" : "")} />
                <span className="leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <currentTab.icon className="size-5 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight">{currentTab.label}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{currentTab.description}</p>
          </div>

          {/* Mobile tab select */}
          <div className="md:hidden">
            <select
              value={currentSlug}
              onChange={(e) => setTab(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              {TABS.map((t) => (
                <option key={t.slug} value={t.slug}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {currentTab.type === "two-person" ? "Enter Both Persons' Data" : "Enter Birth Data"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {currentTab.type === "single" ? (
                  <BirthBlock
                    value={form.person1}
                    onChange={(v) => setForm((f) => ({ ...f, person1: v }))}
                    disabled={loading}
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <BirthBlock
                      title="Person 1 (Self)"
                      value={form.person1}
                      onChange={(v) => setForm((f) => ({ ...f, person1: v }))}
                      disabled={loading}
                    />
                    <BirthBlock
                      title="Person 2 (Partner)"
                      value={form.person2}
                      onChange={(v) => setForm((f) => ({ ...f, person2: v }))}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Extras */}
                {currentTab.extras?.includes("future_week") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Select Week (optional — defaults to current week)
                    </Label>
                    <Input
                      type="date"
                      value={form.futureWeek}
                      onChange={(e) => setForm((f) => ({ ...f, futureWeek: e.target.value }))}
                      disabled={loading}
                      className="h-9 text-sm max-w-xs"
                    />
                  </div>
                )}

                {currentTab.extras?.includes("future_month") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Select Month (optional — defaults to current month)
                    </Label>
                    <Input
                      type="month"
                      value={form.futureMonth ? form.futureMonth.slice(0, 7) : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, futureMonth: val ? `${val}-01` : "" }));
                      }}
                      disabled={loading}
                      className="h-9 text-sm max-w-xs"
                    />
                  </div>
                )}

                {currentTab.extras?.includes("question") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Your Question (required for Horary)
                    </Label>
                    <Textarea
                      value={form.question}
                      onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                      placeholder="e.g. Will I get the job I applied for this month?"
                      rows={3}
                      disabled={loading}
                      className="text-sm resize-none"
                    />
                  </div>
                )}

                {currentTab.extras?.includes("area_of_inquiry") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Area of Inquiry (optional)
                    </Label>
                    <Textarea
                      value={form.areaOfInquiry}
                      onChange={(e) => setForm((f) => ({ ...f, areaOfInquiry: e.target.value }))}
                      placeholder="What would you like to gain clarity on? e.g., Career and purpose, a specific relationship, navigating a current challenge…"
                      rows={3}
                      disabled={loading}
                      className="text-sm resize-none"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-white h-9"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing…
                    </>
                  ) : "Generate Reading"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progress log */}
          {loading && progress.length > 0 && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-1">
              {progress.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  {i === progress.length - 1 && loading
                    ? <Loader2 className="size-3.5 animate-spin text-amber-500 shrink-0" />
                    : <span className="size-3.5 flex items-center justify-center text-amber-500 shrink-0">✓</span>
                  }
                  {msg}
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Results</h2>
                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                  {currentTab.label}
                </Badge>
              </div>

              {returnDate && (
                <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Return Date: <span className="font-bold">{returnDate}</span>
                  </p>
                </div>
              )}

              {/* Natal wheel charts */}
              <div className={cn("gap-4", natalSvg && natalSvgTransit && "grid md:grid-cols-2")}>
                {natalSvg && <ChartSvg svg={natalSvg} />}
                {natalSvgTransit && (
                  <div className="border rounded-lg p-3 bg-background">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {currentTab.type === "two-person" ? "Person 2 Natal Wheel" : "Transit Natal Wheel"}
                    </p>
                    {natalSvgTransit.startsWith("data:") || natalSvgTransit.startsWith("<svg") ? (
                      natalSvgTransit.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={natalSvgTransit} alt="Transit Chart" className="max-w-full mx-auto" />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: natalSvgTransit }} className="overflow-x-auto" />
                      )
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={natalSvgTransit} alt="Transit Chart" className="max-w-full mx-auto rounded" />
                    )}
                  </div>
                )}
              </div>

              {/* AI interpretations first */}
              {results.ai_interpretations && typeof results.ai_interpretations === "object" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Interpretations</p>
                  {Object.entries(results.ai_interpretations as Record<string, unknown>).map(([key, val]) => (
                    <ResultSection key={key} title={key} data={val} />
                  ))}
                </div>
              )}

              {/* Raw astro data */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Astrological Data</p>
                {Object.entries(results)
                  .filter(([k]) => k !== "ai_interpretations" && k !== "natal_wheel" && !k.endsWith("_natal_wheel") && k !== "free_natal_wheel" && k !== "transit_natal_wheel")
                  .map(([key, val]) => (
                    <ResultSection key={key} title={key} data={val} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
