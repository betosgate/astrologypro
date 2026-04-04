/**
 * Natal chart calculation using astronomy-engine.
 * Computes planet positions in the zodiac for a given birth date/time/location.
 */

import * as Astronomy from "astronomy-engine";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export interface PlanetPosition {
  name: string;
  sign: ZodiacSign;
  degree: number;       // degree within the sign (0–29.99)
  longitude: number;    // ecliptic longitude (0–359.99)
  retrograde: boolean;
}

export interface NatalChartData {
  planets: PlanetPosition[];
  ascendant: { sign: ZodiacSign; degree: number; longitude: number } | null;
  mc: { sign: ZodiacSign; degree: number; longitude: number } | null;  // Midheaven
  generatedAt: string;
  birthTime: string | null;
  ageGroup: "child" | "adult";
}

function longitudeToSign(lon: number): { sign: ZodiacSign; degree: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return { sign: ZODIAC_SIGNS[signIndex], degree };
}

/**
 * Calculate RAMC (Right Ascension of Midheaven) → Ascendant and MC.
 * Uses simplified Placidus-like approach.
 */
function calcAscendantMC(
  date: Date,
  lat: number,
  lng: number
): { ascLon: number; mcLon: number } | null {
  try {
    // GMST in degrees
    const jd =
      Astronomy.MakeTime(date).tt +
      2451545.0;
    const T = (jd - 2451545.0) / 36525;
    const gmst =
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      T * T * 0.000387933 -
      (T * T * T) / 38710000;
    const lst = ((gmst + lng) % 360 + 360) % 360;

    // RAMC → MC ecliptic longitude
    const eps = 23.439 - 0.0000004 * T * T; // obliquity approx
    const epsRad = (eps * Math.PI) / 180;
    const lstRad = (lst * Math.PI) / 180;
    const mcLon =
      (Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad)) *
        180) /
      Math.PI;
    const mcLonNorm = ((mcLon % 360) + 360) % 360;

    // Ascendant
    const latRad = (lat * Math.PI) / 180;
    const ascRad = Math.atan2(
      Math.cos(lstRad),
      -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad))
    );
    const ascLon = ((((ascRad * 180) / Math.PI) % 360) + 360) % 360;

    return { ascLon, mcLon: mcLonNorm };
  } catch {
    return null;
  }
}

const PLANET_BODIES: { name: string; body: keyof typeof Astronomy.Body }[] = [
  { name: "Sun", body: "Sun" },
  { name: "Moon", body: "Moon" },
  { name: "Mercury", body: "Mercury" },
  { name: "Venus", body: "Venus" },
  { name: "Mars", body: "Mars" },
  { name: "Jupiter", body: "Jupiter" },
  { name: "Saturn", body: "Saturn" },
  { name: "Uranus", body: "Uranus" },
  { name: "Neptune", body: "Neptune" },
  { name: "Pluto", body: "Pluto" },
];

export function generateNatalChart(params: {
  dateOfBirth: string;        // YYYY-MM-DD
  birthTime: string | null;   // HH:MM or null
  lat: number;                // birth location latitude (default 0 if unknown)
  lng: number;                // birth location longitude (default 0 if unknown)
  ageGroup: "child" | "adult";
}): NatalChartData {
  const { dateOfBirth, birthTime, lat, lng, ageGroup } = params;

  // Parse birth date/time
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let hour = 12;
  let minute = 0;
  if (birthTime) {
    const [h, m] = birthTime.split(":").map(Number);
    hour = h;
    minute = m;
  }

  const birthDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const astroTime = Astronomy.MakeTime(birthDate);

  const planets: PlanetPosition[] = PLANET_BODIES.map(({ name, body }) => {
    try {
      // Get ecliptic longitude from geocentric position
      const lon = Astronomy.EclipticLongitude(
        Astronomy.Body[body] as Astronomy.Body,
        astroTime
      );

      // Check retrograde via comparing position 24h later
      const tomorrow = Astronomy.MakeTime(
        new Date(birthDate.getTime() + 86400000)
      );
      const lonTomorrow = Astronomy.EclipticLongitude(
        Astronomy.Body[body] as Astronomy.Body,
        tomorrow
      );
      const retrograde = lonTomorrow - lon < -0.5 || lonTomorrow - lon > 179;

      const { sign, degree } = longitudeToSign(lon);
      return { name, sign, degree, longitude: ((lon % 360) + 360) % 360, retrograde };
    } catch {
      const { sign, degree } = longitudeToSign(0);
      return { name, sign, degree, longitude: 0, retrograde: false };
    }
  });

  let ascendant: NatalChartData["ascendant"] = null;
  let mc: NatalChartData["mc"] = null;

  // Only compute Asc/MC for adults with birth time
  if (ageGroup === "adult" && birthTime) {
    const angles = calcAscendantMC(birthDate, lat, lng);
    if (angles) {
      const asc = longitudeToSign(angles.ascLon);
      const midh = longitudeToSign(angles.mcLon);
      ascendant = { sign: asc.sign, degree: asc.degree, longitude: angles.ascLon };
      mc = { sign: midh.sign, degree: midh.degree, longitude: angles.mcLon };
    }
  }

  return {
    planets: ageGroup === "child" ? planets : planets,
    ascendant,
    mc,
    generatedAt: new Date().toISOString(),
    birthTime,
    ageGroup,
  };
}
