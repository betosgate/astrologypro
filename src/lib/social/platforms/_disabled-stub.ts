/**
 * Factory for "not yet enabled" platform adapters. Every disabled platform
 * reuses this so the code surface is tiny — the whole contract is filled in
 * with methods that throw `PlatformDisabledError`.
 *
 * Real implementations replace their stub file wholesale when we turn a
 * platform on. Until then the registry entry `enabled: false` keeps these
 * off the UI's active path.
 */

import type { Platform, SocialPlatform } from "../types";
import { PlatformDisabledError } from "../types";

export function makeDisabledAdapter(
  id: Platform,
  displayName: string,
): SocialPlatform {
  const reject = async (): Promise<never> => {
    throw new PlatformDisabledError(id);
  };
  return {
    id,
    displayName,
    buildAuthorizeUrl: reject,
    exchangeCode: reject,
    refreshAccessToken: reject,
    post: reject,
    revoke: reject,
  };
}
