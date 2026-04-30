/**
 * Birth-data readiness — single source of truth for "can we compute a
 * chart product for this family member?".
 *
 * Spec source:
 *   tasks/30.04.2026/community-independent-chart-products/
 *     02-decouple-monthly-summary-eligibility.md
 *     03-compute-monthly-summary-from-birth-data.md
 *
 * Why this exists:
 *   The community surface used to gate monthly transits / relationship
 *   reports on `natal_status='generated' && natal_chart != null`. That
 *   coupled "can the user see this product" to "did we already cache a
 *   natal chart product on this row". The admin Horoscope Toolkit doesn't
 *   need that — it computes whatever report you ask for directly from
 *   birth fields. This module brings the community side in line: the
 *   real prerequisite is complete birth data.
 *
 *   Saved natal_chart JSON, when present and valid, is treated as a
 *   read-through cache. Missing or stale chart data simply means we
 *   recompute on the fly from birth fields — never a hard gate, never
 *   a side-effect write to the natal_chart column.
 *
 * Pure module — no DB, no fetch. Safe to import from server routes,
 * server components, and shared service code.
 */

import {
  generateNatalChart,
  type NatalChartData,
} from "@/lib/astro/natal-chart";

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * The minimal birth-data slice every community chart product needs.
 * Mirrors the columns on `community_family_members` so callers can pass
 * a row directly without re-shaping it.
 */
export interface BirthDataInput {
  date_of_birth: string | null | undefined;
  birth_time: string | null | undefined;
  birth_city: string | null | undefined;
  birth_country: string | null | undefined;
  birth_lat: number | string | null | undefined;
  birth_lng: number | string | null | undefined;
  age_group?: "child" | "adult" | string | null | undefined;
}

/**
 * Field-level readiness result. `missing` lists the canonical field
 * names that aren't usable yet — the UI uses this to render a per-field
 * "Complete Birth Details" hint without re-implementing the rules here.
 */
export interface BirthDataReadiness {
  complete: boolean;
  missing: BirthDataField[];
}

export type BirthDataField =
  | "date_of_birth"
  | "birth_time"
  | "birth_city"
  | "birth_country"
  | "birth_lat"
  | "birth_lng";

// ── Helpers ────────────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Coerce a Supabase numeric column (which can come back as either a
 * `number` or a numeric-string depending on driver/version) into a
 * finite number, or return null when the value is unusable.
 */
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the per-field readiness for a family member's birth data.
 *
 * The product rule from the master task:
 *   complete birth data = every required field present and well-formed.
 * This is the *only* gate community chart products should consult when
 * deciding "can this member be in the workflow at all?".
 */
export function computeBirthDataReadiness(
  fm: BirthDataInput
): BirthDataReadiness {
  const missing: BirthDataField[] = [];

  if (!isNonEmptyString(fm.date_of_birth)) missing.push("date_of_birth");
  if (!isNonEmptyString(fm.birth_time)) missing.push("birth_time");
  if (!isNonEmptyString(fm.birth_city)) missing.push("birth_city");
  if (!isNonEmptyString(fm.birth_country)) missing.push("birth_country");
  if (toFiniteNumber(fm.birth_lat) == null) missing.push("birth_lat");
  if (toFiniteNumber(fm.birth_lng) == null) missing.push("birth_lng");

  return { complete: missing.length === 0, missing };
}

/**
 * Boolean shorthand. Use when the call site only needs a yes/no gate
 * (e.g. eligibility filtering in a list query). Use
 * `computeBirthDataReadiness` when the UI needs to render which fields
 * are still missing.
 */
export function isBirthDataComplete(fm: BirthDataInput): boolean {
  return computeBirthDataReadiness(fm).complete;
}

/**
 * Build a `NatalChartData` from a family-member row's birth fields.
 *
 * Throws when the row is incomplete — call sites must always check
 * `isBirthDataComplete` (or equivalent) first. The throw is deliberate:
 * silently returning a half-computed chart would corrupt downstream
 * caches and validators.
 *
 * IMPORTANT: This does NOT write back to `community_family_members.natal_chart`.
 * Monthly-transit / synastry compute paths use the result in memory only
 * so the natal chart product remains its own explicit user action.
 */
export function buildNatalChartFromBirthData(fm: BirthDataInput): NatalChartData {
  const readiness = computeBirthDataReadiness(fm);
  if (!readiness.complete) {
    throw new Error(
      `Cannot build natal chart — incomplete birth data: ${readiness.missing.join(", ")}`
    );
  }

  const lat = toFiniteNumber(fm.birth_lat);
  const lng = toFiniteNumber(fm.birth_lng);
  if (lat == null || lng == null) {
    // Defensive: readiness already covered this, but the type-narrowing
    // doesn't carry across the helper boundary.
    throw new Error("Cannot build natal chart — invalid coordinates");
  }

  const ageGroup: "child" | "adult" =
    fm.age_group === "child" ? "child" : "adult";

  return generateNatalChart({
    dateOfBirth: fm.date_of_birth as string,
    birthTime: fm.birth_time as string,
    lat,
    lng,
    ageGroup,
  });
}
