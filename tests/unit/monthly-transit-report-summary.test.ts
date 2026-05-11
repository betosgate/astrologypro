import assert from "node:assert/strict";
import test from "node:test";

import { buildMonthlyTransitSummaryFromReport } from "../../src/lib/community/monthly-transit-report-summary";

test("builds summary items from saved monthly AI interpretation records", () => {
  const summary = buildMonthlyTransitSummaryFromReport({
    ai_response: {
      ai_interpretations: {
        tropical_transits_monthly: [
          {
            date: "2026-05-12",
            aspecttitle: "Jupiter trine Sun",
            interpretation:
              "This is a confident growth window. Visibility and opportunity are easier to access this month. Extra text should be trimmed.",
          },
        ],
      },
    },
  });

  assert.deepEqual(summary, [
    {
      date: "2026-05-12",
      title: "Jupiter trine Sun",
      description:
        "This is a confident growth window. Visibility and opportunity are easier to access this month.",
    },
  ]);
});

test("pairs adjacent title-only and interpretation-only monthly records", () => {
  const summary = buildMonthlyTransitSummaryFromReport({
    ai_response: {
      ai_interpretations: {
        tropical_transits_monthly: JSON.stringify([
          { aspecttitle: "Mars conjunct Saturn" },
          {
            interpretation:
              "Patience matters around pressure, timing, and responsibility.",
          },
        ]),
      },
    },
  });

  assert.equal(summary[0]?.title, "Mars conjunct Saturn");
  assert.equal(
    summary[0]?.description,
    "Patience matters around pressure, timing, and responsibility."
  );
});
