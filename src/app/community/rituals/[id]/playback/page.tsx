import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RitualPlaylistPlayer } from "@/components/community/ritual-playlist-player";
import { buildRitualPlaylist } from "@/lib/community/ritual-video-map";
import { resolveAssetsForTags } from "@/lib/community/ritual-asset-resolver";

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

  // Build the playlist via the canonical ordering helper (still
  // code-managed — preserves the planet/zodiac sequencing rules per the
  // spec direction "keep in code"). Then re-point each item's URL via
  // the admin-managed resolver. The resolver falls back to the same
  // hardcoded URL the helper returned, so when no admin overrides exist
  // the runtime behaviour is identical to before.
  const playlist = buildRitualPlaylist(tags);

  // community-ritual-admin-config (2026-04-27):
  // Resolve every tag through the DB-first asset resolver. Per-ritual
  // overrides aren't wired yet (the user_ritual_configurations row has
  // no ritual_definition_id today); the resolver falls back to global
  // mapping → code map automatically.
  if (playlist.length > 0) {
    try {
      const resolved = await resolveAssetsForTags(playlist.map((p) => p.tag));
      for (const item of playlist) {
        const hit = resolved.get(item.tag);
        if (hit) {
          item.videoUrl = hit.url;
          item.missing = false;
          if (hit.title) item.title = hit.title;
        }
      }
    } catch (err) {
      // Resolver failures are non-fatal — the playlist already has the
      // hardcoded fallback URLs from buildRitualPlaylist. Log and move on.
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
