import { getUTCOffset } from "@/lib/timezone-utils";

const DEFAULT_TIME = "12:00";

export interface ToolkitBirthSeed {
  fullName?: string | null;
  dateOfBirth?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  birthLat?: number | null;
  birthLng?: number | null;
  birthTimezone?: string | null;
}

export interface ToolkitCityOption {
  label: string;
  lat: number;
  lng: number;
  timezone: {
    name: string;
    offset_string: string;
    utcOffset: string;
  };
}

export interface ToolkitBirthInput {
  dob: string;
  tob: string;
  city: ToolkitCityOption | null;
}

export interface ToolkitPrefillForm {
  person1: ToolkitBirthInput;
  person2: ToolkitBirthInput;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;
  futureMonth: string;
}

export interface ToolkitFamilyMemberPrefill {
  id: string;
  fullName: string;
  relationship: string | null;
  ageGroup: string | null;
  birth: ToolkitBirthInput;
}

type GeoLookup = {
  label: string;
  lat: number;
  lng: number;
  timezoneName: string | null;
  offsetString: string | null;
};

const geoLookupCache = new Map<string, Promise<GeoLookup | null>>();

function normalizeDate(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function normalizeTime(value: string | null | undefined): string {
  if (!value) return DEFAULT_TIME;
  const normalized = value.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : DEFAULT_TIME;
}

function buildReferenceDate(dateOfBirth: string, birthTime: string): Date {
  const safeDate = dateOfBirth || "2000-01-01";
  const safeTime = birthTime || DEFAULT_TIME;
  const parsed = new Date(`${safeDate}T${safeTime}:00Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function safeOffsetForTimezone(
  timezoneName: string | null,
  dateOfBirth: string,
  birthTime: string,
  fallbackOffset?: string | null,
): string {
  if (timezoneName) {
    try {
      return getUTCOffset(timezoneName, buildReferenceDate(dateOfBirth, birthTime));
    } catch {
      // Fall through to the upstream lookup/default offset.
    }
  }

  if (fallbackOffset && /^[-+]\d{2}:\d{2}$/.test(fallbackOffset)) {
    return fallbackOffset;
  }

  return "+00:00";
}

async function lookupCity(label: string): Promise<GeoLookup | null> {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return null;

  if (!geoLookupCache.has(normalized)) {
    geoLookupCache.set(
      normalized,
      (async () => {
        const apiKey = process.env.GEOAPIFY_API_KEY;
        if (!apiKey) return null;

        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(label)}&apiKey=${apiKey}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;

        const data = (await res.json()) as {
          features?: Array<{
            properties?: {
              formatted?: string;
              lat?: number;
              lon?: number;
              timezone?: {
                name?: string;
                offset_STD?: string;
              };
            };
          }>;
        };

        const first = data.features?.[0]?.properties;
        if (
          !first ||
          typeof first.formatted !== "string" ||
          typeof first.lat !== "number" ||
          typeof first.lon !== "number"
        ) {
          return null;
        }

        return {
          label: first.formatted,
          lat: first.lat,
          lng: first.lon,
          timezoneName: first.timezone?.name ?? null,
          offsetString: first.timezone?.offset_STD ?? null,
        };
      })(),
    );
  }

  return geoLookupCache.get(normalized) ?? null;
}

export function emptyToolkitBirthInput(): ToolkitBirthInput {
  return { dob: "", tob: DEFAULT_TIME, city: null };
}

export async function buildToolkitBirthInput(seed: ToolkitBirthSeed): Promise<ToolkitBirthInput> {
  const dob = normalizeDate(seed.dateOfBirth);
  const tob = normalizeTime(seed.birthTime);

  const cityLabel = seed.birthCountry && seed.birthCity && !seed.birthCity.includes(seed.birthCountry)
    ? `${seed.birthCity}, ${seed.birthCountry}`
    : seed.birthCity ?? "";

  const needsLookup =
    !!cityLabel &&
    (seed.birthLat == null ||
      seed.birthLng == null ||
      !seed.birthTimezone);

  const geo = needsLookup ? await lookupCity(cityLabel) : null;

  const lat = seed.birthLat ?? geo?.lat ?? null;
  const lng = seed.birthLng ?? geo?.lng ?? null;
  const label = seed.birthCity?.trim() || geo?.label || "";

  if (!label || lat == null || lng == null) {
    return { dob, tob, city: null };
  }

  const timezoneName =
    seed.birthTimezone?.trim() ||
    geo?.timezoneName ||
    "UTC";

  const offsetString = safeOffsetForTimezone(
    timezoneName,
    dob,
    tob,
    geo?.offsetString,
  );

  return {
    dob,
    tob,
    city: {
      label,
      lat,
      lng,
      timezone: {
        name: timezoneName,
        offset_string: offsetString,
        utcOffset: offsetString,
      },
    },
  };
}

export async function buildToolkitPrefillForm(input: {
  person1: ToolkitBirthSeed;
  person2?: ToolkitBirthSeed | null;
  areaOfInquiry?: string;
  question?: string;
  futureWeek?: string;
  futureMonth?: string;
}): Promise<ToolkitPrefillForm> {
  const [person1, person2] = await Promise.all([
    buildToolkitBirthInput(input.person1),
    input.person2 ? buildToolkitBirthInput(input.person2) : Promise.resolve(emptyToolkitBirthInput()),
  ]);

  return {
    person1,
    person2,
    areaOfInquiry: input.areaOfInquiry ?? "",
    question: input.question ?? "",
    futureWeek: input.futureWeek ?? "",
    futureMonth: input.futureMonth ?? "",
  };
}

export async function buildToolkitFamilyMemberPrefills(
  members: Array<
    ToolkitBirthSeed & {
      id: string;
      fullName?: string | null;
      relationship?: string | null;
      ageGroup?: string | null;
    }
  >,
): Promise<ToolkitFamilyMemberPrefill[]> {
  return Promise.all(
    members.map(async (member) => ({
      id: member.id,
      fullName: member.fullName ?? "",
      relationship: member.relationship ?? null,
      ageGroup: member.ageGroup ?? null,
      birth: await buildToolkitBirthInput(member),
    })),
  );
}
