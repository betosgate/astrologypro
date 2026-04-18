/**
 * Unit tests for the toolkit mapping + rollout gate (CLAUDE.md §6).
 *
 * These cover the pure helpers that decide:
 *   - which sold services have a toolkit mapping today
 *   - which services need partner birth data
 *   - what the diviner-facing session URL is for a booking
 *   - whether the whole feature is enabled (env-flag rollout gate)
 *
 * Async helpers (resolveTarotSpreadId, resolveToolkitForBooking) hit Supabase
 * and are exercised in integration tests separately — not here.
 *
 * Run: `npx tsx --test tests/unit/service-toolkit-mapping.test.ts`
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  ASTROLOGY_TAB_MAP,
  TAROT_SPREAD_NAME_MAP,
  TWO_PERSON_ASTROLOGY_SLUGS,
  getSessionLinkForBooking,
  isToolkitEnabled,
  isToolkitMappable,
  requiresPartnerBirthData,
} from "@/lib/service-toolkit-mapping";

const ENV_KEY = "NEXT_PUBLIC_TOOLKIT_SESSION_ENABLED";

function withEnv<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env[ENV_KEY];
  if (value === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = value;
  }
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = prev;
    }
  }
}

// ─── Catalogue invariants ────────────────────────────────────────────────────

test("astrology map covers all 12 sold templates", () => {
  // Per product decision 2026-04-18: every astrology template ships with a tab.
  const expected = [
    "nativity-birth-chart",
    "solar-return",
    "weekly-transits",
    "monthly-transits-lunar-return",
    "romantic-relationships",
    "friendship-relationships",
    "business-relationship",
    "predictive-event-horary",
    "jupiter-return",
    "saturn-return",
    "mars-return",
    "uranus-opposition",
  ];
  for (const slug of expected) {
    assert.ok(
      slug in ASTROLOGY_TAB_MAP,
      `astrology slug ${slug} should be mapped`,
    );
    assert.equal(typeof ASTROLOGY_TAB_MAP[slug], "string");
    assert.notEqual(ASTROLOGY_TAB_MAP[slug], "");
  }
});

test("tarot map intentionally covers ONLY the 3 already-matched spreads", () => {
  // Other 4 sold tarot services are intentional gaps — UI must hide their links.
  // See product decision in service-toolkit-mapping.ts file header.
  const matched = [
    "3-card-basic-question-spread",
    "7-card-horseshoe-spread-major-read",
    "10-card-celtic-cross-major-read",
  ];
  assert.equal(Object.keys(TAROT_SPREAD_NAME_MAP).length, 3);
  for (const slug of matched) {
    assert.ok(slug in TAROT_SPREAD_NAME_MAP, `tarot slug ${slug} should be mapped`);
  }
});

test("two-person astrology set matches the 3 relationship services", () => {
  assert.equal(TWO_PERSON_ASTROLOGY_SLUGS.size, 3);
  assert.ok(TWO_PERSON_ASTROLOGY_SLUGS.has("romantic-relationships"));
  assert.ok(TWO_PERSON_ASTROLOGY_SLUGS.has("friendship-relationships"));
  assert.ok(TWO_PERSON_ASTROLOGY_SLUGS.has("business-relationship"));
});

// ─── isToolkitMappable ───────────────────────────────────────────────────────

test("isToolkitMappable: known astrology slug is mappable", () => {
  assert.equal(isToolkitMappable("nativity-birth-chart", "astrology"), true);
});

test("isToolkitMappable: known tarot slug is mappable", () => {
  assert.equal(
    isToolkitMappable("3-card-basic-question-spread", "tarot"),
    true,
  );
});

test("isToolkitMappable: unmapped tarot slug is not mappable", () => {
  // 5-card complex isn't mapped yet — UI hides the link.
  assert.equal(
    isToolkitMappable("5-card-complex-question-spread", "tarot"),
    false,
  );
});

test("isToolkitMappable: unknown category is not mappable", () => {
  assert.equal(isToolkitMappable("nativity-birth-chart", "spell-work"), false);
});

test("isToolkitMappable: missing inputs are not mappable", () => {
  assert.equal(isToolkitMappable(null, "astrology"), false);
  assert.equal(isToolkitMappable("nativity-birth-chart", null), false);
  assert.equal(isToolkitMappable(undefined, undefined), false);
});

// ─── requiresPartnerBirthData ────────────────────────────────────────────────

test("requiresPartnerBirthData: true for the three two-person services", () => {
  assert.equal(requiresPartnerBirthData("romantic-relationships"), true);
  assert.equal(requiresPartnerBirthData("friendship-relationships"), true);
  assert.equal(requiresPartnerBirthData("business-relationship"), true);
});

test("requiresPartnerBirthData: false for solo astrology services", () => {
  assert.equal(requiresPartnerBirthData("nativity-birth-chart"), false);
  assert.equal(requiresPartnerBirthData("solar-return"), false);
});

test("requiresPartnerBirthData: false for missing slug", () => {
  assert.equal(requiresPartnerBirthData(null), false);
  assert.equal(requiresPartnerBirthData(undefined), false);
});

// ─── getSessionLinkForBooking + rollout gate ─────────────────────────────────

test("getSessionLinkForBooking: returns smart-router URL for mapped service", () => {
  withEnv(undefined, () => {
    const link = getSessionLinkForBooking({
      bookingId: "abc-123",
      templateSlug: "nativity-birth-chart",
      category: "astrology",
    });
    assert.equal(link, "/admin/session/abc-123");
  });
});

test("getSessionLinkForBooking: returns null for unmapped tarot slug", () => {
  withEnv(undefined, () => {
    const link = getSessionLinkForBooking({
      bookingId: "abc-123",
      templateSlug: "5-card-complex-question-spread",
      category: "tarot",
    });
    assert.equal(link, null);
  });
});

test("getSessionLinkForBooking: returns null when slug is missing", () => {
  withEnv(undefined, () => {
    assert.equal(
      getSessionLinkForBooking({
        bookingId: "abc-123",
        templateSlug: null,
        category: "astrology",
      }),
      null,
    );
  });
});

test("isToolkitEnabled: defaults to enabled when env var unset", () => {
  withEnv(undefined, () => {
    assert.equal(isToolkitEnabled(), true);
  });
});

test("isToolkitEnabled: returns false for explicit 'false'", () => {
  withEnv("false", () => {
    assert.equal(isToolkitEnabled(), false);
  });
});

test("isToolkitEnabled: returns false for explicit '0'", () => {
  withEnv("0", () => {
    assert.equal(isToolkitEnabled(), false);
  });
});

test("isToolkitEnabled: any other value is treated as enabled", () => {
  // Don't accidentally turn off the feature on misspelled values.
  withEnv("true", () => assert.equal(isToolkitEnabled(), true));
  withEnv("1", () => assert.equal(isToolkitEnabled(), true));
  withEnv("yes", () => assert.equal(isToolkitEnabled(), true));
  withEnv("", () => assert.equal(isToolkitEnabled(), true));
});

test("getSessionLinkForBooking: returns null when rollout gate is OFF, even for mapped service", () => {
  // This is the kill-switch behavior: flipping the flag must hide every
  // "Open Service" button in every placement (CLAUDE.md §8).
  withEnv("false", () => {
    const link = getSessionLinkForBooking({
      bookingId: "abc-123",
      templateSlug: "nativity-birth-chart",
      category: "astrology",
    });
    assert.equal(link, null);
  });
});
