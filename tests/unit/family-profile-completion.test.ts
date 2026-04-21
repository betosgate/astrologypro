import assert from "node:assert/strict";
import test from "node:test";

import { calcFamilyProfileCompletion } from "../../src/lib/community/family-profile-completion";

const completeProfile = {
  full_name: "Louis Williams",
  date_of_birth: "2000-05-31",
  birth_time: "13:00:00",
  birth_city: "Miami, FL, United States of America",
  birth_country: "United States of America",
  relationship: "self",
};

test("complete family profile returns 100 without a natal chart", () => {
  const completion = calcFamilyProfileCompletion({
    ...completeProfile,
    natal_chart: null,
  });

  assert.equal(completion.percent, 100);
  assert.deepEqual(completion.missing, []);
});

test("natal chart does not affect family profile completion", () => {
  const withoutChart = calcFamilyProfileCompletion({
    ...completeProfile,
    natal_chart: null,
  });
  const withChart = calcFamilyProfileCompletion({
    ...completeProfile,
    natal_chart: { planets: [] },
  });

  assert.equal(withoutChart.percent, withChart.percent);
  assert.deepEqual(withoutChart.missing, withChart.missing);
});

test("missing birth country lowers completion", () => {
  const completion = calcFamilyProfileCompletion({
    ...completeProfile,
    birth_country: "",
  });

  assert.equal(completion.percent, 84);
  assert.deepEqual(completion.missing, ["Birth country"]);
});

test("birth time unknown counts as birth time complete", () => {
  const completion = calcFamilyProfileCompletion({
    ...completeProfile,
    birth_time: null,
    birth_time_unknown: true,
  });

  assert.equal(completion.percent, 100);
  assert.deepEqual(completion.missing, []);
});
