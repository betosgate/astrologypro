import test from "node:test";
import assert from "node:assert/strict";

import { hydrateSavedAstroReport } from "../../src/app/admin/horoscope/saved-report-data";

test("saved monthly transit reports keep AI text when raw monthly data uses the same keys", () => {
  const aiTransitCards = [
    {
      date: "2026-04-01",
      transits: [
        {
          aspecttitle: "Mars Square Pluto: Intense Relationship Power Currents",
          interpretation: "Relationship dynamics can feel charged in a way that is impossible to ignore.",
        },
      ],
    },
  ];
  const aiLunarMetrics = {
    month: "April 2026",
    moonsign: "Pisces",
    moon_sign_interpretation: "With the Moon in Pisces, the emotional field is especially receptive.",
  };
  const rawTransitData = {
    unique_transits: [
      {
        date: "2026-04-01",
        type: "Square",
        natal_planet: "Pluto",
        transit_planet: "Mars",
      },
    ],
  };
  const rawLunarMetrics = {
    month: "1-4-2026",
    moon_sign: "Pisces",
    moon_phase: "New Moon",
  };

  const hydrated = hydrateSavedAstroReport(
    {
      form_data: {
        futureMonth: "2026-04-01",
      },
      ai_response: {
        ai_interpretations: {
          tropical_transits_monthly: aiTransitCards,
          lunar_metrics: aiLunarMetrics,
        },
        tropical_transits_monthly: rawTransitData,
        lunar_metrics: rawLunarMetrics,
      },
      astro_api_data: {
        transit_data: rawTransitData,
        lunar_metrics: rawLunarMetrics,
      },
    },
    "tropical_transits_monthly_v3",
  );

  assert.deepEqual(
    hydrated.results?.ai_interpretations?.tropical_transits_monthly,
    aiTransitCards,
  );
  assert.deepEqual(
    hydrated.results?.ai_interpretations?.lunar_metrics,
    aiLunarMetrics,
  );
  assert.deepEqual(hydrated.results?.transit_data, rawTransitData);
  assert.deepEqual(hydrated.results?.lunar_metrics, rawLunarMetrics);
});
