/**
 * degree-awareness.ts
 * Flags special degrees in a natal chart for mundane astrology.
 *
 * Alert types:
 * - aries_point: 0° of cardinal signs (Aries, Cancer, Libra, Capricorn) ±2°
 * - anaretic: 29° of any sign ±0.5°
 * - critical_cardinal: 0° of cardinal signs (same as aries point but tighter category)
 * - critical_fixed: 0°, 13°, 26° of fixed signs (Taurus, Leo, Scorpio, Aquarius)
 * - critical_mutable: 4°, 17° of mutable signs (Gemini, Virgo, Sagittarius, Pisces)
 */

export type DegreeAlert =
  | "aries_point"
  | "anaretic"
  | "critical_cardinal"
  | "critical_fixed"
  | "critical_mutable";

export interface DegreeAlertInfo {
  type: DegreeAlert;
  label: string;
  badgeColor: string;
}

export const DEGREE_ALERT_INFO: Record<DegreeAlert, DegreeAlertInfo> = {
  aries_point: {
    type: "aries_point",
    label: "World Axis",
    badgeColor:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
  },
  anaretic: {
    type: "anaretic",
    label: "29°",
    badgeColor:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  },
  critical_cardinal: {
    type: "critical_cardinal",
    label: "Critical",
    badgeColor:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  },
  critical_fixed: {
    type: "critical_fixed",
    label: "Critical",
    badgeColor:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  },
  critical_mutable: {
    type: "critical_mutable",
    label: "Critical",
    badgeColor:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  },
};

/** Sign modality: 0=cardinal, 1=fixed, 2=mutable (index % 3 gives modality) */
function getModality(signIndex: number): "cardinal" | "fixed" | "mutable" {
  const mod = signIndex % 3;
  if (mod === 0) return "cardinal";
  if (mod === 1) return "fixed";
  return "mutable";
}

/**
 * Given a tropical longitude (0–360°), return all applicable degree alerts.
 *
 * @param longitude - ecliptic longitude 0–360
 */
export function getDegreeAlerts(longitude: number): DegreeAlert[] {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30); // 0=Aries … 11=Pisces
  const degreeInSign = norm % 30;           // 0–30 within the sign
  const modality = getModality(signIndex);

  const alerts: DegreeAlert[] = [];

  // ── Aries Point: 0° cardinal signs ±2° ──────────────────────────────────────
  // Cardinals: Aries(0), Cancer(3), Libra(6), Capricorn(9)
  if (modality === "cardinal" && degreeInSign <= 2) {
    alerts.push("aries_point");
  }
  // Also catch the last 2° of the previous mutable sign (wrapping into 0° cardinal)
  // e.g., 28°–30° Pisces → within 2° of 0° Aries
  if (modality === "mutable" && degreeInSign >= 28) {
    alerts.push("aries_point");
  }

  // ── Anaretic: 29° of any sign ±0.5° ─────────────────────────────────────────
  if (degreeInSign >= 28.5 && degreeInSign < 30) {
    alerts.push("anaretic");
  }

  // ── Critical degrees ─────────────────────────────────────────────────────────
  // Cardinal signs: 0° (±1°) is the critical cardinal degree
  // (0° cardinal overlaps with aries point — include as separate flag)
  if (modality === "cardinal" && degreeInSign <= 1) {
    alerts.push("critical_cardinal");
  }

  // Fixed signs (Taurus=1, Leo=4, Scorpio=7, Aquarius=10): 0°, 13°, 26°
  if (modality === "fixed") {
    const FIXED_CRITICAL = [0, 13, 26];
    for (const cd of FIXED_CRITICAL) {
      if (Math.abs(degreeInSign - cd) <= 1) {
        alerts.push("critical_fixed");
        break;
      }
    }
  }

  // Mutable signs (Gemini=2, Virgo=5, Sagittarius=8, Pisces=11): 4°, 17°
  if (modality === "mutable") {
    const MUTABLE_CRITICAL = [4, 17];
    for (const cd of MUTABLE_CRITICAL) {
      if (Math.abs(degreeInSign - cd) <= 1) {
        alerts.push("critical_mutable");
        break;
      }
    }
  }

  return alerts;
}
