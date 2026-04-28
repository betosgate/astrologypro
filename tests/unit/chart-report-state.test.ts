import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveMonthlyReportState,
  deriveNatalReportState,
  deriveRelationshipReportState,
} from "../../src/lib/community/chart-report-state";

const validNatalChart = {
  planets: [
    {
      name: "Sun",
      sign: "Aries",
      degree: 12,
      longitude: 12,
      retrograde: false,
    },
  ],
  generatedAt: "2026-04-27T00:00:00.000Z",
  birthTime: "10:00",
  ageGroup: "adult",
};

const validMonthlyTransit = {
  month: "2026-04",
  planets: [],
  highlights: [],
  generatedAt: "2026-04-27T00:00:00.000Z",
};

const validRelationshipChart = {
  personAName: "A",
  personBName: "B",
  aspects: [],
  score: 80,
  summary: "Compatible",
  generatedAt: "2026-04-27T00:00:00.000Z",
};

test("natal state views linked saved reports even when legacy chart JSON is absent", () => {
  assert.equal(
    deriveNatalReportState({
      natal_report_id: "00000000-0000-0000-0000-000000000001",
      natal_report_status: "generated",
      natal_chart: null,
    }),
    "generated",
  );
});

test("natal state treats generated status without report or valid legacy chart as stale", () => {
  assert.equal(
    deriveNatalReportState({
      natal_report_status: "generated",
      natal_chart: { placeholder: true },
    }),
    "stale",
  );
});

test("natal state does not treat valid legacy charts as generated without linkage", () => {
  assert.equal(
    deriveNatalReportState({
      natal_chart: validNatalChart,
      natal_status: null,
      natal_report_id: null,
      natal_report_status: null,
    }),
    "missing",
  );
});

test("monthly state views linked full reports and rejects generated placeholders", () => {
  assert.equal(
    deriveMonthlyReportState({
      full_report_id: "00000000-0000-0000-0000-000000000002",
      full_report_status: "generated",
      transit_data: null,
    }),
    "generated",
  );

  assert.equal(
    deriveMonthlyReportState({
      full_report_status: "generated",
      transit_data: { placeholder: true },
    }),
    "stale",
  );

  assert.equal(
    deriveMonthlyReportState({ transit_data: validMonthlyTransit }, "2026-04"),
    "generated",
  );
});

test("relationship state views linked reports and preserves valid legacy charts", () => {
  assert.equal(
    deriveRelationshipReportState({
      report_id: "00000000-0000-0000-0000-000000000003",
      report_status: "generated",
      chart_data: null,
    }),
    "generated",
  );

  assert.equal(
    deriveRelationshipReportState({
      report_status: "generated",
      chart_data: { placeholder: true },
    }),
    "stale",
  );

  assert.equal(
    deriveRelationshipReportState({ chart_data: validRelationshipChart }),
    "generated",
  );
});
