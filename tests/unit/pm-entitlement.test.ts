import test from "node:test";
import assert from "node:assert/strict";

import {
  maxMembersForTier,
  tierToPlanType,
} from "../../src/lib/community/pm-entitlement";

test("PM tier names map Couple and Family to the household-capable legacy plan type", () => {
  assert.equal(tierToPlanType({ name: "Individual" }), "individual");
  assert.equal(tierToPlanType({ name: "Couple" }), "family");
  assert.equal(tierToPlanType({ name: "Family" }), "family");
});

test("PM max member limits prefer the tier-specific hard cap", () => {
  assert.equal(maxMembersForTier({ max_total_members: 2 }, "family"), 2);
  assert.equal(maxMembersForTier(null, "family"), 5);
  assert.equal(maxMembersForTier(null, "individual"), 1);
});
