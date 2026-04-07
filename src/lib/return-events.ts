/**
 * return-events.ts — Pure date-math utilities for computing planetary return dates.
 *
 * Does NOT use an astronomical ephemeris — uses simple orbital period arithmetic
 * sufficient for email reminder windows (accuracy within a few days is acceptable).
 *
 * Exported functions:
 *   computeSaturnReturns(birthDate)  — up to 3 occurrences within ±5 yr window
 *   computeJupiterReturns(birthDate) — up to 7 occurrences within ±1yr/+2yr window
 *   computeSolarReturn(birthDate)    — next upcoming birthday
 *   getEventDisplayName(type)
 *   getEventDescription(type)
 */

export type ReturnEventType = "saturn_return" | "jupiter_return" | "solar_return";

export interface ComputedReturnEvent {
  eventType: ReturnEventType;
  eventDate: Date;
  occurrenceNumber: number;
  /** Positive = future, negative = past */
  daysUntil: number;
}

// Orbital periods in tropical years
const SATURN_PERIOD_YEARS = 29.5;
const JUPITER_PERIOD_YEARS = 11.862;

/**
 * Add a fractional number of years to a date using day-level precision.
 * Uses 365.25 days/year to account for leap years.
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const totalDays = Math.round(years * 365.25);
  result.setDate(result.getDate() + totalDays);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns upcoming (and recently past) Saturn return events for a given birth date.
 * Covers up to the 3rd return (~88.5 years). Only returns events within a ±5-year
 * window of today so the cron has manageable data volume.
 */
export function computeSaturnReturns(birthDate: Date): ComputedReturnEvent[] {
  const now = new Date();
  const results: ComputedReturnEvent[] = [];

  for (let n = 1; n <= 3; n++) {
    const eventDate = addYears(birthDate, SATURN_PERIOD_YEARS * n);
    const daysUntil = daysBetween(now, eventDate);

    // Include if within 5 years past or future
    if (daysUntil > -(365 * 5) && daysUntil < 365 * 5) {
      results.push({ eventType: "saturn_return", eventDate, occurrenceNumber: n, daysUntil });
    }
  }

  return results;
}

/**
 * Returns upcoming (and recently past) Jupiter return events for a given birth date.
 * Covers up to the 7th return (~83 years). Only returns events within a window of
 * 1 year past to 2 years future (Jupiter returns are frequent — narrow window is fine).
 */
export function computeJupiterReturns(birthDate: Date): ComputedReturnEvent[] {
  const now = new Date();
  const results: ComputedReturnEvent[] = [];

  for (let n = 1; n <= 7; n++) {
    const eventDate = addYears(birthDate, JUPITER_PERIOD_YEARS * n);
    const daysUntil = daysBetween(now, eventDate);

    // Include if within 1 year past or 2 years future
    if (daysUntil > -365 && daysUntil < 365 * 2) {
      results.push({ eventType: "jupiter_return", eventDate, occurrenceNumber: n, daysUntil });
    }
  }

  return results;
}

/**
 * Returns the next upcoming Solar Return (birthday) for a given birth date.
 * If today is after this year's birthday, returns next year's.
 */
export function computeSolarReturn(birthDate: Date): ComputedReturnEvent {
  const now = new Date();

  const thisYearBirthday = new Date(
    now.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  const nextReturn =
    thisYearBirthday.getTime() > now.getTime()
      ? thisYearBirthday
      : new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

  const daysUntil = daysBetween(now, nextReturn);
  const occurrenceNumber = nextReturn.getFullYear() - birthDate.getFullYear();

  return { eventType: "solar_return", eventDate: nextReturn, occurrenceNumber, daysUntil };
}

export function getEventDisplayName(type: ReturnEventType): string {
  switch (type) {
    case "saturn_return":
      return "Saturn Return";
    case "jupiter_return":
      return "Jupiter Return";
    case "solar_return":
      return "Solar Return";
  }
}

export function getEventDescription(type: ReturnEventType): string {
  switch (type) {
    case "saturn_return":
      return "A profound life transition occurring every ~29.5 years when Saturn returns to its birth position — a time of major reassessment, maturity, and new beginnings.";
    case "jupiter_return":
      return "A cycle of expansion and abundance occurring every ~12 years when Jupiter returns to its birth position — a time of growth, opportunity, and good fortune.";
    case "solar_return":
      return "Your personal new year — the moment the Sun returns to its exact birth position. A powerful time to set intentions for the year ahead.";
  }
}
