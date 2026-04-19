/**
 * AES-256-GCM encryption helpers for OAuth tokens stored in social_accounts.
 *
 * Key management: the raw 32-byte key lives in the SOCIAL_TOKEN_ENCRYPTION_KEY
 * env var as either:
 *   - 64 hex characters          ("abcdef…"), or
 *   - base64 of 32 bytes         ("BASE64…==")
 *
 * A random 96-bit IV is generated per-encryption. The 128-bit auth tag is
 * stored alongside ciphertext+iv. All three are base64 TEXT in Postgres.
 *
 * Rotation: if you ever need to rotate the key, bump the version by prefixing
 * the ciphertext with "v2:" — the decrypt path can branch on that prefix.
 * For now everything is v1 (no prefix) and we assume a single key.
 *
 * Why app-level instead of Supabase Vault:
 *   - Vault requires `supabase_vault` extension + a bunch of RPC glue, and
 *     is still in beta for some projects. AES-GCM in Node is stable,
 *     well-understood, and zero-dependency.
 *   - If we ever want to move to Vault, only this file changes — the
 *     call sites use `encryptToken` / `decryptToken` through accounts-repo.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV — recommended for GCM
const KEY_BYTES = 32;

function loadKey(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SOCIAL_TOKEN_ENCRYPTION_KEY is not set. Generate 32 bytes with " +
        "`openssl rand -base64 32` and add it to your environment.",
    );
  }

  // Hex form (64 chars, [0-9a-fA-F]).
  if (/^[0-9a-fA-F]{64}$/.test(raw.trim())) {
    return Buffer.from(raw.trim(), "hex");
  }

  // Otherwise assume base64.
  const buf = Buffer.from(raw.trim(), "base64");
  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `SOCIAL_TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes ` +
        `(got ${buf.length}). Generate a new one with \`openssl rand -base64 32\`.`,
    );
  }
  return buf;
}

export interface EncryptedField {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

export function encryptToken(plaintext: string): EncryptedField {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptToken(field: EncryptedField): string {
  const key = loadKey();
  const iv = Buffer.from(field.iv, "base64");
  const tag = Buffer.from(field.tag, "base64");
  const ct = Buffer.from(field.ciphertext, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}

/** True iff the env var is set and decodes to 32 bytes (no exception thrown). */
export function isEncryptionKeyConfigured(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}
