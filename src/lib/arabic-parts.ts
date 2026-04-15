/**
 * arabic-parts.ts
 * Calculates the classical Arabic Parts (Lots) for a natal chart.
 *
 * Formula for all parts: result = (A + B - C + 360) % 360
 * Day/night formulas swap certain pairs based on whether the Sun is above
 * the horizon (diurnal chart).
 */

import type { PlanetData } from "@/components/mundane/astro-wheel";

const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export interface ArabicPart {
  name: string;
  formula: string;       // human-readable formula, e.g. "ASC + Moon - Sun"
  longitude: number;     // 0–360 result
  sign: string;          // zodiac sign name
  degreeInSign: number;  // 0–30 degree within the sign
  minuteInSign: number;  // 0–60 minute within the degree
}

/** Normalize a longitude to 0–360 */
function norm(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

/** Compute a single lot: (A + B - C) mod 360 */
function lot(a: number, b: number, c: number): number {
  return norm(a + b - c);
}

/** Convert longitude to sign name + degree + minute */
function longitudeToSignDeg(longitude: number): {
  sign: string;
  degreeInSign: number;
  minuteInSign: number;
} {
  const n = norm(longitude);
  const signIndex = Math.floor(n / 30);
  const degreeInSign = Math.floor(n % 30);
  const minuteInSign = Math.floor((n % 1) * 60);
  return {
    sign: ZODIAC_NAMES[signIndex],
    degreeInSign,
    minuteInSign,
  };
}

/**
 * Calculate the seven classical Arabic Parts / Lots.
 *
 * @param planets   - Array of PlanetData with longitudes
 * @param ascendant - Ascendant longitude (0–360)
 * @param isDiurnal - true if Sun is above the horizon (day chart)
 */
export function calculateArabicParts(
  planets: PlanetData[],
  ascendant: number,
  isDiurnal: boolean
): ArabicPart[] {
  // Extract planet longitudes by name (case-insensitive match)
  function getLon(name: string): number | null {
    const match = planets.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    return match?.longitude ?? null;
  }

  const sun = getLon("sun") ?? getLon("Sun") ?? 0;
  const moon = getLon("moon") ?? getLon("Moon") ?? 0;
  const mercury = getLon("mercury") ?? getLon("Mercury") ?? 0;
  const venus = getLon("venus") ?? getLon("Venus") ?? 0;
  const mars = getLon("mars") ?? getLon("Mars") ?? 0;
  const jupiter = getLon("jupiter") ?? getLon("Jupiter") ?? 0;
  const saturn = getLon("saturn") ?? getLon("Saturn") ?? 0;
  const asc = ascendant;

  const parts: ArabicPart[] = [];

  function addPart(
    name: string,
    formula: string,
    a: number,
    b: number,
    c: number
  ) {
    const longitude = lot(a, b, c);
    const { sign, degreeInSign, minuteInSign } = longitudeToSignDeg(longitude);
    parts.push({ name, formula, longitude, sign, degreeInSign, minuteInSign });
  }

  // ── Part of Fortune ──────────────────────────────────────────────────────────
  // Day: ASC + Moon - Sun  |  Night: ASC + Sun - Moon
  if (isDiurnal) {
    addPart("Part of Fortune", "ASC + Moon − Sun", asc, moon, sun);
  } else {
    addPart("Part of Fortune", "ASC + Sun − Moon (night)", asc, sun, moon);
  }

  // ── Part of Spirit ───────────────────────────────────────────────────────────
  // Day: ASC + Sun - Moon  |  Night: ASC + Moon - Sun  (opposite of Fortune)
  if (isDiurnal) {
    addPart("Part of Spirit", "ASC + Sun − Moon", asc, sun, moon);
  } else {
    addPart("Part of Spirit", "ASC + Moon − Sun (night)", asc, moon, sun);
  }

  // ── Part of Necessity ────────────────────────────────────────────────────────
  // Day/Night same: ASC + Mercury - Moon
  addPart("Part of Necessity", "ASC + Mercury − Moon", asc, mercury, moon);

  // ── Part of Courage ──────────────────────────────────────────────────────────
  // Day: ASC + Mars - Sun  |  Night: ASC + Sun - Mars
  if (isDiurnal) {
    addPart("Part of Courage", "ASC + Mars − Sun", asc, mars, sun);
  } else {
    addPart("Part of Courage", "ASC + Sun − Mars (night)", asc, sun, mars);
  }

  // ── Part of Victory ──────────────────────────────────────────────────────────
  // Day: ASC + Jupiter - Sun  |  Night: ASC + Sun - Jupiter
  if (isDiurnal) {
    addPart("Part of Victory", "ASC + Jupiter − Sun", asc, jupiter, sun);
  } else {
    addPart("Part of Victory", "ASC + Sun − Jupiter (night)", asc, sun, jupiter);
  }

  // ── Part of Nemesis ──────────────────────────────────────────────────────────
  // Day: ASC + Saturn - Sun  |  Night: ASC + Sun - Saturn
  if (isDiurnal) {
    addPart("Part of Nemesis", "ASC + Saturn − Sun", asc, saturn, sun);
  } else {
    addPart("Part of Nemesis", "ASC + Sun − Saturn (night)", asc, sun, saturn);
  }

  // ── Part of Eros ─────────────────────────────────────────────────────────────
  // Day: ASC + Venus - Sun  |  Night: ASC + Sun - Venus
  if (isDiurnal) {
    addPart("Part of Eros", "ASC + Venus − Sun", asc, venus, sun);
  } else {
    addPart("Part of Eros", "ASC + Sun − Venus (night)", asc, sun, venus);
  }

  return parts;
}
