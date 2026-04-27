// Shared period parser used by every affiliate-reports endpoint.
// Accepts `?period=30d|90d|1y|all`; defaults to `30d`. Returns the
// ISO-string lower bound for a `created_at >= since` filter, or `null`
// for "all-time" (caller skips the filter).

export type ReportPeriod = "30d" | "90d" | "1y" | "all";

export function parseReportPeriod(input: string | null): ReportPeriod {
  if (input === "30d" || input === "90d" || input === "1y" || input === "all") {
    return input;
  }
  return "30d";
}

export function reportPeriodSince(period: ReportPeriod): string | null {
  const now = new Date();
  switch (period) {
    case "30d":
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case "90d":
      now.setDate(now.getDate() - 90);
      return now.toISOString();
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString();
    case "all":
      return null;
  }
}
