/**
 * The single source of truth for "which platforms are enabled".
 *
 * To turn a platform on:
 *   1. Fill in its adapter under lib/social/platforms/<name>.ts
 *      (replace the stub methods with real implementations).
 *   2. Set `enabled: true` here.
 *   3. Make sure the platform-specific env vars are set
 *      (see `requiredEnvVars` on each entry).
 *
 * The admin UI + diviner UI read from this registry to render the list of
 * Connect buttons. Disabled platforms still render (greyed out with a
 * "Coming soon" badge) so operators can see what's on the roadmap.
 */

import type { SocialPlatform, Platform } from "./types";
import { twitterAdapter } from "./platforms/twitter";
import { facebookAdapter } from "./platforms/facebook";
import { instagramAdapter } from "./platforms/instagram";
import { linkedinAdapter } from "./platforms/linkedin";
import { tiktokAdapter } from "./platforms/tiktok";
import { youtubeAdapter } from "./platforms/youtube";

export interface PlatformRegistryEntry {
  adapter: SocialPlatform;
  enabled: boolean;
  displayName: string;
  /** lucide-react icon name (rendered in UI). */
  iconName: string;
  /** Short sentence shown on the Connect card. */
  tagline: string;
  /** Env vars that must be set for this platform to actually work. */
  requiredEnvVars: string[];
}

export const PLATFORM_REGISTRY: Record<Platform, PlatformRegistryEntry> = {
  twitter: {
    adapter: twitterAdapter,
    enabled: true,
    displayName: "X (Twitter)",
    iconName: "twitter",
    tagline: "Post tweets to your X account.",
    requiredEnvVars: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
  },
  facebook: {
    adapter: facebookAdapter,
    enabled: false,
    displayName: "Facebook Page",
    iconName: "facebook",
    tagline: "Post to a Facebook Page you manage.",
    requiredEnvVars: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
  },
  instagram: {
    adapter: instagramAdapter,
    enabled: false,
    displayName: "Instagram",
    iconName: "instagram",
    tagline: "Post to an Instagram Business account.",
    requiredEnvVars: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
  },
  linkedin: {
    adapter: linkedinAdapter,
    enabled: false,
    displayName: "LinkedIn",
    iconName: "linkedin",
    tagline: "Post to your personal LinkedIn profile.",
    requiredEnvVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  },
  tiktok: {
    adapter: tiktokAdapter,
    enabled: false,
    displayName: "TikTok",
    iconName: "music",
    tagline: "Post videos to your TikTok account.",
    requiredEnvVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
  youtube: {
    adapter: youtubeAdapter,
    enabled: false,
    displayName: "YouTube",
    iconName: "youtube",
    tagline: "Upload videos to your YouTube channel.",
    requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
};

export function getPlatform(platform: Platform): PlatformRegistryEntry {
  return PLATFORM_REGISTRY[platform];
}

export function isPlatformEnabled(platform: Platform): boolean {
  return PLATFORM_REGISTRY[platform]?.enabled === true;
}

/** Public summary used by the UI to render the Connect list. */
export function listPlatformsForUi(): Array<{
  id: Platform;
  displayName: string;
  iconName: string;
  tagline: string;
  enabled: boolean;
}> {
  return (Object.keys(PLATFORM_REGISTRY) as Platform[]).map((id) => {
    const entry = PLATFORM_REGISTRY[id];
    return {
      id,
      displayName: entry.displayName,
      iconName: entry.iconName,
      tagline: entry.tagline,
      enabled: entry.enabled,
    };
  });
}
