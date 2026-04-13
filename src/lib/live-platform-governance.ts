export type LivePlatformKey =
  | "youtube"
  | "twitch"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "zoom"
  | "other";

export type LiveIntegrationTier = "first_class" | "managed" | "link_out_only" | "custom";
export type LivePlaybackMode = "embedded_player" | "external_link" | "manual_status";
export type LivePlatformAvailabilityMode = "inherit" | "force_enable" | "force_disable";

export interface LivePlatformRegistryRow {
  platform_key: LivePlatformKey;
  display_name: string;
  is_globally_enabled: boolean;
  is_selectable_by_diviners: boolean;
  integration_tier: LiveIntegrationTier;
  playback_mode: LivePlaybackMode;
  supports_embed: boolean;
  supports_chat_embed: boolean;
  supports_oauth_connection: boolean;
  supports_event_sync: boolean;
  supports_auto_live_detection: boolean;
  sort_order: number;
  admin_notes: string | null;
}

export interface DivinerLivePlatformOverrideRow {
  diviner_id: string;
  platform_key: LivePlatformKey;
  availability_mode: LivePlatformAvailabilityMode;
  reason: string | null;
  set_by?: string | null;
  set_at?: string | null;
}

export interface GovernedLivePlatform extends LivePlatformRegistryRow {
  availability_mode: LivePlatformAvailabilityMode;
  is_available_for_diviner: boolean;
  is_publicly_renderable: boolean;
  reason: string | null;
}

export interface GovernedStreamPlatformConfig {
  id: string;
  diviner_id: string;
  platform: LivePlatformKey;
  display_name: string | null;
  stream_url: string | null;
  embed_url: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  platform_display_name: string;
  integration_tier: LiveIntegrationTier;
  playback_mode: LivePlaybackMode;
  supports_embed: boolean;
  supports_chat_embed: boolean;
  supports_oauth_connection: boolean;
  supports_event_sync: boolean;
  supports_auto_live_detection: boolean;
}

export const VALID_LIVE_PLATFORM_KEYS: LivePlatformKey[] = [
  "youtube",
  "twitch",
  "facebook",
  "instagram",
  "tiktok",
  "zoom",
  "other",
];

export function isValidLivePlatformKey(value: unknown): value is LivePlatformKey {
  return typeof value === "string" && VALID_LIVE_PLATFORM_KEYS.includes(value as LivePlatformKey);
}

function normalizeOverrideMode(value: unknown): LivePlatformAvailabilityMode {
  return value === "force_enable" || value === "force_disable" ? value : "inherit";
}

export function buildGovernedLivePlatforms(
  registryRows: Array<Record<string, unknown>>,
  overrideRows: Array<Record<string, unknown>> = []
): GovernedLivePlatform[] {
  const overrides = new Map<LivePlatformKey, DivinerLivePlatformOverrideRow>();

  for (const row of overrideRows) {
    if (!isValidLivePlatformKey(row.platform_key)) continue;
    overrides.set(row.platform_key, {
      diviner_id: typeof row.diviner_id === "string" ? row.diviner_id : "",
      platform_key: row.platform_key,
      availability_mode: normalizeOverrideMode(row.availability_mode),
      reason: typeof row.reason === "string" && row.reason.trim() ? row.reason.trim() : null,
      set_by: typeof row.set_by === "string" ? row.set_by : null,
      set_at: typeof row.set_at === "string" ? row.set_at : null,
    });
  }

  return registryRows
    .filter((row) => isValidLivePlatformKey(row.platform_key))
    .map((row) => {
      const platformKey = row.platform_key as LivePlatformKey;
      const override = overrides.get(platformKey);
      const availabilityMode = override?.availability_mode ?? "inherit";
      const isGloballyEnabled = row.is_globally_enabled === true;
      const isSelectableByDiviners = row.is_selectable_by_diviners === true;

      const isAvailableForDiviner = isGloballyEnabled
        ? availabilityMode === "force_disable"
          ? false
          : availabilityMode === "force_enable"
            ? true
            : isSelectableByDiviners
        : false;

      const isPubliclyRenderable = isGloballyEnabled && availabilityMode !== "force_disable";

      return {
        platform_key: platformKey,
        display_name: typeof row.display_name === "string" ? row.display_name : platformKey,
        is_globally_enabled: isGloballyEnabled,
        is_selectable_by_diviners: isSelectableByDiviners,
        integration_tier:
          row.integration_tier === "first_class" ||
          row.integration_tier === "managed" ||
          row.integration_tier === "link_out_only" ||
          row.integration_tier === "custom"
            ? row.integration_tier
            : "managed",
        playback_mode:
          row.playback_mode === "embedded_player" ||
          row.playback_mode === "external_link" ||
          row.playback_mode === "manual_status"
            ? row.playback_mode
            : "external_link",
        supports_embed: row.supports_embed === true,
        supports_chat_embed: row.supports_chat_embed === true,
        supports_oauth_connection: row.supports_oauth_connection === true,
        supports_event_sync: row.supports_event_sync === true,
        supports_auto_live_detection: row.supports_auto_live_detection === true,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
        admin_notes: typeof row.admin_notes === "string" ? row.admin_notes : null,
        availability_mode: availabilityMode,
        is_available_for_diviner: isAvailableForDiviner,
        is_publicly_renderable: isPubliclyRenderable,
        reason: override?.reason ?? null,
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name));
}

export function resolveLivePlatformsForStatus(
  governedPlatforms: GovernedLivePlatform[],
  requestedPlatforms: string[]
): LivePlatformKey[] {
  const allowed = new Set(
    governedPlatforms
      .filter((platform) => platform.is_available_for_diviner)
      .map((platform) => platform.platform_key)
  );

  return requestedPlatforms.filter(isValidLivePlatformKey).filter((platform) => allowed.has(platform));
}

export function getLivePlatformLabel(
  platformKey: LivePlatformKey,
  displayName?: string | null
): string {
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  switch (platformKey) {
    case "youtube":
      return "YouTube";
    case "twitch":
      return "Twitch";
    case "facebook":
      return "Facebook";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "zoom":
      return "Zoom";
    default:
      return "Other";
  }
}

export function getLivePlatformEmoji(platformKey: LivePlatformKey): string {
  switch (platformKey) {
    case "youtube":
      return "📺";
    case "twitch":
      return "🎮";
    case "facebook":
      return "👤";
    case "instagram":
      return "📷";
    case "tiktok":
      return "🎵";
    case "zoom":
      return "💻";
    default:
      return "🌐";
  }
}

export function mergeGovernedPlatformConfigs(
  configRows: Array<Record<string, unknown>>,
  governedPlatforms: GovernedLivePlatform[],
  options?: { publicOnly?: boolean; divinerAvailableOnly?: boolean }
): GovernedStreamPlatformConfig[] {
  const platformMap = new Map(governedPlatforms.map((platform) => [platform.platform_key, platform]));

  return configRows
    .filter((row) => isValidLivePlatformKey(row.platform))
    .map((row) => {
      const platform = platformMap.get(row.platform);
      if (!platform) return null;
      if (options?.publicOnly && !platform.is_publicly_renderable) return null;
      if (options?.divinerAvailableOnly && !platform.is_available_for_diviner) return null;

      return {
        id: typeof row.id === "string" ? row.id : "",
        diviner_id: typeof row.diviner_id === "string" ? row.diviner_id : "",
        platform: row.platform,
        display_name: typeof row.display_name === "string" ? row.display_name : null,
        stream_url: typeof row.stream_url === "string" ? row.stream_url : null,
        embed_url: typeof row.embed_url === "string" ? row.embed_url : null,
        is_enabled: row.is_enabled === true,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
        created_at: typeof row.created_at === "string" ? row.created_at : "",
        updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
        platform_display_name: platform.display_name,
        integration_tier: platform.integration_tier,
        playback_mode: platform.playback_mode,
        supports_embed: platform.supports_embed,
        supports_chat_embed: platform.supports_chat_embed,
        supports_oauth_connection: platform.supports_oauth_connection,
        supports_event_sync: platform.supports_event_sync,
        supports_auto_live_detection: platform.supports_auto_live_detection,
      } satisfies GovernedStreamPlatformConfig;
    })
    .filter((row): row is GovernedStreamPlatformConfig => row !== null)
    .sort((a, b) => a.sort_order - b.sort_order || a.platform_display_name.localeCompare(b.platform_display_name));
}
