/**
 * Cleanup test data created by the affiliate commission v2 test suites
 * + the probe-rls.ts diagnostic script.
 *
 * What this targets (email patterns of auth users):
 *   - v2-smoke+<ts>@test.astrologypro.com   (from affiliate-commission-v2-smoke.test.ts)
 *   - rls-<ts>-<rand>-<label>@test.astrologypro.com (from affiliate-rls.test.ts)
 *   - probe-<ts>@test.astrologypro.com      (from the probe diagnostic, now deleted)
 *
 * Dry-run by default — prints what WOULD be deleted. Pass `--apply` to
 * actually delete.
 *
 * Order of deletion (leaves first, then upward through FKs):
 *   campaign_conversions
 *   campaign_clicks
 *   bookings
 *   diviner_service_affiliate_rate_history
 *   diviner_service_affiliates (assignments)
 *   affiliate_campaigns
 *   service_templates  (referenced by destination_id, also drives test data slugs)
 *   services
 *   diviner_affiliates (junctions)
 *   affiliate_accounts
 *   diviners
 *   clients
 *   auth.users
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/cleanup-affiliate-test-data.ts          # dry-run
 *   npx tsx --env-file=.env.local scripts/cleanup-affiliate-test-data.ts --apply  # delete
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SR_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const sr = createClient(URL, SR_KEY, { auth: { persistSession: false } });

// Email patterns the test suites + probe script use.
const EMAIL_PATTERNS = [
  "v2-smoke+%@test.astrologypro.com",
  "rls-%@test.astrologypro.com",
  "probe-%@test.astrologypro.com",
];

// Slug / username patterns derived from the same NS prefixes.
const SLUG_PATTERNS = [
  "v2-smoke-%",
  "rls-%",
  "probe-%",
];

async function listTestAuthUsers(): Promise<{ id: string; email: string }[]> {
  // We avoid auth.admin.listUsers() because it's flaky on larger projects
  // ("Database error finding users"). Instead, resolve user_ids from the
  // tables our test code populates by email pattern.
  const found = new Map<string, string>();

  // affiliate_accounts.user_id covers every affiliate test fixture.
  for (const pat of EMAIL_PATTERNS) {
    const { data } = await sr
      .from("affiliate_accounts")
      .select("user_id, email")
      .like("email", pat);
    for (const r of (data ?? []) as Array<{ user_id: string | null; email: string }>) {
      if (r.user_id) found.set(r.user_id, r.email);
    }
  }

  // diviners.username — the RLS test creates diviners with `rls-<ns>-divA`
  // usernames; user_id ties to auth.users.
  for (const pat of SLUG_PATTERNS) {
    const { data } = await sr
      .from("diviners")
      .select("user_id, username")
      .like("username", pat);
    for (const r of (data ?? []) as Array<{ user_id: string | null; username: string }>) {
      if (r.user_id) {
        // Synthesize an email-ish label from the username for log readability.
        if (!found.has(r.user_id)) found.set(r.user_id, `diviner:${r.username}`);
      }
    }
  }

  return Array.from(found.entries()).map(([id, email]) => ({ id, email }));
}

async function countAndMaybeDelete<T>(
  label: string,
  selectQuery: () => Promise<{ data: T[] | null; error: { message: string } | null }>,
  deleteQuery: () => Promise<{ error: { message: string } | null }>,
) {
  const { data, error } = await selectQuery();
  if (error) {
    console.error(`  [${label}] select error: ${error.message}`);
    return 0;
  }
  const n = (data ?? []).length;
  console.log(`  [${label}] ${n} rows ${APPLY ? "DELETING" : "would be deleted"}`);
  if (n === 0) return 0;
  if (APPLY) {
    const r = await deleteQuery();
    if (r.error) console.error(`  [${label}] delete error: ${r.error.message}`);
  }
  return n;
}

async function main() {
  console.log(
    `\n${APPLY ? "🚨 APPLY MODE — rows will be deleted" : "🔍 DRY-RUN — no rows deleted (pass --apply to delete)"}\n`,
  );

  // ─── 1. Resolve test auth users ──────────────────────────────────────────
  const testUsers = await listTestAuthUsers();
  console.log(`Found ${testUsers.length} auth user(s) matching test patterns:`);
  for (const u of testUsers) console.log(`  ${u.email}  (${u.id})`);
  if (testUsers.length === 0 && SLUG_PATTERNS.length === 0) {
    console.log("\nNothing to clean up.");
    return;
  }
  const userIds = testUsers.map((u) => u.id);

  // ─── 2. Resolve dependent records via user_id ────────────────────────────
  const { data: testDiviners } = await sr
    .from("diviners")
    .select("id, user_id, username")
    .in("user_id", userIds);
  const divinerIds = (testDiviners ?? []).map((d) => d.id as string);

  const { data: testAccounts } = await sr
    .from("affiliate_accounts")
    .select("id, user_id, email")
    .in("user_id", userIds);
  const accountIds = (testAccounts ?? []).map((a) => a.id as string);

  const { data: testClients } = await sr
    .from("clients")
    .select("id, user_id")
    .in("user_id", userIds);
  const clientIds = (testClients ?? []).map((c) => c.id as string);

  const { data: testJunctions } = await sr
    .from("diviner_affiliates")
    .select("id, affiliate_account_id, diviner_id")
    .in("affiliate_account_id", accountIds);
  const junctionIdsFromAccounts = (testJunctions ?? []).map((j) => j.id as string);

  // Also pick up junctions tied to test diviners (paranoia).
  const { data: junctionsByDiviner } = divinerIds.length
    ? await sr
        .from("diviner_affiliates")
        .select("id")
        .in("diviner_id", divinerIds)
    : { data: [] };
  const junctionIds = Array.from(
    new Set([
      ...junctionIdsFromAccounts,
      ...((junctionsByDiviner ?? []).map((j) => j.id as string)),
    ]),
  );

  const { data: testAssignments } = junctionIds.length
    ? await sr
        .from("diviner_service_affiliates")
        .select("id, diviner_id, affiliate_id")
        .in("affiliate_id", junctionIds)
    : { data: [] };
  const assignmentIds = (testAssignments ?? []).map((a) => a.id as string);

  // Campaigns: owned by test junctions OR by test diviners (catches both
  // affiliate-owned and diviner-owned campaigns from the RLS test).
  const { data: testCampaignsByJunction } = junctionIds.length
    ? await sr
        .from("affiliate_campaigns")
        .select("id")
        .in("owner_affiliate_id", junctionIds)
    : { data: [] };
  const { data: testCampaignsByDiviner } = divinerIds.length
    ? await sr
        .from("affiliate_campaigns")
        .select("id")
        .in("diviner_id", divinerIds)
    : { data: [] };
  const campaignIds = Array.from(
    new Set([
      ...((testCampaignsByJunction ?? []).map((c) => c.id as string)),
      ...((testCampaignsByDiviner ?? []).map((c) => c.id as string)),
    ]),
  );

  // Service templates: by slug pattern (RLS test creates these).
  const tplOrFilter = SLUG_PATTERNS.map((p) => `slug.like.${p}`).join(",");
  const { data: testTemplates } = await sr
    .from("service_templates")
    .select("id")
    .or(tplOrFilter);
  const templateIds = (testTemplates ?? []).map((t) => t.id as string);

  // Services: linked to test templates OR test diviners.
  const { data: testServicesByTemplate } = templateIds.length
    ? await sr.from("services").select("id").in("template_id", templateIds)
    : { data: [] };
  const { data: testServicesByDiviner } = divinerIds.length
    ? await sr.from("services").select("id").in("diviner_id", divinerIds)
    : { data: [] };
  const serviceIds = Array.from(
    new Set([
      ...((testServicesByTemplate ?? []).map((s) => s.id as string)),
      ...((testServicesByDiviner ?? []).map((s) => s.id as string)),
    ]),
  );

  // Bookings: client_id IN test clients OR diviner_id IN test diviners.
  const { data: testBookings } =
    clientIds.length || divinerIds.length
      ? await sr
          .from("bookings")
          .select("id")
          .or(
            [
              clientIds.length ? `client_id.in.(${clientIds.join(",")})` : "",
              divinerIds.length ? `diviner_id.in.(${divinerIds.join(",")})` : "",
            ]
              .filter(Boolean)
              .join(","),
          )
      : { data: [] };
  const bookingIds = (testBookings ?? []).map((b) => b.id as string);

  console.log(`\nResolved scope:`);
  console.log(`  diviners:     ${divinerIds.length}`);
  console.log(`  accounts:     ${accountIds.length}`);
  console.log(`  clients:      ${clientIds.length}`);
  console.log(`  junctions:    ${junctionIds.length}`);
  console.log(`  assignments:  ${assignmentIds.length}`);
  console.log(`  campaigns:    ${campaignIds.length}`);
  console.log(`  templates:    ${templateIds.length}`);
  console.log(`  services:     ${serviceIds.length}`);
  console.log(`  bookings:     ${bookingIds.length}`);

  if (
    divinerIds.length === 0 &&
    accountIds.length === 0 &&
    clientIds.length === 0 &&
    junctionIds.length === 0 &&
    assignmentIds.length === 0 &&
    campaignIds.length === 0 &&
    templateIds.length === 0 &&
    serviceIds.length === 0 &&
    bookingIds.length === 0 &&
    testUsers.length === 0
  ) {
    console.log("\nNothing to clean up.");
    return;
  }

  console.log(`\nDeletion plan:`);

  // ─── 3. Delete in FK-safe order ──────────────────────────────────────────

  if (campaignIds.length) {
    await countAndMaybeDelete(
      "campaign_conversions",
      async () => sr.from("campaign_conversions").select("id").in("campaign_id", campaignIds),
      async () => sr.from("campaign_conversions").delete().in("campaign_id", campaignIds),
    );
    await countAndMaybeDelete(
      "campaign_clicks",
      async () => sr.from("campaign_clicks").select("id").in("campaign_id", campaignIds),
      async () => sr.from("campaign_clicks").delete().in("campaign_id", campaignIds),
    );
  }

  if (bookingIds.length) {
    await countAndMaybeDelete(
      "bookings",
      async () => sr.from("bookings").select("id").in("id", bookingIds),
      async () => sr.from("bookings").delete().in("id", bookingIds),
    );
  }

  // Order matters: affiliate-owned campaigns must go BEFORE their source
  // assignments. The assignment row has ON DELETE SET NULL on its
  // affiliate_campaigns reference, but the
  // affiliate_campaigns_owner_consistency CHECK requires
  // source_assignment_id NOT NULL on owner_type='affiliate' rows. So
  // setting the FK to NULL trips the constraint. Delete campaigns first.
  if (campaignIds.length) {
    await countAndMaybeDelete(
      "affiliate_campaigns",
      async () => sr.from("affiliate_campaigns").select("id").in("id", campaignIds),
      async () => sr.from("affiliate_campaigns").delete().in("id", campaignIds),
    );
  }

  if (assignmentIds.length) {
    await countAndMaybeDelete(
      "diviner_service_affiliate_rate_history",
      async () =>
        sr
          .from("diviner_service_affiliate_rate_history")
          .select("id")
          .in("assignment_id", assignmentIds),
      async () =>
        sr
          .from("diviner_service_affiliate_rate_history")
          .delete()
          .in("assignment_id", assignmentIds),
    );
    await countAndMaybeDelete(
      "diviner_service_affiliates",
      async () => sr.from("diviner_service_affiliates").select("id").in("id", assignmentIds),
      async () => sr.from("diviner_service_affiliates").delete().in("id", assignmentIds),
    );
  }

  if (serviceIds.length) {
    await countAndMaybeDelete(
      "services",
      async () => sr.from("services").select("id").in("id", serviceIds),
      async () => sr.from("services").delete().in("id", serviceIds),
    );
  }

  if (templateIds.length) {
    await countAndMaybeDelete(
      "service_templates",
      async () => sr.from("service_templates").select("id").in("id", templateIds),
      async () => sr.from("service_templates").delete().in("id", templateIds),
    );
  }

  if (junctionIds.length) {
    await countAndMaybeDelete(
      "diviner_affiliates",
      async () => sr.from("diviner_affiliates").select("id").in("id", junctionIds),
      async () => sr.from("diviner_affiliates").delete().in("id", junctionIds),
    );
  }

  if (accountIds.length) {
    await countAndMaybeDelete(
      "affiliate_accounts",
      async () => sr.from("affiliate_accounts").select("id").in("id", accountIds),
      async () => sr.from("affiliate_accounts").delete().in("id", accountIds),
    );
  }

  if (divinerIds.length) {
    await countAndMaybeDelete(
      "diviners",
      async () => sr.from("diviners").select("id").in("id", divinerIds),
      async () => sr.from("diviners").delete().in("id", divinerIds),
    );
  }

  if (clientIds.length) {
    await countAndMaybeDelete(
      "clients",
      async () => sr.from("clients").select("id").in("id", clientIds),
      async () => sr.from("clients").delete().in("id", clientIds),
    );
  }

  // ─── 4. Auth users last ──────────────────────────────────────────────────
  console.log(
    `  [auth.users] ${testUsers.length} ${APPLY ? "DELETING" : "would be deleted"}`,
  );
  if (APPLY) {
    for (const u of testUsers) {
      const r = await sr.auth.admin.deleteUser(u.id);
      if (r.error) {
        console.error(`    failed for ${u.email}: ${r.error.message}`);
      }
    }
  }

  console.log(
    `\n${APPLY ? "Done. Re-run with no flag to verify zero remaining rows." : "Dry-run complete. Re-run with --apply to delete for real."}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
