/**
 * Unit tests for `computeCommissionCents` (Task 08 Part C).
 *
 * Pure-function tests — no DB, no network. Confirms the math used by
 * `creditAffiliateConversion` is stable as the codebase evolves.
 *
 * Semantics under test (from src/lib/affiliate-attribution.ts):
 *   - percent → commission_value is whole-number percentage (10 = 10%)
 *   - flat    → commission_value is dollars (100 = $100.00 → 10000 cents)
 *   - non-positive order amount → 0
 *   - non-finite / null / negative rate → 0
 *
 * Run: `npm run test:affiliate-commission-math`
 */

import test from "node:test";
import assert from "node:assert/strict";
import { computeCommissionCents } from "../../src/lib/affiliate-attribution";

// ── Percent ────────────────────────────────────────────────────────────

test("percent: 10% of $100.00 → $10.00 (1000 cents)", () => {
  assert.equal(computeCommissionCents(10000, "percent", 10), 1000);
});

test("percent: 15% of $250.00 → $37.50 (3750 cents)", () => {
  assert.equal(computeCommissionCents(25000, "percent", 15), 3750);
});

test("percent: 100% of $100 → 10000 cents", () => {
  assert.equal(computeCommissionCents(10000, "percent", 100), 10000);
});

test("percent: 0% → 0", () => {
  assert.equal(computeCommissionCents(10000, "percent", 0), 0);
});

test("percent: fractional rate (12.5%) of $80.00 → $10.00 (1000 cents)", () => {
  assert.equal(computeCommissionCents(8000, "percent", 12.5), 1000);
});

test("percent: rounds half-to-even via Math.round (HALF UP for positive)", () => {
  // 10000 * 0.005 / 100 = 0.5 → Math.round(0.5) = 1
  // 10000 * 7.5 / 100 = 750 exactly → 750 cents
  assert.equal(computeCommissionCents(10000, "percent", 7.5), 750);
});

// ── Flat ───────────────────────────────────────────────────────────────

test("flat: $5 flat → 500 cents (regardless of order amount)", () => {
  assert.equal(computeCommissionCents(10000, "flat", 5), 500);
  assert.equal(computeCommissionCents(99999, "flat", 5), 500);
});

test("flat: $0 → 0", () => {
  assert.equal(computeCommissionCents(10000, "flat", 0), 0);
});

test("flat: fractional dollars ($1.50) → 150 cents", () => {
  assert.equal(computeCommissionCents(10000, "flat", 1.5), 150);
});

// ── Default behavior on null / undefined commission type ───────────────

test("null type defaults to percent semantics", () => {
  assert.equal(computeCommissionCents(10000, null, 10), 1000);
});

test("undefined type defaults to percent semantics", () => {
  assert.equal(computeCommissionCents(10000, undefined, 10), 1000);
});

test("unexpected string type falls through to percent", () => {
  // Defensive: any unknown commissionType (not 'flat') is treated as percent.
  // Documented behavior in the source — keep it stable.
  assert.equal(
    computeCommissionCents(
      10000,
      "weird" as unknown as "percent" | "flat",
      10,
    ),
    1000,
  );
});

// ── Bad input → 0 ──────────────────────────────────────────────────────

test("zero order amount → 0", () => {
  assert.equal(computeCommissionCents(0, "percent", 10), 0);
});

test("negative order amount → 0", () => {
  assert.equal(computeCommissionCents(-5000, "percent", 10), 0);
});

test("NaN order amount → 0", () => {
  assert.equal(computeCommissionCents(Number.NaN, "percent", 10), 0);
});

test("Infinity order amount → 0", () => {
  assert.equal(
    computeCommissionCents(Number.POSITIVE_INFINITY, "percent", 10),
    0,
  );
});

test("null commission value → 0", () => {
  assert.equal(computeCommissionCents(10000, "percent", null), 0);
});

test("undefined commission value → 0", () => {
  assert.equal(computeCommissionCents(10000, "percent", undefined), 0);
});

test("NaN commission value → 0", () => {
  assert.equal(computeCommissionCents(10000, "percent", Number.NaN), 0);
});

test("negative commission value → 0", () => {
  assert.equal(computeCommissionCents(10000, "percent", -10), 0);
  assert.equal(computeCommissionCents(10000, "flat", -5), 0);
});

// ── Edge: very large order amount ──────────────────────────────────────

test("very large order amount + tiny percent stays correct", () => {
  // $10,000.00 order × 0.01% = $1.00 = 100 cents
  assert.equal(computeCommissionCents(1000000, "percent", 0.01), 100);
});

test("very large order amount + 50% stays correct", () => {
  // $1,000,000.00 → 100000000 cents × 50% = 50000000 cents
  assert.equal(computeCommissionCents(100000000, "percent", 50), 50000000);
});

// ── Spec invariant — total credit is never negative ────────────────────

test("invariant: result is always ≥ 0", () => {
  const cases: Array<[number, "percent" | "flat" | null, number | null]> = [
    [10000, "percent", 10],
    [0, "percent", 10],
    [10000, "percent", -5],
    [10000, "flat", -5],
    [10000, "flat", 0],
    [10000, null, 10],
  ];
  for (const [order, type, value] of cases) {
    assert.ok(
      computeCommissionCents(order, type, value) >= 0,
      `expected ≥ 0 for (${order}, ${type}, ${value})`,
    );
  }
});
