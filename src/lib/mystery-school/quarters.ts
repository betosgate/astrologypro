/**
 * Mystery School — Seasonal Entry Quarter Logic
 *
 * Entry windows align with the four astronomical turning points:
 *   Spring  — March equinox   (~March 20)
 *   Summer  — Summer solstice (~June 21)
 *   Autumn  — Autumn equinox  (~September 22)
 *   Winter  — Winter solstice (~December 21)
 *
 * Dates are hardcoded per year for 2026-2030 to avoid a runtime ephemeris
 * dependency.  Update this table when extending the programme beyond 2030.
 */

export type QuarterName = "spring" | "summer" | "autumn" | "winter";

interface QuarterDate {
  quarter: QuarterName;
  year: number;
  /** UTC midnight on the actual equinox/solstice date */
  date: Date;
}

/**
 * Astronomical equinox/solstice dates (UTC) for 2026-2030.
 * Sources: USNO / HM Nautical Almanac Office approximate dates.
 */
const QUARTER_DATES: QuarterDate[] = [
  // 2026
  { quarter: "spring", year: 2026, date: new Date("2026-03-20T10:46:00Z") },
  { quarter: "summer", year: 2026, date: new Date("2026-06-21T02:24:00Z") },
  { quarter: "autumn", year: 2026, date: new Date("2026-09-22T20:05:00Z") },
  { quarter: "winter", year: 2026, date: new Date("2026-12-21T23:50:00Z") },
  // 2027
  { quarter: "spring", year: 2027, date: new Date("2027-03-20T16:24:00Z") },
  { quarter: "summer", year: 2027, date: new Date("2027-06-21T08:11:00Z") },
  { quarter: "autumn", year: 2027, date: new Date("2027-09-23T01:51:00Z") },
  { quarter: "winter", year: 2027, date: new Date("2027-12-22T05:42:00Z") },
  // 2028
  { quarter: "spring", year: 2028, date: new Date("2028-03-19T22:17:00Z") },
  { quarter: "summer", year: 2028, date: new Date("2028-06-20T14:01:00Z") },
  { quarter: "autumn", year: 2028, date: new Date("2028-09-22T07:44:00Z") },
  { quarter: "winter", year: 2028, date: new Date("2028-12-21T11:20:00Z") },
  // 2029
  { quarter: "spring", year: 2029, date: new Date("2029-03-20T04:01:00Z") },
  { quarter: "summer", year: 2029, date: new Date("2029-06-20T19:48:00Z") },
  { quarter: "autumn", year: 2029, date: new Date("2029-09-22T13:38:00Z") },
  { quarter: "winter", year: 2029, date: new Date("2029-12-21T17:14:00Z") },
  // 2030
  { quarter: "spring", year: 2030, date: new Date("2030-03-20T10:51:00Z") },
  { quarter: "summer", year: 2030, date: new Date("2030-06-21T01:31:00Z") },
  { quarter: "autumn", year: 2030, date: new Date("2030-09-22T19:26:00Z") },
  { quarter: "winter", year: 2030, date: new Date("2030-12-21T23:09:00Z") },
];

export interface UpcomingEntryDate {
  quarter: QuarterName;
  year: number;
  /** Human-readable label, e.g. "Spring Equinox — March 20, 2026" */
  label: string;
  /** ISO 8601 date string of the equinox/solstice */
  isoDate: string;
  /** JS Date of the equinox/solstice */
  date: Date;
  /** The first week starts 7 days after the turning point */
  firstWeekDate: Date;
  firstWeekLabel: string;
}

const QUARTER_DISPLAY: Record<QuarterName, { name: string; event: string }> = {
  spring: { name: "Spring",  event: "Spring Equinox"  },
  summer: { name: "Summer",  event: "Summer Solstice" },
  autumn: { name: "Autumn",  event: "Autumn Equinox"  },
  winter: { name: "Winter",  event: "Winter Solstice" },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Returns the next 4 upcoming seasonal entry dates from `fromDate` (default: now).
 * Always returns exactly 4 entries in chronological order.
 */
export function getUpcomingEntryDates(fromDate?: Date): UpcomingEntryDate[] {
  const now = fromDate ?? new Date();

  // Filter to dates strictly in the future (after now), sorted ascending
  const upcoming = QUARTER_DATES
    .filter((q) => q.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  return upcoming.map((q): UpcomingEntryDate => {
    const display = QUARTER_DISPLAY[q.quarter];
    const firstWeekDate = new Date(q.date.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      quarter: q.quarter,
      year: q.year,
      label: `${display.event} — ${formatDate(q.date)}`,
      isoDate: q.date.toISOString(),
      date: q.date,
      firstWeekDate,
      firstWeekLabel: `Week 1 begins ${formatDate(firstWeekDate)}`,
    };
  });
}

/**
 * Determines which quarter a given date falls in, based on the nearest
 * preceding equinox/solstice.
 *
 * Returns null if the date predates all known quarter dates (before 2026).
 */
export function getCurrentQuarter(
  date: Date
): { quarter: QuarterName; year: number } | null {
  // Find the most recent quarter date that is <= the input date
  const sorted = [...QUARTER_DATES].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  for (const q of sorted) {
    if (q.date <= date) {
      return { quarter: q.quarter, year: q.year };
    }
  }

  return null;
}

/** Display metadata for use in UI (icon name, colour class) */
export const QUARTER_UI_META: Record<
  QuarterName,
  { emoji: string; colorClass: string; bgClass: string }
> = {
  spring: {
    emoji: "🌱",
    colorClass: "text-green-600",
    bgClass: "bg-green-50 border-green-200",
  },
  summer: {
    emoji: "☀️",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-50 border-amber-200",
  },
  autumn: {
    emoji: "🍂",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50 border-orange-200",
  },
  winter: {
    emoji: "❄️",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-50 border-blue-200",
  },
};
