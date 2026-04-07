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
  Loader2, ChevronDown, ChevronRight, ChevronLeft, Star, Sun, Moon,
  Calendar as CalendarIcon, Heart, Users, Briefcase, Eye, Zap,
  Sparkles, CircleDot, Clock, MapPin, Printer, ArrowUp, RotateCcw,
  X, Maximize2, Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

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

// ─── AWS S3 planet + aspect images (matching Angular's three.service.ts URLs) ──

const PLANET_IMAGES: Record<string, string> = {
  Sun: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/sun+(1).png",
  Moon: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/moon+(2).png",
  Mercury: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/mercury+(1).png",
  Venus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/vinus.png",
  Mars: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/marse.png",
  Jupiter: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/jupitor.png",
  Saturn: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/satarn.png",
  Uranus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/urenus.png",
  Neptune: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/neptune+(1).png",
  Pluto: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_png/pluto+(1).png",
};

// Planet sign images + aspect images — exact URLs from Angular's astroHeaderModifierPipe
// Maps each word in an aspect title (planet OR aspect type) to its S3 sign image
const ASTRO_HEADER_IMAGES: Record<string, string> = {
  // Planets (planet_singn/ folder — exact filenames from astroHeaderModifierPipe)
  Sun: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/sun+(2).png",
  Moon: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/moon+(3).png",
  Mercury: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mercury+(2).png",
  Venus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/vinus_sign.png",
  Mars: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/mars+(2).png",
  Jupiter: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/jupiton_sign.png",
  Saturn: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/satarn+(1).png",
  Uranus: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/urenus_sign.png",
  Neptune: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/neptune_sign.png",
  Pluto: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/planet_singn/pluto_sign.png",
  // Aspect types (connection_singn/ folder — exact filenames from astroHeaderModifierPipe)
  Conjunction: "https://all-frontend-assets.s3.us-east-1.amazonaws.com/divine_astro_assates/connection_singn/conjuction_sign.png",
  Conjunct: "https://all-frontend-assets.s3.us-east-1.amazonaws.com/divine_astro_assates/connection_singn/conjuction_sign.png",
  Opposition: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/opposit.png",
  Square: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/squar.png",
  Trine: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/trine.png",
  Sextile: "https://all-frontend-assets.s3.amazonaws.com/divine_astro_assates/connection_singn/sextile.png",
};

// Keep ASPECT_IMAGES alias for table column aspect-type icon (same URLs as above)
const ASPECT_IMAGES: Record<string, string> = {
  Conjunction: ASTRO_HEADER_IMAGES.Conjunction,
  Opposition: ASTRO_HEADER_IMAGES.Opposition,
  Square: ASTRO_HEADER_IMAGES.Square,
  Trine: ASTRO_HEADER_IMAGES.Trine,
  Sextile: ASTRO_HEADER_IMAGES.Sextile,
};

// ─── Word association keyword maps (ported from Angular's AI-generated keyword logic) ─

const PLANET_KEYWORDS: Record<string, string[]> = {
  Sun: ["identity", "ego", "vitality", "purpose", "willpower", "consciousness", "leadership", "creativity", "authority", "radiance"],
  Moon: ["emotions", "intuition", "nurturing", "subconscious", "cycles", "receptivity", "instinct", "memory", "home", "comfort"],
  Mercury: ["communication", "intellect", "analysis", "logic", "adaptability", "learning", "expression", "curiosity", "wit", "thought"],
  Venus: ["love", "beauty", "harmony", "values", "pleasure", "relationships", "aesthetics", "attraction", "grace", "affection"],
  Mars: ["action", "drive", "ambition", "energy", "courage", "desire", "assertiveness", "passion", "competition", "force"],
  Jupiter: ["expansion", "wisdom", "abundance", "optimism", "growth", "philosophy", "opportunity", "fortune", "benevolence", "faith"],
  Saturn: ["discipline", "structure", "karma", "responsibility", "limitation", "mastery", "perseverance", "authority", "endurance", "time"],
  Uranus: ["innovation", "rebellion", "awakening", "freedom", "disruption", "originality", "breakthrough", "revolution", "insight", "change"],
  Neptune: ["spirituality", "dreams", "illusion", "compassion", "mysticism", "transcendence", "sensitivity", "fantasy", "inspiration", "dissolution"],
  Pluto: ["transformation", "power", "regeneration", "depth", "shadow", "rebirth", "evolution", "intensity", "obsession", "renewal"],
  Node: ["destiny", "karma", "life path", "growth", "soul mission", "connection", "evolution", "purpose", "collective", "direction"],
  Chiron: ["healing", "wounds", "wisdom", "mentorship", "pain", "wholeness", "integration", "teaching", "vulnerability", "breakthrough"],
};

const ASPECT_KEYWORDS: Record<string, string[]> = {
  Conjunction: ["fusion", "intensification", "merging", "unity", "amplification", "focus", "new beginning", "power", "initiation", "strength"],
  Opposition: ["tension", "balance", "awareness", "polarity", "integration", "projection", "challenge", "contrast", "opposition", "reflection"],
  Square: ["challenge", "conflict", "dynamic", "pressure", "friction", "growth", "obstacle", "crisis", "motivation", "breakthrough"],
  Trine: ["harmony", "flow", "ease", "talent", "natural ability", "grace", "gift", "support", "opportunity", "alignment"],
  Sextile: ["opportunity", "cooperation", "potential", "synergy", "support", "effort", "productivity", "skill", "resource", "connection"],
};

// ─── Aspect title parser (mirrors Angular's astroHeaderModifierPipe split logic) ──

const ASPECT_TYPE_WORDS = ["Conjunction", "Conjunct", "Opposition", "Square", "Trine", "Sextile"];

function parseAspectTitle(title?: string): { p1: string; aspectType: string; p2: string } {
  if (!title) return { p1: "", aspectType: "", p2: "" };
  const parts = title.split(/\s+/);
  const idx = parts.findIndex((p) => ASPECT_TYPE_WORDS.some((at) => at.toLowerCase() === p.toLowerCase()));
  if (idx < 0) return { p1: parts[0] ?? "", aspectType: parts[1] ?? "", p2: parts.slice(2).join(" ") };
  // Normalise "Conjunct" → "Conjunction" for image lookup
  const rawType = parts[idx];
  const aspectType = rawType.toLowerCase() === "conjunct" ? "Conjunction" : rawType;
  return {
    p1: parts.slice(0, idx).join(" "),
    aspectType,
    p2: parts.slice(idx + 1).join(" "),
  };
}

// Renders "PLANET [sign_img] ASPECT [aspect_img] PLANET [sign_img]"
// — exact visual equivalent of Angular's astroHeaderModifierPipe
function AstroHeaderParts({ title }: { title?: string }) {
  const { p1, aspectType, p2 } = parseAspectTitle(title);
  const terms = [p1, aspectType, p2].filter(Boolean);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {terms.map((term, i) => {
        const img = ASTRO_HEADER_IMAGES[term];
        return (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">{term}</span>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={term} className="size-5 object-contain shrink-0" />
            )}
          </span>
        );
      })}
    </div>
  );
}

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
async function callDecanLookup(signs: string, planet: string) {
  const r = await fetch("/api/admin/astro/decan-lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signs, planet }) });
  if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? r.statusText); }
  return r.json() as Promise<{ results: DecanRow[] }>;
}

interface DecanRow {
  id?: number;
  sign_name: string;
  planet: string;
  decan: number;           // 1 | 2 | 3
  greek_daemon: string;
  tarot_name: string;
  description?: string;
  is_active?: boolean;
}

interface DecanAi {
  short_format: string;
  long_format: string;
}

interface DecanSection {
  planetAi: DecanAi | null;
  daemonAi: DecanAi | null;
  tarotAi: DecanAi | null;
  loading: boolean;
  error?: string;
}

// ─── AI prompt builders ───────────────────────────────────────────────────────

// Matches Angular's getMonthName(month: number) helper
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function getMonthName(m: number): string { return MONTH_NAMES[(m ?? 1) - 1] ?? String(m); }

// Matches Angular's convertTo12HourFormat(hour, min) helper
function convertTo12HourFormat(hour: number, min: number): string {
  const h = Number(hour ?? 0);
  const m = Number(min ?? 0);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

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
    // Ported from Angular solar-return-v2 component — 1 AI section only
    // NOTE: solar_return_planet_report and solar_return_aspects_report come from AstrologyAPI (callCompute), NOT AI Lambda
    prompts.push({
      key: "solar_return_details",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate solar return details based on given json with minimum 3 sentences on each interpretation with a number as index of details in as much detail as possible, only interpretation in json index in lowest level of indexes please and don't miss a single detail. Response should not start with string 'json' ever but in proper json format in an array with objects {\"title\":\"...\",\"interpretation\":\"...\"}",
      json: [{ details: data.solar_return_details, planets: data.solar_return_planets, cusps: data.solar_return_cusps, aspects: data.solar_return_aspects }],
    });
  }

  if (tab === "tropical_transits_weekly_v2") {
    // Ported from Angular tropical-transits-v2 component — exact stringModifier prompts
    const isFuture = !!data.is_future_transit;
    const transitData = data.transit_data;
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation";
    if (isFuture) {
      // Future week: Angular sends transit_relation and uses the week-date prompt
      const futureDate = data.future_transit_date ?? ""; // "YYYY-MM-DD"
      const [fy, fm, fd] = futureDate.split("-");
      prompts.push({
        key: "tropical_transits_weekly",
        system: "give response only in valid json format as a whole, nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
        user: `For the week containing ${fd} ${fm} ${fy}, provide the Tropical Transits Weekly Relation for a person born on ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} in their birth city, with the result validated against the provided JSON data , formatted as { "aspecttitle": "value", "interpretation": "value" } inside an array,all transit data needs to be there  in same  order  in your resopense, where aspecttitle is the aspect title and interpretation is a 8 sentence paragraph, with each interpretation containing at least three sentences; ensure the response is valid JSON without the word 'json', ensuring the interpretation is properly parsed and formatted on the frontend..`,
        json: [transitData?.transit_relation ?? transitData],
      });
    } else {
      // Current week: Angular sends full data
      prompts.push({
        key: "tropical_transits_weekly",
        system: sys,
        user: `Generate  weekly transit details based on given json with minimum 5 sentences on each interpretation as interpretation  with a number as index named index  of  weekly transit details details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single weekly transit details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be [\n{\n"title":\n"interpretation"\n\n}\n\n] we need multiple unique titles for sure with different interpretation`,
        json: [transitData],
      });
    }
  }

  if (tab === "tropical_transits_monthly_v3") {
    // Ported from Angular tropical-transits-v2 component — exact stringModifier prompts
    const isFuture = !!data.is_future_transit;
    const transitData = data.transit_data;
    const lunarData = data.lunar_metrics;
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation";
    if (isFuture) {
      // Future month: Angular sends unique_transits and uses the month-date prompt
      const futureDate = data.future_transit_date ?? ""; // "YYYY-MM"
      const [fy, fm] = futureDate.split("-");
      prompts.push({
        key: "tropical_transits_monthly",
        system: sys,
        user: `for the month  ${fm} ${fy} as a date give me Tropical Transits Monthly Relation in above format for a person whose dob is ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} and place their birth city must be validated and accurate and response should be craeted on basis of given json data. Follow the asked format strictly no other index expected that asked indexes , both aspecttitle and  interpretation must be text in specific aspecttitle will be header and interpretation will be paragraph of 5 sentences atleast  response format must be as exact :  {{aspecttitle:value},{interpretation:value}  create multiple records on each date and type with unique aspecttitle please not just one and detail as much as possible and again response format must be as exact :  {aspecttitle:value},{interpretation:value}.response should not start with string 'json'  ever  and must be a valid json format`,
        json: [transitData?.unique_transits ?? transitData],
      });
      // Future lunar metrics
      prompts.push({
        key: "lunar_metrics",
        system: sys,
        user: `for the Month  ${fm} ${fy} as a date give me Lunar Metrics as Month ,Moon Day,Moon Illumination,Moon Phase,Moon Sign in a format for a person whose dob is ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} and place their birth city response should be craeted on basis of given json data, and  accurate as format must be  {month:value with unit} , {moonday:value with unit},{moon_illumination:value with unit},{moonphase:value with unit},{moonsign:value} , {moon_sign_interpretation:value} ,{moon_phase_interpretation:value} , {moon_age_interpretation:value} ,{moon_day_interpretation:value},{moon_illumination_interpretation:value} where moonsigninterpretation , moonphaseinterpretation , moonageinterpretation ,moondayinterpretation ,moonilluminationinterpretation values must be paragraph having atleast 5 sentences each these response must come from calculation and should be validated with astrology calculations and in interpretation value if there is any number round to nearest integer if it's a decimal,  response should not start with string 'json'  ever  and  must be a valid json format. `,
        json: [{ transit_relation: transitData?.unique_transits, lunar_matrics: lunarData }],
      });
    } else {
      // Current month: Angular sends full data
      prompts.push({
        key: "tropical_transits_monthly",
        system: sys,
        user: `Generate  monthly transit details based on given json with minimum 5 sentences on each interpretation as interpretation  with a number as index named index  of  monthly transit details details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single monthly transit details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array ofresult must be validated and accurate as format must be  [\n{\n"title":\n"interpretation"\n\n}\n\n]   we need multiple unique titles for sure with different interpretation. Don't add Natal word before any title and response should not start with string 'json'  ever  and must be a valid json format`,
        json: [transitData],
      });
      // Current lunar metrics
      prompts.push({
        key: "lunar_metrics",
        system: sys,
        user: `Generate  lunar return details based on given json with minimum 5 sentences on each interpretation as interpretation  with a numnber as index named index  of  lunar return details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single lunar return details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be{"title":"Title or heading of the interpretation ","interpretation":"Details Interpretation" } , response should not start with string 'json'  ever  and must be with in  an array. make sure each interpretation has more than 5 sentences  `,
        json: [lunarData],
      });
    }
  }

  if (["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2"].includes(tab)) {
    // Exact prompts ported from Angular romantic-forcast-report-v2.component.ts → stringModifiear()
    // Angular interpolates birth dates into each prompt; we do the same here using stored person birth data
    const p1 = data.person1_birth ?? {};
    const p2 = data.person2_birth ?? {};
    const personaCity = data.persona_city ?? "";
    const partnerCity = data.partner_city ?? "";
    const context = tab === "romantic_forecast_report_tropical_v2" ? "love" : tab === "friendship_report_tropical_v2" ? "friendship" : "business partnership";
    const relationshipContext = tab === "romantic_forecast_report_tropical_v2" ? "love relationship partner" : tab === "friendship_report_tropical_v2" ? "friendship partner" : "business partner";
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a detailed synastry chart analysis, you will need precise birth data from both parties, including the exact birth time, date, and location, to accurately calculate their astrological charts. Start by examining the aspects between each person's personal planets (Sun, Moon, Venus, Mars) and the other's outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto) to uncover dynamics of attraction, compatibility, and potential friction points. Assess the house overlays by noting where each individual's planets land in the other's astrological houses, which sheds light on the influence they exert over various life areas of their partner. Analyze the interactions between each person's Ascendant (self-expression) and Descendant (partnership qualities) to gauge core compatibility and relational dynamics. Additionally, explore the North and South Nodes to delve into themes of karmic connections or shared life purposes. Utilizing advanced astrology software or reliable online resources can facilitate this complex analysis, while reference books from respected astrologers can provide deeper interpretive frameworks. For a nuanced understanding, especially in complicated synastry situations, consulting with a professional astrologer is advisable.";

    // Birth info string — matches Angular interpolation pattern
    const b1Str = `I was born on ${getMonthName(p1.month)} ${p1.day}, ${p1.year},  ${p1.hour}:${String(p1.min ?? 0).padStart(2, "0")} in  ${personaCity}  'lat:${p1.lat},lon:${p1.lon},tzone:${p1.tzone}'.`;
    const b2Str = `my ${relationshipContext} was born on  ${getMonthName(p2.month)} ${p2.day}, ${p2.year} ${p2.hour}:${String(p2.min ?? 0).padStart(2, "0")} at ${partnerCity}   'lat:${p2.lat},lon:${p2.lon},tzone:${p2.tzone}'`;
    const suffix = ` in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  `;

    // JSON shapes — synastry uses synastry result; davison/major/etc use self+partner structure
    const synJson = [data.synastry ?? data];
    const selfPartnerJson = [{ mydetails: { ...p1 }, fiend_details: { ...p2 } }];

    prompts.push({ key: "synastry_horoscope", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our synastry chart of this partnership${suffix}`, json: synJson });
    prompts.push({ key: "composite_horoscope", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our composite chart of this partnership${suffix}`, json: synJson });
    prompts.push({ key: "davison_relationship", system: sys, user: `${b1Str.replace("I was born on", `I was born on `)} ${b2Str.replace(`my ${relationshipContext} was born on  `, `my ${relationshipContext} was born on  `)} I have added birth chart details of mine and my ${relationshipContext} both now calculate Aspect and Conjunction of this partnership${suffix.replace("atleast 3 sentences", "atleast 5 sentences")}`, json: selfPartnerJson });
    prompts.push({ key: "major_aspects_and_connections", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our davison relation ship chart of this partnership${suffix}`, json: selfPartnerJson });
    prompts.push({ key: "compatibility_score_or_summary", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate compatibility score or summery of this partnership${suffix}`, json: selfPartnerJson });
    prompts.push({ key: "elemental_balance", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate elemental balance of this partnership${suffix}`, json: selfPartnerJson });
    prompts.push({ key: "timing_and_transits", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate timing and transit of this partnership${suffix}`, json: selfPartnerJson });
    if (tab === "business_partner_v2") {
      prompts.push({ key: "professional_alignment_and_goals", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate professional alignment and goals of this partnership${suffix}`, json: selfPartnerJson });
    } else {
      prompts.push({ key: "karmic_and_soulmate_indicators", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate Karmic and Soulmate Indicators of this partnership${suffix}`, json: selfPartnerJson });
    }
  }

  if (tab === "horary_chart_v2") {
    // Exact prompt ported from Angular horary-chart-v2.component.ts → stringModifier()
    // Angular uses this.currentdate = moment().format('MM/DD/YYYY') for the FUTURE rule
    const currentDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }); // MM/DD/YYYY
    const b = data; // combinedData contains birth1 fields (day, month, year, hour, min, lat, lon, tzone)
    const city = data.city ?? "";
    const question = data.question ?? "";
    const natalChartData = data.horary_chart_data ?? data;
    prompts.push({
      key: "horary_chart_question",
      system: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT user data index related to astrology as data under that aspect and under that interpretation",
      user: `I was born on ${getMonthName(b.month)} ${b.day}, ${b.year} time ${b.hour}:${String(b.min ?? 0).padStart(2, "0")}, in ${city} ,'lat:${b.lat},lon:${b.lon},tzone:${b.tzone}'. ${question}. I'm providing you with my birth chart data in a separate JSON object. You MUST use this data to generate a personalized astrological analysis in the following JSON format:{data:{astrological_aspect:{aspect:[{title:data}],planet:[{title:data}],house:[{title:data}]},summary:{answer:[{title:data}],recommendation:[{title:data}],recommendation_on_date_and_timeline:[{timeline_title:timeline_data}]}}}\n\nexample format to follow :\n{\n \"data\": {\n \"astrological_aspect\": {\n \"aspect\": [\n {\n \"title\": \"Mars Trine Jupiter (Transit to Natal)\",\n \"data\": \"Between January 10th and February 15th, 2025, transiting Mars in Sagittarius forms a trine aspect to your natal Jupiter in the 12th house. This harmonious alignment amplifies your ambition, optimism, and drive to pursue your goals, particularly those related to spirituality, intuition, or humanitarian causes. It supports taking decisive action and expanding your vision, bringing opportunities for growth and success in these areas.\"\n }\n ],\n \"planet\": [\n {\n \"title\": \"Transiting Mars\",\n \"data\": \"Between January 10th and February 15th, 2025, Mars transits through Sagittarius and forms a harmonious trine to your natal Jupiter in the 12th house.\"\n }\n ],\n \"house\": [\n {\n \"title\": \"12th House (Transit Activation)\",\n \"data\": \"Between January 10th and February 15th, 2025, your 12th house is activated.\"\n }\n ]\n },\n \"summary\": {\n \"answer\": [\n {\n \"title\": \"Optimal Time\",\n \"data\": \"Based on your birth chart data, the optimal time is between January 10th and February 15th, 2025.\"\n }\n ],\n \"recommendation\": [\n {\n \"title\": \"Focus on 12th House Themes\",\n \"data\": \"Given the emphasis on your 12th house, consider incorporating themes related to spirituality.\"\n }\n ],\n \"recommendation_on_date_and_timeline\": [\n {\n \"timeline_title\": \"Between January 10th and February 15th, 2025\",\n \"timeline_data\": \"This period is particularly auspicious.\"\n }\n ]\n }\n }\n}\nI need you to strictly adhere to these rules:\n\n1.Personalized Interpretations ONLY: Absolutely NO generic explanations of planets, aspects, or houses. Every interpretation in the data fields must be derived from and specific to MY birth chart data and reasoning with timeline_data you suggested. No general info expected.\n\n2.FUTURE Justified Timelines: The timeline_data must identify a favorable future date range that begins strictly after ${currentDate}. Within this recommended time period, you MUST also pinpoint multiple specific, highly auspicious dates for taking action. You must structure this recommendation by first presenting the single "Top Choice Date," followed by a list of "Other Favorable Dates." For both the overall date range and each specific date, you MUST provide a detailed astrological justification, explaining exactly which transits to MY birth chart make these times significant.\n3.Data Richness: Each data field needs at least three full sentences of detailed, personalized interpretation.\n4.Accurate Titles: Use concise labels for each title (e.g., 'Sun Conjunct Moon', 'Mars in Aries').\n5.Complete Data: Ensure ALL objects have both title and data fields.\n6.For all recommended dates and timelines, format dates as <span class=\"timedata\">date</span> only.\n7.Response should not start with string 'json' ever and must be valid json format.`,
      json: [natalChartData],
    });
  }

  const returnTabMap: Record<string, string> = { "jupiter_return_v2": "jupiter_return_v2", "saturn_return_v2": "saturn_return_v2", "mars_return_v2": "mars_return_v2", "uranus_return_v2": "uranus_return_v2" };
  if (returnTabMap[tab]) {
    // Exact prompt ported from Angular jupiter-return-v2.component.ts → stringModifier()
    // Mars/Saturn/Uranus returns use same structure (ported individually)
    const planet = tab.split("_")[0];
    const planetCap = planet.charAt(0).toUpperCase() + planet.slice(1);
    const returnDate = data?.returnDate ?? "calculated";
    // Angular: value.year, getMonthName(value.month), value.day, convertTo12HourFormat(value.hour, value.min), city
    const city = data.city ?? data.birthplace ?? "";
    const natalData = data.planet_return_data ?? data;
    prompts.push({
      key: returnTabMap[tab],
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT  ",
      user: `My Bday is ${data.year} ${getMonthName(data.month)} ${data.day} , time ${convertTo12HourFormat(data.hour, data.min)}  , at  ${city}   and according to the astrological logic and  aspects my next ${planet} return date is ${returnDate},  I want to know about ${planet} return,  interested on career, relationships and others.house system should be whole sign give me chart data first and then detailed content as title and inter pretation in json format but nothing else and should not start with string 'json' and each interpretations of each title . example response format should be {\n  \"chart_data\": {\n    \"date_of_birth\": \"{data}\",\n    \"time_of_birth\": \"{data}\",\n    \"place_of_birth\": \"{data}\",\n   \"exact_position_details_of_${planet}_at_time_of_birth \": \"{data}\",\n    \"house_system\": \"Whole Sign\",\n    \"Positions\": {\n      \"Sun\": \"{data}\",\n      \"Moon\": \"{data}\",\n      \"Mercury\": \"{data}\",\n      \"Venus\": \"{data}\",\n      \"Mars\": \"{data}\",\n      \"${planetCap}\": \"{data}\",\n      \"Saturn\": \"{data}\",\n      \"Uranus\": \"{data}\",\n      \"Neptune\": \"{data}\",\n      \"Pluto\": \"{data}\",\n      \"North_Node\": \"{data}\",\n      \"South_Node\": \"{data}\",\n      \"Ascendant\": \"{data}\"\n    }\n  },\n  \"title_and_interpretation\": {\n    \"title\": \" Upcoming ${planetCap} Return Analysis for {data}\",\n    \"interpretation\": {\n      \"General\": \"{data_10}.\",\n      \"Career\": \"data.\",\n      \"Relationships\": \"data.\",\n      \"Personal Growth\": \"{data_10}.\",\n      \"Health\": \"{data}\",\n  \"Family\": \"{data}\",\n  \"Social\": \"{data}\",\n  \"Spiritual\": \"{data_10}\"\n  }\n  }\n}\n  take json as example structure do not copy content please and replace data with proper detailed related response like real  positions of stars.every intepretation after the title should be with detailed reasoning related to stars/planets and their positions of house keeping significance of ${planet} in mind and mention both positive and negetives stuffs  with reasoning and interpretation must be very specific as astrologer not general and should sound very confident on observations and keeping age of mine with 3 sentences on each tpoic is must keeping all other plantets positions in calculation too is most important . all {data} and {date_data} should be populated with real calculated info . remember all date time data should be in usa date and time format always whereever we have date / time format  {month–day–year order (e.g. July 9, 2024)} and each date must be exactly perfect after multiple cross check .make sure for each position data is with atleast degrees with house number and impact of the position mentioned  , verify everything as of data from several websites multiple times. All {data_10} must be fulfilled with atleast 3 sentences.Response should not start with string 'json'  ever  and must be a valid json format`,
      json: [natalData],
    });
  }

  return prompts;
}

// ─── Show More Modal ──────────────────────────────────────────────────────────
// aspectTitle: when set, renders the Angular-style icon header + word-association chips
// inside the modal (mirrors Angular's showMoreModal with pictorialData image section)

function ShowMoreModal({ title, content, loading, open, onClose, aspectTitle, promptType, planetEntries, pictureUrl }: {
  title: string; content: string; loading: boolean; open: boolean; onClose: () => void;
  aspectTitle?: string;
  promptType?: "planet" | "house" | "aspect" | "generic";
  planetEntries?: { planet: string; items: string[] }[];
  pictureUrl?: string | null;
}) {
  const isAspect = promptType === "aspect" || !!aspectTitle;
  const { p1, aspectType, p2 } = isAspect ? parseAspectTitle(aspectTitle ?? title) : { p1: "", aspectType: "", p2: "" };
  const [showFullImage, setShowFullImage] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-950 border-white/10" showCloseButton={false}>
          {/* Custom Close Icon - Fixed to top-right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
            aria-label="Close modal"
          >
            <X className="size-5 transition-transform group-hover:rotate-90" />
          </button>

          {/* Sticky Header Section */}
          <div className="px-6 py-5 border-b border-white/5 bg-slate-900/40 pr-16 shrink-0">
            <DialogHeader>
              {isAspect ? (
                <div className="pb-1">
                  <AstroHeaderParts title={aspectTitle ?? title} />
                </div>
              ) : (
                <DialogTitle className="text-lg font-bold capitalize gold-text">{title.replace(/_/g, " ")} (Pictorial Analysis)</DialogTitle>
              )}
            </DialogHeader>
          </div>

          {/* Content Section — Side-by-side on MD screens if picture exists */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
            <div className={cn("grid grid-cols-1 gap-0 h-full", pictureUrl && "md:grid-cols-2")}>

              {/* Textual/Structured Content */}
              <div className="p-6 h-full flex flex-col border-b md:border-b-0 md:border-r border-white/5">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-12 justify-center text-muted-foreground flex-1">
                    <Loader2 className="size-8 animate-spin text-amber-500 mb-2" />
                    <span className="text-sm font-medium tracking-widest uppercase opacity-70">Cosmic Retrieval...</span>
                  </div>
                ) : (
                  <div className="flex-1">
                    {promptType === "planet" && planetEntries && planetEntries.length > 0 ? (
                      <div className="space-y-6">
                        {planetEntries.map(({ planet, items }) => (
                          <div key={planet} className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 space-y-3 shadow-inner">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <PlanetSymbol name={planet} />
                              </div>
                              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                            </div>
                            <ol className="space-y-3 list-none">
                              {items.map((item, idx) => (
                                <li key={idx} className="text-sm leading-relaxed text-foreground/90 flex gap-3 group">
                                  <span className="flex-shrink-0 size-5 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px] border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all">{idx + 1}</span>
                                  <span className="opacity-90 group-hover:opacity-100">{item}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-light tracking-wide bg-slate-900/40 p-6 rounded-2xl border border-white/5 italic relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40" />
                        <Sparkles className="absolute top-3 right-3 size-4 text-amber-500/20" />
                        "{content}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pictorial Representation — Step-by-side with text */}
              {pictureUrl && (
                <div className="p-6 flex flex-col items-center justify-center bg-slate-900/20">
                  <div className="relative group rounded-2xl border border-amber-500/20 overflow-hidden bg-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.08)] transition-all hover:border-amber-500/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pictureUrl} alt={title} className="w-full h-auto max-h-[50vh] object-contain transition-transform duration-1000 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                    {/* Maximize Icon */}
                    <button
                      onClick={() => setShowFullImage(true)}
                      className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-xl bg-slate-950/80 border border-white/10 text-amber-500/80 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-2xl backdrop-blur-md z-10 group/btn"
                      title="Enlarge Cosmic Map"
                    >
                      <Maximize2 className="size-5 transition-transform group-hover/btn:scale-125" />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/50 mix-blend-overlay">Celestial Configuration</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {pictureUrl && (
        <ChartImageModal src={pictureUrl} open={showFullImage} onClose={() => setShowFullImage(false)} />
      )}
    </>
  );
}

// ─── Chart Image Modal ────────────────────────────────────────────────────────

function ChartImageModal({ src, open, onClose }: { src: string; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden bg-slate-950 border-white/10" showCloseButton={false}>
        {/* Custom Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.2)] group"
          aria-label="Close modal"
        >
          <X className="size-5 transition-transform group-hover:rotate-90" />
        </button>

        <div className="h-full w-full overflow-hidden p-6 flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Astrological Asset</DialogTitle>
          </DialogHeader>
          {src.startsWith("<svg") ? (
            <div dangerouslySetInnerHTML={{ __html: src }} className="w-full h-full overflow-auto flex justify-center items-center" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Astrological Asset" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Planet Symbol ────────────────────────────────────────────────────────────

function PlanetSymbol({ name, showImage = true }: { name: string; showImage?: boolean }) {
  const imgSrc = PLANET_IMAGES[name];
  return (
    <span className="inline-flex items-center gap-1.5">
      {showImage && imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt={name} className="size-5 object-contain shrink-0" />
      ) : (
        <span className="text-amber-500 font-semibold text-base leading-none shrink-0" aria-hidden>{PLANET_SYMBOLS[name] ?? "✦"}</span>
      )}
      <span>{name}</span>
    </span>
  );
}

// ─── Word Association Chips (replaces Angular's Three.js 3D sphere keyword arrays) ──
// The card header already renders "PLANET [img] ASPECT [img] PLANET [img]" via AstroHeaderParts.
// This panel only renders the 3-column keyword chips — no duplicate icon header.

function WordAssociationChips({ aspecting, type, aspected }: { aspecting: string; type: string; aspected: string }) {
  const p1keys = (PLANET_KEYWORDS[aspecting] ?? []).slice(0, 6);
  const typeKeys = (ASPECT_KEYWORDS[type] ?? []).slice(0, 5);
  const p2keys = (PLANET_KEYWORDS[aspected] ?? []).slice(0, 6);

  if (!p1keys.length && !typeKeys.length && !p2keys.length) return null;

  return (
    <div className="px-4 py-3 bg-muted/10 border-t">
      {/* Three keyword columns — mirrors Angular's 3-sphere text arrays */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 text-center">{aspecting}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {p1keys.map((kw) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-400/20">{kw}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 text-center">{type}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {typeKeys.map((kw) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] font-medium border border-purple-400/20">{kw}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 text-center">{aspected}</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {p2keys.map((kw) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-400/20">{kw}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
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
  const [modal, setModal] = useState<{
    title: string;
    content: string;
    loading: boolean;
    aspectTitle?: string;
    // promptType determines how the response is rendered:
    //   "aspect"  → {interpretation:"text"} → plain paragraph (Angular showMoreModalAsecdent)
    //   "planet"  → {PlanetName:{1:"...",2:"...",...}} → numbered paragraphs per planet (Angular showMoreModal)
    //   "house"   → {interpretations:{data:"..."}} → plain paragraph from .data field (Angular showMoreModalHouse)
    //   "generic" → {interpretation:"text"} → plain paragraph
    promptType?: "planet" | "house" | "aspect" | "generic";
    // For planet type: structured numbered entries extracted from response
    planetEntries?: { planet: string; items: string[] }[];
    // Pictorial asset URL from AWS S3
    pictureUrl?: string | null;
  } | null>(null);

  /**
   * Build the S3 filename + folder for the astro-picture-content API.
   * Mirrors Angular's fetchPicture() payload construction:
   *   Planets:  "Sun-In-Virgo"                        → folder "planets"
   *   Aspects:  "Mars-Square-Pluto"                    → folder "aspect"
   *   Houses:   "Sun-In-12th-House-With-Virgo"         → folder "planets"
   */
  function buildPicturePayload(
    type: "planet" | "house" | "aspect" | "generic",
    title: string,
    promptData: any,
  ): { filename: string; foldername: string } | null {
    try {
      if (type === "aspect") {
        // Parse "Mars Square Pluto" → "Mars-Square-Pluto"
        const parts = title.trim().split(/\s+/);
        if (parts.length >= 3) {
          return { filename: parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("-"), foldername: "aspect" };
        }
      } else if (type === "planet") {
        // promptData can be the planet object directly or { planet: p } or { ascendant: { sign: '...' } }
        const p = promptData?.planet ?? promptData;
        const planet = p?.name ?? title.trim();
        // Look for sign in p directly, or nested under the title (for points like ascendant)
        const sign = p?.sign ?? p?.Sign ?? p?.[title.toLowerCase()]?.sign ?? p?.[title.toLowerCase()]?.Sign ?? "";
        if (planet && sign) {
          const capPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
          const capSign = sign.charAt(0).toUpperCase() + sign.slice(1);
          return { filename: `${capPlanet}-In-${capSign}`, foldername: "planets" };
        }
      } else if (type === "house") {
        // promptData has house number + sign + planet
        const house = promptData?.house ?? promptData?.House ?? "";
        const sign = promptData?.sign ?? promptData?.Sign ?? "";
        // Try to find a planet in this house if the direct 'planet' property is missing
        let planet = promptData?.planet ?? promptData?.ruler;
        if (!planet && title?.trim()) planet = title.trim();

        if (house && sign && planet) {
          const ordinal = String(house).replace(/\D/g, "");
          const suffix = ordinal === "1" ? "st" : ordinal === "2" ? "nd" : ordinal === "3" ? "rd" : "th";
          return { filename: `${planet}-In-${ordinal}${suffix}-House-With-${sign}`, foldername: "planets" };
        }
      }
    } catch { /* ignore — will return null */ }
    return null;
  }

  async function fetchPicture(
    type: "planet" | "house" | "aspect" | "generic",
    title: string,
    promptData: any,
  ): Promise<string | null> {
    const payload = buildPicturePayload(type, title, promptData);
    if (!payload) return null;
    try {
      const res = await fetch("/api/admin/astro/astro-picture-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.status === "success" ? json.data?.url ?? null : null;
    } catch {
      return null;
    }
  }

  // aspectTitle: pass for aspect cards → triggers Angular's exact aspect prompt
  // promptType: "planet" for planet show-more, "house" for house show-more, "aspect" for aspects, else generic
  async function trigger(
    title: string,
    currentText: string,
    promptData: any,
    areaOfInquiry?: string,
    aspectTitle?: string,
    isKeyValue?: boolean,
    promptType?: "planet" | "house" | "aspect" | "generic",
  ) {
    const resolvedType = promptType ?? (aspectTitle ? "aspect" : "generic");
    setModal({ title, content: "", loading: true, aspectTitle, promptType: resolvedType, pictureUrl: null });

    // Fetch S3 pictorial image in parallel with the AI call
    const picturePromise = fetchPicture(resolvedType, aspectTitle ?? title, promptData);

    try {
      let aiPayload: any;

      if (resolvedType === "aspect" || aspectTitle) {
        // Exact Angular prompt from common-tabil-aspects.component.ts shoMoreOption()
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
            user_content: "Generate western chart details only on aspects based on given json with atleast 8 sentences the json must be as {interpretation:data} where data in response from chatbot and it must be paragraph / string  but not object type (must not have any index in data or under interpretation index value) for sure.Response should not start with string 'json'  ever  and must be a valid json format  ",
          },
          toolname: "other",
          json: [promptData],
        };
      } else if (resolvedType === "planet") {
        // Exact Angular prompt from common-tabil-lilith.component.ts shoMoreOption()
        // Response format: {PlanetName: {1:"text",2:"text",3:"text",4:"text",5:"text"}}
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
            user_content: "Generate western chart details only onmentioned planet based on given json with detailed signifance of sign . retro , house , degree and speed data given as json format  with atleast 5 sentences or 2 paragraphs  on each mentioned topic in as much as detail possible , remove full degree , norm degree , speed , retrograde , sign , house from  json index and add number as index on each interpretation (e.g {Sun : {1:interpretation data,2:interpretation data,3:interpretation data,4:interpretation data,5:interpretation data}}) please and don't miss a single planet there are many please be careful .Response should not start with string 'json'  ever  and must be a valid json format ",
          },
          toolname: "other",
          json: [promptData],
        };
      } else if (resolvedType === "house") {
        // Exact Angular prompt from common-tabil-house.component.ts shoMoreOption()
        // Response format: {interpretations: {data: "..."}}
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation ",
            user_content: "Generate western chart details only on only one house  provided in json with atleast 5 sentences on 3 paragraphs on each interpretation making sure mentioning significance of house , sign and degree in details , in json I need to see interpreation as index only and nothing else such as {interpretations:{data}} where is the content generated by astrologer and data is paragraph as text not json object and it must not have any inner index .Response should not start with string 'json'  ever  and must be a valid json format ",
          },
          toolname: "other",
          json: [promptData],
        };
      } else {
        // Generic expanded interpretation
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT",
            user_content: `Give me a much more detailed and expanded interpretation of "${title}" in western astrology. Based on the given data, provide at least 8 sentences covering meaning, planetary influence, house significance, and practical life guidance. Response must be in json format as {interpretation: "detailed paragraph text"}`,
          },
          toolname: "other",
          json: [promptData],
        };
      }

      const res = await callAI(aiPayload, areaOfInquiry);
      let parsed = res.ai_response;
      if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { /* keep string */ } }

      if (resolvedType === "planet") {
        // Response: {PlanetName: {1:"...", 2:"...", ...}} — extract as structured entries
        let planetEntries: { planet: string; items: string[] }[] = [];
        if (typeof parsed === "object" && parsed !== null) {
          for (const [planetName, numbered] of Object.entries(parsed as Record<string, any>)) {
            const items: string[] = typeof numbered === "object" && numbered !== null
              ? Object.values(numbered).map(String)
              : [String(numbered)];
            planetEntries.push({ planet: planetName, items });
          }
        }
        const picUrl = await picturePromise;
        if (!picUrl) toast.error("No Record Found", { description: `Pictorial representation for ${title} is unavailable.` });
        setModal({ title, content: "", loading: false, aspectTitle, promptType: resolvedType, planetEntries, pictureUrl: picUrl });
      } else if (resolvedType === "house") {
        // Response: {interpretations: {data: "..."}} — extract .interpretations.data
        let text = "";
        if (typeof parsed === "object" && parsed !== null) {
          const interp = (parsed as any).interpretations;
          if (typeof interp === "object" && interp !== null) {
            text = interp.data ?? JSON.stringify(interp);
          } else if (typeof interp === "string") {
            text = interp;
          } else {
            text = parsed.interpretation ?? JSON.stringify(parsed, null, 2);
          }
        } else {
          text = String(parsed ?? "");
        }
        const picUrl2 = await picturePromise;
        if (!picUrl2) toast.error("No Record Found", { description: "Pictorial map is currently unavailable." });
        setModal({ title, content: text, loading: false, aspectTitle, promptType: resolvedType, pictureUrl: picUrl2 });
      } else {
        // aspect / generic: extract .interpretation
        let text: string;
        if (typeof parsed === "object" && parsed !== null) {
          text = (parsed as any).interpretation ?? JSON.stringify(parsed, null, 2);
        } else {
          text = String(parsed ?? "");
        }
        const picUrl3 = await picturePromise;
        if (!picUrl3) {
          // Only show toast if it's a specific aspect, not generic text
          if (resolvedType === "aspect") toast.error("No Record Found", { description: "Aspect pictorial representation is unavailable." });
        }
        setModal({ title, content: text, loading: false, aspectTitle, promptType: resolvedType, pictureUrl: picUrl3 });
      }
    } catch {
      setModal({ title, content: "Could not load extended interpretation. Please try again.", loading: false, aspectTitle, promptType: resolvedType, pictureUrl: null });
    }
  }

  return { modal, trigger, close: () => setModal(null) };
}

// ─── Decan Modal ─────────────────────────────────────────────────────────────
// Mirrors Angular's decan detail modal — 3 AI sections per decan:
//   1. Planet-in-Decan interpretation (short + long)
//   2. Greek Daemon spirit of the decan (short + long)
//   3. Tarot attribution via Crowley/Thoth system (short + long)

function ordinalDecan(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : "3rd";
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
        className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
      >
        {expanded ? "Show Less" : "Read More"}
      </button>
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

  // Fetch decan rows + fire 3 AI calls per decan whenever modal opens
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

        // Fire 3 AI calls per decan row in parallel (non-fatal)
        for (const row of results) {
          const decanLabel = ordinalDecan(row.decan);
          // Initialise loading state for this decan
          setSections((prev) => ({ ...prev, [row.decan]: { planetAi: null, daemonAi: null, tarotAi: null, loading: true } }));

          const systemContent = "give response only in json format as a whole , nothing else answer as astrologer not AI BOT";

          // Angular exact prompts — three parallel AI calls
          const [planetRes, daemonRes, tarotRes] = await Promise.allSettled([
            callAI({
              condition: {
                system_content: systemContent,
                user_content: `What does it mean when you have ${planet} in the ${decanLabel} decan of ${sign} in astrology , give me response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`,
              },
              toolname: "other",
              json: [{ planet, sign, decan: decanLabel, decan_data: row }],
            } as any),
            callAI({
              condition: {
                system_content: systemContent,
                user_content: `Explain the Greek daemon ${row.greek_daemon} as the spirit of the decan in relation to the ${decanLabel} decan of ${sign} in astrology. Give response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`,
              },
              toolname: "other",
              json: [{ daemon: row.greek_daemon, sign, decan: decanLabel }],
            } as any),
            callAI({
              condition: {
                system_content: systemContent,
                user_content: `Using the Crowley's thoth decks attributions, without referencing his deck directly, explain the ${row.tarot_name} as it would relate to the ${decanLabel} decan of ${sign} in astrology. Give response in json where two indexes are short_format (min 3 sentences) and long_format (min 5 sentences) and response should not start with 'json' ever`,
              },
              toolname: "other",
              json: [{ tarot: row.tarot_name, sign, decan: decanLabel }],
            } as any),
          ]);

          if (cancelled) return;

          function parseDecanAi(res: PromiseSettledResult<any>): DecanAi | null {
            if (res.status === "rejected") return null;
            let parsed = res.value?.ai_response;
            if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { /* keep */ } }
            if (typeof parsed === "object" && parsed !== null) {
              return { short_format: parsed.short_format ?? "", long_format: parsed.long_format ?? "" };
            }
            return null;
          }

          setSections((prev) => ({
            ...prev,
            [row.decan]: {
              planetAi: parseDecanAi(planetRes),
              daemonAi: parseDecanAi(daemonRes),
              tarotAi: parseDecanAi(tarotRes),
              loading: false,
            },
          }));
        }
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-950 border-white/10" showCloseButton={false}>
        {/* Custom Close Icon - Fixed to top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
          aria-label="Close modal"
        >
          <X className="size-5 transition-transform group-hover:rotate-90" />
        </button>

        {/* Sticky Header Section */}
        <div className="px-6 py-5 border-b border-white/5 bg-slate-900/40 pr-16 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold gold-text">
              {PLANET_IMAGES[planet] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={PLANET_IMAGES[planet]} alt={planet} className="size-7 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
              )}
              <span>{planet} Decans in {sign}</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

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
                  <div key={row.decan} className="rounded-lg border overflow-hidden">
                    {/* Decan header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-600">{ordinalDecan(row.decan)} Decan</span>
                      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400 ml-auto">{planet} in {sign}</Badge>
                    </div>

                    {/* Static labels row */}
                    <div className="grid grid-cols-2 gap-px bg-border">
                      <div className="bg-background px-4 py-2.5 space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Greek Daemon</p>
                        <p className="text-sm font-medium text-foreground">{row.greek_daemon || "—"}</p>
                      </div>
                      <div className="bg-background px-4 py-2.5 space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tarot Card</p>
                        <p className="text-sm font-medium text-foreground">{row.tarot_name || "—"}</p>
                      </div>
                    </div>

                    {/* Static description if present */}
                    {row.description && (
                      <div className="px-4 py-3 bg-muted/5 border-t">
                        <p className="text-xs text-muted-foreground leading-relaxed">{row.description}</p>
                      </div>
                    )}

                    {/* AI sections */}
                    <div className="px-4 py-4 space-y-5 border-t">
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
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Planets Section ──────────────────────────────────────────────────────────

function PlanetsSection({ planets, aiData, areaOfInquiry, decanPossibilities }: { planets: any[]; aiData: any; areaOfInquiry?: string; decanPossibilities: any[] }) {
  const { modal, trigger, close } = useShowMore();
  const [decanPlanet, setDecanPlanet] = useState<{ name: string; sign: string } | null>(null);

  if (!planets) return null;

  const checkDacen = (planetName: string, signName: string) => {
    if (!decanPossibilities) return false;
    return decanPossibilities.some((item: any) =>
      item.planet === planetName && item.sign_name === signName
    );
  };

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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      {/* Decan modal — opens per-planet on Decan button click */}
      <DecanModal
        planet={decanPlanet?.name ?? ""}
        sign={decanPlanet?.sign ?? ""}
        open={!!decanPlanet}
        onClose={() => setDecanPlanet(null)}
      />

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
            const hasDecan = checkDacen(p.name, p.sign);
            return (
              <div key={p.name} className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
                  <span className="text-amber-500 text-base">{PLANET_SYMBOLS[p.name] ?? "✦"}</span>
                  <h4 className="text-sm font-semibold uppercase tracking-wide">{p.name}</h4>
                  {hasDecan && (
                    <button
                      onClick={() => setDecanPlanet({ name: p.name, sign: p.sign })}
                      className="inline-flex items-center justify-center p-1 rounded-md hover:bg-purple-500/10 text-purple-600 transition-colors"
                      title={`${p.name} Decan in ${p.sign}`}
                    >
                      <Sparkles className="size-4" />
                    </button>
                  )}
                  <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-400">{p.sign} · House {p.house}</Badge>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed text-foreground">{interp}</p>
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={() => trigger(p.name, interp, p, areaOfInquiry, undefined, false, "planet")}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />

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

      {/* House Distribution Grid - Precise & Compact with Rich Tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="rounded-xl border border-amber-500/20 overflow-hidden bg-card shadow-sm mt-4">
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/5 via-background to-background border-b border-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-amber-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">Distribution Analysis</h3>
            </div>
            <Badge variant="outline" className="h-5 text-[9px] uppercase tracking-widest border-amber-500/20 text-amber-600 px-1.5 font-bold">Western V2</Badge>
          </div>

          <div className="p-4 overflow-x-auto bg-slate-50/30 dark:bg-slate-950/20">
            <div className="flex flex-col gap-0.5 min-w-[850px]">
              {/* Compact Legend Row */}
              <div className="flex items-center gap-6 mb-2 border-b border-muted/20 pb-2 ml-1">
                <div className="w-40 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Planetary Track</div>
                <div className="flex gap-1.5 flex-1 justify-between max-w-4xl px-2">
                  {["Sun", "Moon", "Mercury", "Venus", "Mars", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "Node", "Part of Fortune", "Chiron"].map((p) => {
                    const pImg = PLANET_IMAGES[p];
                    return (
                      <Tooltip key={p}>
                        <TooltipTrigger asChild>
                          <div className="size-7 flex items-center justify-center grayscale opacity-30 hover:opacity-100 transition-opacity cursor-help">
                            {pImg ? (
                              <img src={pImg} alt={p} className="size-4 object-contain brightness-0 dark:invert" />
                            ) : (
                              <span className="text-[10px] font-bold">{PLANET_SYMBOLS[p] ?? "✦"}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] font-bold uppercase tracking-wider">{p}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {houses.map((h: any) => {
                const planetsInHouse = (houseMap[Number(h.house)] ?? []) as string[];
                const gridPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "Node", "Part of Fortune", "Chiron"];

                let maxIdx = -1;
                planetsInHouse.forEach(pName => {
                  const idx = gridPlanets.indexOf(pName);
                  if (idx > maxIdx) maxIdx = idx;
                });

                return (
                  <div key={h.house} className="flex items-center gap-6 py-2 group hover:bg-amber-500/10 rounded-lg px-2 transition-all border-b border-muted/5 last:border-0">
                    {/* High-Readability House Header */}
                    <div className="flex items-center gap-4 w-44 shrink-0">
                      <div className="flex flex-col w-12 italic">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Cusp</span>
                        <span className="text-sm font-black text-foreground/90 leading-none">H{String(h.house).padStart(2, "0")}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center size-9 rounded-full bg-background border-2 border-amber-500/20 group-hover:border-amber-500/50 group-hover:scale-110 transition-all shadow-sm cursor-pointer overflow-hidden">
                            <span className="text-amber-500 text-xl leading-none font-bold">{ZODIAC_SYMBOLS[h.sign] ?? "•"}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white dark:bg-slate-900 border-2 border-amber-500/20 p-3 shadow-2xl rounded-xl">
                          <p className="font-black text-sm uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">{h.sign}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase italic pb-2 border-b border-muted/20">House {h.house} Custodian</p>
                          <div className="mt-2 text-xs font-mono font-bold text-foreground/80">Position: {Number(h.full_degree || h.degree).toFixed(2)}°</div>
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex flex-col items-end flex-1">
                        <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 leading-none">{Number(h.full_degree || h.degree).toFixed(2)}°</span>
                      </div>
                    </div>

                    {/* Interaction Track with Animated Scale */}
                    <div className="flex gap-2 flex-1 items-center justify-between max-w-4xl px-2">
                      {gridPlanets.map((colPlanet, colIdx) => {
                        const isHere = planetsInHouse.includes(colPlanet);
                        const pImg = PLANET_IMAGES[colPlanet];
                        const planetData = planets?.find(p => p.name === colPlanet);

                        if (isHere) {
                          return (
                            <Tooltip key={colPlanet}>
                              <TooltipTrigger asChild>
                                <div className="size-8 flex items-center justify-center rounded-lg bg-background border-2 border-amber-500/40 text-foreground hover:scale-125 hover:rotate-6 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:z-20 hover:border-amber-500 transition-all cursor-zoom-in overflow-hidden" >
                                  {pImg ? (
                                    <img src={pImg} alt={colPlanet} className="size-6 object-contain" />
                                  ) : (
                                    <span className="text-lg font-bold leading-none text-amber-600">{PLANET_SYMBOLS[colPlanet] ?? "✦"}</span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="p-0 border-0 bg-transparent shadow-none overflow-visible">
                                <div className="p-4 bg-white dark:bg-slate-900 border-2 border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] min-w-[220px] relative">
                                  <div className="flex items-center gap-4 mb-3 pb-3 border-b border-amber-500/10">
                                    <div className="size-11 flex items-center justify-center rounded-xl bg-amber-500/5 shadow-inner p-2 border border-amber-500/10">
                                      {pImg ? <img src={pImg} alt={colPlanet} className="size-full object-contain" /> : <span className="text-2xl">{PLANET_SYMBOLS[colPlanet]}</span>}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1">{colPlanet}</p>
                                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight opacity-70">Resident in Sign {planetData?.sign ?? "N/A"}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                                    <div className="bg-slate-500/5 p-2 rounded-lg border border-border/40">
                                      <span className="text-muted-foreground block text-[9px] uppercase tracking-widest mb-1 opacity-50">Degree</span>
                                      <p className="font-mono text-amber-600">{Number(planetData?.full_degree ?? 0).toFixed(2)}°</p>
                                    </div>
                                    <div className="bg-slate-500/5 p-2 rounded-lg border border-border/40">
                                      <span className="text-muted-foreground block text-[9px] uppercase tracking-widest mb-1 opacity-50">Motion</span>
                                      <p className={planetData?.is_retro === "true" ? "text-red-500" : "text-green-500"}>{planetData?.is_retro === "true" ? "Retrograde" : "Direct"}</p>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        if (colIdx < maxIdx) {
                          return (
                            <Tooltip key={colIdx}>
                              <TooltipTrigger asChild>
                                <div className="size-8 bg-slate-950 border border-slate-800 dark:bg-slate-200 dark:border-slate-300 rounded shadow-inner opacity-90 transition-all hover:opacity-100 hover:scale-105 cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20">
                                <span className="opacity-50 text-amber-400 mr-1">Zone:</span> {colPlanet}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return <div key={colIdx} className="size-8" />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>


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
                <div className="mt-2 flex justify-center">
                  <button onClick={() => trigger(`House ${item.house}`, item.interpretation, item, areaOfInquiry, undefined, false, "house")} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                </div>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
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
                    <span className="inline-flex items-center gap-1.5">
                      {ASPECT_IMAGES[a.type] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ASPECT_IMAGES[a.type]} alt={a.type} className="size-4 object-contain" />
                      ) : (
                        <span className="text-amber-500 text-sm">{ASPECT_SYMBOLS[a.type] ?? ""}</span>
                      )}
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

      {/* AI aspect interpretations with word association */}
      {!aiData && <SectionSkeleton title="Aspect Interpretations" />}
      {aiData === "error" && <SectionError title="Aspect Interpretations" />}
      {Array.isArray(aiData) && aiData.length > 0 && (
        <div className="space-y-3">
          {aiData.map((item: any, i: number) => {
            // Parse planet/aspect names directly from the AI title — no fuzzy rawAspect lookup
            // e.g. "Moon Conjunction Venus" → p1="Moon", aspectType="Conjunction", p2="Venus"
            const { p1, aspectType, p2 } = parseAspectTitle(item.title);
            return (
              <div key={i} className="rounded-lg border overflow-hidden">
                {/* Header — Angular astroHeaderModifierPipe pattern: WORD [img] WORD [img] WORD [img] */}
                <div className="px-4 py-2.5 bg-muted/40 border-b">
                  <AstroHeaderParts title={item.title ?? `Aspect ${i + 1}`} />
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed">{item.interpretation}</p>
                  <div className="mt-2 flex justify-center">
                    <button onClick={() => trigger(item.title ?? `Aspect ${i + 1}`, item.interpretation, item, areaOfInquiry, item.title)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
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

function DharmaKarmaSection({ data, rawData, areaOfInquiry }: { data: any; rawData?: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();

  if (!data && data !== "error") return <SectionSkeleton title="Dharma & Karma" />;
  if (data === "error") return <SectionError title="Dharma & Karma" />;

  const dharma = typeof data === "string" ? null : data?.dharma;
  const karma = typeof data === "string" ? null : data?.karma;

  return (
    <div className="space-y-3">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      {[{ key: "dharma", label: "Dharma", text: dharma }, { key: "karma", label: "Karma", text: karma }].map(({ key, label, text }) => (
        text ? (
          <div key={key} className="rounded-lg border overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-400/20">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{label}</h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed">{text}</p>
              <div className="mt-2 flex justify-center">
                <button onClick={() => trigger(label, text, rawData ?? data, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
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
            <div className="mt-2 flex justify-center">
              <button onClick={() => trigger("Lilith", interp, lilith, areaOfInquiry, undefined, false, "planet")} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
            </div>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
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
                <div className="mt-1.5 flex justify-center">
                  <button onClick={() => trigger(key, interp, { [key]: degree }, areaOfInquiry, undefined, false, "planet")} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                </div>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      <div className="px-4 py-2.5 bg-muted/40 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y">
        {interp && typeof interp === "object" ? (
          Object.entries(interp).map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1.5">{k}</h4>
              <p className="text-sm leading-relaxed">{String(v)}</p>
              <div className="mt-1.5 flex justify-center">
                <button onClick={() => trigger(k, String(v), interp, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
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

function SolarReturnSection({ details, planets, cusps, aspects, planetReport, aspectsReport, aiData, areaOfInquiry }: {
  details: any; planets: any; cusps: any; aspects: any;
  // AstrologyAPI data — ported from Angular solar-return-v2 getHttpHoroscopePost() calls
  planetReport?: any; // solar_return_planet_report: [{name, forecast:[string,...], ...}]
  aspectsReport?: any; // solar_return_aspects_report: [{solar_return_planet, type, natal_planet, forecast}]
  aiData: any; areaOfInquiry?: string;
}) {
  const { modal, trigger, close } = useShowMore();

  // aiData: only solar_return_details comes from AI Lambda now
  const detailsAi = aiData?.solar_return_details ?? null;
  // planet/aspects data come from AstrologyAPI results directly
  const planetAi = null; // not used anymore — see planetReport prop
  const aspectsAi = null; // not used anymore — see aspectsReport prop

  function AiCards({ data, title }: { data: any; title: string }) {
    if (!data) return <SectionSkeleton title={title} />;
    if (data === "error") return <SectionError title={title} />;
    const items: any[] = Array.isArray(data) ? data : [];
    return (
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2">
              {item.name && PLANET_IMAGES[item.name] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={PLANET_IMAGES[item.name]} alt={item.name} className="size-5 object-contain" />
              )}
              <h4 className="text-sm font-semibold">{item.title ?? item.name ?? `${title} ${i + 1}`}</h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed">{item.interpretation ?? item.data ?? item.forecast}</p>
              <div className="mt-2 flex justify-center">
                <button onClick={() => trigger(item.title ?? item.name ?? title, item.interpretation ?? item.data ?? "", item, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />

      {/* 1. Solar Return Details */}
      {details && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Solar Return Details</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/20">
                {["Native Birth Date", "Solar Return Date", "Sun Degree", "Solar Return ASC"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody><tr className="bg-background">
                <td className="px-3 py-2">{details.native_birth_date ?? details.date_of_birth ?? "—"}</td>
                <td className="px-3 py-2 font-semibold text-amber-600">{details.solar_return_date ?? details.return_date ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{details.sun_degree ?? "—"}</td>
                <td className="px-3 py-2">{details.solar_return_asc ?? details.ascendant ?? "—"}</td>
              </tr></tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Solar Return Planets table */}
      {planetList.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Solar Return Planets</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/20">
                {["Planet", "House", "Full Degree", "Sign", "Norm Degree", "Speed", "Retro?"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {planetList.map((p: any, i: number) => (
                  <tr key={p.name ?? i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                    <td className="px-3 py-2 font-medium whitespace-nowrap"><PlanetSymbol name={p.name} /></td>
                    <td className="px-3 py-2 text-center">{p.house ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{Number(p.full_degree ?? 0).toFixed(2)}°</td>
                    <td className="px-3 py-2 whitespace-nowrap"><ZodiacSymbol sign={p.sign} /></td>
                    <td className="px-3 py-2 font-mono text-xs">{Number(p.norm_degree ?? 0).toFixed(2)}°</td>
                    <td className="px-3 py-2 font-mono text-xs">{Number(p.speed ?? 0).toFixed(4)}</td>
                    <td className="px-3 py-2"><Badge variant={p.is_retro === "true" || p.is_retro === true ? "destructive" : "outline"} className="text-[10px]">{p.is_retro === "true" || p.is_retro === true ? "R" : "—"}</Badge></td>
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
            <h3 className="text-sm font-semibold px-1">Solar Return Planet Interpretations</h3>
            {items.map((p: any, i: number) => {
              const forecasts: string[] = Array.isArray(p.forecast) ? p.forecast : (p.forecast ? [String(p.forecast)] : []);
              return (
                <div key={p.name ?? i} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2">
                    {p.name && PLANET_IMAGES[p.name] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={PLANET_IMAGES[p.name]} alt={p.name} className="size-5 object-contain" />
                    )}
                    <h4 className="text-sm font-semibold">{p.name ?? `Planet ${i + 1}`}</h4>
                    {p.sign && <Badge variant="outline" className="ml-auto text-[10px] text-amber-600 border-amber-400">{p.sign}{p.house ? ` · House ${p.house}` : ""}</Badge>}
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {forecasts.map((f: string, fi: number) => (
                      <p key={fi} className="text-sm leading-relaxed text-foreground">{f}</p>
                    ))}
                    {forecasts.length === 0 && <p className="text-sm text-muted-foreground italic">No forecast available.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 4. Solar Return House Cusps */}
      {(cuspObj.ascendant || cuspObj.midheaven || cuspObj.vertex || houseList.length > 0) && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Solar Return House Cusps</h3></div>
          {(cuspObj.ascendant || cuspObj.midheaven || cuspObj.vertex) && (
            <div className="overflow-x-auto border-b">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/20">
                  {["Point", "Sign", "Degree"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody>
                  {[{ label: "Ascendant", val: cuspObj.ascendant }, { label: "Midheaven", val: cuspObj.midheaven }, { label: "Vertex", val: cuspObj.vertex }].filter((r) => r.val).map((r) => (
                    <tr key={r.label} className="border-b last:border-0 bg-background">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2"><ZodiacSymbol sign={typeof r.val === "object" ? r.val?.sign : String(r.val)} /></td>
                      <td className="px-3 py-2 font-mono text-xs">{typeof r.val === "object" ? `${Number(r.val?.degree ?? 0).toFixed(2)}°` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {houseList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/20">
                  {["House", "Sign", "Degree"].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody>
                  {houseList.map((h: any, i: number) => (
                    <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                      <td className="px-3 py-2 font-medium">{h.house}</td>
                      <td className="px-3 py-2"><ZodiacSymbol sign={h.sign} /></td>
                      <td className="px-3 py-2 font-mono text-xs">{Number(h.degree ?? 0).toFixed(2)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Solar Return Aspects table */}
      {aspectList.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Solar Return Planet Aspects</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/20">
                {["SR Planet", "Natal Planet", "Type", "Orb"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {aspectList.map((a: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                    <td className="px-3 py-2 whitespace-nowrap"><PlanetSymbol name={a.solar_return_planet ?? a.aspecting_planet ?? a.planet1 ?? "—"} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><PlanetSymbol name={a.natal_planet ?? a.aspected_planet ?? a.planet2 ?? "—"} /></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {ASPECT_IMAGES[a.type] && <img src={ASPECT_IMAGES[a.type]} alt={a.type} className="size-4 object-contain" />}
                        {a.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{Number(a.orb ?? 0).toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Solar Return Aspects Report — from AstrologyAPI solar_return_aspects_report
           Shape: [{solar_return_planet, type, natal_planet, forecast}]
           Ported from Angular solar-return-v2 getHttpHoroscopePost("solar_return_aspects_report") */}
      {aspectsReport !== null && aspectsReport !== undefined && (() => {
        const items: any[] = Array.isArray(aspectsReport) ? aspectsReport : [];
        if (items.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold px-1">Solar Return Planet Aspects Interpretations</h3>
            {items.map((a: any, i: number) => {
              const srPlanet = a.solar_return_planet ?? a.aspecting_planet ?? "";
              const nPlanet = a.natal_planet ?? a.aspected_planet ?? "";
              const aType = a.type ?? "";
              const header = [srPlanet, aType, nPlanet].filter(Boolean).join(" ");
              const forecast = a.forecast ?? a.interpretation ?? "";
              return (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2 flex-wrap">
                    {srPlanet && <PlanetSymbol name={srPlanet} showImage />}
                    {aType && ASPECT_IMAGES[aType] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ASPECT_IMAGES[aType]} alt={aType} className="size-4 object-contain" />
                    )}
                    {nPlanet && <PlanetSymbol name={nPlanet} showImage />}
                    <h4 className="text-sm font-semibold ml-1">{header || `Aspect ${i + 1}`}</h4>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed text-foreground">{String(forecast)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 7. General AI interpretation (solar_return_details key) */}
      {detailsAi && <AiCards data={detailsAi} title="Solar Return Interpretation" />}
    </div>
  );
}

// ─── Transit Section ──────────────────────────────────────────────────────────

function TransitSection({ data, lunarMetrics, aiData, lunarAiData, tabSlug, areaOfInquiry }: {
  data: any; lunarMetrics?: any; aiData: any; lunarAiData?: any; tabSlug: string; areaOfInquiry?: string;
}) {
  const { modal, trigger, close } = useShowMore();
  const isWeekly = tabSlug === "tropical_transits_weekly_v2";
  const label = isWeekly ? "Weekly Transits" : "Monthly Transits";

  // Normalise transit relation rows — handles both Lambda and AstrologyAPI shapes
  const transitRows: any[] = (() => {
    if (!data) return [];
    // Lambda: { transit_relation: [...] } or direct array
    if (Array.isArray(data?.transit_relation)) return data.transit_relation;
    if (Array.isArray(data?.transits)) return data.transits;
    if (Array.isArray(data)) return data;
    // AstrologyAPI weekly shape: { transit_planet: { Sun: {...}, ... } } — flatten
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

  // Lunar metrics rows
  const lunarRows: any[] = (() => {
    const src = lunarMetrics ?? data?.lunar_data ?? data?.lunar_metrics;
    if (!src) return [];
    if (Array.isArray(src)) return src;
    // Object keyed by month or numeric index
    if (typeof src === "object") return Object.values(src);
    return [];
  })();

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />

      {/* Weekly / Monthly Transit Relation Table */}
      {transitRows.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h3 className="text-sm font-semibold">{label} — Transit Aspects</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  {["Transit Planet", "Aspect", "Natal Planet", "Orb", "Date"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
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
                    <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                      <td className="px-3 py-2 whitespace-nowrap">{tPlanet ? <PlanetSymbol name={tPlanet} /> : "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {ASPECT_IMAGES[aspType] && <img src={ASPECT_IMAGES[aspType]} alt={aspType} className="size-4 object-contain" />}
                          <span>{aspType || "—"}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{nPlanet ? <PlanetSymbol name={nPlanet} /> : "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{orb}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{dt || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lunar Return Metrics (monthly only) */}
      {!isWeekly && lunarRows.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h3 className="text-sm font-semibold">Lunar Return Metrics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  {["Date / Month", "Moon Day", "Illumination", "Phase", "Moon Sign"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lunarRows.map((row: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/10")}>
                    <td className="px-3 py-2 text-xs">{row.date ?? row.month ?? `Month ${i + 1}`}</td>
                    <td className="px-3 py-2 text-xs">{row.moon_day ?? row.day ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.moon_illumination != null ? `${Number(row.moon_illumination).toFixed(1)}%` : (row.illumination ?? "—")}</td>
                    <td className="px-3 py-2 text-xs">{row.moon_phase ?? row.phase ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.moon_sign ? <ZodiacSymbol sign={row.moon_sign} /> : (row.sign ? <ZodiacSymbol sign={row.sign} /> : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI interpretation cards */}
      {!aiData && <SectionSkeleton title={`${label} Interpretation`} />}
      {aiData === "error" && <SectionError title={`${label} Interpretation`} />}
      {Array.isArray(aiData) && aiData.map((item: any, i: number) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <h4 className="text-sm font-semibold">{item.title ?? `${label} ${i + 1}`}</h4>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed">{item.interpretation ?? item.data}</p>
            <div className="mt-2 flex justify-center">
              <button onClick={() => trigger(item.title ?? label, item.interpretation ?? "", item, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
            </div>
          </div>
        </div>
      ))}

      {/* Lunar AI interpretation (monthly only) — from AI Lambda lunar_metrics prompt */}
      {!isWeekly && lunarAiData && (() => {
        const items: any[] = Array.isArray(lunarAiData) ? lunarAiData : (typeof lunarAiData === "object" ? [lunarAiData] : []);
        return items.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold px-1">Lunar Return AI Interpretation</h3>
            {items.map((item: any, i: number) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/40 border-b">
                  <h4 className="text-sm font-semibold">{item.title ?? `Lunar Return ${i + 1}`}</h4>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed">{item.interpretation ?? item.data ?? JSON.stringify(item)}</p>
                  <div className="mt-2 flex justify-center">
                    <button onClick={() => trigger(item.title ?? "Lunar Return", item.interpretation ?? "", item, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* Raw data fallback */}
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

function HorarySection({ data, areaOfInquiry }: { data: any; areaOfInquiry?: string }) {
  const { modal, trigger, close } = useShowMore();
  if (!data) return <SectionSkeleton title="Horary Chart Interpretation" />;
  if (data === "error") return <SectionError title="Horary Chart Interpretation" />;

  // The AI response has both root-level keys AND a nested `data` key
  const inner = data?.data ?? data;
  const rootPlanet = data?.planet;               // root level planet object
  const astroConsiderations = data?.astrological_considerations;
  const recommendations = data?.recommendations;
  const alternativeTimings = data?.alternative_timings;

  function ItemBlock({ title, text }: { title: string; text: string }) {
    if (!text) return null;
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b">
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed">{text}</p>
          <div className="mt-2 flex justify-center">
            <button onClick={() => trigger(title, text, { title, data: text }, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
          </div>
        </div>
      </div>
    );
  }

  function ObjSection({ title, obj }: { title: string; obj: any }) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const entries = Object.entries(obj).filter(([, v]) => v && typeof v === "string");
    if (!entries.length) return null;
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">{title}</h3></div>
        <div className="divide-y">
          {entries.map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{k.replace(/_/g, " ")}</h4>
              <p className="text-sm leading-relaxed">{String(v)}</p>
              <div className="mt-1.5 flex justify-center">
                <button onClick={() => trigger(k, String(v), obj, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasContent = inner?.recomendation_on_date_and_timeline || inner?.house || inner?.planet || inner?.summary || rootPlanet || astroConsiderations;

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />

      {/* Recommendation on Date & Timeline */}
      {inner?.recomendation_on_date_and_timeline?.data && (
        <ItemBlock title={inner.recomendation_on_date_and_timeline.title ?? "Recommendation on Date & Timeline"} text={inner.recomendation_on_date_and_timeline.data} />
      )}

      {/* Root-level planet significators */}
      <ObjSection title="Planet Significators" obj={rootPlanet} />

      {/* Astrological Considerations */}
      <ObjSection title="Astrological Considerations" obj={astroConsiderations} />

      {/* Recommendations */}
      <ObjSection title="Recommendations" obj={recommendations} />

      {/* Alternative Timings */}
      <ObjSection title="Alternative Timings" obj={alternativeTimings} />

      {/* Summary — timeline entries */}
      {Array.isArray(inner?.summary?.recommendation_on_date_and_timeline) && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Summary</h3></div>
          <div className="divide-y">
            {inner.summary.recommendation_on_date_and_timeline.map((s: any, i: number) => (
              <div key={i} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{s.timeline_title}</h4>
                <p className="text-sm leading-relaxed">{s.timeline_data}</p>
                <div className="mt-1.5 flex justify-center">
                  <button onClick={() => trigger(s.timeline_title, s.timeline_data, s, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary — answer array */}
      {Array.isArray(inner?.summary?.answer) && inner.summary.answer.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-400/20"><h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Answer</h3></div>
          <div className="divide-y">
            {inner.summary.answer.map((a: any, i: number) => (
              <div key={i} className="px-4 py-3">
                {a.title && <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{a.title}</h4>}
                <p className="text-sm leading-relaxed">{a.data ?? a.text ?? String(a)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary — recommendation array */}
      {Array.isArray(inner?.summary?.recommendation) && inner.summary.recommendation.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Recommendations</h3></div>
          <div className="divide-y">
            {inner.summary.recommendation.map((r: any, i: number) => (
              <div key={i} className="px-4 py-3">
                {r.title && <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{r.title}</h4>}
                <p className="text-sm leading-relaxed">{r.data ?? r.text ?? String(r)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Houses */}
      {Array.isArray(inner?.house) && inner.house.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">House Analysis</h3></div>
          <div className="divide-y">
            {inner.house.map((h: any, i: number) => (
              <div key={i} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{h.title}</h4>
                <p className="text-sm leading-relaxed">{h.data}</p>
                <div className="mt-1.5 flex justify-center">
                  <button onClick={() => trigger(h.title, h.data, h, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planets (inner.planet array) */}
      {Array.isArray(inner?.planet) && inner.planet.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Planet Analysis</h3></div>
          <div className="divide-y">
            {inner.planet.map((p: any, i: number) => {
              const pName = p.title?.split(" ")[0];
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    {pName && PLANET_IMAGES[pName] && <img src={PLANET_IMAGES[pName]} alt={pName} className="size-5 object-contain" />}
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">{p.title}</h4>
                  </div>
                  <p className="text-sm leading-relaxed">{p.data}</p>
                  <div className="mt-1.5 flex justify-center">
                    <button onClick={() => trigger(p.title, p.data, p, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Astrological aspects sub-section */}
      {inner?.astrological_aspect && typeof inner.astrological_aspect === "object" && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">Astrological Aspects</h3></div>
          <div className="divide-y">
            {Object.entries(inner.astrological_aspect).map(([k, v]: [string, any]) => (
              <div key={k} className="px-4 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{k.replace(/_/g, " ")}</h4>
                <p className="text-sm leading-relaxed">{typeof v === "string" ? v : JSON.stringify(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback raw data */}
      {!hasContent && (
        <details className="rounded-lg border">
          <summary className="px-4 py-2.5 text-sm font-semibold cursor-pointer bg-muted/20 hover:bg-muted/40">Horary Chart Raw Data</summary>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/10 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// ─── Relationship Section — all 8 Angular AI sections ────────────────────────

const RELATIONSHIP_AI_SECTIONS = [
  { key: "synastry_horoscope", label: "Synastry Horoscope" },
  { key: "composite_horoscope", label: "Composite Horoscope" },
  { key: "davison_relationship", label: "Davison Relationship" },
  { key: "major_aspects_and_connections", label: "Major Aspects & Connections" },
  { key: "compatibility_score_or_summary", label: "Compatibility Score / Summary" },
  { key: "elemental_balance", label: "Elemental Balance" },
  { key: "timing_and_transits", label: "Timing & Transits" },
  { key: "karmic_and_soulmate_indicators", label: "Karmic & Soulmate Indicators" },
  // business only
  { key: "professional_alignment_and_goals", label: "Professional Alignment & Goals" },
];

function RelationshipSection({ aiMap, areaOfInquiry, tabSlug }: { aiMap: Record<string, any>; areaOfInquiry?: string; tabSlug: string }) {
  const { modal, trigger, close } = useShowMore();
  const isBusiness = tabSlug === "business_partner_v2";

  function AiBlock({ title, sectionKey, data }: { title: string; sectionKey: string; data: any }) {
    if (!data && data !== "error") return <SectionSkeleton title={title} />;
    if (data === "error") return <SectionError title={title} />;
    const items: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    if (!items.length) return null;
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b"><h3 className="text-sm font-semibold">{title}</h3></div>
        <div className="divide-y">
          {items.map((item: any, i: number) => (
            <div key={i} className="px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">{item.title ?? item.name}</h4>
              <p className="text-sm leading-relaxed">{item.data ?? item.interpretation ?? item.description}</p>
              <div className="mt-1.5 flex justify-center">
                <button onClick={() => trigger(item.title ?? title, item.data ?? item.interpretation ?? "", item, areaOfInquiry)} className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2">Show More</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sections = RELATIONSHIP_AI_SECTIONS.filter((s) => {
    if (s.key === "professional_alignment_and_goals") return isBusiness;
    if (s.key === "karmic_and_soulmate_indicators") return !isBusiness;
    return true;
  });

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      {sections.map((s) => (
        <AiBlock key={s.key} title={s.label} sectionKey={s.key} data={aiMap[s.key]} />
      ))}
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

// ─── Tab Bar (horizontal scrollable with arrow buttons) ──────────────────────

function TabBar({ currentSlug, onSelect }: { currentSlug: string; onSelect: (slug: string) => void }) {
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
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.slug === currentSlug;
            return (
              <button
                key={tab.slug}
                data-active={active}
                onClick={() => onSelect(tab.slug)}
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
  const [decanPossibilities, setDecanPossibilities] = useState<any[]>([]);

  // Reset on tab change
  useEffect(() => {
    setResults(null); setNatalSvg(null); setNatalSvgTransit(null);
    setReturnDate(null); setError(null); setProgress([]); setForm(defaultForm());
    setShowScrollTop(false); setShowChartBtn(false);
  }, [currentSlug]);

  // Pre-fetch decan possibilities
  useEffect(() => {
    fetch("/api/admin/astro-decans")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDecanPossibilities(data);
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
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResults({}); // Initialize results so the section shows up immediately
    setNatalSvg(null);
    setNatalSvgTransit(null);
    setReturnDate(null);
    setProgress([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: Record<string, any> = {};

    try {
      const birth1 = parseBirth(form.person1);

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
                setNatalSvg(w.chart_url);
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
                setNatalSvgTransit(svg);
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
              if (form.futureWeek) {
                const wd = await callPlanetReturn({
                  steps: "astrology_report_weekly",
                  birth_details: birth1,
                  week_start_date: form.futureWeek,
                });
                const val = wd?.astrology_report_weekly ?? wd;
                collected.transit_data = val;
                collected.is_future_transit = true;
                collected.future_transit_date = form.futureWeek;
                setResults((prev) => ({
                  ...prev,
                  transit_data: val,
                  is_future_transit: true,
                  future_transit_date: form.futureWeek,
                }));
              } else {
                const val = await callCompute(
                  "tropical_transits/weekly",
                  birth1 as unknown as Record<string, unknown>
                );
                collected.transit_data = val;
                collected.is_future_transit = false;
                setResults((prev) => ({
                  ...prev,
                  transit_data: val,
                  is_future_transit: false,
                }));
              }
            })()
          );
        }

        if (currentTab.slug === "tropical_transits_monthly_v3") {
          tasks.push(
            (async () => {
              if (form.futureMonth) {
                const [mYear, mMonth] = form.futureMonth.split("-").map(Number);
                const md = await callPlanetReturn({
                  steps: "astrology_report_monthly",
                  birth_details: birth1,
                  target_year: mYear,
                  target_month: mMonth,
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
            })()
          );
        }

        if (currentTab.slug === "horary_chart_v2") {
          tasks.push(
            (async () => {
              const val = await callCompute("horary_chart", {
                ...birth1,
                question: form.question,
              } as unknown as Record<string, unknown>);
              collected.horary_chart_data = val;
              collected.question = form.question;
              collected.city = form.person1?.city ?? "";
              setResults((prev) => ({
                ...prev,
                horary_chart_data: val,
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
          uranus_return_v2: "uranus_return",
        };
        if (planetReturnMap[currentTab.slug]) {
          tasks.push(
            (async () => {
              const steps = planetReturnMap[currentTab.slug];
              const planetName = steps.split("_")[0];
              const planetCap = planetName.charAt(0).toUpperCase() + planetName.slice(1);
              const nDeg = getPlanetDegree(natalData?.planets, planetCap);
              const bod = `${pad(birth1.year)}-${pad(birth1.month)}-${pad(
                birth1.day
              )} ${pad(birth1.hour)}:${pad(birth1.min)}:00`;
              const retData = await callPlanetReturn({
                steps,
                date_of_birth_with_time: bod,
                natal_deg: nDeg,
              });
              const rdVal = retData?.[`${planetName}_return`];
              if (rdVal) {
                setReturnDate(rdVal);
                collected.returnDate = rdVal;
              }
              collected.planet_return_data = retData;
              setResults((prev) => ({ ...prev, planet_return_data: retData }));

              if (currentTab.slug === "saturn_return_v2") {
                const [det, pla, cup, asp] = await Promise.allSettled([
                  callCompute(
                    "solar_return_details",
                    birth1 as unknown as Record<string, unknown>
                  ),
                  callCompute(
                    "solar_return_planets",
                    birth1 as unknown as Record<string, unknown>
                  ),
                  callCompute(
                    "solar_return_house_cusps",
                    birth1 as unknown as Record<string, unknown>
                  ),
                  callCompute(
                    "solar_return_planet_aspects",
                    birth1 as unknown as Record<string, unknown>
                  ),
                ]);
                const detV = det.status === "fulfilled" ? det.value : null;
                const plaV = pla.status === "fulfilled" ? pla.value : null;
                const cupV = cup.status === "fulfilled" ? cup.value : null;
                const aspV = asp.status === "fulfilled" ? asp.value : null;
                collected.solar_return_details = detV;
                collected.solar_return_planets = plaV;
                collected.solar_return_cusps = cupV;
                collected.solar_return_aspects = aspV;
                setResults((prev) => ({
                  ...prev,
                  solar_return_details: detV,
                  solar_return_planets: plaV,
                  solar_return_cusps: cupV,
                  solar_return_aspects: aspV,
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
        const prompts = buildAiPrompts(combinedData, currentTab.slug);

        const aiPromises = prompts.map(async (p) => {
          try {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const aiRes = await callAI(aiPayload, form.areaOfInquiry || undefined);
            let parsed = aiRes.ai_response;
            if (typeof parsed === "string") {
              try {
                parsed = JSON.parse(parsed);
              } catch {
                /* keep string */
              }
            }
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: parsed },
              };
            });
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
      if (currentTab.type === "two-person") {
        const birth2 = parseBirth(form.person2);
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

        // Synastry
        relTasks.push(
          callCompute("synastry_horoscope", {
            ...birth1,
            p_day: birth2.day,
            p_month: birth2.month,
            p_year: birth2.year,
            p_hour: birth2.hour,
            p_min: birth2.min,
            p_lat: birth2.lat,
            p_lon: birth2.lon,
            p_tzone: birth2.tzone,
          } as unknown as Record<string, unknown>).then((d) => {
            collected.synastry = d;
            setResults((prev) => ({ ...prev, synastry: d }));
          })
        );

        // Composite
        relTasks.push(
          callCompute("composite_horoscope", {
            ...birth1,
            p_day: birth2.day,
            p_month: birth2.month,
            p_year: birth2.year,
            p_hour: birth2.hour,
            p_min: birth2.min,
            p_lat: birth2.lat,
            p_lon: birth2.lon,
            p_tzone: birth2.tzone,
          } as unknown as Record<string, unknown>)
            .then((d) => {
              collected.composite = d;
              setResults((prev) => ({ ...prev, composite: d }));
            })
            .catch(() => { })
        );

        // Wheels
        relTasks.push(
          callNatalWheel(
            freeWheelBody(form.person1) as unknown as Record<string, unknown>
          ).then((r) => {
            const svg = r?.results?.output;
            if (svg) {
              setNatalSvg(svg);
              setShowChartBtn(true);
            }
          })
        );
        relTasks.push(
          callNatalWheel(
            freeWheelBody(form.person2) as unknown as Record<string, unknown>
          ).then((r) => {
            const svg = r?.results?.output;
            if (svg) setNatalSvgTransit(svg);
          })
        );

        await Promise.allSettled(relTasks);

        // AI Interpretations
        addProgress("Running relationship AI…");
        const combinedData = { ...(collected.synastry ?? {}), ...collected };
        const prompts = buildAiPrompts(combinedData, currentTab.slug);
        const aiPromises = prompts.map(async (p) => {
          try {
            const aiPayload = {
              condition: { system_content: p.system, user_content: p.user },
              toolname: "other",
              json: p.json,
            };
            const aiRes = await callAI(aiPayload, form.areaOfInquiry || undefined);
            let parsed = aiRes.ai_response;
            if (typeof parsed === "string") {
              try {
                parsed = JSON.parse(parsed);
              } catch {
                /* keep */
              }
            }
            setResults((prev) => {
              const prevAi = prev?.ai_interpretations ?? {};
              return {
                ...prev!,
                ai_interpretations: { ...prevAi, [p.key]: parsed },
              };
            });
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

      {/* Horizontal tab bar with scroll arrows */}
      <TabBar currentSlug={currentSlug} onSelect={setTab} />

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
                <SolarReturnSection details={results.solar_return_details} planets={results.solar_return_planets} cusps={results.solar_return_cusps} aspects={results.solar_return_aspects} planetReport={results.solar_return_planet_report} aspectsReport={results.solar_return_aspects_report} aiData={ai} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Saturn Return also shows solar return ──── */}
              {currentSlug === "saturn_return_v2" && results.solar_return_details && (
                <SolarReturnSection details={results.solar_return_details} planets={results.solar_return_planets} cusps={results.solar_return_cusps} aspects={results.solar_return_aspects} planetReport={results.solar_return_planet_report} aspectsReport={results.solar_return_aspects_report} aiData={null} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Transits ───────────────────────────────── */}
              {isTransit && (
                <TransitSection data={results.transit_data} lunarMetrics={results.lunar_metrics} aiData={currentSlug === "tropical_transits_weekly_v2" ? ai.tropical_transits_weekly : ai.tropical_transits_monthly} lunarAiData={currentSlug === "tropical_transits_monthly_v3" ? ai.lunar_metrics : undefined} tabSlug={currentSlug} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Horary ─────────────────────────────────── */}
              {isHorary && (
                <HorarySection data={ai.horary_chart_question} areaOfInquiry={form.areaOfInquiry} />
              )}

              {/* ─── Two-person relationship (all 8 AI sections) ─ */}
              {isTwoPersonAiTab && (
                <RelationshipSection aiMap={ai} areaOfInquiry={form.areaOfInquiry} tabSlug={currentSlug} />
              )}

              {/* ─── Natal chart sections (all single tabs + planet return tabs) ─ */}
              {natalData && (
                <div className="space-y-6">
                  <PlanetsSection planets={natalData.planets} aiData={ai.western_horoscope_planets} areaOfInquiry={form.areaOfInquiry} decanPossibilities={decanPossibilities} />
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
