export type MonthlyTransitReportSummaryItem = {
  date: string | null;
  title: string;
  description: string;
};

type JsonRecord = Record<string, unknown>;

const SUMMARY_TEXT_KEYS = [
  "interpretation",
  "interpret",
  "body_text",
  "body",
  "content",
  "description",
  "text",
  "forecast",
];

const SUMMARY_TITLE_KEYS = [
  "aspecttitle",
  "aspectTitle",
  "aspect_title",
  "heading",
  "title",
  "aspect",
];

const SUMMARY_DATE_KEYS = ["date", "transit_date", "month", "period"];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
    .replace(/^json\s*/i, "")
    .trim();

  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function pickSummaryText(record: JsonRecord): string {
  for (const key of SUMMARY_TEXT_KEYS) {
    const normalized = normalizeText(record[key]);
    if (normalized) return normalized;
  }
  return "";
}

function firstSentenceBlock(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const matches = normalized.match(/[^.!?]+[.!?]+/g);
  if (matches?.length) {
    return matches.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
  }

  return normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
}

function extractMonthlyAiSource(savedReport: unknown): unknown {
  if (!isRecord(savedReport)) return null;

  const aiResponse = isRecord(savedReport.ai_response) ? savedReport.ai_response : null;
  const aiSections =
    aiResponse && isRecord(aiResponse.ai_interpretations)
      ? aiResponse.ai_interpretations
      : null;

  return (
    aiSections?.tropical_transits_monthly ??
    aiResponse?.tropical_transits_monthly ??
    savedReport.ai_response ??
    null
  );
}

export function buildMonthlyTransitSummaryFromReport(
  savedReport: unknown,
  maxItems = 3
): MonthlyTransitReportSummaryItem[] {
  const source = extractMonthlyAiSource(savedReport);
  const items: MonthlyTransitReportSummaryItem[] = [];

  function collect(
    node: unknown,
    inheritedDate: string | null = null,
    inheritedTitle: string | null = null
  ) {
    if (items.length >= maxItems) return;

    const parsed = parseMaybeJson(node);
    if (parsed !== node) {
      collect(parsed, inheritedDate, inheritedTitle);
      return;
    }

    if (Array.isArray(node)) {
      let pendingTitle: string | null = null;
      let pendingDate: string | null = inheritedDate;
      for (const entry of node) {
        const parsedEntry = parseMaybeJson(entry);
        if (isRecord(parsedEntry)) {
          const entryTitle = pickString(parsedEntry, SUMMARY_TITLE_KEYS);
          const entryDate = pickString(parsedEntry, SUMMARY_DATE_KEYS) ?? pendingDate;
          const entryText = pickSummaryText(parsedEntry);

          if (entryTitle && !entryText) {
            pendingTitle = entryTitle;
            pendingDate = entryDate;
            continue;
          }

          collect(parsedEntry, entryDate, pendingTitle ?? inheritedTitle);
          pendingTitle = null;
          pendingDate = inheritedDate;
        } else {
          collect(parsedEntry, inheritedDate, pendingTitle ?? inheritedTitle);
        }
        if (items.length >= maxItems) return;
      }
      return;
    }

    if (!isRecord(node)) return;

    const date = pickString(node, SUMMARY_DATE_KEYS) ?? inheritedDate;

    for (const key of ["transits", "items", "entries", "data"]) {
      if (Array.isArray(node[key])) {
        collect(node[key], date);
        if (items.length >= maxItems) return;
      }
    }

    const title =
      pickString(node, SUMMARY_TITLE_KEYS) ?? inheritedTitle ?? "Transit Highlight";
    const description = firstSentenceBlock(pickSummaryText(node));

    if (!description) return;

    items.push({
      date,
      title,
      description,
    });
  }

  collect(source);
  return items;
}
