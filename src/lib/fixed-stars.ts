/**
 * fixed-stars.ts
 * Fixed star data and conjunction detection for mundane astrology.
 *
 * Longitudes are tropical ecliptic at J2000.0 (epoch 2000-01-01T12:00:00 UTC).
 * Annual precession rate: 50.29 arcseconds/year = 0.013969° per year.
 */

import type { PlanetData } from "@/components/mundane/astro-wheel";

// J2000.0 epoch reference
const J2000 = new Date("2000-01-01T12:00:00.000Z");

/** Degrees of precession per year (Julian year = 365.25 days) */
const PRECESSION_DEG_PER_YEAR = 0.013969;

export interface FixedStar {
  name: string;
  longitude_j2000: number; // tropical ecliptic longitude at J2000.0 (0–360)
  latitude: number;        // ecliptic latitude (degrees)
  magnitude: number;       // visual magnitude (lower = brighter)
  nature: string;          // traditional nature, e.g., "Mars/Mercury"
  meaning: string;         // brief mundane significance
}

/**
 * The 30 principal fixed stars used in mundane astrology.
 * Longitudes are tropical at J2000.0. Source: traditional astrological sources
 * cross-referenced with modern star catalogues.
 */
export const FIXED_STARS: FixedStar[] = [
  // Sign abbreviations: Ari=0, Tau=30, Gem=60, Can=90, Leo=120, Vir=150,
  //                     Lib=180, Sco=210, Sag=240, Cap=270, Aqu=300, Pis=330
  {
    name: "Algol",
    longitude_j2000: 56.14, // 26°08' Taurus
    latitude: 22.5,
    magnitude: 2.12,
    nature: "Saturn/Jupiter",
    meaning: "Violence, mass casualties, upheaval; the most malefic star in mundane work",
  },
  {
    name: "Alcyone (Pleiades)",
    longitude_j2000: 60.05, // 00°05' Gemini
    latitude: 4.03,
    magnitude: 2.87,
    nature: "Moon/Mars",
    meaning: "Accidents, blindness (collective), storms; grief and mourning events",
  },
  {
    name: "Aldebaran",
    longitude_j2000: 69.89, // 09°53' Gemini
    latitude: -5.47,
    magnitude: 0.86,
    nature: "Mars",
    meaning: "Military leadership, courage, honour; Royal Star of the East; danger through ambition",
  },
  {
    name: "Rigel",
    longitude_j2000: 76.76, // 16°46' Gemini
    latitude: -31.12,
    magnitude: 0.13,
    nature: "Jupiter/Saturn",
    meaning: "Technical mastery, engineering, architecture; prosperity through skill",
  },
  {
    name: "Bellatrix",
    longitude_j2000: 80.93, // 20°56' Gemini
    latitude: -16.76,
    magnitude: 1.64,
    nature: "Mars/Mercury",
    meaning: "Female military leadership; sharp speech; rash decisions; victory through daring",
  },
  {
    name: "Castor",
    longitude_j2000: 113.34, // 23°20' Gemini (note: Castor/Pollux are in Gemini, not Cancer)
    latitude: 10.05,
    magnitude: 1.58,
    nature: "Mercury",
    meaning: "Intellect, arts, dual nature; sudden fame or disgrace",
  },
  {
    name: "Betelgeuse",
    longitude_j2000: 88.79, // 28°47' Gemini
    latitude: -16.03,
    magnitude: 0.42,
    nature: "Mars/Mercury",
    meaning: "Military success, command; fortune through war; bold enterprise",
  },
  {
    name: "Pollux",
    longitude_j2000: 116.34, // 23°13' Cancer (corrected: Pollux is ~23° Cancer tropically)
    latitude: 6.68,
    magnitude: 1.16,
    nature: "Mars/Moon",
    meaning: "Cruelty, danger from authority; audacity; the darker twin",
  },
  {
    name: "Sirius",
    longitude_j2000: 104.10, // 14°05' Cancer
    latitude: -39.61,
    magnitude: -1.46,
    nature: "Jupiter/Mars",
    meaning: "National fame, prestige, worldly power; ambition; burning glory",
  },
  {
    name: "Canopus",
    longitude_j2000: 104.68, // 14°41' Cancer
    latitude: -75.83,
    magnitude: -0.72,
    nature: "Saturn/Jupiter",
    meaning: "Navigation, overseas travel, colonial expansion; wisdom at sea",
  },
  {
    name: "Procyon",
    longitude_j2000: 115.77, // 25°46' Cancer
    latitude: -16.02,
    magnitude: 0.38,
    nature: "Mercury/Mars",
    meaning: "Violence, sudden reversals; heat and haste; quick gains and quick losses",
  },
  {
    name: "Acubens",
    longitude_j2000: 133.21, // 13°13' Leo
    latitude: 5.33,
    magnitude: 4.26,
    nature: "Saturn/Mercury",
    meaning: "Liars and criminals; deceit in government; concealment of plans",
  },
  {
    name: "Regulus",
    longitude_j2000: 149.99, // 29°59' Leo
    latitude: 0.46,
    magnitude: 1.35,
    nature: "Mars/Jupiter",
    meaning: "Kingship, sovereign power, military command; Royal Star of the North; fall from grace if revenge sought",
  },
  {
    name: "Spica",
    longitude_j2000: 203.97, // 23°58' Libra
    latitude: -2.05,
    magnitude: 0.97,
    nature: "Venus/Mars",
    meaning: "Genius, brilliance, success in the arts and sciences; a fortunate star",
  },
  {
    name: "Arcturus",
    longitude_j2000: 203.75, // 23°45' Libra
    latitude: 30.77,
    magnitude: -0.05,
    nature: "Jupiter/Mars",
    meaning: "Justice, guardianship, law; leadership for the benefit of others",
  },
  {
    name: "Alphecca",
    longitude_j2000: 192.20, // 12°12' Scorpio
    latitude: 44.58,
    magnitude: 2.23,
    nature: "Venus/Mercury",
    meaning: "Honour in the arts; dignified refinement; beauty through discipline",
  },
  {
    name: "Zuben Elgenubi",
    longitude_j2000: 224.82, // 14°49' Scorpio
    latitude: -8.52,
    magnitude: 2.75,
    nature: "Saturn/Mars",
    meaning: "Negative social reform; criminality; burden of the people; unjust laws",
  },
  {
    name: "Zuben Eschamali",
    longitude_j2000: 229.08, // 19°05' Scorpio
    latitude: 8.78,
    magnitude: 2.61,
    nature: "Jupiter/Mercury",
    meaning: "Positive social reform; wealth for the many; beneficial legislation",
  },
  {
    name: "Acrux",
    longitude_j2000: 221.17, // 11°10' Scorpio
    latitude: -63.10,
    magnitude: 0.77,
    nature: "Jupiter",
    meaning: "Religious and ceremonial power; law and justice in the southern hemisphere",
  },
  {
    name: "Antares",
    longitude_j2000: 249.90, // 09°54' Sagittarius
    latitude: -4.57,
    magnitude: 1.05,
    nature: "Mars/Jupiter",
    meaning: "War, violence, obsession; Royal Star of the West; success through ruthlessness or ruin",
  },
  {
    name: "Ras Alhague",
    longitude_j2000: 262.00, // 22°00' Sagittarius
    latitude: 35.90,
    magnitude: 2.08,
    nature: "Saturn/Venus",
    meaning: "Healing powers, medicine, epidemics; wisdom misused; serpent-bearer energy",
  },
  {
    name: "Vega",
    longitude_j2000: 284.74, // 14°44' Capricorn
    latitude: 61.72,
    magnitude: 0.03,
    nature: "Venus/Mercury",
    meaning: "Artistic genius, poetic vision, temporary wealth; charisma; refinement in leadership",
  },
  {
    name: "Altair",
    longitude_j2000: 301.95, // 01°57' Aquarius
    latitude: 29.31,
    magnitude: 0.77,
    nature: "Mars/Jupiter",
    meaning: "Boldness, swiftness, decisive action; high-flying ambition; sudden elevation",
  },
  {
    name: "Sadalsuud",
    longitude_j2000: 323.41, // 23°24' Aquarius
    latitude: -5.57,
    magnitude: 2.91,
    nature: "Saturn/Mercury",
    meaning: "Good fortune for all; humanitarian aid; the luckiest of the lucky stars",
  },
  {
    name: "Sadalmelik",
    longitude_j2000: 303.50, // 03°30' Aquarius (corrected)
    latitude: -11.53,
    magnitude: 2.96,
    nature: "Saturn/Mercury",
    meaning: "Good luck; collective prosperity; fortunate beginnings of group endeavors",
  },
  {
    name: "Fomalhaut",
    longitude_j2000: 333.95, // 03°57' Pisces
    latitude: -21.13,
    magnitude: 1.17,
    nature: "Venus/Mercury",
    meaning: "Royal Star of the South; idealism, charisma, mass appeal; dreams made real or shattered",
  },
  {
    name: "Achernar",
    longitude_j2000: 15.34 + 330, // ~345° = 15° Pisces
    latitude: -59.51,
    magnitude: 0.45,
    nature: "Jupiter",
    meaning: "Regal power; success in religious and political spheres; royal prestige",
  },
  {
    name: "Scheat",
    longitude_j2000: 359.63, // 29°38' Pisces
    latitude: 31.08,
    magnitude: 2.44,
    nature: "Mars/Mercury",
    meaning: "Shipwrecks, floods, disasters; imprisonment; unfortunate endings; collective misfortune",
  },
  {
    name: "Deneb Algedi (Markab)",
    longitude_j2000: 353.38, // 23°23' Pisces
    latitude: -2.77,
    magnitude: 2.84,
    nature: "Saturn/Jupiter",
    meaning: "Law and government; sorrow through authority; wisdom under constraint",
  },
  {
    name: "Deneb (Deneb Adige)",
    longitude_j2000: 335.14, // 05°08' Pisces
    latitude: 59.99,
    magnitude: 1.25,
    nature: "Venus/Mercury",
    meaning: "Artistic talent, musical genius; spiritual vision; collective idealism",
  },
];

/**
 * Get a star's current tropical longitude corrected for precession from J2000.
 * Formula: lon = lon_j2000 + (years_since_j2000 * PRECESSION_DEG_PER_YEAR)
 */
export function getStarLongitude(star: FixedStar, date: Date): number {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsSinceJ2000 = (date.getTime() - J2000.getTime()) / msPerYear;
  const raw = star.longitude_j2000 + yearsSinceJ2000 * PRECESSION_DEG_PER_YEAR;
  return ((raw % 360) + 360) % 360;
}

export interface StarHit {
  star: FixedStar;
  planet: string;
  planetLongitude: number;
  starLongitude: number;
  orb: number;
}

/**
 * Check which natal planets are within orbDegrees of any fixed star.
 * Returns hits sorted by orb (tightest first).
 */
export function checkStarHits(
  natalPlanets: PlanetData[],
  date: Date,
  orbDegrees: number
): StarHit[] {
  const hits: StarHit[] = [];

  for (const planet of natalPlanets) {
    for (const star of FIXED_STARS) {
      const starLon = getStarLongitude(star, date);
      let diff = Math.abs(planet.longitude - starLon);
      if (diff > 180) diff = 360 - diff;
      if (diff <= orbDegrees) {
        hits.push({
          star,
          planet: planet.name,
          planetLongitude: planet.longitude,
          starLongitude: starLon,
          orb: Math.round(diff * 100) / 100,
        });
      }
    }
  }

  return hits.sort((a, b) => a.orb - b.orb);
}
