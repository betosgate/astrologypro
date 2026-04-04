/**
 * Synastry (relationship chart) calculation.
 * Computes aspects between two people's natal planets.
 */

import type { NatalChartData, PlanetPosition } from "./natal-chart";

export type AspectType =
  | "Conjunction"
  | "Opposition"
  | "Trine"
  | "Square"
  | "Sextile"
  | "Quincunx";

export interface Aspect {
  planetA: string;
  planetB: string;
  aspectType: AspectType;
  orb: number;         // degrees of separation from exact
  isHarmonious: boolean;
}

export interface SynastryData {
  personAName: string;
  personBName: string;
  aspects: Aspect[];
  score: number;       // 0–100 compatibility score
  summary: string;
  generatedAt: string;
}

const ASPECT_DEFS: { type: AspectType; angle: number; orb: number; harmonious: boolean }[] = [
  { type: "Conjunction", angle: 0,   orb: 8, harmonious: true },
  { type: "Opposition",  angle: 180, orb: 8, harmonious: false },
  { type: "Trine",       angle: 120, orb: 8, harmonious: true },
  { type: "Square",      angle: 90,  orb: 7, harmonious: false },
  { type: "Sextile",     angle: 60,  orb: 6, harmonious: true },
  { type: "Quincunx",    angle: 150, orb: 4, harmonious: false },
];

// Weight planets by importance in synastry
const PLANET_WEIGHTS: Record<string, number> = {
  Sun: 3, Moon: 3, Venus: 3, Mars: 2,
  Mercury: 1, Jupiter: 1, Saturn: 2,
  Uranus: 0.5, Neptune: 0.5, Pluto: 0.5,
};

function angularDiff(a: number, b: number): number {
  const diff = Math.abs(((a - b + 360) % 360));
  return diff > 180 ? 360 - diff : diff;
}

export function calculateSynastry(
  chartA: NatalChartData,
  chartB: NatalChartData,
  personAName: string,
  personBName: string
): SynastryData {
  const aspects: Aspect[] = [];

  for (const pA of chartA.planets) {
    for (const pB of chartB.planets) {
      const diff = angularDiff(pA.longitude, pB.longitude);

      for (const aspectDef of ASPECT_DEFS) {
        const orb = Math.abs(diff - aspectDef.angle);
        if (orb <= aspectDef.orb) {
          aspects.push({
            planetA: pA.name,
            planetB: pB.name,
            aspectType: aspectDef.type,
            orb: Math.round(orb * 10) / 10,
            isHarmonious: aspectDef.harmonious,
          });
          break; // one aspect type per planet pair
        }
      }
    }
  }

  // Score calculation
  let harmoniousWeight = 0;
  let challengingWeight = 0;
  let totalWeight = 0;

  for (const aspect of aspects) {
    const wA = PLANET_WEIGHTS[aspect.planetA] ?? 0.5;
    const wB = PLANET_WEIGHTS[aspect.planetB] ?? 0.5;
    const w = wA * wB;
    totalWeight += w;
    if (aspect.isHarmonious) {
      harmoniousWeight += w;
    } else {
      challengingWeight += w;
    }
  }

  const score =
    totalWeight > 0
      ? Math.round((harmoniousWeight / totalWeight) * 100)
      : 50;

  // Summary
  const harmCount = aspects.filter((a) => a.isHarmonious).length;
  const challengeCount = aspects.filter((a) => !a.isHarmonious).length;

  let summary: string;
  if (score >= 70) {
    summary = `${personAName} and ${personBName} share strong natural harmony — ${harmCount} supportive aspects create an easy, flowing connection.`;
  } else if (score >= 50) {
    summary = `A balanced dynamic: ${harmCount} harmonious aspects bring support while ${challengeCount} challenging aspects add growth and depth.`;
  } else {
    summary = `${challengeCount} challenging aspects point to areas of growth and tension that can strengthen the relationship through awareness.`;
  }

  return {
    personAName,
    personBName,
    aspects,
    score,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
