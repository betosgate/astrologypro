/**
 * GET /api/social/connect/[platform]/callback
 *
 * The OAuth provider redirects here after user consent. We:
 *   1. Look up (and DELETE) the stored OAuth state.
 *   2. Reject if missing/expired/owner mismatch.
 *   3. Hand the auth code + PKCE verifier to the adapter to exchange for tokens.
 *   4. Upsert the resulting connection (encrypting tokens) in social_accounts.
 *   5. Redirect the user back to `redirect_after_url` with a ?connected=...
 *      flag, or to the default settings page if none was stored.
 *
 * Any failure writes ?connect_error=... to the return URL — never leaks
 * stack traces. Server-side logging captures the real error.
 */

import { NextRequest, NextResponse } from "next/server";
import { isPlatform } from "@/lib/social/types";
import { getPlatform, isPlatformEnabled } from "@/lib/social/platform-registry";
import { consumeOAuthState } from "@/lib/social/oauth-state";
import { upsertConnection } from "@/lib/social/accounts-repo";
import { redirectUriForPlatform } from "@/lib/social/resolve-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildReturnUrl(
  request: NextRequest,
  path: string | null,
  params: Record<string, string>,
): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const defaultPath = "/admin/social-connections";
  const safePath =
    path && path.startsWith("/") && !path.startsWith("//") ? path : defaultPath;
  const url = new URL(safePath, base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

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
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      buildReturnUrl(request, null, {
        connect_error: providerError.slice(0, 100),
      }),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildReturnUrl(request, null, { connect_error: "missing_code_or_state" }),
    );
  }

  const consumed = await consumeOAuthState(state);
  if (!consumed) {
    return NextResponse.redirect(
      buildReturnUrl(request, null, { connect_error: "invalid_or_expired_state" }),
    );
  }

  if (consumed.platform !== platform) {
    return NextResponse.redirect(
      buildReturnUrl(request, consumed.redirectAfterUrl, {
        connect_error: "platform_mismatch",
      }),
    );
  }

  const entry = getPlatform(platform);
  const redirectUri = redirectUriForPlatform(platform);

  try {
    const tokenPayload = await entry.adapter.exchangeCode({
      code,
      codeVerifier: consumed.codeVerifier,
      redirectUri,
    });

    await upsertConnection({
      owner: consumed.owner,
      platform: tokenPayload.platform,
      platformAccountId: tokenPayload.platformAccountId,
      platformAccountHandle: tokenPayload.platformAccountHandle,
      platformAccountName: tokenPayload.platformAccountName,
      accessToken: tokenPayload.accessToken,
      refreshToken: tokenPayload.refreshToken,
      tokenExpiresAt: tokenPayload.tokenExpiresAt,
      scopes: tokenPayload.scopes,
    });

    return NextResponse.redirect(
      buildReturnUrl(request, consumed.redirectAfterUrl, {
        connected: platform,
      }),
    );
  } catch (err) {
    console.error(`[social/connect/${platform}/callback] exchange failed:`, err);
    return NextResponse.redirect(
      buildReturnUrl(request, consumed.redirectAfterUrl, {
        connect_error: "token_exchange_failed",
      }),
    );
  }
}
