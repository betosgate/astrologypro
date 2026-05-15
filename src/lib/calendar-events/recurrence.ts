import { RecurrenceDay } from "./constants";

export interface RecurrenceRule {
  type: "weekly";
  days: RecurrenceDay[];
  range_end: string;
  timezone: string;
  automation?: string;
  cron_enabled?: boolean;
}

export interface RecurrencePayload {
  enabled: boolean;
  type?: "weekly";
  days?: RecurrenceDay[];
  range_end?: string;
  timezone?: string;
}

export interface OccurrenceGenerationResult {
  occurrences: OccurrencePeriod[];
  exceededLimit: boolean;
}

export const DAY_MAP: Record<RecurrenceDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export interface OccurrencePeriod {
  start_at: Date;
  end_at: Date;
}

const VALID_RECURRENCE_DAYS = new Set<RecurrenceDay>([
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]);

function assertSupportedTimezone(timezone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function parseDateTimeLocal(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function getZonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: assertSupportedTimezone(timezone),
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const parts = getZonedParts(date, timezone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return zonedAsUtc - date.getTime();
}

export function zonedDateTimeToUtc(value: string, timezone: string): Date {
  const parts = parseDateTimeLocal(value);
  if (!parts) return new Date(value);

  const normalizedTimezone = assertSupportedTimezone(timezone);
  const wallClockUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  let utcDate = new Date(wallClockUtc);

  // Two passes handle most DST boundary offsets without adding a date library.
  for (let i = 0; i < 2; i++) {
    utcDate = new Date(wallClockUtc - getTimezoneOffsetMs(utcDate, normalizedTimezone));
  }

  return utcDate;
}

function dateStringFromParts(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function timeStringFromParts(parts: { hour: number; minute: number }) {
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function compareDateStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function dayDiff(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86_400_000);
}

function dayOfWeek(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isIsoDateTime(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
}

export function parseAdminEventDateTime(value: string, timezone: string): Date {
  if (isIsoDateTime(value)) return new Date(value);
  return zonedDateTimeToUtc(value, timezone);
}

// Temporary Phase 1 path: recurrence occurrences are generated synchronously
// when an admin saves the event. This avoids running cron/Lambda before launch
// while still creating real calendar_events rows for RSVP and Add to Calendar.
// Future cron/worker should handle rolling generation, cleanup, reminders, and
// long-range maintenance from recurrence_rule/recurrence_series_id.
//
// Keep this preview calculation aligned with the server-side manual occurrence
// generation. Future cron should use the same recurrence rule semantics.
export function generateOccurrences(
  startAt: Date,
  endAt: Date,
  payload: RecurrencePayload,
  maxOccurrences: number = 120
): OccurrencePeriod[] {
  return generateOccurrenceResult(startAt, endAt, payload, maxOccurrences).occurrences;
}

export function generateOccurrenceResult(
  startAt: Date,
  endAt: Date,
  payload: RecurrencePayload,
  maxOccurrences: number = 120
): OccurrenceGenerationResult {
  const occurrences: OccurrencePeriod[] = [];

  if (endAt.getTime() < startAt.getTime() || !payload.enabled || !payload.days || payload.days.length === 0 || !payload.range_end) {
    return { occurrences: [{ start_at: startAt, end_at: endAt }], exceededLimit: false };
  }

  const timezone = assertSupportedTimezone(payload.timezone || "UTC");
  const startParts = getZonedParts(startAt, timezone);
  const endParts = getZonedParts(endAt, timezone);
  const startDateString = dateStringFromParts(startParts);
  const endDateString = dateStringFromParts(endParts);
  const rangeEndDateString = payload.range_end;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rangeEndDateString) || compareDateStrings(rangeEndDateString, startDateString) < 0) {
    return { occurrences: [{ start_at: startAt, end_at: endAt }], exceededLimit: false };
  }

  const validDays = new Set(
    payload.days
      .filter((day): day is RecurrenceDay => VALID_RECURRENCE_DAYS.has(day))
      .map((day) => DAY_MAP[day])
  );
  
  if (validDays.size === 0) {
    return { occurrences: [{ start_at: startAt, end_at: endAt }], exceededLimit: false };
  }

  const endDateOffsetDays = dayDiff(startDateString, endDateString);
  const startTime = timeStringFromParts(startParts);
  const endTime = timeStringFromParts(endParts);
  let currentDateString = startDateString;

  while (compareDateStrings(currentDateString, rangeEndDateString) <= 0) {
    if (validDays.has(dayOfWeek(currentDateString))) {
      const occurrenceStart = zonedDateTimeToUtc(`${currentDateString}T${startTime}`, timezone);
      const occurrenceEndDateString = addDays(currentDateString, endDateOffsetDays);
      const occurrenceEnd = zonedDateTimeToUtc(`${occurrenceEndDateString}T${endTime}`, timezone);
      occurrences.push({
        start_at: occurrenceStart,
        end_at: occurrenceEnd,
      });

      if (occurrences.length > maxOccurrences) {
        return { occurrences: occurrences.slice(0, maxOccurrences), exceededLimit: true };
      }
    }

    currentDateString = addDays(currentDateString, 1);
  }

  return { occurrences, exceededLimit: false };
}
