/**
 * OAuth state & PKCE helpers.
 *
 * We persist the random `state` value into `social_oauth_states` before the
 * redirect so that, on callback:
 *   - The state must be present (CSRF protection: the attacker can't guess it).
 *   - It must not have expired (10 min default).
 *   - It must match the owner the callback is running under.
 *   - After use it is deleted (one-shot).
 *
 * PKCE `code_verifier` is stored alongside state for platforms that require
 * it (Twitter/X mandates PKCE for OAuth 2.0 public clients; others accept
 * confidential-client flow without PKCE).
 */

import { randomBytes, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Owner, Platform } from "./types";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** URL-safe random token, 32 bytes of entropy. */
function randomUrlSafe(bytes = 32): string {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomUrlSafe(48); // 64-char URL-safe — inside the 43–128 PKCE range
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { codeVerifier, codeChallenge };
}

export interface CreateStateInput {
  owner: Owner;
  platform: Platform;
  userId: string | null;
  codeVerifier?: string | null;
  redirectAfterUrl?: string | null;
}

export async function createOAuthState(input: CreateStateInput): Promise<string> {
  const admin = createAdminClient();
  const state = randomUrlSafe(24);
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  const { error } = await admin.from("social_oauth_states").insert({
    state,
    owner_type: input.owner.type,
    owner_id: input.owner.id,
    platform: input.platform,
    code_verifier: input.codeVerifier ?? null,
    redirect_after_url: input.redirectAfterUrl ?? null,
    user_id: input.userId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to persist OAuth state: ${error.message}`);
  }
  return state;
}

export interface ConsumedState {
  state: string;
  owner: Owner;
  platform: Platform;
  codeVerifier: string | null;
  redirectAfterUrl: string | null;
  userId: string | null;
}

/**
 * Look up, validate, and DELETE a stored OAuth state. Returns null if the
 * state is missing or expired. One-shot by design — calling this twice with
 * the same value will succeed exactly once.
 */
export async function consumeOAuthState(state: string): Promise<ConsumedState | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("social_oauth_states")
    .select("*")
    .eq("state", state)
    .maybeSingle();

  if (!data) return null;

  // Delete unconditionally — even if expired, it's burned now.
  await admin.from("social_oauth_states").delete().eq("state", state);

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return {
    state: data.state,
    owner: { type: data.owner_type, id: data.owner_id },
    platform: data.platform,
    codeVerifier: data.code_verifier,
    redirectAfterUrl: data.redirect_after_url,
    userId: data.user_id,
  };
}

/** Background maintenance — prune expired states. Safe to call repeatedly. */
export async function purgeExpiredOAuthStates(): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("social_oauth_states")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
