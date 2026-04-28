import type { BirthInput, CityOption, FormState } from "./types";
import { defaultForm } from "./utils";

type JsonRecord = Record<string, any>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function firstString(source: JsonRecord | null, keys: string[]): string {
  if (!source) return "";

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
}

function firstNumber(source: JsonRecord | null, keys: string[]): number | null {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function twoDigit(value: number): string {
  return String(value).padStart(2, "0");
}

function dateFromParts(source: JsonRecord | null): string {
  const direct = firstString(source, [
    "dob",
    "dateOfBirth",
    "date_of_birth",
    "birthDate",
    "birth_date",
  ]);
  if (direct) return direct.slice(0, 10);

  const year = firstNumber(source, ["year", "birthYear", "birth_year"]);
  const month = firstNumber(source, ["month", "birthMonth", "birth_month"]);
  const day = firstNumber(source, ["day", "date", "birthDay", "birth_day"]);

  if (year && month && day) {
    return `${year}-${twoDigit(month)}-${twoDigit(day)}`;
  }

  return "";
}

function timeFromParts(source: JsonRecord | null): string {
  const direct = firstString(source, [
    "tob",
    "birthTime",
    "birth_time",
    "timeOfBirth",
    "time_of_birth",
  ]);
  if (direct) {
    const [hour = "00", minute = "00"] = direct.split(":");
    return `${twoDigit(Number(hour) || 0)}:${twoDigit(Number(minute) || 0)}`;
  }

  const hour = firstNumber(source, ["hour", "hours", "birthHour", "birth_hour"]);
  const minute = firstNumber(source, ["min", "minute", "minutes", "birthMinute", "birth_minute"]);

  if (hour != null) return `${twoDigit(hour)}:${twoDigit(minute ?? 0)}`;

  return "";
}

function offsetFromDecimal(value: number): string {
  const sign = value < 0 ? "-" : "+";
  const absolute = Math.abs(value);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `${sign}${twoDigit(hours)}:${twoDigit(minutes)}`;
}

function normalizeTimezone(source: JsonRecord | null, city: JsonRecord | null) {
  const timezone = asRecord(city?.timezone);
  const offset =
    firstString(timezone, ["offset_string", "utcOffset", "utc_offset"]) ||
    firstString(source, ["offset_string", "utcOffset", "utc_offset"]) ||
    (() => {
      const decimalOffset = firstNumber(source, ["tzone", "timezone"]);
      return decimalOffset == null ? "" : offsetFromDecimal(decimalOffset);
    })() ||
    "+00:00";

  return {
    name: firstString(timezone, ["name", "timezoneName"]) || firstString(source, ["timezoneName"]) || "UTC",
    offset_string: offset,
    utcOffset: firstString(timezone, ["utcOffset", "offset_string", "utc_offset"]) || offset,
  };
}

function normalizeCity(source: JsonRecord | null): CityOption | null {
  if (!source) return null;

  const rawCity = source.city;
  const city = asRecord(rawCity);
  const label =
    firstString(source, ["birthCity", "birth_city", "cityLabel", "placeOfBirth", "place_of_birth"]) ||
    firstString(city, ["label", "name", "city"]) ||
    (typeof rawCity === "string" ? rawCity.trim() : "");

  const lat = firstNumber(source, ["birthLat", "birth_lat", "lat", "latitude"]) ?? firstNumber(city, ["lat", "latitude"]);
  const lng =
    firstNumber(source, ["birthLng", "birth_lng", "lng", "lon", "longitude"]) ??
    firstNumber(city, ["lng", "lon", "longitude"]);

  if (!label || lat == null || lng == null) return null;

  return {
    label,
    lat,
    lng,
    timezone: normalizeTimezone(source, city),
  };
}

function normalizeBirth(source: JsonRecord | null): BirthInput {
  return {
    dob: dateFromParts(source),
    tob: timeFromParts(source),
    city: normalizeCity(source),
  };
}

function normalizeMonth(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  return match ? `${match[1]}-${match[2]}-01` : "";
}

function savedFormDataRoot(input: unknown): JsonRecord | null {
  const root = asRecord(input);
  if (!root) return null;

  const aiResponse = asRecord(root.ai_response);
  return (
    asRecord(aiResponse?.formData) ??
    asRecord(aiResponse?.form_data) ??
    asRecord(root.formData) ??
    asRecord(root.form_data) ??
    root
  );
}

export function formStateFromSavedFormData(input: unknown): FormState {
  const root = savedFormDataRoot(input);
  const form = defaultForm() as FormState;
  if (!root) return form;

  const person1Source =
    asRecord(root.self) ??
    asRecord(root.person1) ??
    asRecord(root.primary) ??
    asRecord(root.persona) ??
    root;
  const person2Source =
    asRecord(root.partner) ??
    asRecord(root.person2) ??
    asRecord(root.secondary) ??
    asRecord(root.spouse);

  form.person1 = normalizeBirth(person1Source);
  form.person2 = normalizeBirth(person2Source);
  form.areaOfInquiry = firstString(root, [
    "areaOfInquiry",
    "area_of_inquiry",
    "area",
    "inquiry",
  ]);
  form.question = firstString(root, ["question", "horaryQuestion", "horary_question"]);
  form.futureWeek = firstString(root, [
    "futureWeek",
    "future_week",
    "weekStartDate",
    "week_start_date",
  ]).slice(0, 10);

  form.futureMonth =
    normalizeMonth(firstString(root, ["futureMonth", "future_month", "targetMonth", "target_month"])) ||
    (() => {
      const targetYear = firstNumber(root, ["targetYear", "target_year"]);
      const targetMonth = firstNumber(root, ["targetMonth", "target_month"]);
      return targetYear && targetMonth ? `${targetYear}-${twoDigit(targetMonth)}-01` : "";
    })();

  return form;
}
