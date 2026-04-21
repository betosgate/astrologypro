/**
 * Cross-platform post dispatcher.
 *
 * Given an owner + a list of platforms + content, looks up the active
 * connection for each platform, calls the right adapter, and reports
 * per-platform success/failure. Handles one token-refresh retry on 401.
 */

import { getPlatform, isPlatformEnabled } from "./platform-registry";
import {
  getActiveConnection,
  markConnectionPosted,
  markConnectionError,
  updateConnectionTokens,
  getConnectionById,
} from "./accounts-repo";
import type { Owner, Platform, PostContent, PostResult } from "./types";
import { PlatformDisabledError, PlatformPostError } from "./types";

export interface DispatchResult {
  platform: Platform;
  ok: boolean;
  platformPostId?: string;
  permalink?: string | null;
  error?: string;
}

export async function dispatchPost(input: {
  owner: Owner;
  platforms: Platform[];
  content: PostContent;
}): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [];

  for (const platform of input.platforms) {
    if (!isPlatformEnabled(platform)) {
      results.push({
        platform,
        ok: false,
        error: `Platform "${platform}" is not yet enabled`,
      });
      continue;
    }

    let connection = await getActiveConnection(input.owner, platform);
    if (!connection) {
      results.push({
        platform,
        ok: false,
        error: `No active ${platform} connection`,
      });
      continue;
    }

    const entry = getPlatform(platform);

    // First attempt — proactive refresh if token is expired or within 60s
    // of expiry. The second 401 retry below is the safety net.
    const now = Date.now();
    if (
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() <= now + 60_000 &&
      connection.refreshToken
    ) {
      try {
        const refreshed = await entry.adapter.refreshAccessToken(connection);
        await updateConnectionTokens(connection.id, refreshed);
        const reloaded = await getConnectionById(connection.id);
        if (reloaded) connection = reloaded;
      } catch (err) {
        await markConnectionError(connection.id, describeError(err));
        results.push({
          platform,
          ok: false,
          error: `Token refresh failed: ${describeError(err)}`,
        });
        continue;
      }
    }

    try {
      const result = await entry.adapter.post(connection, input.content);
      await markConnectionPosted(connection.id);
      results.push(successResult(platform, result));
    } catch (err) {
      // One retry on 401-ish errors — maybe the token expired between check and post.
      if (isUnauthorized(err) && connection.refreshToken) {
        try {
          const refreshed = await entry.adapter.refreshAccessToken(connection);
          await updateConnectionTokens(connection.id, refreshed);
          const reloaded = await getConnectionById(connection.id);
          if (reloaded) {
            const retryResult = await entry.adapter.post(reloaded, input.content);
            await markConnectionPosted(reloaded.id);
            results.push(successResult(platform, retryResult));
            continue;
          }
        } catch (retryErr) {
          await markConnectionError(connection.id, describeError(retryErr));
          results.push({
            platform,
            ok: false,
            error: `Retry after refresh failed: ${describeError(retryErr)}`,
          });
          continue;
        }
      }

      await markConnectionError(connection.id, describeError(err));
      results.push({
        platform,
        ok: false,
        error: describeError(err),
      });
    }
  }

  return results;
}

function successResult(platform: Platform, r: PostResult): DispatchResult {
  return {
    platform,
    ok: true,
    platformPostId: r.platformPostId,
    permalink: r.permalink ?? null,
  };
}

function isUnauthorized(err: unknown): boolean {
  if (err instanceof PlatformPostError && err.status === 401) return true;
  const msg = describeError(err).toLowerCase();
  return msg.includes("401") || msg.includes("unauthorized");
}

function describeError(err: unknown): string {
  if (err instanceof PlatformDisabledError) return err.message;
  if (err instanceof PlatformPostError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}
