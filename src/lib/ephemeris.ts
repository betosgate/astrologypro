/**
 * ephemeris.ts
 * Calculates mundane astrology events for a given date using astronomy-engine.
 * Detects: sign ingresses, retrograde stations, direct stations, exact aspects.
 */

import Astronomy from 'astronomy-engine';

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
