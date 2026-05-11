export interface PersonInput {
  dob?: string | null;
  tob?: string | null;
  city?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
}

export interface MatchSavedReportBody {
  toolname?: string;
  type?: "single" | "two-person";
  person1?: PersonInput | null;
  person2?: PersonInput | null;
  extras?: {
    areaOfInquiry?: string;
    question?: string;
    futureWeek?: string;
    futureMonth?: string;
    familyMembers?: unknown[];
    family_members?: unknown[];
  } | null;
  limit?: number;
  familyMemberId?: string;
  personAId?: string;
  personBId?: string;
}

export type JsonRecord = Record<string, unknown>;

export const SAVED_REPORT_MATCH_SELECT = [
  "id",
  "user_id",
  "toolname",
  "form_data",
  "ai_response",
  "natal_chart",
  "astro_api_data",
  "free_natal_wheel_chart",
  "free_natal_wheel_chart_transit",
  "free_natal_wheel_chart_self",
  "free_natal_wheel_chart_partner",
  "free_natal_wheel_chart_p2",
  "free_natal_wheel_chart_transit_p2",
  "summary",
  "created_at",
  "updated_at",
].join(", ");

export function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

/**
 * Resolve the canonical `formData` blob from a saved row. Prefers the
 * top-level column when populated; falls back to whatever the legacy
 * save path stored inside `ai_response`.
 */
function resolveFormData(row: JsonRecord): JsonRecord | null {
  const colForm = asRecord(row.form_data);
  if (colForm && Object.keys(colForm).length > 0) return colForm;

  const ai = asRecord(row.ai_response);
  if (!ai) return null;
  return asRecord(ai.formData) ?? asRecord(ai.form_data) ?? null;
}

interface Identity {
  year: number | null;
  month: number | null;
  day: number | null;
  hour: number | null;
  min: number | null;
  lat: number | null;
  lon: number | null;
  dob: string | null;
  tob: string | null;
}

function pickNumber(source: JsonRecord | null, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    const v = source[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const parsed = Number(v);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function pickString(source: JsonRecord | null, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const v = source[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function identityFrom(source: JsonRecord | null): Identity {
  if (!source) {
    return {
      year: null,
      month: null,
      day: null,
      hour: null,
      min: null,
      lat: null,
      lon: null,
      dob: null,
      tob: null,
    };
  }

  let year = pickNumber(source, ["year", "birthYear", "birth_year"]);
  let month = pickNumber(source, ["month", "birthMonth", "birth_month"]);
  let day = pickNumber(source, ["day", "date", "birthDay", "birth_day"]);

  const dob = pickString(source, [
    "dob",
    "dateOfBirth",
    "date_of_birth",
    "birthDate",
    "birth_date",
  ]);
  if (dob && (!year || !month || !day)) {
    const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      year = year ?? Number(m[1]);
      month = month ?? Number(m[2]);
      day = day ?? Number(m[3]);
    }
  }

  let hour = pickNumber(source, ["hour", "hours", "birthHour", "birth_hour"]);
  let min = pickNumber(source, [
    "min",
    "minute",
    "minutes",
    "birthMinute",
    "birth_minute",
  ]);
  const tob = pickString(source, [
    "tob",
    "birthTime",
    "birth_time",
    "timeOfBirth",
    "time_of_birth",
  ]);
  if (tob && (hour == null || min == null)) {
    const m = tob.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      hour = hour ?? Number(m[1]);
      min = min ?? Number(m[2]);
    }
  }

  let lat = pickNumber(source, ["lat", "latitude", "birthLat", "birth_lat"]);
  let lon = pickNumber(source, [
    "lon",
    "lng",
    "longitude",
    "birthLng",
    "birth_lng",
  ]);
  if (lat == null || lon == null) {
    const city = asRecord(source.city);
    if (city) {
      lat = lat ?? pickNumber(city, ["lat", "latitude"]);
      lon = lon ?? pickNumber(city, ["lng", "lon", "longitude"]);
    }
  }

  return { year, month, day, hour, min, lat, lon, dob, tob };
}

function approxEq(a: number | null, b: number | null, eps = 0.01): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= eps;
}

function exactEq(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return false;
  return a === b;
}

function identityMatches(req: Identity, row: Identity): boolean {
  if (!exactEq(req.year, row.year)) return false;
  if (!exactEq(req.month, row.month)) return false;
  if (!exactEq(req.day, row.day)) return false;
  if (!exactEq(req.hour, row.hour)) return false;
  if (!exactEq(req.min, row.min)) return false;
  if (!approxEq(req.lat, row.lat, 0.01)) return false;
  if (!approxEq(req.lon, row.lon, 0.01)) return false;
  return true;
}

function splitPersons(formData: JsonRecord | null): {
  self: JsonRecord | null;
  partner: JsonRecord | null;
} {
  if (!formData) return { self: null, partner: null };

  const self =
    asRecord(formData.self) ??
    asRecord(formData.person1) ??
    asRecord(formData.primary) ??
    formData;
  const partner =
    asRecord(formData.partner) ??
    asRecord(formData.person2) ??
    asRecord(formData.secondary) ??
    asRecord(formData.spouse) ??
    null;

  return { self, partner };
}

function identityFromFamilyValue(value: unknown): Identity {
  const record = asRecord(value);
  return identityFrom(asRecord(record?.birth) ?? record);
}

function familyIdentitiesFromFormData(formData: JsonRecord | null): Identity[] {
  if (!formData) return [];

  const directMembers =
    (Array.isArray(formData.familyMemberPayloads) && formData.familyMemberPayloads) ||
    (Array.isArray(formData.family_member_payloads) && formData.family_member_payloads) ||
    (Array.isArray(formData.familyMembers) && formData.familyMembers) ||
    (Array.isArray(formData.family_members) && formData.family_members) ||
    null;
  if (directMembers) return directMembers.map(identityFromFamilyValue);

  const chartMembers =
    (Array.isArray(formData.familyPersonCharts) && formData.familyPersonCharts) ||
    (Array.isArray(formData.family_person_charts) && formData.family_person_charts) ||
    null;
  if (chartMembers) return chartMembers.map(identityFromFamilyValue);

  const { self, partner } = splitPersons(formData);
  const partners =
    (Array.isArray(formData.partners) && formData.partners) ||
    (Array.isArray(formData.partner) && formData.partner) ||
    [];

  return [self, ...partners, Array.isArray(formData.partner) ? null : partner]
    .filter(Boolean)
    .map(identityFromFamilyValue);
}

function familyIdentitiesFromBody(body: MatchSavedReportBody): Identity[] {
  const members =
    (Array.isArray(body.extras?.familyMembers) && body.extras?.familyMembers) ||
    (Array.isArray(body.extras?.family_members) && body.extras?.family_members) ||
    [];

  return members.map(identityFromFamilyValue).filter(isComplete);
}

function familyIdentitiesMatch(reqFamily: Identity[], rowFamily: Identity[]): boolean {
  if (!reqFamily.length) return true;
  if (rowFamily.length !== reqFamily.length) return false;

  const unmatched = [...rowFamily];
  return reqFamily.every((reqId) => {
    const index = unmatched.findIndex((rowId) => identityMatches(reqId, rowId));
    if (index < 0) return false;
    unmatched.splice(index, 1);
    return true;
  });
}

function reqIdentitiesFromBody(body: MatchSavedReportBody): {
  self: Identity;
  partner: Identity | null;
  twoPerson: boolean;
} {
  const self = identityFrom(asRecord(body.person1) ?? null);
  const partner = body.person2
    ? identityFrom(asRecord(body.person2) ?? null)
    : null;
  return {
    self,
    partner,
    twoPerson: body.type === "two-person",
  };
}

function isComplete(id: Identity): boolean {
  return (
    id.year != null &&
    id.month != null &&
    id.day != null &&
    id.hour != null &&
    id.min != null &&
    id.lat != null &&
    id.lon != null
  );
}

export function normalizeMatchLimit(limit: unknown): number {
  return Math.max(
    1,
    Math.min(typeof limit === "number" ? limit : 30, 100)
  );
}

export function findSavedReportMatch(
  body: MatchSavedReportBody,
  candidates: unknown[]
): JsonRecord | null {
  const reqIds = reqIdentitiesFromBody(body);
  const reqFamilyIds = familyIdentitiesFromBody(body);

  if (!isComplete(reqIds.self)) return null;
  if (reqIds.twoPerson && (!reqIds.partner || !isComplete(reqIds.partner))) {
    return null;
  }

  const reqFutureMonth = body.extras?.futureMonth?.trim() || null;
  const reqFutureWeek = body.extras?.futureWeek?.trim() || null;
  const reqQuestion = body.extras?.question?.trim() || null;

  for (const candidate of candidates) {
    const row = asRecord(candidate);
    if (!row) continue;

    const formData = resolveFormData(row);
    if (!formData) continue;

    if (reqFutureMonth) {
      const rowFutureMonth = pickString(formData, [
        "futureMonth",
        "future_month",
        "targetMonth",
        "target_month",
      ]);
      if (
        rowFutureMonth &&
        rowFutureMonth.slice(0, 7) !== reqFutureMonth.slice(0, 7)
      ) {
        continue;
      }
    }
    if (reqFutureWeek) {
      const rowFutureWeek = pickString(formData, [
        "futureWeek",
        "future_week",
        "weekStartDate",
        "week_start_date",
      ]);
      if (
        rowFutureWeek &&
        rowFutureWeek.slice(0, 10) !== reqFutureWeek.slice(0, 10)
      ) {
        continue;
      }
    }
    if (reqQuestion) {
      const rowQuestion = pickString(formData, [
        "question",
        "horaryQuestion",
        "horary_question",
      ]);
      if (rowQuestion && rowQuestion.toLowerCase() !== reqQuestion.toLowerCase()) {
        continue;
      }
    }

    const { self: rowSelf, partner: rowPartner } = splitPersons(formData);
    const rowSelfId = identityFrom(rowSelf);

    if (reqFamilyIds.length) {
      if (!familyIdentitiesMatch(reqFamilyIds, familyIdentitiesFromFormData(formData))) {
        continue;
      }
      return row;
    }

    if (reqIds.twoPerson) {
      if (!rowPartner) continue;
      const rowPartnerId = identityFrom(rowPartner);

      const direct =
        identityMatches(reqIds.self, rowSelfId) &&
        identityMatches(reqIds.partner!, rowPartnerId);
      const swapped =
        identityMatches(reqIds.self, rowPartnerId) &&
        identityMatches(reqIds.partner!, rowSelfId);

      if (!direct && !swapped) continue;
    } else if (!identityMatches(reqIds.self, rowSelfId)) {
      continue;
    }

    return row;
  }

  return null;
}
