/**
 * Monthly transit calculation.
 * Computes current planet positions and their aspects to a person's natal planets.
 */

import * as Astronomy from "astronomy-engine";
import type { NatalChartData, PlanetPosition } from "./natal-chart";

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
}

export interface TransitPlanet {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  retrograde: boolean;
  aspects: TransitAspect[];
}

export interface MonthlyTransitData {
  month: string;        // YYYY-MM
  planets: TransitPlanet[];
  highlights: string[]; // Human-readable key transit descriptions
  generatedAt: string;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANET_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

const ASPECT_DEFS = [
  { type: "Conjunction", angle: 0,   orb: 8, harmonious: true },
  { type: "Opposition",  angle: 180, orb: 8, harmonious: false },
  { type: "Trine",       angle: 120, orb: 8, harmonious: true },
  { type: "Square",      angle: 90,  orb: 7, harmonious: false },
  { type: "Sextile",     angle: 60,  orb: 6, harmonious: true },
];

function longitudeToSign(lon: number): { sign: string; degree: number } {
  const n = ((lon % 360) + 360) % 360;
  return { sign: ZODIAC_SIGNS[Math.floor(n / 30)], degree: n % 30 };
}

function angularDiff(a: number, b: number): number {
  const diff = Math.abs(((a - b + 360) % 360));
  return diff > 180 ? 360 - diff : diff;
}

export function calculateMonthlyTransits(
  natal: NatalChartData,
  year: number,
  month: number  // 1-12
): MonthlyTransitData {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  // Use mid-month for transit snapshot
  const refDate = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  const astroTime = Astronomy.MakeTime(refDate);

  const transitPlanets: TransitPlanet[] = PLANET_BODIES.map((planetName) => {
    const lon = Astronomy.EclipticLongitude(
      Astronomy.Body[planetName] as Astronomy.Body,
      astroTime
    );
    const tomorrow = Astronomy.MakeTime(new Date(refDate.getTime() + 86400000));
    const lonTomorrow = Astronomy.EclipticLongitude(
      Astronomy.Body[planetName] as Astronomy.Body,
      tomorrow
    );
    const retrograde = lonTomorrow - lon < -0.5 || lonTomorrow - lon > 179;
    const { sign, degree } = longitudeToSign(lon);
    const longitude = ((lon % 360) + 360) % 360;

    // Find aspects to natal planets
    const aspects: TransitAspect[] = [];
    for (const natalPlanet of natal.planets) {
      const diff = angularDiff(longitude, natalPlanet.longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            transitPlanet: planetName,
            natalPlanet: natalPlanet.name,
            aspectType: def.type,
            orb: Math.round(orb * 10) / 10,
            isHarmonious: def.harmonious,
          });
          break;
        }
      }
    }

    return { name: planetName, sign, degree, longitude, retrograde, aspects };
  });

  // Build highlights — notable transits involving personal planets
  const highlights: string[] = [];
  const personalPlanets = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);
  const personalNatal = new Set(["Sun", "Moon", "Venus", "Mars"]);

  for (const tp of transitPlanets) {
    if (!personalPlanets.has(tp.name)) continue;
    for (const aspect of tp.aspects) {
      if (!personalNatal.has(aspect.natalPlanet)) continue;
      const retroTag = tp.retrograde ? " (retrograde)" : "";
      highlights.push(
        `${tp.name}${retroTag} in ${tp.sign} ${aspect.aspectType.toLowerCase()}s your natal ${aspect.natalPlanet} — ${aspect.isHarmonious ? "supportive energy" : "growth opportunity"}`
      );
    }
  }

  return {
    month: monthStr,
    planets: transitPlanets,
    highlights: highlights.slice(0, 5), // top 5
    generatedAt: new Date().toISOString(),
  };
}
