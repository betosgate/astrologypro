/**
 * ephemeris.ts
 * Calculates mundane astrology events for a given date using astronomy-engine.
 * Detects: sign ingresses, retrograde stations, direct stations, exact aspects.
 */

import * as Astronomy from 'astronomy-engine';

export const SIGNS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
] as const;
export type Sign = typeof SIGNS[number];

export const PLANETS = [
  'sun','moon','mercury','venus','mars',
  'jupiter','saturn','uranus','neptune','pluto'
] as const;
export type Planet = typeof PLANETS[number];

export const ASPECTS = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
} as const;
export type AspectName = keyof typeof ASPECTS;

// Map our planet names to astronomy-engine Body enum
const BODY_MAP: Record<Planet, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

/** Get ecliptic longitude for a planet on a date (0–360°) */
export function getEclipticLongitude(planet: Planet, date: Date): number {
  if (planet === 'sun') {
    // EclipticLongitude() is heliocentric — use SunPosition() for geocentric Sun longitude
    return Astronomy.SunPosition(date).elon;
  }
  const body = BODY_MAP[planet];
  return Astronomy.EclipticLongitude(body, date);
}

/** Get zodiac sign index (0=Aries … 11=Pisces) from ecliptic longitude */
export function longitudeToSignIndex(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30);
}

/** Get zodiac sign name from ecliptic longitude */
export function getSign(planet: Planet, date: Date): Sign {
  const lon = getEclipticLongitude(planet, date);
  return SIGNS[longitudeToSignIndex(lon)];
}

/** Angular difference between two longitudes, normalized to -180…+180 */
function angleDiff(a: number, b: number): number {
  let d = ((a - b) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/** Check if planet is retrograde on given date (longitude decreasing) */
export function isRetrograde(planet: Planet, date: Date): boolean {
  if (planet === 'sun' || planet === 'moon') return false; // never retrograde
  const yesterday = new Date(date.getTime() - 86_400_000);
  const today = getEclipticLongitude(planet, date);
  const prev = getEclipticLongitude(planet, yesterday);
  const diff = angleDiff(today, prev);
  return diff < 0;
}

/** Check if planet stations retrograde today (was direct yesterday, retrograde today) */
export function stationsRetrograde(planet: Planet, date: Date): boolean {
  if (planet === 'sun' || planet === 'moon') return false;
  const yesterday = new Date(date.getTime() - 86_400_000);
  return isRetrograde(planet, date) && !isRetrograde(planet, yesterday);
}

/** Check if planet stations direct today (was retrograde yesterday, direct today) */
export function stationsDirect(planet: Planet, date: Date): boolean {
  if (planet === 'sun' || planet === 'moon') return false;
  const yesterday = new Date(date.getTime() - 86_400_000);
  return !isRetrograde(planet, date) && isRetrograde(planet, yesterday);
}

/** Check if planet changed signs today */
export function hasIngressed(planet: Planet, date: Date): Sign | null {
  const yesterday = new Date(date.getTime() - 86_400_000);
  const todaySign = getSign(planet, date);
  const yesterdaySign = getSign(planet, yesterday);
  return todaySign !== yesterdaySign ? todaySign : null;
}

// ---------------------------------------------------------------------------
// Cycle Analysis
// ---------------------------------------------------------------------------

// Known synodic periods in days
const SYNODIC_PERIODS: Record<string, number> = {
  'jupiter-saturn': 7253,
  'saturn-pluto': 12054,
  'jupiter-pluto': 4633,
  'uranus-pluto': 44603,
  'saturn-uranus': 16438,
};

function cyclePairKey(planet1: string, planet2: string): string {
  return [planet1, planet2].sort().join('-');
}

/**
 * Get current cycle phase angle (0–360°) between two planets.
 * Phase: 0=conjunction, 90=waxing square, 180=opposition, 270=waning square.
 * Measured as (longitude_planet2 - longitude_planet1 + 360) % 360.
 */
export function getCyclePhase(planet1: string, planet2: string, atDate: Date): number {
  const lon1 = getEclipticLongitude(planet1 as Planet, atDate);
  const lon2 = getEclipticLongitude(planet2 as Planet, atDate);
  return ((lon2 - lon1) % 360 + 360) % 360;
}

/**
 * Returns the phase name for a given phase angle (0–360°).
 */
export function getPhaseName(
  phaseAngle: number
): 'Conjunction' | 'Crescent' | 'First Quarter' | 'Gibbous' | 'Full' | 'Disseminating' | 'Last Quarter' | 'Balsamic' {
  const a = ((phaseAngle % 360) + 360) % 360;
  if (a < 45) return 'Conjunction';
  if (a < 90) return 'Crescent';
  if (a < 135) return 'First Quarter';
  if (a < 180) return 'Gibbous';
  if (a < 225) return 'Full';
  if (a < 270) return 'Disseminating';
  if (a < 315) return 'Last Quarter';
  return 'Balsamic';
}

/**
 * Find the most recent conjunction of two planets before a reference date.
 *
 * Algorithm:
 * 1. Step backwards day by day until the phase angle crosses through 0° (i.e. wraps
 *    from a small value to a value close to 360°, or the signed diff changes sign).
 * 2. Binary-search within that 1-day window to the nearest hour.
 */
export function findLastConjunction(planet1: string, planet2: string, beforeDate: Date): Date {
  const MS_PER_DAY = 86_400_000;
  const MS_PER_HOUR = 3_600_000;

  // Max search window: use the known synodic period + buffer
  const key = cyclePairKey(planet1, planet2);
  const periodDays = SYNODIC_PERIODS[key] ?? 50_000;

  let cursor = new Date(beforeDate.getTime());
  let prevPhase = getCyclePhase(planet1, planet2, cursor);

  for (let d = 0; d < periodDays + 30; d++) {
    const prev = new Date(cursor.getTime() - MS_PER_DAY);
    const phase = getCyclePhase(planet1, planet2, prev);

    // Conjunction crossing: phase went from near 360 to near 0 (decreasing toward 0
    // while stepping backwards = conjunction was crossed). We detect it when prevPhase
    // is small (< 30) and phase jumps to large (> 330), meaning yesterday was just
    // before/after the crossing.
    if (prevPhase < 30 && phase > 330) {
      // Binary search in the window [prev, cursor] for the hour-level crossing
      let lo = prev.getTime();
      let hi = cursor.getTime();
      for (let iter = 0; iter < 24; iter++) {
        const mid = Math.round((lo + hi) / 2);
        const midPhase = getCyclePhase(planet1, planet2, new Date(mid));
        if (midPhase > 180) {
          lo = mid;
        } else {
          hi = mid;
        }
        if (hi - lo <= MS_PER_HOUR) break;
      }
      return new Date(Math.round((lo + hi) / 2));
    }

    cursor = prev;
    prevPhase = phase;
  }

  // Fallback: return an approximate date using synodic period estimate
  const currentPhase = getCyclePhase(planet1, planet2, beforeDate);
  const fractionIntoCurrentCycle = currentPhase / 360;
  const approxMs = fractionIntoCurrentCycle * periodDays * MS_PER_DAY;
  return new Date(beforeDate.getTime() - approxMs);
}

export interface AspectEvent {
  planet1: Planet;
  planet2: Planet;
  aspect: AspectName;
  orb: number; // degrees from exact
}

const ASPECT_ORB = 1.5; // degrees — tight orb for "exact" aspects

/** Find all exact aspects (within orb) for a given date */
export function findExactAspects(date: Date): AspectEvent[] {
  const results: AspectEvent[] = [];
  const longitudes: Partial<Record<Planet, number>> = {};

  for (const p of PLANETS) {
    longitudes[p] = getEclipticLongitude(p, date);
  }

  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const p1 = PLANETS[i];
      const p2 = PLANETS[j];
      const lon1 = longitudes[p1]!;
      const lon2 = longitudes[p2]!;
      const separation = Math.abs(angleDiff(lon1, lon2));

      for (const [aspectName, angle] of Object.entries(ASPECTS) as [AspectName, number][]) {
        const orb = Math.abs(separation - angle);
        if (orb <= ASPECT_ORB) {
          // Ensure it's closest today (approaching or separating by less than yesterday)
          const yesterday = new Date(date.getTime() - 86_400_000);
          const yLon1 = getEclipticLongitude(p1, yesterday);
          const yLon2 = getEclipticLongitude(p2, yesterday);
          const ySep = Math.abs(angleDiff(yLon1, yLon2));
          const yOrb = Math.abs(ySep - angle);
          // Only report if today's orb is tighter (approaching) or if yesterday was outside orb
          if (orb <= yOrb || yOrb > ASPECT_ORB) {
            results.push({ planet1: p1, planet2: p2, aspect: aspectName, orb });
          }
        }
      }
    }
  }

  return results;
}
