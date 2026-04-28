import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RitualPlaylistPlayer } from "@/components/community/ritual-playlist-player";
import { buildRitualPlaylist } from "@/lib/community/ritual-video-map";
import {
  resolveAssetsForTags,
  resolveFinalOverrideForRitual,
  listPublishedRitualDefinitions,
} from "@/lib/community/ritual-asset-resolver";

export const dynamic = "force-dynamic";
export const metadata = { title: "Begin the Ritual" };

/**
 * Community Perennial Mandalism — ritual playback (video playlist).
 *
 * Spec source:
 *   docs/tasks/2026-04-27/01-perennial-mandalism-ritual-playlist-player-and-video-mapping.md
 *
 * This route opens when the user clicks "Begin the Ritual" on the ritual
 * detail page. It:
 *   1. Fetches the ritual (object-level auth: user_id must match).
 *   2. Builds the canonical playlist via the shared ritual-video-map
 *      utility (handles Fire→Water→Air→Earth→Spirit ordering, etc.).
 *   3. Hands the playlist to the client player which enforces the
 *      forward-lock / backward-replay rules and persists progress.
 *
 * It deliberately reuses the existing `/api/community/rituals/[id]`
 * PATCH endpoint for progress, so no new API surface is introduced
 * and the ritual list page (which already reads `current_step` and
 * `is_complete`) keeps working without changes.
 */
export default async function CommunityRitualPlaybackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/community/rituals/${id}/playback`)}`);
  }

  // Object-level authorization: only the ritual's owner can play it.
  const { data: ritual, error } = await supabase
    .from("user_ritual_configurations")
    .select(
      "id, ritual_name, ritual_tags, current_step, is_complete"
    )
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error || !ritual) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/community/rituals">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to My Rituals
          </Link>
        </Button>
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Ritual not found, or you don&apos;t have access.
        </div>
      </div>
    );
  }

  const tags: string[] = Array.isArray(ritual.ritual_tags)
    ? (ritual.ritual_tags as string[])
    : [];

  // ── Match this user-ritual to an admin ritual_definitions row ────────
  //
  // user_ritual_configurations doesn't yet carry a ritual_definition_id
  // FK (the user-side ritual builder pre-dates the admin definitions).
  // We map by title match against the published definitions list — the
  // four seeded definitions use the same title strings the user-side
  // builder writes for the 3 static rituals + the dynamic planetary
  // ritual. When a match is found we get final-override resolution and
  // can pass the definition id to the per-ritual mapping resolver.
  let matchedDefinitionId: string | null = null;
  try {
    const definitions = await listPublishedRitualDefinitions();
    const wantedTitle = (ritual.ritual_name ?? "").trim().toLowerCase();
    const matched = definitions.find(
      (d) => d.title.trim().toLowerCase() === wantedTitle
    );
    if (matched) matchedDefinitionId = matched.id;
  } catch {
    /* non-fatal */
  }

  // ── Final-override branch (Task 04 spec section 5) ───────────────────
  //
  // If the matched definition has final_override_enabled + a valid
  // override asset, render a single-item playlist using that one video
  // and bypass the generated step playback entirely.
  let overrideAsset: Awaited<ReturnType<typeof resolveFinalOverrideForRitual>> | null = null;
  if (matchedDefinitionId) {
    try {
      overrideAsset = await resolveFinalOverrideForRitual(matchedDefinitionId);
    } catch (err) {
      console.warn(
        "[community/rituals/playback] final-override resolution failed:",
        err instanceof Error ? err.message : err
      );
      /* fall through to playlist mode */
    }
  }

  if (overrideAsset) {
    const overridePlaylist = [
      {
        tag: "Final_Override",
        title: overrideAsset.title ?? ritual.ritual_name,
        videoUrl: overrideAsset.url,
        filename: null,
        sequence: 1,
        kind: "static" as const,
        missing: false,
      },
    ];
    return (
      <div className="space-y-4">
        <RitualPlaylistPlayer
          ritualId={ritual.id}
          ritualName={ritual.ritual_name}
          playlist={overridePlaylist}
          initialHighestStepIndex={0}
        />
      </div>
    );
  }

  // Build the playlist via the canonical ordering helper (still
  // code-managed — preserves the planet/zodiac sequencing rules per the
  // spec direction "keep in code"). Then re-point each item's URL via
  // the admin-managed resolver. The resolver falls back to the same
  // hardcoded URL the helper returned, so when no admin overrides exist
  // the runtime behaviour is identical to before.
  const playlist = buildRitualPlaylist(tags);

  // community-ritual-admin-config (2026-04-27):
  // Resolve every tag through the DB-first asset resolver, scoped by
  // the matched ritual_definition_id when we have one. Per-ritual
  // overrides take precedence over global mappings → code map fallback.
  if (playlist.length > 0) {
    try {
      const resolved = await resolveAssetsForTags(
        playlist.map((p) => p.tag),
        matchedDefinitionId
      );
      for (const item of playlist) {
        const hit = resolved.get(item.tag);
        if (hit) {
          item.videoUrl = hit.url;
          item.missing = false;
          if (hit.title) item.title = hit.title;
        }
      }
    } catch (err) {
      console.warn(
        "[community/rituals/playback] asset resolver failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Resume mode: convert the persisted `current_step` (1-indexed, with 0 =
  // never started) to a 0-indexed step count clamped to the actual playlist.
  // If the ritual was previously marked complete the user can replay from the
  // start with everything unlocked.
  const persistedCurrentStep =
    typeof ritual.current_step === "number" ? ritual.current_step : 0;
  let initialHighestStepIndex = 0;
  if (ritual.is_complete) {
    initialHighestStepIndex = Math.max(playlist.length - 1, 0);
  } else if (persistedCurrentStep > 0) {
    initialHighestStepIndex = Math.min(
      Math.max(persistedCurrentStep - 1, 0),
      Math.max(playlist.length - 1, 0)
    );
  }

  return (
    <div className="space-y-4">
      <RitualPlaylistPlayer
        ritualId={ritual.id}
        ritualName={ritual.ritual_name}
        playlist={playlist}
        initialHighestStepIndex={initialHighestStepIndex}
      />
    </div>
  );
}
