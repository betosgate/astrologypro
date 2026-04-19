/**
 * Unit tests for the native social-posting subsystem.
 *
 * Covers:
 *   - token-crypto roundtrip (encrypt → decrypt === identity)
 *   - platform-registry invariants (only twitter enabled; all 6 registered)
 *   - PKCE helper shape
 *   - types guard (isPlatform)
 *
 * Not covered here (needs network or DB): the Twitter OAuth/token/post flow
 * — those are integration tests to run against a preview deploy with real
 * test credentials.
 *
 * Run:
 *   npm run test:social-subsystem
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import { isPlatform, SUPPORTED_PLATFORMS } from "../../src/lib/social/types";
import {
  encryptToken,
  decryptToken,
  isEncryptionKeyConfigured,
} from "../../src/lib/social/token-crypto";
import {
  PLATFORM_REGISTRY,
  isPlatformEnabled,
  listPlatformsForUi,
} from "../../src/lib/social/platform-registry";
import { generatePkcePair } from "../../src/lib/social/oauth-state";

// ── Set a test encryption key before any crypto runs ───────────────────────
const ORIG_KEY = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;

before(() => {
  // 32 bytes of zeros, base64 → ok for unit tests only.
  process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32).toString("base64");
});

after(() => {
  if (ORIG_KEY === undefined) delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = ORIG_KEY;
});

describe("social/types", () => {
  it("isPlatform accepts all registered ids and rejects unknown", () => {
    for (const p of SUPPORTED_PLATFORMS) {
      assert.equal(isPlatform(p), true, `${p} should be a platform`);
    }
    assert.equal(isPlatform("mastodon"), false);
    assert.equal(isPlatform(""), false);
    assert.equal(isPlatform("Twitter"), false); // case-sensitive by design
  });
});

describe("social/token-crypto", () => {
  it("isEncryptionKeyConfigured returns true when env var is a valid 32-byte key", () => {
    assert.equal(isEncryptionKeyConfigured(), true);
  });

  it("encrypt → decrypt is identity", () => {
    const plaintext = "sk-very-long-fake-oauth-token-0123456789abcdef";
    const enc = encryptToken(plaintext);
    assert.ok(enc.ciphertext.length > 0);
    assert.ok(enc.iv.length > 0);
    assert.ok(enc.tag.length > 0);
    assert.notEqual(enc.ciphertext, plaintext);
    const decrypted = decryptToken(enc);
    assert.equal(decrypted, plaintext);
  });

  it("two encryptions of the same plaintext produce different ciphertexts (random IV)", () => {
    const p = "same-token-every-time";
    const a = encryptToken(p);
    const b = encryptToken(p);
    assert.notEqual(a.ciphertext, b.ciphertext);
    assert.notEqual(a.iv, b.iv);
    assert.equal(decryptToken(a), p);
    assert.equal(decryptToken(b), p);
  });

  it("tampered ciphertext fails authentication", () => {
    const enc = encryptToken("sensitive");
    // Flip last base64 char of ciphertext.
    const bad = {
      ...enc,
      ciphertext:
        enc.ciphertext.slice(0, -1) + (enc.ciphertext.endsWith("A") ? "B" : "A"),
    };
    assert.throws(() => decryptToken(bad));
  });
});

describe("social/platform-registry", () => {
  it("registers all 6 supported platforms", () => {
    for (const p of SUPPORTED_PLATFORMS) {
      assert.ok(
        PLATFORM_REGISTRY[p],
        `platform ${p} must have a registry entry`,
      );
    }
    assert.equal(Object.keys(PLATFORM_REGISTRY).length, SUPPORTED_PLATFORMS.length);
  });

  it("only twitter is enabled at launch", () => {
    assert.equal(isPlatformEnabled("twitter"), true);
    for (const p of SUPPORTED_PLATFORMS) {
      if (p === "twitter") continue;
      assert.equal(
        isPlatformEnabled(p),
        false,
        `platform ${p} should be disabled at launch — update this test when you flip it on`,
      );
    }
  });

  it("every registry entry has a non-empty displayName, tagline, adapter", () => {
    for (const [id, entry] of Object.entries(PLATFORM_REGISTRY)) {
      assert.ok(entry.displayName.length > 0, `${id} missing displayName`);
      assert.ok(entry.tagline.length > 0, `${id} missing tagline`);
      assert.ok(entry.adapter, `${id} missing adapter`);
      assert.equal(
        entry.adapter.id,
        id,
        `${id} adapter.id must equal registry key`,
      );
    }
  });

  it("listPlatformsForUi returns a UI-safe shape with no secrets", () => {
    const ui = listPlatformsForUi();
    assert.equal(ui.length, SUPPORTED_PLATFORMS.length);
    for (const p of ui) {
      assert.ok(typeof p.id === "string");
      assert.ok(typeof p.displayName === "string");
      assert.ok(typeof p.iconName === "string");
      assert.ok(typeof p.tagline === "string");
      assert.equal(typeof p.enabled, "boolean");
      // No secret fields leak.
      assert.equal("adapter" in p, false);
      assert.equal("requiredEnvVars" in p, false);
    }
  });
});

describe("social/oauth-state PKCE", () => {
  it("generatePkcePair produces URL-safe strings with no padding", () => {
    const pair = generatePkcePair();
    const safe = /^[A-Za-z0-9_-]+$/;
    assert.ok(safe.test(pair.codeVerifier), "verifier must be URL-safe");
    assert.ok(safe.test(pair.codeChallenge), "challenge must be URL-safe");
    assert.ok(pair.codeVerifier.length >= 43, "verifier length ≥ 43 per RFC 7636");
    assert.ok(pair.codeVerifier.length <= 128, "verifier length ≤ 128 per RFC 7636");
    assert.notEqual(pair.codeVerifier, pair.codeChallenge);
  });

  it("generatePkcePair is non-deterministic", () => {
    const a = generatePkcePair();
    const b = generatePkcePair();
    assert.notEqual(a.codeVerifier, b.codeVerifier);
    assert.notEqual(a.codeChallenge, b.codeChallenge);
  });
});
