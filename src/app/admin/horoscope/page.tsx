"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2, ChevronDown, ChevronRight, Star, Sun, Moon,
  Calendar as CalendarIcon, Heart, Users, Briefcase, Eye, Zap,
  Sparkles, CircleDot, Clock, MapPin, Printer, ArrowUp, RotateCcw,
  X,
} from "lucide-react";

// ─── Planet & Zodiac symbols ─────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  Node: "☊", "Part of Fortune": "⊕", Chiron: "⚷", Lilith: "⚸",
};

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunction: "☌", Sextile: "⚹", Square: "□", Trine: "△", Opposition: "☍",
};

const PLANET_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Node", "Part of Fortune", "Chiron"];

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabType = "single" | "two-person";
interface TabDef {
  slug: string; label: string; type: TabType;
  extras?: ("area_of_inquiry" | "question" | "future_week" | "future_month")[];
  icon: React.ElementType; description: string;
}

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityOption {
  label: string; lat: number; lng: number;
  timezone: { name: string; offset_string: string; utcOffset: string };
}
interface BirthInput { dob: string; tob: string; city: CityOption | null; }
interface FormState {
  person1: BirthInput; person2: BirthInput;
  areaOfInquiry: string; question: string; futureWeek: string; futureMonth: string;
}

const emptyBirth = (): BirthInput => ({ dob: "", tob: "", city: null });
const defaultForm = (): FormState => ({
  person1: emptyBirth(), person2: emptyBirth(),
  areaOfInquiry: "", question: "", futureWeek: "", futureMonth: "",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return { hours, minutes, date: day, month, year, latitude: b.city!.lat, longitude: b.city!.lng, timezone: parseDecimalTz(b.city!.timezone.offset_string) };
}
function pad(n: number) { return n.toString().padStart(2, "0"); }
function getPlanetDegree(planets: any[], name: string) {
  const p = planets?.find((x: any) => x.name?.toLowerCase() === name.toLowerCase());
  return p?.full_degree ?? null;
}

// ─── Aspect orb color ─────────────────────────────────────────────────────────

function getAspectOrbColor(orb: number, type: string, ap: string, asp: string): string {
  const ranges: Record<string, number> = { Sun: 2.5, Moon: 2, Mercury: 2.2, Venus: 2.3, Mars: 2.4, Jupiter: 3, Saturn: 3.2, Uranus: 3.5, Neptune: 3.7, Pluto: 4 };
  let nearExact = ((ranges[ap] ?? 3) + (ranges[asp] ?? 3)) / 2;
  if (type === "Conjunction" || type === "Opposition") nearExact += 0.5;
  else if (type === "Sextile") nearExact -= 0.2;
  const orbVal = (["Conjunction", "Opposition"].includes(type)) ? 8 : 6;
  const abs = Math.abs(orb);
  if (abs <= nearExact) return "#eb910a";
  if (abs <= 1.5 * nearExact) return orb < 0 ? "#b8b205" : "#226404";
  if (abs <= orbVal / 3) return orb < 0 ? "#faf562" : "#52fc03";
  if (abs <= (2 * orbVal) / 3) return orb < 0 ? "#ecff46" : "#76ff81";
  return orb < 0 ? "#fffdba" : "#a6ffad";
}

// ─── API callers ──────────────────────────────────────────────────────────────

async function callCompute(endpoint: string, payload: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/compute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint, payload }) });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}
async function callAI(aiPayload: Record<string, unknown>, areaOfInquiry?: string) {
  const r = await fetch("/api/admin/astro/ai-interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aiPayload, areaOfInquiry }) });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}
async function callPlanetReturn(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/planet-return", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}
async function callNatalWheel(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/astro/natal-wheel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json();
}

// ─── AI prompt builders ───────────────────────────────────────────────────────

function buildAiPrompts(data: any, tab: string) {
  const prompts: { key: string; system: string; user: string; json: unknown[] }[] = [];

  if (tab === "western_horoscope_v2" || ["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(tab)) {
    // Exact prompts ported from Angular westernhoroscop-v2.component.ts → stringModifier()
    prompts.push({
      key: "western_horoscope_ascendant_midheaven_vertex",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation.response should not start with string 'json'  ever  and must be with in  an array  ",
      user: "Generate western chart details only on ascendant,midheaven,vertex based on given json with minimum 3 sentences on each interpretations(for each ascendant ,midheaven , vertex) (mention significance of degree (upto 2 desimal points) for each) with a numnber as index named index  of  ascendant,midheaven,vertex in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single ascendant,midheaven,vertex there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be \n[\n  {\"ascendant\":\"interpretation\"},\n  {\"midheaven\":\"interpretation\"},\n  {\"vertex\":\"interpretation\"}\n].Double check that response should not start with string 'json'  ever  and must be with in  an array ",
      json: [{ ascendant: data.ascendant, midheaven: data.midheaven, vertex: data.vertex, houses: data.houses, aspects: data.aspects, planets: data.planets }],
    });
    prompts.push({
      key: "western_horoscope_aspects",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on aspects based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  aspect in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single aspect there are many please be careful object format in json  should be {\"title\":\"Title or heading of the interpretation \",\"interpretation\":\"Details Interpretation\", \"orb\":data} , response should not start with string 'json'  ever  and must be with in  an array ",
      json: data.aspects,
    });
    prompts.push({
      key: "western_horoscope_houses",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on houses based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  houses in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single houses there are many please be careful and response should not start with string 'json'  ever but in proper json format in an array ",
      json: data.houses,
    });
    prompts.push({
      key: "western_horoscope_lilith",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on lilith based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  lilith in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single lilith there are many please be careful and response should not start with string 'json'  ever but in proper json format in an array and json must have only one index called interpretation and that will be string not object.response should not start with string 'json'  ever  and must be with in  an array",
      json: [data.lilith],
    });
    prompts.push({
      key: "western_horoscope_planets",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
      user: "Generate western chart details only on planets based on given json with minimum 10 unique sentences on each planet and its significance with each of house position , full degree, norm degree , speed , sign in as much as detail possible(5 sentences for each of house position , full degree, norm degree , speed , sign all should be with in interpretation not in other index for sure ) . don't miss a single planet there are many please be careful  and response should not start with string 'json'  ever but in proper json format in an array and object in json will be name and interpretation(each of them must have 3 sentences at least) only (nothing else) where both will be string only not object",
      json: data.planets,
    });
    prompts.push({
      key: "dharma_karma",
      system: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT",
      user: "Keeping western astrology in mind and keeping this as main source info I need to know details of dharma and karma karma as paragraph you have planet , aspect and house info given in json response must be in json format as {dharma:data,karma:data} ,response should not start with string 'json' key  ever  and must be a valid json format here data is dynamic data form bot and must be a paragraph with 3 sentences for both dharma and karma make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and keep these rules in mind mainly : In Western astrology, we can interpret Karma and Dharma by analyzing various planetary placements and aspects. Saturn, as the Karmic Significator, reveals areas of life where karmic lessons, restrictions, and responsibilities may arise, with its house and sign placement providing clues to these areas, and aspects to other planets revealing specific challenges and opportunities for growth. The South Node and the 12th House offer insights into past life tendencies and ingrained patterns that need to be released, with the South Node indicating these tendencies through its sign and house placement, and the 12th House, linked to the subconscious, potentially revealing karmic debts or unresolved issues. Conversely, the North Node and 9th House point toward the soul's evolutionary path and the direction of growth, with the North Node indicating this direction through its sign and house placement, and the 9th House, representing higher learning and philosophy, providing clues about the individual's Dharma and potential paths to meaning and purpose. Jupiter, as a Dharmic Indicator, highlights areas of potential expansion, wisdom, and fulfillment of Dharma through its house and sign placement, while aspects to other planets can reveal opportunities for growth and alignment with the soul's purpose. The Sun and Moon placements also contribute to understanding Karma and Dharma; the Sun represents the core identity and conscious will, offering insights into karmic lessons and how one can shine their light, while the Moon reflects emotional needs and subconscious patterns, potentially connected to past life influences and karmic themes. Finally, analyzing aspects and chart dynamics, specifically challenging aspects (squares, oppositions) and harmonious aspects (trines, sextiles), helps identify potential karmic blockages or areas of conflict, and opportunities for growth, integration, and fulfillment of Dharma. Double check that Response should not start with string 'json'  ever  and must be a valid json format",
      json: [{ planet: data.planets, aspect: data.aspects, house: data.houses }],
    });
  }

  if (tab === "solar_return_v2") {
    // Ported from Angular saturn-return-v2 (same structure used for solar return AI calls)
    prompts.push({
      key: "solar_return_details",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate solar return details based on given json with minimum 3 sentences on each interpretation with a number as index of details in as much detail as possible, only interpretation in json index in lowest level of indexes please and don't miss a single detail. Response should not start with string 'json' ever but in proper json format in an array with objects {\"title\":\"...\",\"interpretation\":\"...\"}",
      json: [{ details: data.solar_return_details, planets: data.solar_return_planets, cusps: data.solar_return_cusps, aspects: data.solar_return_aspects }],
    });
  }

  if (tab === "tropical_transits_weekly_v2" || tab === "tropical_transits_monthly_v3") {
    // Ported from Angular tropical-transits-v2 component
    const label = tab === "tropical_transits_weekly_v2" ? "weekly" : "monthly";
    prompts.push({
      key: tab === "tropical_transits_weekly_v2" ? "tropical_transits_weekly" : "tropical_transits_monthly",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: `Generate ${label} transit interpretation based on given json with minimum 3 sentences on each transit interpretation. Don't miss a single transit. Response should not start with string 'json' ever but in proper json format in an array with objects {"title":"...","interpretation":"..."} covering all major planetary movements and their effects`,
      json: [data],
    });
  }

  if (["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2"].includes(tab)) {
    // Ported from Angular romantic-forcast-report-v2 / friendship / business-partner components
    const context = tab === "romantic_forecast_report_tropical_v2" ? "romantic" : tab === "friendship_report_tropical_v2" ? "friendship" : "business";
    prompts.push({
      key: "synastry_horoscope",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: `Generate ${context} relationship synastry chart details based on given json with minimum 3 sentences on each interpretation. Include compatibility insights, major aspects between the two charts, and relationship dynamics. Response in format {\"data\":[{\"title\":\"...\",\"data\":\"...\"}]} as a valid json object. Do not start with 'json' string`,
      json: [data],
    });
    prompts.push({
      key: "composite_horoscope",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: `Generate ${context} composite chart analysis based on given json. Describe the energy of the relationship as a single entity with minimum 3 sentences per section. Include key composite themes, strengths, and challenges. Response in format {\"data\":[{\"title\":\"...\",\"data\":\"...\"}]} as valid json. Do not start with 'json' string`,
      json: [data],
    });
  }

  if (tab === "horary_chart_v2") {
    // Ported from Angular horary component — exact format matches Angular's horary_chart_question call
    prompts.push({
      key: "horary_chart_question",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: `Generate horary chart interpretation for the given question based on the astrological data. Include timing, planetary significators, and recommendations. Response must follow this exact json structure: {\"planet\":{},\"astrological_considerations\":{},\"recommendations\":{},\"alternative_timings\":{},\"data\":{\"recomendation_on_date_and_timeline\":{\"title\":\"\",\"data\":\"\"},\"house\":[{\"title\":\"\",\"data\":\"\"}],\"planet\":[{\"title\":\"\",\"data\":\"\"}],\"summary\":{\"recommendation_on_date_and_timeline\":[{\"timeline_title\":\"\",\"timeline_data\":\"\"}]}}}. Do not start response with string 'json' ever`,
      json: [data],
    });
  }

  const returnTabMap: Record<string, string> = { "jupiter_return_v2": "jupiter_return_v2", "saturn_return_v2": "saturn_return_v2", "mars_return_v2": "mars_return_v2", "uranus_return_v2": "uranus_return_v2" };
  if (returnTabMap[tab]) {
    // Ported from Angular jupiter/saturn/mars/uranus-return-v2 components
    const planet = tab.split("_")[0];
    const returnDate = data?.returnDate ?? "calculated";
    prompts.push({
      key: returnTabMap[tab],
      system: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT",
      user: `My birth details match the data given. My next ${planet} return date is ${returnDate}. I want to know about ${planet} return — career, relationships, personal growth, health. House system: whole sign. Response must follow this exact json format: {\"chart_data\":{},\"title_and_interpretation\":{\"title\":\"...\",\"interpretation\":{\"General\":\"...\",\"Career\":\"...\",\"Relationships\":\"...\",\"Personal Growth\":\"...\",\"Health\":\"...\"}}}. All interpretation fields minimum 3 sentences. Response must not start with 'json' string and must be valid json`,
      json: [data],
    });
  }

  return prompts;
}

// ─── Show More Modal ──────────────────────────────────────────────────────────

function ShowMoreModal({ title, content, loading, open, onClose }: {
  title: string; content: string; loading: boolean; open: boolean; onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold capitalize">{title.replace(/_/g, " ")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-amber-500" />
            <span className="text-sm">Loading extended interpretation…</span>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{content}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Chart Image Modal ────────────────────────────────────────────────────────

function ChartImageModal({ src, open, onClose }: { src: string; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>Natal Chart</DialogTitle>
        </DialogHeader>
        {src.startsWith("<svg") ? (
          <div dangerouslySetInnerHTML={{ __html: src }} className="overflow-auto" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Natal Chart" className="w-full h-auto rounded" />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Planet Symbol ────────────────────────────────────────────────────────────

function PlanetSymbol({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-amber-500 font-semibold text-base leading-none" aria-hidden>{PLANET_SYMBOLS[name] ?? "✦"}</span>
      <span>{name}</span>
    </span>
  );
}

function ZodiacSymbol({ sign }: { sign: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-amber-500" aria-hidden>{ZODIAC_SYMBOLS[sign] ?? "•"}</span>
      <span>{sign}</span>
    </span>
  );
}

// ─── Orb Circle SVG ───────────────────────────────────────────────────────────

function OrbCircle({ orb, color }: { orb: number; color: string }) {
  const maxOrb = 10;
  const clampedOrb = Math.min(Math.abs(orb), maxOrb);
  const angle = (clampedOrb / maxOrb) * 2 * Math.PI - Math.PI / 2;
  const needleX = 100 + 65 * Math.cos(angle);
  const needleY = 100 + 65 * Math.sin(angle);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    return { x1: 100 + 88 * Math.cos(a), y1: 100 + 88 * Math.sin(a), x2: 100 + 78 * Math.cos(a), y2: 100 + 78 * Math.sin(a) };
  });
  return (
    <svg width="36" height="36" viewBox="0 0 200 200" className="shrink-0">
      <circle cx="100" cy="100" r="90" fill={color} />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
      ))}
      <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="black" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="black" />
    </svg>
  );
}

// ─── Aspects Legend ───────────────────────────────────────────────────────────

function AspectsLegend() {
  const items = [
    { color: "#eb910a", label: "Orange", desc: "Very close to exact — strong immediate influence" },
    { color: "#226404", label: "Dark Green", desc: "Just past the exact degree" },
    { color: "#b8b205", label: "Dark Yellow", desc: "Just before the exact degree" },
    { color: "#52fc03", label: "Green", desc: "Moderately past target" },
    { color: "#faf562", label: "Yellow", desc: "Moderately before target" },
    { color: "#76ff81", label: "Light Green", desc: "Further past target" },
    { color: "#ecff46", label: "Light Yellow", desc: "Further before target" },
  ];
  return (
    <div className="mb-4 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">Aspect Proximity Indicator</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border border-border/50 shrink-0" style={{ background: item.color }} />
            <span className="text-[11px] text-muted-foreground"><b>{item.label}:</b> {item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
        <Loader2 className="size-4 animate-spin text-amber-500" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + i * 15}%` }} />)}
      </div>
    </div>
  );
}

// ─── Section error ────────────────────────────────────────────────────────────

function SectionError({ title }: { title: string }) {
  return (
    <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
      <p className="text-sm font-semibold text-destructive">{title} — failed to load</p>
      <p className="text-xs text-muted-foreground mt-1">The AI interpretation could not be retrieved. Check network and try again.</p>
    </div>
  );
}

// ─── Show More hook ───────────────────────────────────────────────────────────

function useShowMore() {
  const [modal, setModal] = useState<{ title: string; content: string; loading: boolean } | null>(null);

  async function trigger(title: string, currentText: string, promptData: any, areaOfInquiry?: string) {
    setModal({ title, content: "", loading: true });
    try {
      const aiPayload = {
        condition: {
          system_content: "Give response as plain text, answer as an astrologer not an AI bot. Be detailed and thorough.",
          user_content: `Give me a much more detailed and expanded interpretation of "${title}" in western astrology. Based on the given data, provide at least 10 sentences covering its meaning, influence on personality, life events, relationships, career, and spiritual growth. Current summary: ${currentText}`,
        },
        toolname: "other",
        json: [promptData],
      };
      const res = await callAI(aiPayload as any, areaOfInquiry);
      let text = res.ai_response;
      if (typeof text !== "string") text = JSON.stringify(text, null, 2);
      setModal({ title, content: text, loading: false });
    } catch {
      setModal({ title, content: "Could not load extended interpretation. Please try again.", loading: false });
    }
  }

  return { modal, trigger, close: () => setModal(null) };
}

// ─── Planets Section ──────────────────────────────────────────────────────────

function PlanetsSection({ planets, aiData, areaOfInquiry }: { planets: any[]; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  if (!planets) return null;

  // Sort planets in canonical order
  const ordered = [...planets].sort((a, b) => PLANET_ORDER.indexOf(a.name) - PLANET_ORDER.indexOf(b.name));

  // Build AI map: name → interpretation
  const aiMap: Record<string, string> = {};
  if (Array.isArray(aiData)) {
    for (const item of aiData) {
      if (item?.name) aiMap[item.name] = item.interpretation ?? "";
    }
  }

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h3 className="text-sm font-semibold">Planet Information</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                {["Planet", "Sign", "Full Degree", "House", "Norm Degree", "Speed", "Retro?"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.map((p, i) => (
                <tr key={p.name} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap"><PlanetSymbol name={p.name} /></td>
                  <td className="px-3 py-2 whitespace-nowrap"><ZodiacSymbol sign={p.sign} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{Number(p.full_degree).toFixed(2)}°</td>
                  <td className="px-3 py-2 text-center">{p.house}</td>
                  <td className="px-3 py-2 font-mono text-xs">{Number(p.norm_degree).toFixed(2)}°</td>
                  <td className="px-3 py-2 font-mono text-xs">{Number(p.speed).toFixed(4)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={p.is_retro === "true" ? "destructive" : "outline"} className="text-[10px]">
                      {p.is_retro === "true" ? "R" : "—"}
                    </Badge>
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
            return (
              <div key={p.name} className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
                  <span className="text-amber-500 text-base">{PLANET_SYMBOLS[p.name] ?? "✦"}</span>
                  <h4 className="text-sm font-semibold uppercase tracking-wide">{p.name}</h4>
                  <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-400">{p.sign} · House {p.house}</Badge>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed text-foreground">{interp}</p>
                  <button
                    onClick={() => trigger(p.name, interp, { planet: p, context: "western astrology planet interpretation" }, areaOfInquiry)}
                    className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
                  >Show More</button>
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
      if (item?.house !== undefined) aiMap[item.house] = item.interpretation ?? "";
    }
  }

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />

      {/* House table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h3 className="text-sm font-semibold">House Information</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                {["House", "Sign", "Degree", "Planets"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {houses.map((h: any, i: number) => (
                <tr key={h.house} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                  <td className="px-3 py-2 font-semibold">House {h.house}</td>
                  <td className="px-3 py-2"><ZodiacSymbol sign={h.sign} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{Number(h.degree).toFixed(2)}°</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(houseMap[Number(h.house)] ?? []).map((pName) => (
                        <Badge key={pName} variant="secondary" className="text-[10px]">
                          <span className="text-amber-500 mr-1">{PLANET_SYMBOLS[pName] ?? "✦"}</span>{pName}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* House bar chart */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h3 className="text-sm font-semibold">House Chart</h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {houses.map((h: any) => {
            const planetsInHouse = houseMap[Number(h.house)] ?? [];
            return (
              <div key={h.house} className="flex items-center gap-2 rounded-md border p-2">
                <div className="shrink-0 w-16">
                  <p className="text-xs font-semibold text-amber-600">House {h.house}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="text-amber-500">{ZODIAC_SYMBOLS[h.sign] ?? ""}</span> {h.sign}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {/* Empty boxes up to house number */}
                  {[...Array(Math.min(Number(h.house) - 1, 6))].map((_, idx) => (
                    <span key={idx} className="size-4 rounded-sm border border-border/40 bg-muted/30" />
                  ))}
                  {/* Planet badges */}
                  {planetsInHouse.map((pName) => (
                    <span key={pName} className="text-amber-500 text-base" title={pName}>{PLANET_SYMBOLS[pName] ?? "✦"}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI interpretations */}
      {!aiData && <SectionSkeleton title="House Interpretations" />}
      {aiData === "error" && <SectionError title="House Interpretations" />}
      {Array.isArray(aiData) && aiData.length > 0 && (
        <div className="space-y-3">
          {aiData.map((item: any) => (
            <div key={item.house} className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b">
                <h4 className="text-sm font-semibold uppercase tracking-wide">House {item.house}</h4>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed">{item.interpretation}</p>
                <button onClick={() => trigger(`House ${item.house}`, item.interpretation, item, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aspects Section ──────────────────────────────────────────────────────────

function AspectsSection({ aspects, planets, aiData, areaOfInquiry }: { aspects: any[]; planets: any[]; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  if (!aspects) return null;

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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      <AspectsLegend />

      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h3 className="text-sm font-semibold">Aspects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                {["Aspected Planet", "Aspecting Planet", "Orb", "Type", "Diff", "Aspected °", "Aspecting °"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((a: any, i: number) => (
                <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                  <td className="px-3 py-2 whitespace-nowrap"><PlanetSymbol name={a.aspected_planet} /></td>
                  <td className="px-3 py-2 whitespace-nowrap"><PlanetSymbol name={a.aspecting_planet} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <OrbCircle orb={Number(a.orb ?? 0)} color={a.color} />
                      <span className="font-mono text-xs">{Number(a.orb ?? 0).toFixed(2)}°</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-amber-500">{ASPECT_SYMBOLS[a.type] ?? ""}</span>
                      <span>{a.type}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{a.diff}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.aspected_degree ?? "—"}°</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.aspecting_degree ?? "—"}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI aspect interpretations */}
      {!aiData && <SectionSkeleton title="Aspect Interpretations" />}
      {aiData === "error" && <SectionError title="Aspect Interpretations" />}
      {Array.isArray(aiData) && aiData.length > 0 && (
        <div className="space-y-3">
          {aiData.map((item: any, i: number) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b">
                <h4 className="text-sm font-semibold">{item.title ?? `Aspect ${i + 1}`}</h4>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed">{item.interpretation}</p>
                <button onClick={() => trigger(item.title ?? `Aspect ${i + 1}`, item.interpretation, item, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dharma & Karma Section ───────────────────────────────────────────────────

function DharmaKarmaSection({ data, rawData, areaOfInquiry }: { data: any; rawData?: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  if (!data && data !== "error") return <SectionSkeleton title="Dharma & Karma" />;
  if (data === "error") return <SectionError title="Dharma & Karma" />;

  const dharma = typeof data === "string" ? null : data?.dharma;
  const karma = typeof data === "string" ? null : data?.karma;

  return (
    <div className="space-y-3">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      {[{ key: "dharma", label: "Dharma", text: dharma }, { key: "karma", label: "Karma", text: karma }].map(({ key, label, text }) => (
        text ? (
          <div key={key} className="rounded-lg border overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-400/20">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{label}</h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed">{text}</p>
              <button onClick={() => trigger(label, text, rawData ?? data, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
            </div>
          </div>
        ) : null
      ))}
      {typeof data === "string" && <p className="text-sm text-muted-foreground px-4 py-3">{data}</p>}
    </div>
  );
}

// ─── Lilith Section ───────────────────────────────────────────────────────────

function LilithSection({ lilith, aiData, areaOfInquiry }: { lilith: any; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  if (!lilith) return null;

  const interp = Array.isArray(aiData) ? aiData[0]?.interpretation : null;

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h3 className="text-sm font-semibold">Lilith <span className="text-amber-500 ml-1">⚸</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                {["Planet", "Sign", "Full Degree", "House", "Norm Degree", "Speed", "Retro?"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-background">
                <td className="px-3 py-2 font-medium"><PlanetSymbol name={lilith.name ?? "Lilith"} /></td>
                <td className="px-3 py-2"><ZodiacSymbol sign={lilith.sign} /></td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.full_degree).toFixed(2)}°</td>
                <td className="px-3 py-2 text-center">{lilith.house}</td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.norm_degree).toFixed(2)}°</td>
                <td className="px-3 py-2 font-mono text-xs">{Number(lilith.speed).toFixed(4)}</td>
                <td className="px-3 py-2"><Badge variant={lilith.is_retro === "true" ? "destructive" : "outline"} className="text-[10px]">{lilith.is_retro === "true" ? "R" : "—"}</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
        {interp && (
          <div className="px-4 py-3 border-t">
            <p className="text-sm leading-relaxed">{interp}</p>
            <button onClick={() => trigger("Lilith", interp, lilith, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
          </div>
        )}
        {!aiData && <div className="px-4 py-3 border-t"><div className="h-3 bg-muted rounded w-3/4 animate-pulse" /></div>}
      </div>
    </div>
  );
}

// ─── Ascendant / Midheaven / Vertex Section ───────────────────────────────────

function AscMidheavenVertexSection({ natalData, aiData, areaOfInquiry }: { natalData: any; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  const keys = ["ascendant", "midheaven", "vertex"];
  const aiMap: Record<string, string> = {};
  if (Array.isArray(aiData)) {
    for (const item of aiData) {
      for (const k of keys) {
        if (item[k]) aiMap[k] = item[k];
      }
    }
  }

  if (!aiData && aiData !== "error") return <SectionSkeleton title="Ascendant · Midheaven · Vertex" />;
  if (aiData === "error") return <SectionError title="Ascendant · Midheaven · Vertex" />;

  return (
    <div className="rounded-lg border overflow-hidden">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      <div className="px-4 py-2.5 bg-muted/40 border-b">
        <h3 className="text-sm font-semibold">Ascendant · Midheaven · Vertex</h3>
      </div>
      <div className="divide-y">
        {keys.map((key) => {
          const degree = natalData?.[key];
          const interp = aiMap[key];
          return (
            <div key={key} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">{key}</h4>
                {degree && <Badge variant="outline" className="text-[10px]">{typeof degree === "object" ? `${degree.sign ?? ""} ${Number(degree.degree ?? 0).toFixed(2)}°` : String(degree)}</Badge>}
              </div>
              <p className="text-sm leading-relaxed">{interp ?? <span className="text-muted-foreground italic">Loading…</span>}</p>
              {interp && (
                <button onClick={() => trigger(key, interp, { [key]: degree }, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Natal Charts Row ─────────────────────────────────────────────────────────

function NatalChartsRow({ svg1, svg2, label1 = "Natal Wheel Chart", label2 = "Natal Wheel Chart (Alt)", onExpandImg }: {
  svg1: string | null; svg2: string | null; label1?: string; label2?: string; onExpandImg: (src: string) => void;
}) {
  if (!svg1 && !svg2) return null;

  const renderImg = (src: string, label: string) => (
    <div className="flex-1 min-w-[200px] border rounded-lg p-2 bg-background cursor-pointer hover:ring-2 ring-amber-400 transition" onClick={() => onExpandImg(src)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label} <Eye className="inline size-3 ml-1 opacity-60" /></p>
      {src.startsWith("<svg") ? (
        <div dangerouslySetInnerHTML={{ __html: src }} className="overflow-hidden max-h-80" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full h-auto rounded" />
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap gap-4">
      {svg1 && renderImg(svg1, label1)}
      {svg2 && renderImg(svg2, label2)}
    </div>
  );
}

// ─── Planet Return Summary Table ──────────────────────────────────────────────

function PlanetReturnSummaryTable({ tab, birth, returnDate, natalData }: {
  tab: string; birth: BirthInput; returnDate: string | null; natalData: any;
}) {
  const planet = tab.split("_")[0]; // jupiter, saturn, mars, uranus
  const label = planet.charAt(0).toUpperCase() + planet.slice(1);
  const natalDeg = natalData?.planets ? getPlanetDegree(natalData.planets, label) : null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-400/20">
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{label} Return — Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              {["Date of Birth", "Place of Birth", "Time of Birth", "House System", `${label} at Birth`, `Next ${label} Return`].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-background">
              <td className="px-3 py-2">{birth.dob ? format(parse(birth.dob, "yyyy-MM-dd", new Date()), "PPP") : "—"}</td>
              <td className="px-3 py-2">{birth.city?.label ?? "—"}</td>
              <td className="px-3 py-2">{birth.tob || "—"}</td>
              <td className="px-3 py-2">Whole Sign</td>
              <td className="px-3 py-2 font-mono text-xs">{natalDeg != null ? `${natalDeg.toFixed(2)}°` : "—"}</td>
              <td className="px-3 py-2 font-semibold text-amber-600 dark:text-amber-400">{returnDate ?? <span className="text-muted-foreground">Calculating…</span>}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Planet Return AI Interpretation ─────────────────────────────────────────

function PlanetReturnInterpretation({ tab, aiData, areaOfInquiry }: { tab: string; aiData: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  if (!aiData && aiData !== "error") return <SectionSkeleton title="Return Interpretation" />;
  if (aiData === "error") return <SectionError title="Return Interpretation" />;

  const interp = aiData?.title_and_interpretation?.interpretation ?? aiData?.interpretation ?? null;
  const title = aiData?.title_and_interpretation?.title ?? `${tab.split("_")[0].charAt(0).toUpperCase() + tab.split("_")[0].slice(1)} Return`;

  return (
    <div className="rounded-lg border overflow-hidden">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      <div className="px-4 py-2.5 bg-muted/40 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y">
        {interp && typeof interp === "object" ? (
          Object.entries(interp).map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1.5">{k}</h4>
              <p className="text-sm leading-relaxed">{String(v)}</p>
              <button onClick={() => trigger(k, String(v), interp, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
            </div>
          ))
        ) : interp ? (
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed">{String(interp)}</p>
          </div>
        ) : null}
        {aiData && typeof aiData === "object" && aiData.chart_data && (
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

function SolarReturnSection({ details, planets, cusps, aspects, aiData, areaOfInquiry }: {
  details: any; planets: any; cusps: any; aspects: any; aiData: any; areaOfInquiry?: string;
}) {
  const { modal, trigger, close } = useShowMore();
  const sections = [
    { key: "details", label: "Solar Return Details", data: details },
    { key: "planets", label: "Solar Return Planets", data: planets },
    { key: "cusps", label: "Solar Return House Cusps", data: cusps },
    { key: "aspects", label: "Solar Return Aspects", data: aspects },
  ];

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />

      {/* Solar return date table from details */}
      {details && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h3 className="text-sm font-semibold">Solar Return Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  {["Native Birth Date", "Solar Return Date", "Sun Degree", "Solar Return ASC"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-background">
                  <td className="px-3 py-2">{details.native_birth_date ?? details.date_of_birth ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold text-amber-600">{details.solar_return_date ?? details.return_date ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{details.sun_degree ?? "—"}</td>
                  <td className="px-3 py-2">{details.solar_return_asc ?? details.ascendant ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI interpretation */}
      {!aiData && <SectionSkeleton title="Solar Return Interpretation" />}
      {aiData === "error" && <SectionError title="Solar Return Interpretation" />}
      {Array.isArray(aiData) && aiData.map((item: any, i: number) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h4 className="text-sm font-semibold">{item.title ?? `Section ${i + 1}`}</h4>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed">{item.interpretation ?? item.data}</p>
            <button onClick={() => trigger(item.title ?? `Section ${i + 1}`, item.interpretation ?? item.data, item, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
          </div>
        </div>
      ))}

      {/* Raw data panels */}
      {sections.map(({ key, label, data }) => data && (
        <details key={key} className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">{label} (raw)</summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

// ─── Transit Section ──────────────────────────────────────────────────────────

function TransitSection({ data, aiData, tabSlug, areaOfInquiry }: { data: any; aiData: any; tabSlug: string; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  const label = tabSlug === "tropical_transits_weekly_v2" ? "Weekly Transits" : "Monthly Transits";

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />

      {/* AI sections */}
      {!aiData && <SectionSkeleton title={`${label} Interpretation`} />}
      {aiData === "error" && <SectionError title={`${label} Interpretation`} />}
      {Array.isArray(aiData) && aiData.map((item: any, i: number) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h4 className="text-sm font-semibold">{item.title ?? `${label} ${i + 1}`}</h4>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed">{item.interpretation ?? item.data}</p>
            <button onClick={() => trigger(item.title ?? label, item.interpretation ?? "", item, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
          </div>
        </div>
      ))}

      {/* Raw data */}
      {data && (
        <details className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">{label} Raw Data</summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// ─── Horary Section ───────────────────────────────────────────────────────────

function HorarySection({ data, areaOfInquiry }: { data: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  if (!data) return <SectionSkeleton title="Horary Chart Interpretation" />;
  if (data === "error") return <SectionError title="Horary Chart Interpretation" />;

  const inner = data?.data ?? data;

  function ItemBlock({ title, text }: { title: string; text: string }) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed">{text}</p>
          <button onClick={() => trigger(title, text, { title, data: text }, areaOfInquiry)} className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />

      {/* Recommendation */}
      {inner?.recomendation_on_date_and_timeline?.data && (
        <ItemBlock title={inner.recomendation_on_date_and_timeline.title ?? "Recommendation on Date & Timeline"} text={inner.recomendation_on_date_and_timeline.data} />
      )}

      {/* Summary */}
      {Array.isArray(inner?.summary?.recommendation_on_date_and_timeline) && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Summary</h3></div>
          <div className="divide-y">
            {inner.summary.recommendation_on_date_and_timeline.map((s: any, i: number) => (
              <div key={i} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{s.timeline_title}</h4>
                <p className="text-sm leading-relaxed">{s.timeline_data}</p>
                <button onClick={() => trigger(s.timeline_title, s.timeline_data, s, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Houses */}
      {Array.isArray(inner?.house) && inner.house.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">House</h3></div>
          <div className="divide-y">
            {inner.house.map((h: any, i: number) => (
              <div key={i} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{h.title}</h4>
                <p className="text-sm leading-relaxed">{h.data}</p>
                <button onClick={() => trigger(h.title, h.data, h, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planets */}
      {Array.isArray(inner?.planet) && inner.planet.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Planet</h3></div>
          <div className="divide-y">
            {inner.planet.map((p: any, i: number) => (
              <div key={i} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{p.title}</h4>
                <p className="text-sm leading-relaxed">{p.data}</p>
                <button onClick={() => trigger(p.title, p.data, p, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback raw */}
      {!inner?.recomendation_on_date_and_timeline && !inner?.house && !inner?.planet && (
        <details className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">Horary Chart Raw Data</summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// ─── Relationship Section (Synastry / Composite) ──────────────────────────────

function RelationshipSection({ synastryAi, compositeAi, areaOfInquiry }: { synastryAi: any; compositeAi: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  function AiBlock({ title, items }: { title: string; items: any[] }) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">{title}</h3></div>
        <div className="divide-y">
          {items.map((item: any, i: number) => (
            <div key={i} className="px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{item.title}</h4>
              <p className="text-sm leading-relaxed">{item.data}</p>
              <button onClick={() => trigger(item.title, item.data, item, areaOfInquiry)} className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} />
      {!synastryAi && <SectionSkeleton title="Synastry Horoscope" />}
      {synastryAi === "error" && <SectionError title="Synastry Horoscope" />}
      {synastryAi && synastryAi !== "error" && Array.isArray(synastryAi?.data) && (
        <AiBlock title="Synastry Horoscope" items={synastryAi.data} />
      )}
      {!compositeAi && <SectionSkeleton title="Composite Horoscope" />}
      {compositeAi === "error" && <SectionError title="Composite Horoscope" />}
      {compositeAi && compositeAi !== "error" && Array.isArray(compositeAi?.data) && (
        <AiBlock title="Composite Horoscope" items={compositeAi.data} />
      )}
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

function DatePicker({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected: Date | undefined = value ? (() => { const d = parse(value, "yyyy-MM-dd", new Date()); return isValid(d) ? d : undefined; })() : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className={cn("h-9 w-full justify-start text-left font-normal text-sm", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-60" />
          {selected ? format(selected, "PPP") : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={(date) => { onChange(date ? format(date, "yyyy-MM-dd") : ""); setOpen(false); }} captionLayout="dropdown" startMonth={new Date(1900, 0)} endMonth={new Date()} disabled={(date) => date > new Date()} />
      </PopoverContent>
    </Popover>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

function TimePicker({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [hh, mm] = value ? value.split(":") : ["", ""];
  function update(newHH: string, newMM: string) {
    if (newHH !== "" && newMM !== "") onChange(`${newHH}:${newMM}`);
    else if (newHH !== "") onChange(`${newHH}:${mm || "00"}`);
    else if (newMM !== "") onChange(`${hh || "00"}:${newMM}`);
  }
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="size-4 shrink-0 text-muted-foreground" />
      <Select value={hh} onValueChange={(v) => update(v, mm)} disabled={disabled}>
        <SelectTrigger className="h-9 w-[72px] text-sm"><SelectValue placeholder="HH" /></SelectTrigger>
        <SelectContent className="max-h-52">{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-muted-foreground font-semibold select-none">:</span>
      <Select value={mm} onValueChange={(v) => update(hh, v)} disabled={disabled}>
        <SelectTrigger className="h-9 w-[72px] text-sm"><SelectValue placeholder="MM" /></SelectTrigger>
        <SelectContent className="max-h-52">{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground ml-0.5">24h</span>
    </div>
  );
}

// ─── CityAutocomplete ─────────────────────────────────────────────────────────

function CityAutocomplete({ value, onChange, label = "Place of Birth", disabled = false }: {
  value: CityOption | null; onChange: (c: CityOption | null) => void; label?: string; disabled?: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (value) setQuery(value.label); }, [value]);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setOptions([]); setOpen(false); return; }
    setLoading(true);
    fetch("/api/admin/astro/city-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) })
      .then((r) => r.json()).then((d) => { setOptions(d.results ?? []); setOpen((d.results ?? []).length > 0); })
      .catch(() => setOptions([])).finally(() => setLoading(false));
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value; setQuery(q); onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  }
  function select(c: CityOption) { onChange(c); setQuery(c.label); setOptions([]); setOpen(false); }

  return (
    <div className="relative space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground block">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
        <Input value={query} onChange={handleInput} onBlur={() => setTimeout(() => setOpen(false), 200)} placeholder="Search city, state or country…" disabled={disabled} className="h-9 text-sm pl-8 pr-8" />
        {loading && <Loader2 className="absolute right-2.5 top-2 size-4 animate-spin text-muted-foreground" />}
      </div>
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-0.5 w-full rounded-md border bg-popover shadow-lg text-sm max-h-60 overflow-y-auto">
          {options.map((opt, i) => {
            const parts = opt.label.split(","); const primary = parts[0]?.trim() ?? opt.label; const secondary = parts.slice(1).join(",").trim();
            return (
              <li key={i} className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors border-b border-border/50 last:border-0" onMouseDown={() => select(opt)}>
                <MapPin className="size-3.5 mt-0.5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{primary}</p>
                  {secondary && <p className="text-[11px] text-muted-foreground truncate">{secondary}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{opt.lat.toFixed(4)}, {opt.lng.toFixed(4)} · UTC{opt.timezone.offset_string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {value && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-400/30 px-2.5 py-1.5">
          <MapPin className="size-3 text-amber-500 shrink-0" />
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium truncate">{value.label}</span>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{value.lat.toFixed(3)}, {value.lng.toFixed(3)} · UTC{value.timezone.offset_string}</span>
        </div>
      )}
    </div>
  );
}

// ─── BirthBlock ───────────────────────────────────────────────────────────────

function BirthBlock({ title, value, onChange, disabled }: { title?: string; value: BirthInput; onChange: (v: BirthInput) => void; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{title}</p>}
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
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminHoroscopePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultRef = useRef<HTMLDivElement>(null);

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showChartBtn, setShowChartBtn] = useState(false);
  const [chartModal, setChartModal] = useState<string | null>(null);

  // Reset on tab change
  useEffect(() => {
    setResults(null); setNatalSvg(null); setNatalSvgTransit(null);
    setReturnDate(null); setError(null); setProgress([]); setForm(defaultForm());
    setShowScrollTop(false); setShowChartBtn(false);
  }, [currentSlug]);

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

  function setTab(slug: string) { router.push(`/admin/horoscope?tab=${slug}`); }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true); setError(null); setResults(null); setNatalSvg(null);
    setNatalSvgTransit(null); setReturnDate(null); setProgress([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: Record<string, any> = {};

    try {
      const birth1 = parseBirth(form.person1);

      // ── Single person ─────────────────────────────────────────────────────
      if (currentTab.type === "single") {
        addProgress("Calculating natal chart…");
        const natalData = await callCompute("western_horoscope", birth1 as unknown as Record<string, unknown>);
        collected.natal_chart_data = natalData;

        // Fetch both natal wheels in parallel — matching Angular's imgFetch + newNatalImagFetch
        addProgress("Generating natal wheels…");
        await Promise.allSettled([
          // Wheel 1: AstrologyAPI natal_wheel_chart → chart_url (PNG)
          callCompute("natal_wheel_chart", birth1 as unknown as Record<string, unknown>)
            .then((w) => { if (w?.chart_url) { setNatalSvg(w.chart_url); setShowChartBtn(true); } })
            .catch(() => { /* non-fatal */ }),
          // Wheel 2: FreeAstrologyAPI via NestJS → SVG/URL
          callNatalWheel(freeWheelBody(form.person1) as unknown as Record<string, unknown>)
            .then((freeResp) => { const svg = freeResp?.results?.output; if (svg) { setNatalSvgTransit(svg); setShowChartBtn(true); } })
            .catch(() => { /* non-fatal */ }),
        ]);

        // Tab-specific data
        if (currentTab.slug === "solar_return_v2") {
          addProgress("Fetching solar return data…");
          const [det, pla, cup, asp] = await Promise.allSettled([
            callCompute("solar_return_details", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_planets", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_house_cusps", birth1 as unknown as Record<string, unknown>),
            callCompute("solar_return_planet_aspects", birth1 as unknown as Record<string, unknown>),
          ]);
          collected.solar_return_details = det.status === "fulfilled" ? det.value : null;
          collected.solar_return_planets = pla.status === "fulfilled" ? pla.value : null;
          collected.solar_return_cusps = cup.status === "fulfilled" ? cup.value : null;
          collected.solar_return_aspects = asp.status === "fulfilled" ? asp.value : null;
        }

        if (currentTab.slug === "tropical_transits_weekly_v2") {
          addProgress("Fetching weekly transits…");
          if (form.futureWeek) {
            const wd = await callPlanetReturn({ steps: "astrology_report_weekly", birth_details: birth1, week_start_date: form.futureWeek });
            collected.transit_data = wd?.astrology_report_weekly ?? wd;
          } else {
            collected.transit_data = await callCompute("tropical_transits/weekly", birth1 as unknown as Record<string, unknown>);
          }
        }

        if (currentTab.slug === "tropical_transits_monthly_v3") {
          addProgress("Fetching monthly transits + lunar return…");
          if (form.futureMonth) {
            const [mYear, mMonth] = form.futureMonth.split("-").map(Number);
            const md = await callPlanetReturn({ steps: "astrology_report_monthly", birth_details: birth1, target_year: mYear, target_month: mMonth });
            collected.transit_data = md?.astrology_report_monthly ?? md;
            collected.lunar_metrics = md?.astrology_report_monthly?.lunar_data ?? null;
          } else {
            const [mt, lu] = await Promise.allSettled([
              callCompute("tropical_transits/monthly", birth1 as unknown as Record<string, unknown>),
              callCompute("lunar_metrics", birth1 as unknown as Record<string, unknown>),
            ]);
            collected.transit_data = mt.status === "fulfilled" ? mt.value : null;
            collected.lunar_metrics = lu.status === "fulfilled" ? lu.value : null;
          }
        }

        if (currentTab.slug === "horary_chart_v2") {
          addProgress("Calculating horary chart…");
          collected.horary_chart_data = await callCompute("horary_chart", { ...birth1, question: form.question } as unknown as Record<string, unknown>);
        }

        // Planet return tabs
        const planetReturnMap: Record<string, string> = { "jupiter_return_v2": "jupiter_return", "saturn_return_v2": "saturn_return", "mars_return_v2": "mars_return", "uranus_return_v2": "uranus_return" };
        if (planetReturnMap[currentTab.slug]) {
          const steps = planetReturnMap[currentTab.slug];
          const planetName = steps.split("_")[0];
          addProgress(`Calculating ${planetName} natal degree…`);
          const natalDeg = getPlanetDegree(natalData?.planets, planetName.charAt(0).toUpperCase() + planetName.slice(1));
          addProgress(`Calculating ${planetName} return date…`);
          const bod = `${pad(birth1.year)}-${pad(birth1.month)}-${pad(birth1.day)} ${pad(birth1.hour)}:${pad(birth1.min)}:00`;
          const returnData = await callPlanetReturn({ steps, date_of_birth_with_time: bod, natal_deg: natalDeg });
          const rdVal = returnData?.[`${planetName}_return`];
          if (rdVal) setReturnDate(rdVal);
          collected.planet_return_data = returnData;

          // Saturn also needs solar return details
          if (currentTab.slug === "saturn_return_v2") {
            addProgress("Fetching solar return details for Saturn…");
            try {
              const [det, pla, cup, asp] = await Promise.allSettled([
                callCompute("solar_return_details", birth1 as unknown as Record<string, unknown>),
                callCompute("solar_return_planets", birth1 as unknown as Record<string, unknown>),
                callCompute("solar_return_house_cusps", birth1 as unknown as Record<string, unknown>),
                callCompute("solar_return_planet_aspects", birth1 as unknown as Record<string, unknown>),
              ]);
              collected.solar_return_details = det.status === "fulfilled" ? det.value : null;
              collected.solar_return_planets = pla.status === "fulfilled" ? pla.value : null;
              collected.solar_return_cusps = cup.status === "fulfilled" ? cup.value : null;
              collected.solar_return_aspects = asp.status === "fulfilled" ? asp.value : null;
            } catch { /* non-fatal */ }
          }
        }

        // AI interpretations
        addProgress("Running AI interpretations…");
        const combinedData = { ...natalData, ...collected, returnDate: returnDate ?? "calculated" };
        const prompts = buildAiPrompts(combinedData, currentTab.slug);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiResults = await Promise.allSettled(prompts.map(async (p) => {
          const aiPayload = { condition: { system_content: p.system, user_content: p.user }, toolname: "other", json: p.json };
          const res = await callAI(aiPayload, form.areaOfInquiry || undefined);
          let parsed = res.ai_response;
          if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { /* keep */ } }
          return { key: p.key, value: parsed };
        }));
        const aiSection: Record<string, unknown> = {};
        for (const r of aiResults) { if (r.status === "fulfilled") aiSection[r.value.key] = r.value.value; }
        collected.ai_interpretations = aiSection;
      }

      // ── Two person ────────────────────────────────────────────────────────
      if (currentTab.type === "two-person") {
        const birth2 = parseBirth(form.person2);

        addProgress("Calculating synastry chart…");
        const synastry = await callCompute("synastry_horoscope", { ...birth1, p_day: birth2.day, p_month: birth2.month, p_year: birth2.year, p_hour: birth2.hour, p_min: birth2.min, p_lat: birth2.lat, p_lon: birth2.lon, p_tzone: birth2.tzone } as unknown as Record<string, unknown>);
        collected.synastry = synastry;
        // Also get natal data for person1 for planets/houses rendering
        addProgress("Calculating natal chart (self)…");
        const natalData1 = await callCompute("western_horoscope", birth1 as unknown as Record<string, unknown>);
        collected.natal_chart_data = natalData1;

        addProgress("Calculating composite horoscope…");
        try {
          const comp = await callCompute("composite_horoscope", { ...birth1, p_day: birth2.day, p_month: birth2.month, p_year: birth2.year, p_hour: birth2.hour, p_min: birth2.min, p_lat: birth2.lat, p_lon: birth2.lon, p_tzone: birth2.tzone } as unknown as Record<string, unknown>);
          collected.composite = comp;
        } catch { /* non-fatal */ }

        addProgress("Generating natal wheels…");
        await Promise.allSettled([
          callNatalWheel(freeWheelBody(form.person1) as unknown as Record<string, unknown>).then((r) => { const svg = r?.results?.output; if (svg) { setNatalSvg(svg); setShowChartBtn(true); } }),
          callNatalWheel(freeWheelBody(form.person2) as unknown as Record<string, unknown>).then((r) => { const svg = r?.results?.output; if (svg) setNatalSvgTransit(svg); }),
        ]);

        addProgress("Running AI interpretations…");
        const combinedData = { ...synastry, ...collected };
        const prompts = buildAiPrompts(combinedData, currentTab.slug);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiResults = await Promise.allSettled(prompts.map(async (p) => {
          const aiPayload = { condition: { system_content: p.system, user_content: p.user }, toolname: "other", json: p.json };
          const res = await callAI(aiPayload, form.areaOfInquiry || undefined);
          let parsed = res.ai_response;
          if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { /* keep */ } }
          return { key: p.key, value: parsed };
        }));
        const aiSection: Record<string, unknown> = {};
        for (const r of aiResults) { if (r.status === "fulfilled") aiSection[r.value.key] = r.value.value; }
        collected.ai_interpretations = aiSection;
      }

      setResults(collected);
      addProgress("Done ✓");
      setShowScrollTop(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const ai = results?.ai_interpretations ?? {};
  const natalData = results?.natal_chart_data;
  const isPlanetReturn = ["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(currentSlug);
  const isTwoPersonAiTab = currentTab.type === "two-person";
  const isTransit = ["tropical_transits_weekly_v2", "tropical_transits_monthly_v3"].includes(currentSlug);
  const isHorary = currentSlug === "horary_chart_v2";
  const isSolarReturn = currentSlug === "solar_return_v2";

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden flex flex-col">
      {chartModal && <ChartImageModal src={chartModal} open={!!chartModal} onClose={() => setChartModal(null)} />}

      {/* Horizontal tab bar */}
      <div className="shrink-0 border-b bg-background px-4 pt-3 pb-0">
        <div
          className="flex gap-1 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.slug === currentSlug;
            return (
              <button
                key={tab.slug}
                onClick={() => setTab(tab.slug)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-all",
                  active
                    ? "bg-amber-500 text-white font-medium shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto result-scroll-container" onScroll={(e) => setShowScrollTop((e.currentTarget.scrollTop) > 400)}>
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6" ref={resultRef}>

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
                  <BirthBlock value={form.person1} onChange={(v) => setForm((f) => ({ ...f, person1: v }))} disabled={loading} />
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <BirthBlock title="Person 1 (Self)" value={form.person1} onChange={(v) => setForm((f) => ({ ...f, person1: v }))} disabled={loading} />
                    <BirthBlock title="Person 2 (Partner)" value={form.person2} onChange={(v) => setForm((f) => ({ ...f, person2: v }))} disabled={loading} />
                  </div>
                )}

                {/* Week picker */}
                {currentTab.extras?.includes("future_week") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Select Week (optional — defaults to current week)</Label>
                    <Input type="date" value={form.futureWeek} onChange={(e) => setForm((f) => ({ ...f, futureWeek: e.target.value }))} disabled={loading} className="h-9 text-sm max-w-xs" />
                  </div>
                )}
                {/* Month picker */}
                {currentTab.extras?.includes("future_month") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Select Month (optional — defaults to current month)</Label>
                    <Input type="month" value={form.futureMonth ? form.futureMonth.slice(0, 7) : ""} onChange={(e) => { const val = e.target.value; setForm((f) => ({ ...f, futureMonth: val ? `${val}-01` : "" })); }} disabled={loading} className="h-9 text-sm max-w-xs" />
                  </div>
                )}
                {/* Question */}
                {currentTab.extras?.includes("question") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Your Question (required for Horary)</Label>
                    <Textarea value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="e.g. Will I get the job I applied for this month?" rows={3} disabled={loading} className="text-sm resize-none" />
                  </div>
                )}
                {/* Area of inquiry */}
                {currentTab.extras?.includes("area_of_inquiry") && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Area of Inquiry (optional)</Label>
                    <Textarea value={form.areaOfInquiry} onChange={(e) => setForm((f) => ({ ...f, areaOfInquiry: e.target.value }))} placeholder="What would you like to gain clarity on? e.g., Career and purpose, a specific relationship…" rows={3} disabled={loading} className="text-sm resize-none" />
                  </div>
                )}

                {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}

                <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white h-9">
                  {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Processing…</> : "Generate Reading"}
                </Button>
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
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Results</h2>
                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">{currentTab.label}</Badge>
                <button onClick={printResult} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded px-2 py-1">
                  <Printer className="size-3" />Print
                </button>
              </div>

              {/* Return date banner */}
              {returnDate && (
                <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Return Date: <span className="font-bold">{returnDate}</span></p>
                </div>
              )}

              {/* Natal charts — always show first */}
              <div id="natal-charts-row">
                <NatalChartsRow
                  svg1={natalSvg}
                  svg2={natalSvgTransit}
                  label1={isTwoPersonAiTab ? "Person 1 Natal Wheel" : "Natal Wheel Chart (AstrologyAPI)"}
                  label2={isTwoPersonAiTab ? "Person 2 Natal Wheel" : "Natal Wheel Chart (FreeAstrology)"}
                  onExpandImg={(src) => setChartModal(src)}
                />
              </div>

              {/* ─── Planet Return Summary ──────────────────── */}
              {isPlanetReturn && (
                <PlanetReturnSummaryTable tab={currentSlug} birth={form.person1} returnDate={returnDate} natalData={natalData} />
              )}

              {/* ─── Solar Return ───────────────────────────── */}
              {isSolarReturn && (
                <SolarReturnSection details={results.solar_return_details} planets={results.solar_return_planets} cusps={results.solar_return_cusps} aspects={results.solar_return_aspects} aiData={ai.solar_return} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Saturn Return also shows solar return ──── */}
              {currentSlug === "saturn_return_v2" && results.solar_return_details && (
                <SolarReturnSection details={results.solar_return_details} planets={results.solar_return_planets} cusps={results.solar_return_cusps} aspects={results.solar_return_aspects} aiData={null} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Transits ───────────────────────────────── */}
              {isTransit && (
                <TransitSection data={results.transit_data} aiData={currentSlug === "tropical_transits_weekly_v2" ? ai.tropical_transits_weekly : ai.tropical_transits_monthly} tabSlug={currentSlug} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Horary ─────────────────────────────────── */}
              {isHorary && (
                <HorarySection data={ai.horary_chart_question} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Two-person relationship ─────────────────── */}
              {isTwoPersonAiTab && (
                <RelationshipSection synastryAi={ai.synastry_horoscope} compositeAi={ai.composite_horoscope} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Natal chart sections (all single tabs + planet return tabs) ─ */}
              {natalData && (
                <div className="space-y-6">
                  <PlanetsSection planets={natalData.planets} aiData={ai.western_horoscope_planets} areaOfInquiry={form.areaOfInquiry} />
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/40 border-b"><h2 className="text-sm font-semibold">House Information</h2></div>
                    <div className="p-4">
                      <HousesSection houses={natalData.houses} planets={natalData.planets} aiData={ai.western_horoscope_houses} areaOfInquiry={form.areaOfInquiry} />
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-400/20"><h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Dharma & Karma</h2></div>
                    <div className="p-4">
                      <DharmaKarmaSection data={ai.dharma_karma} rawData={natalData} areaOfInquiry={form.areaOfInquiry} />
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/40 border-b"><h2 className="text-sm font-semibold">Aspects</h2></div>
                    <div className="p-4">
                      <AspectsSection aspects={natalData.aspects} planets={natalData.planets} aiData={ai.western_horoscope_aspects} areaOfInquiry={form.areaOfInquiry} />
                    </div>
                  </div>
                  <AscMidheavenVertexSection natalData={natalData} aiData={ai.western_horoscope_ascendant_midheaven_vertex} areaOfInquiry={form.areaOfInquiry} />
                  <LilithSection lilith={natalData.lilith} aiData={ai.western_horoscope_lilith} areaOfInquiry={form.areaOfInquiry} />
                </div>
              )}

              {/* ─── Planet Return AI ────────────────────────── */}
              {isPlanetReturn && (
                <PlanetReturnInterpretation tab={currentSlug} aiData={ai[currentSlug]} areaOfInquiry={form.areaOfInquiry} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating buttons */}
      {results && (
        <>
          {showChartBtn && (
            <button onClick={scrollToChart} className="fixed bottom-28 right-4 z-50 size-11 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition flex items-center justify-center" title="View Natal Chart">
              <Eye className="size-5" />
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
    </div>
  );
}
