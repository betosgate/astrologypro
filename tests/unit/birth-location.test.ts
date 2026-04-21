import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatBirthPlace } from "../../src/lib/community/birth-location";

describe("formatBirthPlace", () => {
  it("does not duplicate the country when city already includes it", () => {
    assert.equal(
      formatBirthPlace(
        "Miami, FL, United States of America",
        "United States of America",
      ),
      "Miami, FL, United States of America",
    );
  });

  it("appends country when city does not include it", () => {
    assert.equal(
      formatBirthPlace("Miami, FL", "United States of America"),
      "Miami, FL, United States of America",
    );
  });

  it("handles city-only and country-only values", () => {
    assert.equal(formatBirthPlace("Miami, FL", null), "Miami, FL");
    assert.equal(formatBirthPlace(null, "United States of America"), "United States of America");
  });

  it("matches duplicated country case-insensitively with whitespace normalized", () => {
    assert.equal(
      formatBirthPlace("Miami, FL,   United States of America", " united states of america "),
      "Miami, FL,   United States of America",
    );
  });
});
