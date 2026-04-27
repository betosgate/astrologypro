/**
 * Shared CTA state model for community chart/report surfaces.
 *
 * Spec source:
 *   tasks/27.04.2026/community-saved-chart-report-lifecycle/07-add-shared-cta-state-model.md
 *
 * Pure module — no I/O, no React. Safe to import from server pages,
 * route handlers, and client components.
 *
 * Why this exists:
 *   /community/family today branches Generate-vs-View on raw
 *   `natal_chart` truthiness. That misses three cases:
 *     1. The row's natal_chart JSON is legacy/dummy (Task 09)
 *     2. The new `natal_report_id` is set but the report is stale
 *        (Task 04 lifecycle)
 *     3. Status is `locked_for_review` (governance) or `failed` (retry)
 *
 *   This module produces a single deterministic `ChartReportState` per
 *   row so every surface — family list, dashboard cards, transits,
 *   charts — speaks the same vocabulary and renders consistent CTAs.
 */

import {
  isValidNatalChart,
  isValidMonthlyTransit,
  isValidRelationshipChart,
} from "@/lib/community/chart-validators";

// ── State + CTA model ────────────────────────────────────────────────────

export type ChartReportState =
  | "missing"
  | "generating"
  | "generated"
  | "failed"
  | "stale"
  | "locked_for_review";

export type ChartReportCtaKind = "generate" | "view" | "regenerate" | "retry" | "generating" | "locked";

export interface CtaDescriptor {
  kind: ChartReportCtaKind;
  /** Default short label suitable for a button face. */
  label: string;
  /** Whether the primary action should be disabled (e.g. while pending). */
  disabled: boolean;
}

/**
 * Maps a state to the primary CTA users should see. Surfaces with custom
 * copy can use this as a starting point and override the label.
 */
export function ctaForState(state: ChartReportState): CtaDescriptor {
  switch (state) {
    case "missing":
      return { kind: "generate", label: "Generate", disabled: false };
    case "generating":
      return { kind: "generating", label: "Generating…", disabled: true };
    case "generated":
      return { kind: "view", label: "View", disabled: false };
    case "failed":
      return { kind: "retry", label: "Retry", disabled: false };
    case "stale":
      return { kind: "regenerate", label: "Regenerate", disabled: false };
    case "locked_for_review":
      // Governance still surfaces a viewable chart while moderation runs;
      // surfaces that prefer to mark the row as locked can branch on
      // `kind === "locked"` here.
      return { kind: "locked", label: "Locked for review", disabled: false };
  }
}

// ── Inputs (loose row shapes — only the fields each derive function needs)

export interface NatalReportRow {
  natal_chart?: unknown;
  natal_status?: string | null;
  natal_report_id?: string | null;
  natal_report_status?: string | null;
}

export interface MonthlyReportRow {
  /** Month key the row is for, e.g. "2026-04". */
  month?: string | null;
  transit_data?: unknown;
  generation_status?: string | null;
  full_report_id?: string | null;
  full_report_status?: string | null;
}

export interface RelationshipReportRow {
  chart_data?: unknown;
  invalidated_at?: string | null;
  report_id?: string | null;
  report_status?: string | null;
}

// ── Derive functions ─────────────────────────────────────────────────────

/**
 * Resolve the canonical state for a family member's natal chart.
 *
 * Priority order:
 *   1. The new `natal_report_status` (populated only by the saved-report
 *      lifecycle) — this is the source of truth once domain linkage rolls
 *      in.
 *   2. Otherwise, the legacy `natal_status` column the governance flow
 *      writes (`generated` / `locked_for_review` / `failed` / etc.) plus
 *      a shape check on `natal_chart` (legacy/dummy rows return "stale").
 *   3. Falls back to "missing".
 *
 * Legacy compatibility (Task 09): a row with no `natal_report_id` but a
 * shape-valid `natal_chart` and `natal_status='generated'` still returns
 * "generated" so existing users don't lose chart access during rollout.
 */
export function deriveNatalReportState(row: NatalReportRow): ChartReportState {
  const explicit = normalizeStatus(row.natal_report_status);
  if (explicit) return explicit;

  const legacyStatus = (row.natal_status ?? "").toLowerCase();
  if (legacyStatus === "locked_for_review") return "locked_for_review";
  if (legacyStatus === "failed") return "failed";
  if (legacyStatus === "queued" || legacyStatus === "pending") return "generating";

  if (legacyStatus === "generated") {
    if (isValidNatalChart(row.natal_chart)) return "generated";
    return "stale";
  }

  return "missing";
}

/**
 * Resolve canonical state for the lightweight monthly transit row plus
 * its optional saved-full-report linkage. The full-report linkage drives
 * the View action on /community/transits/detailed, while the lightweight
 * shape gates the summary cards on /community/transits.
 */
export function deriveMonthlyReportState(
  row: MonthlyReportRow,
  expectedMonth?: string
): ChartReportState {
  const explicit = normalizeStatus(row.full_report_status);
  if (explicit) return explicit;

  const genStatus = (row.generation_status ?? "").toLowerCase();
  if (genStatus === "pending") return "generating";
  if (genStatus === "failed") return "failed";

  if (genStatus === "generated" || genStatus === "notified") {
    if (isValidMonthlyTransit(row.transit_data, expectedMonth)) return "generated";
    return "stale";
  }

  return "missing";
}

/**
 * Resolve canonical state for a relationship chart row. Honors the new
 * `report_status` linkage when present, then falls back to the legacy
 * `chart_data` + `invalidated_at` semantics from the synastry flow.
 */
export function deriveRelationshipReportState(
  row: RelationshipReportRow
): ChartReportState {
  const explicit = normalizeStatus(row.report_status);
  if (explicit) return explicit;

  if (row.invalidated_at) return "stale";
  if (row.chart_data == null) return "missing";
  if (!isValidRelationshipChart(row.chart_data)) return "stale";
  return "generated";
}

// ── Helpers ───────────────────────────────────────────────────────────────

const VALID_STATES = new Set<ChartReportState>([
  "missing",
  "generating",
  "generated",
  "failed",
  "stale",
  "locked_for_review",
]);

/**
 * Coerces a free-form status string from a domain row into the canonical
 * `ChartReportState`. Returns null when the value isn't one of the
 * recognized states so callers fall through to the legacy derivation.
 */
function normalizeStatus(value: string | null | undefined): ChartReportState | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  return (VALID_STATES as Set<string>).has(lower)
    ? (lower as ChartReportState)
    : null;
}
