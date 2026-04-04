#!/usr/bin/env node
/**
 * provision-legacy-test-users.js
 *
 * Creates / resets passwords for known test accounts in the DEV Cognito user pool
 * so you can log into the old Angular system immediately.
 *
 * Usage:
 *   node scripts/provision-legacy-test-users.js
 *
 * All accounts will be set to: TestAccess123!
 */

"use strict";

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

// ─── Config ───────────────────────────────────────────────────────────────────
// Set these in your shell before running, or add to .env.local (never commit keys):
//   export LEGACY_AWS_ACCESS_KEY=<key>
//   export LEGACY_AWS_SECRET_KEY=<secret>

const REGION      = "us-east-1";
const USER_POOL   = process.env.LEGACY_COGNITO_USER_POOL   || "us-east-1_E7eKADUs4";
const ACCESS_KEY  = process.env.LEGACY_AWS_ACCESS_KEY;
const SECRET_KEY  = process.env.LEGACY_AWS_SECRET_KEY;
const PASSWORD    = process.env.LEGACY_TEST_PASSWORD       || "TestAccess123!";

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌  Missing env vars: LEGACY_AWS_ACCESS_KEY and LEGACY_AWS_SECRET_KEY");
  console.error("   Export them before running this script.");
  process.exit(1);
}

// ─── Test accounts (all pre-exist in MongoDB cognito_user_data) ───────────────

const TEST_USERS = [
  {
    label:    "Admin",
    email:    "admindivine@yopmail.com",
    name:     "The Admin",
  },
  {
    label:    "Diviner (Astrologer)",
    email:    "arnab.atrotest@yopmail.com",
    name:     "Astro Tester",
  },
  {
    label:    "Diviner (Tarot)",
    email:    "ctestamelia@yopmail.com",
    name:     "Amelia Tester",
  },
  {
    label:    "Client (Customer)",
    email:    "beto@betoparedes.com",
    name:     "Heriberto Paredes",
  },
  {
    label:    "Client + Social Advocate",
    email:    "sankettest2@yopmail.com",
    name:     "Sanket Test 2",
  },
  {
    label:    "Social Advocate",
    email:    "socialadvo@yopmail.com",
    name:     "Social Advo",
  },
  {
    label:    "Perennial Mandalism",
    email:    "test.data@yopmail.com",
    name:     "Test Data",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cognito = new CognitoIdentityProviderClient({
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  console.log(`\n🔐 Provisioning test users in Cognito pool: ${USER_POOL}`);
  console.log(`🔑 Password for all accounts: ${PASSWORD}\n`);

  const results = [];

  for (const u of TEST_USERS) {
    process.stdout.write(`  [${u.label.padEnd(28)}] ${u.email.padEnd(38)} → `);

    try {
      // Check if user already exists in Cognito
      let exists = false;
      try {
        await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL, Username: u.email }));
        exists = true;
      } catch (e) {
        if (!e.name?.includes("UserNotFoundException")) throw e;
      }

      if (!exists) {
        // Create the user (email = username, suppress welcome email)
        await cognito.send(new AdminCreateUserCommand({
          UserPoolId:        USER_POOL,
          Username:          u.email,
          TemporaryPassword: PASSWORD,
          MessageAction:     "SUPPRESS",
          UserAttributes: [
            { Name: "email",          Value: u.email },
            { Name: "email_verified", Value: "true"  },
            { Name: "name",           Value: u.name  },
          ],
        }));
      }

      // Force-set permanent password (no NEW_PASSWORD_REQUIRED challenge)
      await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL,
        Username:   u.email,
        Password:   PASSWORD,
        Permanent:  true,
      }));

      console.log(exists ? "✓ reset" : "✓ created");
      results.push({ ...u, status: "ok" });

    } catch (err) {
      console.log(`✗ ${err.message}`);
      results.push({ ...u, status: "error", error: err.message });
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const ok  = results.filter(r => r.status === "ok");
  const err = results.filter(r => r.status === "error");

  console.log(`\n${"─".repeat(72)}`);
  console.log("  Test User Credentials — old Angular system (http://localhost:4200)");
  console.log(`${"─".repeat(72)}`);
  console.log(`  Password (all accounts): ${PASSWORD}\n`);
  for (const r of ok) {
    console.log(`  ${r.label.padEnd(30)} ${r.email}`);
  }
  if (err.length) {
    console.log(`\n  ⚠️  Failed:`);
    for (const r of err) console.log(`  ${r.email}: ${r.error}`);
  }
  console.log(`${"─".repeat(72)}\n`);
}

main().catch(err => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
