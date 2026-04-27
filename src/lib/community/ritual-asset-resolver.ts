/**
 * Ritual asset resolver — admin-managed first, code fallback always.
 *
 * Spec source:
 *   docs/tasks/2026-04-27/03-admin-ritual-configurations-and-dynamic-media-management.md
 *   (Step 7 — Shared resolver layer.)
 *
 * Responsibilities:
 *   1. Resolve a ritual tag (e.g. "Fire_Gate_Invocation_Ritual") to a
 *      playable video URL.
 *   2. Honour the optional ritual-definition-level final-override video
 *      (one video that replaces the entire generated playlist).
 *   3. Look up admin-managed mappings first; fall back to the hardcoded
 *      `ritual-video-map.ts` constant when no DB row is configured.
 *
 * Design notes:
 *   - Server-only module. The DB read uses an admin client; RLS allows
 *     authenticated SELECT of published/active rows but the resolver can
 *     run from cron or background contexts too, so we go through admin.
 *   - Per-ritual mapping wins over global mapping — admins can override
 *     individual steps for a single ritual without touching globals.
 *   - The hardcoded fallback in `ritual-video-map.ts` is intentionally
 *     kept so that an environment without the migration applied (or with
 *     an empty asset library) still plays correctly. Behaviour is
 *     identical to the pre-resolver world until admins start curating.
 *   - Pure read paths only. Writes happen via Phase 2 admin endpoints.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRitualVideoUrlForTag as codeMapUrlForTag,
  type RitualPlaylistKind,
} from "@/lib/community/ritual-video-map";

// ── Types ────────────────────────────────────────────────────────────────

export interface ResolvedAsset {
  /** The S3 URL or external URL the player should hit. */
  url: string;
  /** Where the URL came from — useful for telemetry / dev diagnostics. */
  source: "ritual_definition_mapping" | "global_mapping" | "code_fallback";
  /** asset_id when the URL came from the DB; null on code fallback. */
  assetId: string | null;
  /** The asset row's title when present (DB only); null on code fallback. */
  title: string | null;
}

export interface ResolvedFinalOverride {
  url: string;
  assetId: string;
  title: string | null;
}

export interface RitualDefinitionSummary {
  id: string;
  key: string;
  title: string;
  description: string | null;
  ritualType: "static" | "dynamic";
  supportedMode: "invocation" | "banishing" | "both";
  badgeLabel: string | null;
  iconKey: string | null;
  sortOrder: number;
  isVisible: boolean;
  isPublished: boolean;
  playbackPolicy: Record<string, unknown>;
  finalOverrideEnabled: boolean;
  finalOverrideAssetId: string | null;
  cardTitleOverride: string | null;
  cardDescriptionOverride: string | null;
  completionMessage: string | null;
  missingAssetMessage: string | null;
}

interface MappingRow {
  tag_key: string | null;
  asset_id: string;
  ritual_definition_id: string | null;
  mapping_scope: "global" | "ritual_definition";
}

interface AssetRow {
  id: string;
  asset_key: string;
  title: string;
  source_type: "upload" | "external_url";
  storage_path: string | null;
  external_url: string | null;
  is_active: boolean;
  is_published: boolean;
}

// ── Asset URL helper ─────────────────────────────────────────────────────

/**
 * Returns the canonical playback URL for an asset row, or null when the
 * row is unusable (inactive, unpublished, or missing both source fields).
 */
function urlForAssetRow(row: Pick<AssetRow, "is_active" | "is_published" | "source_type" | "storage_path" | "external_url">): string | null {
  if (!row.is_active || !row.is_published) return null;
  if (row.source_type === "upload" && row.storage_path) return row.storage_path;
  if (row.source_type === "external_url" && row.external_url) return row.external_url;
  return null;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Resolve a single tag to a playable URL, optionally scoped to a
 * ritual_definition. Lookup order:
 *
 *   1. Per-ritual mapping (if `ritualDefinitionId` is supplied AND a
 *      ritual_asset_mappings row exists with mapping_scope='ritual_definition'
 *      and the matching ritual_definition_id + tag_key).
 *   2. Global mapping (mapping_scope='global', tag_key match).
 *   3. Hardcoded code fallback (ritual-video-map.ts).
 *   4. null when nothing resolves.
 *
 * The DB lookups are JOINed against ritual_media_assets and the result
 * is rejected if the asset row is inactive/unpublished — so a "soft
 * disable" flip on an asset cleanly falls through to the next layer.
 */
export async function resolveAssetForTag(
  tag: string,
  ritualDefinitionId?: string | null
): Promise<ResolvedAsset | null> {
  const admin = createAdminClient();

  // Per-definition mapping first.
  if (ritualDefinitionId) {
    const { data: hit } = await admin
      .from("ritual_asset_mappings")
      .select(
        `tag_key, asset_id, ritual_definition_id, mapping_scope,
         asset:ritual_media_assets!inner(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
      )
      .eq("mapping_scope", "ritual_definition")
      .eq("ritual_definition_id", ritualDefinitionId)
      .eq("tag_key", tag)
      .eq("is_active", true)
      .maybeSingle();

    const asset = hit?.asset as AssetRow | null | undefined;
    if (hit && asset) {
      const url = urlForAssetRow(asset);
      if (url) {
        return {
          url,
          source: "ritual_definition_mapping",
          assetId: asset.id,
          title: asset.title,
        };
      }
    }
  }

  // Global mapping.
  const { data: globalHit } = await admin
    .from("ritual_asset_mappings")
    .select(
      `tag_key, asset_id, ritual_definition_id, mapping_scope,
       asset:ritual_media_assets!inner(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
    )
    .eq("mapping_scope", "global")
    .eq("tag_key", tag)
    .eq("is_active", true)
    .maybeSingle();

  const globalAsset = globalHit?.asset as AssetRow | null | undefined;
  if (globalHit && globalAsset) {
    const url = urlForAssetRow(globalAsset);
    if (url) {
      return {
        url,
        source: "global_mapping",
        assetId: globalAsset.id,
        title: globalAsset.title,
      };
    }
  }

  // Code fallback.
  const codeUrl = codeMapUrlForTag(tag);
  if (codeUrl) {
    return {
      url: codeUrl,
      source: "code_fallback",
      assetId: null,
      title: null,
    };
  }

  return null;
}

/**
 * Bulk-resolve a list of tags in one round-trip per scope. Falls back
 * per-tag to the code map for any tag without a DB hit.
 *
 * Returns a Map<tag, ResolvedAsset> (only includes resolved tags; callers
 * should treat missing keys as "no mapping").
 */
export async function resolveAssetsForTags(
  tags: string[],
  ritualDefinitionId?: string | null
): Promise<Map<string, ResolvedAsset>> {
  const result = new Map<string, ResolvedAsset>();
  if (tags.length === 0) return result;

  const admin = createAdminClient();
  const uniqueTags = Array.from(new Set(tags));

  // Per-definition mappings first (if requested).
  if (ritualDefinitionId) {
    const { data: defRows } = await admin
      .from("ritual_asset_mappings")
      .select(
        `tag_key, asset_id, ritual_definition_id, mapping_scope,
         asset:ritual_media_assets!inner(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
      )
      .eq("mapping_scope", "ritual_definition")
      .eq("ritual_definition_id", ritualDefinitionId)
      .in("tag_key", uniqueTags)
      .eq("is_active", true);

    for (const row of (defRows ?? []) as Array<MappingRow & { asset: AssetRow }>) {
      if (!row.tag_key) continue;
      const url = urlForAssetRow(row.asset);
      if (!url) continue;
      result.set(row.tag_key, {
        url,
        source: "ritual_definition_mapping",
        assetId: row.asset.id,
        title: row.asset.title,
      });
    }
  }

  // Global mappings for tags not yet resolved.
  const stillNeed = uniqueTags.filter((t) => !result.has(t));
  if (stillNeed.length > 0) {
    const { data: globalRows } = await admin
      .from("ritual_asset_mappings")
      .select(
        `tag_key, asset_id, ritual_definition_id, mapping_scope,
         asset:ritual_media_assets!inner(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
      )
      .eq("mapping_scope", "global")
      .in("tag_key", stillNeed)
      .eq("is_active", true);

    for (const row of (globalRows ?? []) as Array<MappingRow & { asset: AssetRow }>) {
      if (!row.tag_key) continue;
      const url = urlForAssetRow(row.asset);
      if (!url) continue;
      result.set(row.tag_key, {
        url,
        source: "global_mapping",
        assetId: row.asset.id,
        title: row.asset.title,
      });
    }
  }

  // Code fallback for any remaining tags.
  for (const tag of uniqueTags) {
    if (result.has(tag)) continue;
    const codeUrl = codeMapUrlForTag(tag);
    if (codeUrl) {
      result.set(tag, {
        url: codeUrl,
        source: "code_fallback",
        assetId: null,
        title: null,
      });
    }
  }

  return result;
}

/**
 * Returns the ritual definition's final-override video, if and only if
 *   - final_override_enabled = TRUE
 *   - final_override_asset_id is non-null
 *   - the linked asset is active + published
 *
 * Otherwise returns null and callers should generate the normal playlist.
 */
export async function resolveFinalOverrideForRitual(
  ritualDefinitionId: string
): Promise<ResolvedFinalOverride | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ritual_definitions")
    .select(
      `id, final_override_enabled, final_override_asset_id,
       asset:ritual_media_assets(id, title, source_type, storage_path, external_url, is_active, is_published)`
    )
    .eq("id", ritualDefinitionId)
    .maybeSingle();

  if (!data || !data.final_override_enabled || !data.final_override_asset_id) {
    return null;
  }
  const asset = data.asset as AssetRow | null;
  if (!asset) return null;
  const url = urlForAssetRow(asset);
  if (!url) return null;
  return { url, assetId: asset.id, title: asset.title };
}

/**
 * Load a ritual definition by its `key`. Used when a user-facing page
 * needs the admin-managed metadata (title/description/badge/etc.) for
 * one of the canonical rituals — the runtime side calls this with keys
 * like 'standard_banishing_pentagram' or 'planetary_zodiacal_invocation'.
 */
export async function loadRitualDefinitionByKey(
  key: string
): Promise<RitualDefinitionSummary | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ritual_definitions")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  if (!data || data.archived_at) return null;
  return mapRitualDefinitionRow(data as Record<string, unknown>);
}

/**
 * List all published, visible, non-archived ritual definitions in
 * sort_order. Used by `/community/rituals/new` once it's switched to
 * read from admin-managed metadata (Phase 4 in the follow-up doc).
 */
export async function listPublishedRitualDefinitions(): Promise<RitualDefinitionSummary[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ritual_definitions")
    .select("*")
    .eq("is_published", true)
    .eq("is_visible", true)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRitualDefinitionRow);
}

// ── Internal helpers ─────────────────────────────────────────────────────

function mapRitualDefinitionRow(row: Record<string, unknown>): RitualDefinitionSummary {
  return {
    id: String(row.id),
    key: String(row.key),
    title: String(row.title),
    description: (row.description as string) ?? null,
    ritualType: (row.ritual_type as "static" | "dynamic") ?? "dynamic",
    supportedMode:
      (row.supported_mode as "invocation" | "banishing" | "both") ?? "both",
    badgeLabel: (row.badge_label as string) ?? null,
    iconKey: (row.icon_key as string) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isVisible: row.is_visible !== false,
    isPublished: row.is_published !== false,
    playbackPolicy:
      (row.playback_policy_json as Record<string, unknown>) ?? {},
    finalOverrideEnabled: row.final_override_enabled === true,
    finalOverrideAssetId: (row.final_override_asset_id as string) ?? null,
    cardTitleOverride: (row.card_title_override as string) ?? null,
    cardDescriptionOverride:
      (row.card_description_override as string) ?? null,
    completionMessage: (row.completion_message as string) ?? null,
    missingAssetMessage: (row.missing_asset_message as string) ?? null,
  };
}

// Re-export the playlist-kind type so consumers using the resolver can
// keep their existing import surface tight.
export type { RitualPlaylistKind };
