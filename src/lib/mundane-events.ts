/**
 * mundane-events.ts
 * Maps planetary events to image filenames and creates event records.
 */

import {
  PLANETS, Planet, Sign, AspectName,
  getSign, isRetrograde, stationsRetrograde, stationsDirect,
  hasIngressed, findExactAspects,
} from './ephemeris';

export interface MundaneEvent {
  event_key: string;         // unique dedup key
  event_type: 'ingress' | 'retrograde' | 'direct' | 'aspect';
  event_label: string;       // human-readable
  image_filename: string;    // filename in MundaneAstrology folder
  priority: number;          // 1=highest (retrograde station), 2=ingress, 3=aspect
}

const SIGN_LABELS: Record<Sign, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

const PLANET_LABELS: Record<Planet, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

const ASPECT_LABELS: Record<AspectName, string> = {
  conjunction: 'conjunct', sextile: 'sextile', square: 'square', trine: 'trine', opposition: 'opposite',
};

/** Build image filename for a planet-sign ingress */
function ingressImageFile(planet: Planet, sign: Sign): string {
  return `${planet}-in-${sign}.jpg`;
}

/** Build image filename for a retrograde/direct station */
function retrogradeImageFile(planet: Planet): string {
  return `${planet}-retrograde.jpg`;
}

/** Build image filename for a planet aspect */
function aspectImageFile(p1: Planet, aspect: AspectName, p2: Planet): string {
  // Try canonical ordering (alphabetical) to match filenames
  const [a, b] = [p1, p2].sort();
  return `${a}-${aspect === 'conjunction' ? 'conjunct' : aspect === 'opposition' ? 'opposite' : aspect}-${b}.jpg`;
}

/** Get all mundane events for a given date, sorted by priority */
export function getMundaneEventsForDate(date: Date): MundaneEvent[] {
  const events: MundaneEvent[] = [];
  const today = date;

  // 1. Retrograde / Direct stations (highest priority)
  for (const planet of PLANETS) {
    if (planet === 'sun' || planet === 'moon') continue;

    if (stationsRetrograde(planet, today)) {
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      events.push({
        event_key: `${planet}-retrograde-${month}`,
        event_type: 'retrograde',
        event_label: `${PLANET_LABELS[planet]} stations Retrograde`,
        image_filename: retrogradeImageFile(planet),
        priority: 1,
      });
    } else if (stationsDirect(planet, today)) {
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      events.push({
        event_key: `${planet}-direct-${month}`,
        event_type: 'direct',
        event_label: `${PLANET_LABELS[planet]} stations Direct`,
        image_filename: retrogradeImageFile(planet), // reuse retrograde image
        priority: 1,
      });
    }
  }

  // 2. Sign ingresses (high priority)
  for (const planet of PLANETS) {
    const newSign = hasIngressed(planet, today);
    if (newSign) {
      events.push({
        event_key: `${planet}-${newSign}`,  // dedup: one per planet-sign combo
        event_type: 'ingress',
        event_label: `${PLANET_LABELS[planet]} enters ${SIGN_LABELS[newSign]}`,
        image_filename: ingressImageFile(planet, newSign),
        priority: 2,
      });
    }
  }

  // 3. Exact aspects (lower priority — happens frequently)
  const aspects = findExactAspects(today);
  for (const asp of aspects) {
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    events.push({
      event_key: `${asp.planet1}-${asp.aspect}-${asp.planet2}-${month}`,
      event_type: 'aspect',
      event_label: `${PLANET_LABELS[asp.planet1]} ${ASPECT_LABELS[asp.aspect]} ${PLANET_LABELS[asp.planet2]}`,
      image_filename: aspectImageFile(asp.planet1, asp.aspect, asp.planet2),
      priority: 3,
    });
  }

  // Sort by priority, then by planet importance (slow planets = more important)
  const PLANET_WEIGHT: Record<Planet, number> = {
    pluto: 10, neptune: 9, uranus: 8, saturn: 7, jupiter: 6,
    mars: 5, venus: 4, mercury: 3, sun: 2, moon: 1,
  };

  return events.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // For aspects, prefer outer planet aspects
    if (a.event_type === 'aspect' && b.event_type === 'aspect') {
      const aWeight = PLANET_WEIGHT[a.event_key.split('-')[0] as Planet] || 0;
      const bWeight = PLANET_WEIGHT[b.event_key.split('-')[0] as Planet] || 0;
      return bWeight - aWeight;
    }
    return 0;
  });
}

/** Get top N events for the day, filtering out events already sent */
export function selectDailyEvents(
  events: MundaneEvent[],
  alreadySentKeys: Set<string>,
  count: number = 2
): MundaneEvent[] {
  // Filter out already sent events (ingresses + retrogrades only — aspects repeat monthly)
  const filtered = events.filter(e => {
    if (e.event_type === 'ingress' || e.event_type === 'retrograde' || e.event_type === 'direct') {
      return !alreadySentKeys.has(e.event_key);
    }
    return true; // aspects always eligible
  });

  // Return top N
  return filtered.slice(0, count);
}

// Re-export ephemeris utilities needed by consumers of this module
export { isRetrograde, getSign } from './ephemeris';
