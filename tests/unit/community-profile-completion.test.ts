import assert from "node:assert/strict";
import test from "node:test";

import { getCommunityProfileCompletion } from "../../src/lib/community/profile-completion";

type TableRows = Record<string, unknown>[];

function createAdminStub(tables: Record<string, TableRows>) {
  return {
    from(table: string) {
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        not() {
          return query;
        },
        limit() {
          return Promise.resolve({ data: tables[table] ?? [] });
        },
        maybeSingle() {
          return Promise.resolve({ data: tables[table]?.[0] ?? null });
        },
        then(resolve: (value: { data: TableRows }) => unknown) {
          return Promise.resolve({ data: tables[table] ?? [] }).then(resolve);
        },
      };

      return query;
    },
  };
}

function findItem(
  completion: NonNullable<Awaited<ReturnType<typeof getCommunityProfileCompletion>>>,
  key: string
) {
  const item = completion.items.find((candidate) => candidate.key === key);
  assert.ok(item, `Expected ${key} item to exist`);
  return item;
}

test("community profile completion uses community_members birth data without a clients row", async () => {
  const completion = await getCommunityProfileCompletion(
    createAdminStub({
      community_members: [
        {
          id: "member-1",
          full_name: "Ada Lovelace",
          date_of_birth: "1990-01-01",
          birth_time: "12:30:00",
          birth_city: "London, United Kingdom",
        },
      ],
      community_family_members: [],
      relationship_charts: [],
    }) as never,
    "user-1"
  );

  assert.ok(completion);
  assert.equal(findItem(completion, "birth_data").completed, true);
  assert.equal(completion.overall_pct, 35);
});

test("community profile completion requires all member birth fields", async () => {
  const completion = await getCommunityProfileCompletion(
    createAdminStub({
      community_members: [
        {
          id: "member-1",
          full_name: "Ada Lovelace",
          date_of_birth: "1990-01-01",
          birth_time: null,
          birth_city: "London, United Kingdom",
        },
      ],
      community_family_members: [],
      relationship_charts: [],
    }) as never,
    "user-1"
  );

  assert.ok(completion);
  assert.equal(findItem(completion, "birth_data").completed, false);
  assert.equal(completion.overall_pct, 10);
});
