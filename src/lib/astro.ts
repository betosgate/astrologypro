/**
 * Ported from Angular astro.service.ts
 *
 * Zodiac ranges with decan breakdowns (3 per sign = 36 total).
 * Each decan maps to ~10 calendar days, a tarot card theme, and a date range label.
 */

export interface DecanInfo {
  sign: string;
  decan: string;  // "Deacon 1" | "Deacon 2" | "Deacon 3"
  range: string;  // e.g. "Mar 21-Mar 30"
  theme: string;  // e.g. "Initiation, drive, willpower — Two of Wands"
}

interface DecanRange {
  start: string;  // "MM-DD"
  end: string;    // "MM-DD"
  label: string;
  range: string;
  theme: string;
}

interface ZodiacSign {
  sign: string;
  decans: DecanRange[];
}

const ZODIAC_RANGES: ZodiacSign[] = [
  {
    sign: "Aries",
    decans: [
      { start: "03-21", end: "03-30", label: "Deacon 1", range: "Mar 21-Mar 30", theme: "Initiation, drive, willpower — Two of Wands" },
      { start: "03-31", end: "04-09", label: "Deacon 2", range: "Mar 31-Apr 9",  theme: "Leadership, ambition, bold actions — Three of Wands" },
      { start: "04-10", end: "04-19", label: "Deacon 3", range: "Apr 10-Apr 19", theme: "Conflict, challenge, asserting self — Four of Wands" },
    ],
  },
  {
    sign: "Taurus",
    decans: [
      { start: "04-20", end: "04-30", label: "Deacon 1", range: "Apr 20-Apr 30", theme: "Laying foundations, patience, material growth — Five of Pentacles" },
      { start: "05-01", end: "05-10", label: "Deacon 2", range: "May 1-May 10",  theme: "Applying stability, resource sharing, balance — Six of Pentacles" },
      { start: "05-11", end: "05-20", label: "Deacon 3", range: "May 11-May 20", theme: "Assessment, long-term growth, delayed reward — Seven of Pentacles" },
    ],
  },
  {
    sign: "Gemini",
    decans: [
      { start: "05-21", end: "05-31", label: "Deacon 1", range: "May 21-May 31", theme: "Curiosity, planning, restlessness — Eight of Swords" },
      { start: "06-01", end: "06-10", label: "Deacon 2", range: "Jun 1-Jun 10",  theme: "Inner conflict, duality, thought cycles — Nine of Swords" },
      { start: "06-11", end: "06-20", label: "Deacon 3", range: "Jun 11-Jun 20", theme: "Release, acceptance, transformation — Ten of Swords" },
    ],
  },
  {
    sign: "Cancer",
    decans: [
      { start: "06-21", end: "06-30", label: "Deacon 1", range: "Jun 21-Jun 30", theme: "Emotional initiation, home roots — Two of Cups" },
      { start: "07-01", end: "07-10", label: "Deacon 2", range: "Jul 1-Jul 10",  theme: "Celebration, nurturing, connection — Three of Cups" },
      { start: "07-11", end: "07-22", label: "Deacon 3", range: "Jul 11-Jul 22", theme: "Sentiment, reflection, nostalgia — Four of Cups" },
    ],
  },
  {
    sign: "Leo",
    decans: [
      { start: "07-23", end: "08-01", label: "Deacon 1", range: "Jul 23-Aug 1",  theme: "Vision, recognition, achievement — Five of Wands" },
      { start: "08-02", end: "08-11", label: "Deacon 2", range: "Aug 2-Aug 11",  theme: "Victory, charisma, spotlight — Six of Wands" },
      { start: "08-12", end: "08-22", label: "Deacon 3", range: "Aug 12-Aug 22", theme: "Challenge, perseverance, glory — Seven of Wands" },
    ],
  },
  {
    sign: "Virgo",
    decans: [
      { start: "08-23", end: "09-01", label: "Deacon 1", range: "Aug 23-Sep 1",  theme: "Precision, diligence, refinement — Eight of Pentacles" },
      { start: "09-02", end: "09-11", label: "Deacon 2", range: "Sep 2-Sep 11",  theme: "Planning, wealth, support systems — Nine of Pentacles" },
      { start: "09-12", end: "09-22", label: "Deacon 3", range: "Sep 12-Sep 22", theme: "Completion, legacy, generosity — Ten of Pentacles" },
    ],
  },
  {
    sign: "Libra",
    decans: [
      { start: "09-23", end: "10-02", label: "Deacon 1", range: "Sep 23-Oct 2",  theme: "Decisions, clarity, duality — Two of Swords" },
      { start: "10-03", end: "10-12", label: "Deacon 2", range: "Oct 3-Oct 12",  theme: "Balance, strategy, honesty — Three of Swords" },
      { start: "10-13", end: "10-22", label: "Deacon 3", range: "Oct 13-Oct 22", theme: "Renewal, letting go, peace after chaos — Four of Swords" },
    ],
  },
  {
    sign: "Scorpio",
    decans: [
      { start: "10-23", end: "11-01", label: "Deacon 1", range: "Oct 23-Nov 1",  theme: "Emotional depth, choice, longing — Five of Cups" },
      { start: "11-02", end: "11-11", label: "Deacon 2", range: "Nov 2-Nov 11",  theme: "Reflection, inner journey, mystery — Six of Cups" },
      { start: "11-12", end: "11-21", label: "Deacon 3", range: "Nov 12-Nov 21", theme: "Shadows, dreams, transcendence — Seven of Cups" },
    ],
  },
  {
    sign: "Sagittarius",
    decans: [
      { start: "11-22", end: "12-01", label: "Deacon 1", range: "Nov 22-Dec 1",  theme: "Optimism, expansion, fire to explore — Eight of Wands" },
      { start: "12-02", end: "12-11", label: "Deacon 2", range: "Dec 2-Dec 11",  theme: "Intensity, strength, courage — Nine of Wands" },
      { start: "12-12", end: "12-21", label: "Deacon 3", range: "Dec 12-Dec 21", theme: "Triumph, purpose, completion — Ten of Wands" },
    ],
  },
  {
    sign: "Capricorn",
    decans: [
      { start: "12-22", end: "12-31", label: "Deacon 1", range: "Dec 22-Dec 31", theme: "Responsibility, foundation, dedication — Two of Pentacles" },
      { start: "01-01", end: "01-10", label: "Deacon 2", range: "Jan 1-Jan 10",  theme: "Authority, goals, long-term plans — Three of Pentacles" },
      { start: "01-11", end: "01-19", label: "Deacon 3", range: "Jan 11-Jan 19", theme: "Mastery, ambition, control — Four of Pentacles" },
    ],
  },
  {
    sign: "Aquarius",
    decans: [
      { start: "01-20", end: "01-29", label: "Deacon 1", range: "Jan 20-Jan 29", theme: "Clarity, innovation, rebellion — Five of Swords" },
      { start: "01-30", end: "02-08", label: "Deacon 2", range: "Jan 30-Feb 8",  theme: "Idealism, reform, truth-speaking — Six of Swords" },
      { start: "02-09", end: "02-18", label: "Deacon 3", range: "Feb 9-Feb 18",  theme: "Mental liberation, disruption, paradigm shift — Seven of Swords" },
    ],
  },
  {
    sign: "Pisces",
    decans: [
      { start: "02-19", end: "02-28", label: "Deacon 1", range: "Feb 19-Feb 28", theme: "Dreaminess, innocence, imagination — Eight of Cups" },
      { start: "03-01", end: "03-10", label: "Deacon 2", range: "Mar 1-Mar 10",  theme: "Compassion, sensitivity, service — Nine of Cups" },
      { start: "03-11", end: "03-20", label: "Deacon 3", range: "Mar 11-Mar 20", theme: "Surrender, oneness, transcendence — Ten of Cups" },
    ],
  },
];

/**
 * Returns the zodiac sign + decan for a given date (defaults to today).
 * Returns null if no range matches (shouldn't happen with well-formed data).
 */
export function getCurrentAstroPosition(inputDate?: Date): DecanInfo | null {
  const date = inputDate ?? new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const current = `${month}-${day}`;

  for (const signData of ZODIAC_RANGES) {
    for (const decan of signData.decans) {
      if (current >= decan.start && current <= decan.end) {
        return {
          sign: signData.sign,
          decan: decan.label,
          range: decan.range,
          theme: decan.theme,
        };
      }
    }
  }

  return null;
}

/** All zodiac ranges, useful for static rendering (decan calendar etc.) */
export { ZODIAC_RANGES };

/** Planet-to-zodiac ruler map */
export const PLANET_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

/** Planet-to-element map */
export const PLANET_ELEMENTS: Record<string, string> = {
  Jupiter: "Fire",
  Mars: "Fire",
  Sun: "Spirit",
  Moon: "Water",
  Mercury: "Air",
  Venus: "Earth",
  Saturn: "Earth",
  Uranus: "Air",
  Neptune: "Water",
  Pluto: "Spirit",
};

/** Zodiac-to-element map */
export const ZODIAC_ELEMENTS: Record<string, string> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};
