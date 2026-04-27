/**
 * Lightweight shape validators for community chart JSON columns.
 *
 * Spec source:
 *   tasks/27.04.2026/community-chart-cache-and-regeneration/06-legacy-chart-data-guard.md
 *
 * Why this exists:
 *   Older project phases stored dummy or legacy chart JSON in the same
 *   columns the production generators write to:
 *     - community_family_members.natal_chart
 *     - monthly_transits.transit_data
 *     - relationship_charts.chart_data
 *   The new cache-aware reads must not blindly trust any non-null JSON.
 *   These validators check that a stored row matches the *current*
 *   production shape (see src/lib/astro/{natal-chart,transits,synastry}.ts).
 *
 * Pure module — no I/O. Safe to import from any route.
 */

// ── Tiny structural helpers ──────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// ── Natal chart ──────────────────────────────────────────────────────────────
// Shape from src/lib/astro/natal-chart.ts:
//   { planets: PlanetPosition[], ascendant, mc, generatedAt, birthTime, ageGroup }
//   PlanetPosition: { name, sign, degree, longitude, retrograde }

export function isValidNatalChart(chart: unknown): boolean {
  if (!isObject(chart)) return false;

  // Required top-level keys
  if (!Array.isArray(chart.planets)) return false;
  if (chart.planets.length === 0) return false;
  if (!isNonEmptyString(chart.generatedAt)) return false;
  // birthTime is `string | null` — only the *key* must exist
  if (!("birthTime" in chart)) return false;
  if (chart.ageGroup !== "child" && chart.ageGroup !== "adult") return false;

  // Validate every planet row has the required production fields. We loop
  // through ALL rows (rather than spot-check) so a partial/legacy row mixed
  // into a real chart still trips the guard.
  for (const p of chart.planets) {
    if (!isObject(p)) return false;
    if (!isNonEmptyString(p.name)) return false;
    if (!isNonEmptyString(p.sign)) return false;
    if (!isFiniteNumber(p.degree)) return false;
    if (!isFiniteNumber(p.longitude)) return false;
    if (typeof p.retrograde !== "boolean") return false;
  }

  return true;
}

// ── Monthly transit ──────────────────────────────────────────────────────────
// Shape from src/lib/astro/transits.ts:
//   { month: "YYYY-MM", planets: TransitPlanet[], highlights: string[], generatedAt }

export function isValidMonthlyTransit(
  transit: unknown,
  expectedMonth?: string
): boolean {
  if (!isObject(transit)) return false;

  if (!isNonEmptyString(transit.month)) return false;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(transit.month)) return false;
  if (expectedMonth && transit.month !== expectedMonth) return false;

  if (!Array.isArray(transit.planets)) return false;
  if (!Array.isArray(transit.highlights)) return false;
  if (!isNonEmptyString(transit.generatedAt)) return false;

  return true;
}

// ── Relationship chart ───────────────────────────────────────────────────────
// Shape from src/lib/astro/synastry.ts:
//   { personAName, personBName, aspects: Aspect[], score: number, summary, generatedAt }

export function isValidRelationshipChart(chart: unknown): boolean {
  if (!isObject(chart)) return false;

  if (!isNonEmptyString(chart.personAName)) return false;
  if (!isNonEmptyString(chart.personBName)) return false;
  if (!Array.isArray(chart.aspects)) return false;
  if (!isFiniteNumber(chart.score)) return false;
  if (!isNonEmptyString(chart.summary)) return false;
  if (!isNonEmptyString(chart.generatedAt)) return false;

  return true;
}
