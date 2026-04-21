/**
 * Twitter / X adapter — OAuth 2.0 Authorization Code Flow with PKCE.
 *
 * X Free tier (what we're targeting at launch):
 *   - 500 posts / month, pooled across the whole app
 *   - 100 reads / month (we barely use reads)
 *   - No Premium features required
 *
 * Docs:
 *   Authorize:   https://twitter.com/i/oauth2/authorize
 *   Token:       https://api.twitter.com/2/oauth2/token
 *   Post tweet:  https://api.twitter.com/2/tweets
 *   Me:          https://api.twitter.com/2/users/me
 *   Revoke:      https://api.twitter.com/2/oauth2/revoke
 *
 * Required env vars:
 *   TWITTER_CLIENT_ID       OAuth 2.0 client ID from the X developer portal
 *   TWITTER_CLIENT_SECRET   Client secret (Confidential Client recommended)
 *   NEXT_PUBLIC_APP_URL     Public origin used to build the redirect URI
 *
 * Scopes requested:
 *   tweet.read      (read tweets)
 *   tweet.write     (post tweets)
 *   users.read      (fetch @handle after connect)
 *   offline.access  (refresh token so connections survive past 2 hours)
 *
 * Note on media (images): X Free tier permits image uploads via the v1.1
 * media/upload endpoint, but it requires an OAuth 1.0a user context that
 * our current OAuth 2.0 user tokens can't produce. For v1 of this feature
 * we ship text-only posts. When we upgrade to X Basic ($100/mo) we'll add
 * media support via the v2 media/upload endpoint in a follow-up.
 */

import type {
  ConnectedAccount,
  NewConnectionPayload,
  PostContent,
  PostResult,
  SocialPlatform,
} from "../types";
import { PlatformAuthError, PlatformPostError } from "../types";

const AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWEETS_URL = "https://api.twitter.com/2/tweets";
const ME_URL = "https://api.twitter.com/2/users/me";
const REVOKE_URL = "https://api.twitter.com/2/oauth2/revoke";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

function creds() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PlatformAuthError(
      "TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET are not configured",
      "twitter",
    );
  }
  return { clientId, clientSecret };
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export const twitterAdapter: SocialPlatform = {
  id: "twitter",
  displayName: "X (Twitter)",

  async buildAuthorizeUrl({ state, redirectUri }) {
    const { clientId } = creds();
    // PKCE pair is built by the caller (oauth-state.generatePkcePair) and
    // the code_verifier is persisted in social_oauth_states. We receive
    // the state value and construct the URL — the verifier isn't needed
    // until token exchange.
    const { createHash, randomBytes } = await import("node:crypto");
    const codeVerifier = randomBytes(48)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return { url: url.toString(), codeVerifier };
  },

  async exchangeCode({ code, codeVerifier, redirectUri }) {
    const { clientId, clientSecret } = creds();

    if (!codeVerifier) {
      throw new PlatformAuthError(
        "PKCE code_verifier missing — OAuth state was not persisted",
        "twitter",
      );
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new PlatformAuthError(
        `Token exchange failed (${res.status}): ${errText.slice(0, 400)}`,
        "twitter",
      );
    }

    const tokenJson = (await res.json()) as {
      token_type: string;
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    // Fetch the user's handle so we can display it in the UI.
    const meRes = await fetch(ME_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    let platformAccountId = "";
    let platformAccountHandle: string | null = null;
    let platformAccountName: string | null = null;

    if (meRes.ok) {
      const meJson = (await meRes.json()) as {
        data?: { id: string; username: string; name: string };
      };
      if (meJson.data) {
        platformAccountId = meJson.data.id;
        platformAccountHandle = "@" + meJson.data.username;
        platformAccountName = meJson.data.name;
      }
    }

    if (!platformAccountId) {
      throw new PlatformAuthError(
        "Could not retrieve user profile from X /users/me",
        "twitter",
      );
    }

    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000)
      : null;

    const payload: Omit<NewConnectionPayload, "owner"> = {
      platform: "twitter",
      platformAccountId,
      platformAccountHandle,
      platformAccountName,
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      scopes: tokenJson.scope?.split(" ") ?? SCOPES,
    };
    return payload;
  },

  async refreshAccessToken(account) {
    if (!account.refreshToken) {
      throw new PlatformAuthError("No refresh_token on record", "twitter");
    }
    const { clientId, clientSecret } = creds();

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientId,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new PlatformAuthError(
        `Refresh failed (${res.status}): ${errText.slice(0, 400)}`,
        "twitter",
      );
    }

    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? account.refreshToken,
      tokenExpiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000)
        : null,
      scopes: json.scope?.split(" ") ?? account.scopes,
    };
  },

  async post(account: ConnectedAccount, content: PostContent): Promise<PostResult> {
    if (content.scheduleAt) {
      // X v2 API does not natively support scheduled tweets for free tier.
      // The caller (cron) handles scheduling by only calling us when the
      // scheduled_at has arrived. If a caller sets scheduleAt here it's
      // a caller bug — we fail loud instead of silently posting now.
      throw new PlatformPostError(
        "Twitter adapter does not support deferred scheduling — " +
          "the caller must dispatch posts only when their scheduled_at has passed.",
        "twitter",
      );
    }

    if (content.imageUrl) {
      // See file header: media support is out of scope for the Free-tier
      // launch. We log + drop the image silently rather than fail — the
      // text still goes out.
      console.warn(
        "[social/twitter] image attached to post was dropped — " +
          "Free-tier media upload is not implemented yet",
      );
    }

    // Trim to X's 280-char hard limit. We don't try to preserve URL shortening;
    // X does its own t.co wrapping so a 280-char cap is correct for input.
    const text = content.text.length > 280 ? content.text.slice(0, 277) + "..." : content.text;

    const res = await fetch(TWEETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new PlatformPostError(
        `Tweet post failed: ${errText.slice(0, 400)}`,
        "twitter",
        res.status,
      );
    }

    const json = (await res.json()) as {
      data?: { id: string; text: string };
    };

    if (!json.data?.id) {
      throw new PlatformPostError(
        "Tweet API returned 200 but no id",
        "twitter",
        res.status,
      );
    }

    const tweetId = json.data.id;
    const permalink = account.platformAccountHandle
      ? `https://x.com/${account.platformAccountHandle.replace(/^@/, "")}/status/${tweetId}`
      : `https://x.com/i/status/${tweetId}`;

    return {
      platformPostId: tweetId,
      permalink,
      scheduled: false,
    };
  },

  async revoke(account) {
    const { clientId, clientSecret } = creds();
    try {
      await fetch(REVOKE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({
          token: account.accessToken,
          token_type_hint: "access_token",
        }).toString(),
      });
    } catch (err) {
      // Best-effort — even if revoke fails, we still delete our side.
      console.warn("[social/twitter] revoke failed:", err);
    }
  },
};
