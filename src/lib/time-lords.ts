/**
 * Time Lord Techniques for Mundane Astrology
 *
 * Two primary techniques:
 * 1. Annual Profections — whole-sign house activation cycling every year from birth
 * 2. Firdaria — Chaldean-order planetary period system over a 75-year cycle (diurnal/solar charts)
 */

// ─── Zodiac signs in Aries-first order ──────────────────────────────────────

const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

// Traditional sign rulers (Chaldean / traditional, no outer planets)
const SIGN_RULER: Record<string, string> = {
  aries: "Mars",
  taurus: "Venus",
  gemini: "Mercury",
  cancer: "Moon",
  leo: "Sun",
  virgo: "Mercury",
  libra: "Venus",
  scorpio: "Mars",
  sagittarius: "Jupiter",
  capricorn: "Saturn",
  aquarius: "Saturn",
  pisces: "Jupiter",
};

// ─── Annual Profections ──────────────────────────────────────────────────────

export interface AnnualProfection {
  /** 1-based house number that is activated in the current profection year */
  activatedHouse: number;
  /** Sign on that house (using whole-sign from Aries-rising assumption for mundane entity charts) */
  activatedSign: string;
  /** Traditional planet ruling the activated sign */
  lordOfYear: string;
  /** Complete years elapsed from founding date to atDate */
  yearsElapsed: number;
}

/**
 * Calculates the Annual Profection for a mundane entity at a given date.
 *
 * Uses an Aries-rising whole-sign system: House 1 = Aries, House 2 = Taurus, etc.
 * This is the conventional approach for national entity charts when the exact
 * Ascendant is unknown.
 *
 * The activated house cycles 1→12 then repeats: year 0 = H1, year 1 = H2, …
 */
export function getAnnualProfection(
  foundingDate: Date,
  atDate: Date
): AnnualProfection {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsElapsed = Math.floor(
    (atDate.getTime() - foundingDate.getTime()) / msPerYear
  );
  const houseIndex = ((yearsElapsed % 12) + 12) % 12; // 0-based
  const activatedHouse = houseIndex + 1; // 1-12
  const activatedSign = ZODIAC_SIGNS[houseIndex];
  const lordOfYear = SIGN_RULER[activatedSign] ?? "Unknown";

  return { activatedHouse, activatedSign, lordOfYear, yearsElapsed };
}

// ─── Firdaria ────────────────────────────────────────────────────────────────

/**
 * Diurnal (day/solar) chart Firdaria sequence.
 * Each entry: [planet, years in that period].
 * Total = 75 years, then repeats.
 *
 * Chaldean order starting from Sun for diurnal charts:
 * Sun 10 → Venus 8 → Mercury 13 → Moon 9 → Saturn 11 → Jupiter 12 → Mars 7 → N.Node 3 → S.Node 2 = 75
 */
const FIRDARIA_SEQUENCE: [string, number][] = [
  ["Sun", 10],
  ["Venus", 8],
  ["Mercury", 13],
  ["Moon", 9],
  ["Saturn", 11],
  ["Jupiter", 12],
  ["Mars", 7],
  ["N.Node", 3],
  ["S.Node", 2],
];

const FIRDARIA_TOTAL_YEARS = FIRDARIA_SEQUENCE.reduce((acc, [, y]) => acc + y, 0); // 75

/**
 * Sub-period sequence for each major period.
 * Sub-rulers cycle through the same Chaldean order starting from the major ruler.
 */
function getSubPeriodOrder(majorRuler: string): string[] {
  const allPlanets = FIRDARIA_SEQUENCE.map(([p]) => p);
  const startIdx = allPlanets.indexOf(majorRuler);
  if (startIdx === -1) return allPlanets;
  return [
    ...allPlanets.slice(startIdx),
    ...allPlanets.slice(0, startIdx),
  ];
}

export interface FirdariaRuler {
  planet: string;
  subPlanet: string;
  periodStart: Date;
  periodEnd: Date;
  subPeriodStart: Date;
  subPeriodEnd: Date;
}

/**
 * Returns all Firdaria periods for a given 75-year cycle starting at foundingDate.
 * Expands sub-periods within each major period.
 */
function buildFirdariaExpanded(cycleStart: Date): FirdariaRuler[] {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const result: FirdariaRuler[] = [];
  let cursor = cycleStart.getTime();

  for (const [planet, years] of FIRDARIA_SEQUENCE) {
    const majorStart = cursor;
    const majorEnd = cursor + years * MS_PER_YEAR;
    const subOrder = getSubPeriodOrder(planet);
    const numSubs = subOrder.length; // always 9 planets
    const subDuration = (years * MS_PER_YEAR) / numSubs;
    let subCursor = majorStart;

    for (const subPlanet of subOrder) {
      const subStart = subCursor;
      const subEnd = subCursor + subDuration;
      result.push({
        planet,
        subPlanet,
        periodStart: new Date(majorStart),
        periodEnd: new Date(majorEnd),
        subPeriodStart: new Date(subStart),
        subPeriodEnd: new Date(subEnd),
      });
      subCursor = subEnd;
    }
    cursor = majorEnd;
  }

  return result;
}

/**
 * Returns the currently active Firdaria ruler (major + sub) for the given date.
 *
 * The technique loops: at year 75 the cycle repeats from Sun again.
 */
export function getCurrentFirdaria(foundingDate: Date, atDate: Date): FirdariaRuler {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const totalMs = FIRDARIA_TOTAL_YEARS * MS_PER_YEAR;

  // Determine which 75-year cycle we are in and the cycle start date
  const elapsed = atDate.getTime() - foundingDate.getTime();
  const cycleIndex = Math.floor(elapsed / totalMs);
  const cycleStart = new Date(foundingDate.getTime() + cycleIndex * totalMs);

  const expanded = buildFirdariaExpanded(cycleStart);

  // Find the sub-period that contains atDate
  const atMs = atDate.getTime();
  const found = expanded.find(
    (f) => atMs >= f.subPeriodStart.getTime() && atMs < f.subPeriodEnd.getTime()
  );
  return found ?? expanded[0];
}

/**
 * Returns an array of upcoming Firdaria MAJOR period transitions (not sub-periods)
 * from atDate, looking yearsAhead forward.
 *
 * Each entry represents the next major ruler change. Returns one entry per major
 * period encountered in the window.
 */
export function getFirdariaTimeline(
  foundingDate: Date,
  atDate: Date,
  yearsAhead: number
): FirdariaRuler[] {
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const totalMs = FIRDARIA_TOTAL_YEARS * MS_PER_YEAR;
  const windowEnd = atDate.getTime() + yearsAhead * MS_PER_YEAR;
  const atMs = atDate.getTime();

  // Build two cycles worth to cover transitions
  const elapsed = atMs - foundingDate.getTime();
  const cycleIndex = Math.floor(elapsed / totalMs);

  const result: FirdariaRuler[] = [];
  const seenPeriodStarts = new Set<number>();

  for (let ci = cycleIndex; ci <= cycleIndex + 1; ci++) {
    const cycleStart = new Date(foundingDate.getTime() + ci * totalMs);
    const expanded = buildFirdariaExpanded(cycleStart);

    for (const entry of expanded) {
      const ps = entry.periodStart.getTime();
      // Include major periods that start in [now, windowEnd] and haven't been seen
      if (ps >= atMs && ps <= windowEnd && !seenPeriodStarts.has(ps)) {
        // Only emit the first sub-period of each major period (the period opener)
        seenPeriodStarts.add(ps);
        result.push(entry);
      }
    }
  }

  // Sort by period start
  result.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  return result;
}
