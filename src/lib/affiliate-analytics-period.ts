/**
 * Shared helper for the standard `?period=30d|90d|365d|all` filter used
 * across every Phase 3 analytics API route. Returns the cutoff Date that
 * SQL queries should compare `created_at` / `converted_at` against.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/00-master-task.md §3
 */
export type AnalyticsPeriod = "30d" | "90d" | "365d" | "all";

const VALID = new Set<AnalyticsPeriod>(["30d", "90d", "365d", "all"]);

export function parsePeriod(input: string | null | undefined): AnalyticsPeriod {
  if (input && (VALID as Set<string>).has(input)) {
    return input as AnalyticsPeriod;
  }
  return "30d";
}

export function periodCutoff(period: AnalyticsPeriod): Date {
  if (period === "all") return new Date(0);
  const days = period === "365d" ? 365 : period === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function periodCutoffIso(input: string | null | undefined): {
  period: AnalyticsPeriod;
  cutoff: string;
} {
  const period = parsePeriod(input);
  return { period, cutoff: periodCutoff(period).toISOString() };
}
