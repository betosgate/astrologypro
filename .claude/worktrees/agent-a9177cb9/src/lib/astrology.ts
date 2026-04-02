/**
 * Session preparation insights based on astrological timing.
 * Uses simple date math — no ephemeris library required.
 */

/**
 * Mercury retrograde periods for 2026.
 * Source: standard astronomical projections.
 * Each entry is [start, end] as ISO date strings (inclusive).
 */
const MERCURY_RETROGRADE_2026: [string, string][] = [
  ["2026-01-26", "2026-02-16"], // Aquarius
  ["2026-05-22", "2026-06-14"], // Gemini
  ["2026-09-16", "2026-10-08"], // Libra / Virgo
];

/**
 * Key solar ingress / seasonal dates for 2026.
 */
const SEASONAL_DATES_2026: { date: string; label: string }[] = [
  { date: "2026-03-20", label: "Spring Equinox" },
  { date: "2026-06-21", label: "Summer Solstice" },
  { date: "2026-09-23", label: "Autumn Equinox" },
  { date: "2026-12-21", label: "Winter Solstice" },
];

function parseDate(d: string): Date {
  // Handle both "YYYY-MM-DD" and full ISO strings
  return new Date(d + (d.length === 10 ? "T00:00:00" : ""));
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function formatMonthDay(month: number, day: number): string {
  const d = new Date(2026, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/**
 * Generate data-driven insights for a session preparation panel.
 *
 * @param birthDate - Client birth date as "YYYY-MM-DD"
 * @param sessionDate - The date of the upcoming session
 * @returns Array of human-readable insight strings
 */
export function getSessionInsights(
  birthDate: string,
  sessionDate: Date
): string[] {
  const insights: string[] = [];
  const birth = parseDate(birthDate);
  const sessionDay = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate()
  );

  // --- Solar Return check (birthday within 30 days of session) ---
  const birthMonth = birth.getMonth(); // 0-indexed
  const birthDay = birth.getDate();

  // Build this year's birthday
  let solarReturn = new Date(
    sessionDay.getFullYear(),
    birthMonth,
    birthDay
  );
  // If this year's birthday already passed by more than 30 days, check next year
  if (daysBetween(sessionDay, solarReturn) < -30) {
    solarReturn = new Date(
      sessionDay.getFullYear() + 1,
      birthMonth,
      birthDay
    );
  }

  const daysUntilBirthday = daysBetween(sessionDay, solarReturn);
  if (daysUntilBirthday >= 0 && daysUntilBirthday <= 30) {
    const dateLabel = formatMonthDay(birthMonth + 1, birthDay);
    if (daysUntilBirthday === 0) {
      insights.push(
        `Solar Return today! It is the client's birthday (${dateLabel}). A powerful time to discuss the year ahead.`
      );
    } else {
      insights.push(
        `Solar Return approaching on ${dateLabel} (${daysUntilBirthday} days away). Consider discussing yearly themes.`
      );
    }
  }

  // --- Mercury Retrograde check ---
  const sessionISO = sessionDay.toISOString().slice(0, 10);
  for (const [start, end] of MERCURY_RETROGRADE_2026) {
    if (sessionISO >= start && sessionISO <= end) {
      insights.push(
        "Mercury is currently retrograde. Communication, technology, and travel themes may be especially relevant."
      );
      break;
    }
    // Also flag if retrograde starts within 7 days (shadow period)
    const startDate = parseDate(start);
    const daysUntilRx = daysBetween(sessionDay, startDate);
    if (daysUntilRx > 0 && daysUntilRx <= 7) {
      insights.push(
        `Mercury retrograde begins in ${daysUntilRx} day${daysUntilRx === 1 ? "" : "s"} (${start}). Pre-retrograde shadow themes may already be surfacing.`
      );
      break;
    }
  }

  // --- Seasonal / Solstice / Equinox proximity (within 7 days) ---
  for (const season of SEASONAL_DATES_2026) {
    const seDate = parseDate(season.date);
    const gap = Math.abs(daysBetween(sessionDay, seDate));
    if (gap <= 7) {
      if (gap === 0) {
        insights.push(
          `Today is the ${season.label}! A potent threshold for setting intentions and reflecting on seasonal shifts.`
        );
      } else {
        const direction =
          daysBetween(sessionDay, seDate) > 0 ? "approaching" : "just passed";
        insights.push(
          `The ${season.label} is ${direction} (${season.date}). Seasonal transition energy may be prominent.`
        );
      }
    }
  }

  return insights;
}
