/**
 * GET /api/social/connect/[platform]/start
 *
 * Initiates the OAuth flow for a social platform.
 *
 * Query params:
 *   scope=admin   — (optional) connect as brand admin; requires admin auth.
 *                   Default: diviner (caller must own a diviners row).
 *   redirect_to   — (optional) path to send the user back to after success,
 *                   e.g. /admin/social-connections. Must be a same-origin
 *                   path; absolute URLs are rejected.
 *
 * Flow:
 *   1. Resolve caller → Owner (admin or diviner).
 *   2. Reject if platform is disabled.
 *   3. Generate `state` + (for PKCE platforms) `code_verifier`.
 *   4. Persist both in `social_oauth_states` (10-minute TTL, one-shot).
 *   5. Return a 302 to the platform's authorize URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { isPlatform } from "@/lib/social/types";
import { isPlatformEnabled, getPlatform } from "@/lib/social/platform-registry";
import { createOAuthState } from "@/lib/social/oauth-state";
import {
  resolveOwnerFromRequest,
  redirectUriForPlatform,
} from "@/lib/social/resolve-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }

  if (!isPlatformEnabled(platform)) {
    return NextResponse.json(
      { error: `Platform "${platform}" is not yet enabled` },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") as "admin" | "diviner" | null;
  const rawRedirect = url.searchParams.get("redirect_to");
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : null;

  const resolved = await resolveOwnerFromRequest(scope);
  if (!resolved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = getPlatform(platform);
  const redirectUri = redirectUriForPlatform(platform);

  // Generate state first (we need it to build the authorize URL), then
  // ask the adapter for the URL + (if PKCE) a code_verifier, then persist
  // the state row with the verifier attached.
  //
  // Note: we write the row with a placeholder state token and re-read it
  // below. Simpler: generate state ourselves, persist AFTER the adapter
  // builds the URL.
  const crypto = await import("node:crypto");
  const state = crypto
    .randomBytes(24)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const built = await entry.adapter.buildAuthorizeUrl({ state, redirectUri });

  // Persist state + codeVerifier keyed on the actual state token.
  // `createOAuthState` generates its own — so we inline a direct insert
  // here using our pre-generated state to keep state === the one in the URL.
  // Re-use the DB schema via a small helper we already have.
  await createOAuthStateWithValue({
    state,
    owner: resolved.owner,
    platform,
    userId: resolved.userId,
    codeVerifier: built.codeVerifier ?? null,
    redirectAfterUrl: redirectTo,
  });

  return NextResponse.redirect(built.url);
}

/**
 * Direct insert helper (inline, avoids refactoring oauth-state.ts which
 * currently generates the state internally). Mirrors the same schema.
 */
async function createOAuthStateWithValue(input: {
  state: string;
  owner: { type: "admin" | "diviner"; id: string | null };
  platform: string;
  userId: string;
  codeVerifier: string | null;
  redirectAfterUrl: string | null;
}): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await admin.from("social_oauth_states").insert({
    state: input.state,
    owner_type: input.owner.type,
    owner_id: input.owner.id,
    platform: input.platform,
    code_verifier: input.codeVerifier,
    redirect_after_url: input.redirectAfterUrl,
    user_id: input.userId,
    expires_at: expiresAt,
  });
  if (error) {
    throw new Error(`Failed to persist OAuth state: ${error.message}`);
  }
}
