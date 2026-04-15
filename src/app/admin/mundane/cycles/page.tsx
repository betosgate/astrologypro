/**
 * Planetary Cycle Analysis — server component
 * Computes current phase for 5 major planetary cycles using astronomy-engine
 * via the ephemeris helper functions.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  findLastConjunction,
  getCyclePhase,
  getPhaseName,
  getEclipticLongitude,
} from "@/lib/ephemeris";
import type { Planet } from "@/lib/ephemeris";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const ZODIAC_SYMBOLS = [
  "♈", "♉", "♊", "♋", "♌", "♍",
  "♎", "♏", "♐", "♑", "♒", "♓",
];

const PLANET_SYMBOLS: Record<string, string> = {
  jupiter: "♃",
  saturn: "♄",
  uranus: "⛢",
  neptune: "♆",
  pluto: "♇",
};

// Known synodic periods in days (used for next-conjunction estimate)
const SYNODIC_PERIODS: Record<string, number> = {
  "jupiter-saturn": 7253,
  "saturn-pluto": 12054,
  "jupiter-pluto": 4633,
  "uranus-pluto": 44603,
  "saturn-uranus": 16438,
};

function cyclePairKey(p1: string, p2: string): string {
  return [p1, p2].sort().join("-");
}

const CYCLES: {
  planet1: Planet;
  planet2: Planet;
  label: string;
  approxYears: string;
}[] = [
  { planet1: "saturn", planet2: "pluto",   label: "Saturn — Pluto",   approxYears: "33–38" },
  { planet1: "jupiter", planet2: "saturn", label: "Jupiter — Saturn", approxYears: "~20"   },
  { planet1: "jupiter", planet2: "pluto",  label: "Jupiter — Pluto",  approxYears: "~13"   },
  { planet1: "uranus",  planet2: "pluto",  label: "Uranus — Pluto",   approxYears: "~127"  },
  { planet1: "saturn",  planet2: "uranus", label: "Saturn — Uranus",  approxYears: "~45"   },
];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  Conjunction:     "New cycle begins",
  Crescent:        "Intention setting",
  "First Quarter": "Crisis of action",
  Gibbous:         "Development phase",
  Full:            "Peak tension / revelation",
  Disseminating:   "Spreading awareness",
  "Last Quarter":  "Crisis of consciousness",
  Balsamic:        "Release, completion",
};

// Phase badge colors
function phaseBadgeClass(phaseName: string): string {
  switch (phaseName) {
    case "Conjunction":     return "bg-purple-100 text-purple-700 border-purple-200";
    case "Crescent":        return "bg-blue-100 text-blue-700 border-blue-200";
    case "First Quarter":   return "bg-sky-100 text-sky-700 border-sky-200";
    case "Gibbous":         return "bg-teal-100 text-teal-700 border-teal-200";
    case "Full":            return "bg-red-100 text-red-700 border-red-200";
    case "Disseminating":   return "bg-orange-100 text-orange-700 border-orange-200";
    case "Last Quarter":    return "bg-amber-100 text-amber-700 border-amber-200";
    case "Balsamic":        return "bg-gray-100 text-gray-600 border-gray-200";
    default:                return "bg-muted text-muted-foreground border-muted";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format longitude as degree + zodiac sign symbol, e.g. "22°♑" */
function formatLongitude(lon: number): string {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = Math.floor(normalized % 30);
  return `${degree}°${ZODIAC_SYMBOLS[signIndex]}`;
}

/** Estimate next opposition date from last conjunction and current phase */
function estimateNextOpposition(lastConj: Date, synodicDays: number): Date {
  const halfPeriodMs = (synodicDays / 2) * 86_400_000;
  const candDate = new Date(lastConj.getTime() + halfPeriodMs);
  // If already past, add another full cycle
  if (candDate <= new Date()) {
    return new Date(candDate.getTime() + synodicDays * 86_400_000);
  }
  return candDate;
}

/** Estimate next conjunction date from last conjunction */
function estimateNextConjunction(lastConj: Date, synodicDays: number): Date {
  const periodMs = synodicDays * 86_400_000;
  let next = new Date(lastConj.getTime() + periodMs);
  // Advance until it's in the future
  while (next <= new Date()) {
    next = new Date(next.getTime() + periodMs);
  }
  return next;
}

/** Years elapsed since a date, to one decimal */
function yearsElapsed(from: Date, to: Date): string {
  const diff = (to.getTime() - from.getTime()) / (365.25 * 86_400_000);
  return diff.toFixed(1);
}

// ---------------------------------------------------------------------------
// SVG Phase Diagram
// ---------------------------------------------------------------------------

interface PhaseDiagramProps {
  phaseAngle: number; // 0–360
}

function PhaseDiagram({ phaseAngle }: PhaseDiagramProps) {
  const SIZE = 60;
  const R = 22;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // Convert phase angle to position on circle
  // 0° = top (12 o'clock), going clockwise
  const rad = ((phaseAngle - 90) * Math.PI) / 180;
  const dotX = cx + R * Math.cos(rad);
  const dotY = cy + R * Math.sin(rad);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label={`Phase diagram at ${phaseAngle.toFixed(1)} degrees`}
      role="img"
    >
      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-muted-foreground/30"
      />
      {/* Axis crosshairs */}
      <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="currentColor" strokeWidth={0.5} className="text-muted-foreground/20" />
      <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="currentColor" strokeWidth={0.5} className="text-muted-foreground/20" />
      {/* Center dot (inner planet) */}
      <circle cx={cx} cy={cy} r={3} fill="currentColor" className="text-muted-foreground/60" />
      {/* Phase position dot (outer planet) */}
      <circle cx={dotX} cy={dotY} r={4} fill="currentColor" className="text-violet-500" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CyclesPage() {
  const now = new Date();

  const cycleData = CYCLES.map((cycle) => {
    const { planet1, planet2, label, approxYears } = cycle;
    const key = cyclePairKey(planet1, planet2);
    const synodicDays = SYNODIC_PERIODS[key] ?? 10000;

    const phaseAngle = getCyclePhase(planet1, planet2, now);
    const phaseName = getPhaseName(phaseAngle);
    const lastConj = findLastConjunction(planet1, planet2, now);

    // Get the zodiac position at the last conjunction
    const conjLon = getEclipticLongitude(planet1, lastConj);
    const conjSign = formatLongitude(conjLon);

    const nextOpp = estimateNextOpposition(lastConj, synodicDays);
    const nextConj = estimateNextConjunction(lastConj, synodicDays);
    const yearsIntoStr = yearsElapsed(lastConj, now);
    const totalYearsStr = (synodicDays / 365.25).toFixed(1);

    const p1Symbol = PLANET_SYMBOLS[planet1] ?? "";
    const p2Symbol = PLANET_SYMBOLS[planet2] ?? "";

    return {
      label,
      approxYears,
      planet1Symbol: p1Symbol,
      planet2Symbol: p2Symbol,
      phaseAngle,
      phaseName,
      phaseDescription: PHASE_DESCRIPTIONS[phaseName] ?? "",
      lastConj,
      conjSign,
      nextOpp,
      nextConj,
      yearsIntoStr,
      totalYearsStr,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planetary Cycle Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Major synodic cycles — phase positions computed for{" "}
          {now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
        </p>
      </div>

      {/* Cycle cards */}
      <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {cycleData.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold leading-snug">
                  {c.planet1Symbol} {c.label} {c.planet2Symbol}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 font-medium ${phaseBadgeClass(c.phaseName)}`}
                >
                  {c.phaseName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Synodic cycle ≈ {c.approxYears} years
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Phase diagram + angle row */}
              <div className="flex items-center gap-4">
                <PhaseDiagram phaseAngle={c.phaseAngle} />
                <div className="space-y-1">
                  <p className="text-2xl font-mono font-semibold tabular-nums leading-none">
                    {c.phaseAngle.toFixed(1)}°
                  </p>
                  <p className="text-xs text-muted-foreground italic">{c.phaseDescription}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.yearsIntoStr} of ~{c.totalYearsStr} yrs into cycle
                  </p>
                </div>
              </div>

              {/* Dates grid */}
              <div className="grid grid-cols-1 gap-1.5 text-xs border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last conjunction</span>
                  <span className="font-medium tabular-nums">
                    {formatDate(c.lastConj)} at {c.conjSign}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next opposition (est.)</span>
                  <span className="font-medium tabular-nums">{formatDate(c.nextOpp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next conjunction (est.)</span>
                  <span className="font-medium tabular-nums">{formatDate(c.nextConj)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
