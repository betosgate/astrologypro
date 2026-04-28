type JsonRecord = Record<string, any>;

export interface SavedReportHydration {
  results: Record<string, any> | null;
  natalSvg: string | null;
  natalSvgTransit: string | null;
  natalSvgP2: string | null;
  natalSvgTransitP2: string | null;
  transitChartSvg: string | null;
  returnDate: string | null;
  showChartButton: boolean;
}

const NON_AI_RESPONSE_KEYS = new Set([
  "ai_interpretations",
  "formData",
  "form_data",
  "astro_api_data",
  "natal_chart",
  "freeNatalWheelChart",
  "freeNatalWheelChartForTransit",
  "freeNatalWheelChartForTrasit",
  "freeNatalWheelChartP2",
  "freeNatalWheelChartForTransitP2",
  "freeNatalWheelChartForTrasitP2",
  "returnDate",
]);

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function hasKeys(value: unknown): value is JsonRecord {
  const record = asRecord(value);
  return !!record && Object.keys(record).length > 0;
}

function asNonEmptyRecord(value: unknown): JsonRecord | null {
  return hasKeys(value) ? (value as JsonRecord) : null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const candidates = [
    trimmed,
    trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim(),
  ];

  for (const candidate of candidates) {
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // keep original value when it is plain prose or malformed legacy output
    }
  }

  return value;
}

function normalizeDeep(value: unknown): unknown {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) return parsed.map((item) => normalizeDeep(item));
  if (!parsed || typeof parsed !== "object") return parsed;

  return Object.fromEntries(
    Object.entries(parsed as JsonRecord).map(([key, entry]) => [key, normalizeDeep(entry)])
  );
}

function collectAiSections(aiResponse: JsonRecord): JsonRecord {
  const nestedAi = asRecord(aiResponse.ai_interpretations);
  const sections: JsonRecord = nestedAi ? { ...normalizeDeep(nestedAi) as JsonRecord } : {};

  for (const [key, value] of Object.entries(aiResponse)) {
    if (NON_AI_RESPONSE_KEYS.has(key)) continue;
    sections[key] = normalizeDeep(value);
  }

  return sections;
}

function pickAstroApiData(row: JsonRecord, aiResponse: JsonRecord): JsonRecord | null {
  return (
    asNonEmptyRecord(row.astro_api_data) ??
    asNonEmptyRecord(aiResponse.astro_api_data) ??
    null
  );
}

function pickNatalChart(row: JsonRecord, aiResponse: JsonRecord): JsonRecord | null {
  return (
    asNonEmptyRecord(row.natal_chart) ??
    asNonEmptyRecord(aiResponse.natal_chart) ??
    null
  );
}

function pickNatalData(tabSlug: string, astroApiData: JsonRecord | null): JsonRecord | null {
  if (!astroApiData) return null;

  if (tabSlug === "romantic_forecast_report_tropical_v2" ||
    tabSlug === "friendship_report_tropical_v2" ||
    tabSlug === "business_partner_v2") {
    return asNonEmptyRecord(astroApiData.self) ?? asNonEmptyRecord(astroApiData.natal_chart_data);
  }

  return (
    asNonEmptyRecord(astroApiData.natal_chart_data) ??
    asNonEmptyRecord(astroApiData.self) ??
    astroApiData
  );
}

function hydrateCommon(results: JsonRecord, tabSlug: string, astroApiData: JsonRecord | null) {
  const natalData = pickNatalData(tabSlug, astroApiData);
  if (natalData) results.natal_chart_data = natalData;
}

function hydrateTransit(results: JsonRecord, tabSlug: string, row: JsonRecord, astroApiData: JsonRecord | null) {
  if (!astroApiData) return;

  const transitData =
    astroApiData.transit_data ??
    astroApiData.transits ??
    astroApiData.astrology_report_weekly ??
    astroApiData.astrology_report_monthly ??
    astroApiData;
  const lunarMetrics =
    astroApiData.lunar_metrics ??
    astroApiData.lunar_data ??
    asRecord(transitData)?.lunar_data ??
    asRecord(transitData)?.lunar_metrics;

  results.transit_data = transitData;
  if (lunarMetrics) results.lunar_metrics = lunarMetrics;

  const formData = asRecord(row.form_data);
  const futureDate =
    formData?.futureWeek ??
    formData?.future_week ??
    formData?.futureMonth ??
    formData?.future_month ??
    formData?.targetMonth ??
    formData?.target_month ??
    astroApiData.future_transit_date;

  if (futureDate) {
    results.is_future_transit = true;
    results.future_transit_date = futureDate;
  } else {
    results.is_future_transit = Boolean(astroApiData.is_future_transit);
  }

  if (tabSlug === "tropical_transits_monthly_v3" && !results.lunar_metrics && asRecord(transitData)?.lunar_data) {
    results.lunar_metrics = asRecord(transitData)?.lunar_data;
  }
}

function hydrateSolarReturn(results: JsonRecord, astroApiData: JsonRecord | null) {
  if (!astroApiData) return;

  const keys = [
    "solar_return_details",
    "solar_return_planets",
    "solar_return_cusps",
    "solar_return_aspects",
    "solar_return_planet_report",
    "solar_return_aspects_report",
  ];

  for (const key of keys) {
    if (astroApiData[key] != null) results[key] = astroApiData[key];
  }
}

function hydrateRelationship(results: JsonRecord, astroApiData: JsonRecord | null) {
  if (!astroApiData) return;

  if (astroApiData.synastry != null) results.synastry = astroApiData.synastry;
  if (astroApiData.composite != null) results.composite = astroApiData.composite;
  if (astroApiData.self != null) results.natal_chart_data = astroApiData.self;
  if (astroApiData.partner != null) results.natal_chart_data_p2 = astroApiData.partner;
}

function hydratePlanetReturn(results: JsonRecord, tabSlug: string, aiSections: JsonRecord) {
  if (aiSections[tabSlug] != null) {
    results[tabSlug] = aiSections[tabSlug];
  }
}

export function hydrateSavedAstroReport(input: unknown, tabSlug: string): SavedReportHydration {
  const empty: SavedReportHydration = {
    results: null,
    natalSvg: null,
    natalSvgTransit: null,
    natalSvgP2: null,
    natalSvgTransitP2: null,
    transitChartSvg: null,
    returnDate: null,
    showChartButton: false,
  };
  const row = asRecord(input);
  if (!row) return empty;

  const aiResponse = asRecord(row.ai_response) ?? {};
  const aiSections = collectAiSections(aiResponse);
  const astroApiData = pickAstroApiData(row, aiResponse);
  const natalChart = pickNatalChart(row, aiResponse);
  const results: JsonRecord = {};

  if (Object.keys(aiSections).length) {
    results.ai_interpretations = aiSections;
  }

  hydrateCommon(results, tabSlug, astroApiData);

  if (tabSlug === "tropical_transits_weekly_v2" || tabSlug === "tropical_transits_monthly_v3") {
    hydrateTransit(results, tabSlug, row, astroApiData);
  }

  if (tabSlug === "solar_return_v2") {
    hydrateSolarReturn(results, astroApiData);
  }

  if (tabSlug === "romantic_forecast_report_tropical_v2" ||
    tabSlug === "friendship_report_tropical_v2" ||
    tabSlug === "business_partner_v2") {
    hydrateRelationship(results, astroApiData);
  }

  if (["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(tabSlug)) {
    hydratePlanetReturn(results, tabSlug, aiSections);
  }

  const natalSvg = firstText(
    row.free_natal_wheel_chart,
    natalChart?.chart_url,
    natalChart?.self?.chart_url,
    aiResponse.natal_chart?.chart_url,
    aiResponse.natal_chart?.self?.chart_url
  );
  const natalSvgTransit = firstText(
    row.free_natal_wheel_chart_transit,
    aiResponse.freeNatalWheelChartForTransit,
    aiResponse.freeNatalWheelChartForTrasit,
    aiResponse.freeNatalWheelChart
  );
  const natalSvgP2 = firstText(
    row.free_natal_wheel_chart_p2,
    row.free_natal_wheel_chart_partner,
    natalChart?.partner?.chart_url,
    aiResponse.natal_chart?.partner?.chart_url
  );
  const natalSvgTransitP2 = firstText(
    row.free_natal_wheel_chart_transit_p2,
    aiResponse.freeNatalWheelChartForTransitP2,
    aiResponse.freeNatalWheelChartForTrasitP2,
    aiResponse.freeNatalWheelChartP2
  );
  const transitChartSvg = firstText(
    row.free_natal_wheel_chart_transit,
    aiResponse.freeNatalWheelChartForTransit,
    aiResponse.freeNatalWheelChartForTrasit,
    aiResponse.freeNatalWheelChart
  );
  const returnDate = firstText(aiResponse.returnDate, aiSections[tabSlug]?.returnDate);

  return {
    results: Object.keys(results).length ? results : null,
    natalSvg,
    natalSvgTransit,
    natalSvgP2,
    natalSvgTransitP2,
    transitChartSvg,
    returnDate,
    showChartButton: Boolean(natalSvg || natalSvgTransit || natalSvgP2 || natalSvgTransitP2 || transitChartSvg),
  };
}
