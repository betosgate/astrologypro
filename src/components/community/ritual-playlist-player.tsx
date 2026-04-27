"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RitualPlaylistItem } from "@/lib/community/ritual-video-map";

interface RitualPlaylistPlayerProps {
  ritualId: string;
  ritualName: string;
  playlist: RitualPlaylistItem[];
  /**
   * Highest step the user had previously reached, persisted on the
   * ritual row (0 = never started). Used as the initial unlocked
   * boundary so a refresh resumes where the user left off.
   */
  initialHighestStepIndex?: number;
}

function fmtSeconds(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function kindLabel(kind: RitualPlaylistItem["kind"]): string {
  switch (kind) {
    case "opening":
      return "Opening";
    case "closing":
      return "Closing";
    case "gate":
      return "Gate";
    case "static":
      return "Ritual";
    default:
      return "Invocation";
  }
}

function kindBadgeClass(kind: RitualPlaylistItem["kind"]): string {
  switch (kind) {
    case "opening":
      return "bg-blue-500/15 text-blue-700 border-blue-500/30";
    case "closing":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30";
    case "gate":
      return "bg-purple-500/15 text-purple-700 border-purple-500/30";
    case "static":
      return "bg-slate-500/15 text-slate-700 border-slate-500/30";
    default:
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  }
}

/**
 * Sequential ritual-video player.
 *
 * Locking model:
 *   - currentStepIndex      → which item is currently shown
 *   - highestUnlockedIndex  → the furthest the user has been allowed to reach
 *   - completedIndexes      → Set<number> of items whose video has ended
 *
 * A click on a playlist row is allowed iff the row's index is
 * `<= highestUnlockedIndex`. Future rows render with a lock and ignore
 * clicks. When the active video fires `ended`, the current step is
 * marked completed, the unlocked boundary is bumped, and playback
 * auto-advances to the next item. Once a step has been unlocked it
 * stays unlocked for replay.
 *
 * Progress persistence:
 *   When the unlocked boundary advances, the component PATCHes
 *   `current_step` on /api/community/rituals/[id]. When the final
 *   video ends, it PATCHes `is_complete: true`. Failures are logged
 *   but never block playback — the local UI is the source of truth
 *   in the moment.
 */
export function RitualPlaylistPlayer({
  ritualId,
  ritualName,
  playlist,
  initialHighestStepIndex = 0,
}: RitualPlaylistPlayerProps) {
  const totalSteps = playlist.length;

  // Clamp the resumed boundary into the actual playlist range so a stale
  // current_step from a longer prior playlist can't break the state.
  const safeInitialHighest = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.min(Math.max(initialHighestStepIndex, 0), totalSteps - 1);
  }, [initialHighestStepIndex, totalSteps]);

  const [currentStepIndex, setCurrentStepIndex] = useState(safeInitialHighest);
  const [highestUnlockedIndex, setHighestUnlockedIndex] =
    useState(safeInitialHighest);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(() => {
    // Resume model: every step before the resumed one is implicitly complete.
    const resumed = new Set<number>();
    for (let i = 0; i < safeInitialHighest; i += 1) resumed.add(i);
    return resumed;
  });
  const [completedAll, setCompletedAll] = useState(false);

  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeItem: RitualPlaylistItem | null = useMemo(() => {
    if (totalSteps === 0) return null;
    const idx = Math.min(Math.max(currentStepIndex, 0), totalSteps - 1);
    return playlist[idx] ?? null;
  }, [currentStepIndex, playlist, totalSteps]);

  // ── Persistence helpers (fire-and-forget) ────────────────────────────────
  const patchProgress = useCallback(
    async (payload: { current_step?: number; is_complete?: boolean }) => {
      try {
        await fetch(`/api/community/rituals/${ritualId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("[RitualPlaylistPlayer] PATCH failed:", err);
      }
    },
    [ritualId]
  );

  // ── Reset video element when the active item changes ─────────────────────
  // We only call into the imperative <video> element here — the duration
  // and position state are reset by the element's own onEmptied /
  // onLoadedMetadata / onTimeUpdate handlers below, which keeps this
  // effect free of setState calls (avoids cascading renders).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeItem) return;
    // Loading a new src and calling load() avoids a brief flash of the
    // previous frame on Chrome.
    el.load();
    // Best-effort autoplay. Browsers often require muted=true for
    // programmatic play; we leave the audio on but suppress promise
    // rejections so the page doesn't crash if autoplay is blocked —
    // the user can still hit Play.
    el.play().catch(() => {
      /* autoplay may be blocked until first user gesture */
    });
  }, [activeItem?.tag, activeItem]);

  // Video lifecycle: reset duration/position when the source unloads.
  const handleEmptied = useCallback(() => {
    setDuration(0);
    setPosition(0);
  }, []);

  // ── Video event handlers ────────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (!activeItem) return;
    const idx = currentStepIndex;
    setCompletedIndexes((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });

    const isLast = idx >= totalSteps - 1;

    if (isLast) {
      setCompletedAll(true);
      void patchProgress({ current_step: totalSteps, is_complete: true });
      return;
    }

    const nextIdx = idx + 1;
    setHighestUnlockedIndex((prev) => Math.max(prev, nextIdx));
    setCurrentStepIndex(nextIdx);
    void patchProgress({ current_step: nextIdx + 1 });
  }, [activeItem, currentStepIndex, patchProgress, totalSteps]);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el) setDuration(el.duration);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (el) setPosition(el.currentTime);
  }, []);

  // ── Playlist row click ───────────────────────────────────────────────────
  const handleSelect = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      if (idx > highestUnlockedIndex) return; // hard lock — UI also disables
      setCurrentStepIndex(idx);
    },
    [highestUnlockedIndex, totalSteps]
  );

  // ── Empty / degenerate states ───────────────────────────────────────────
  if (totalSteps === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This ritual has no playable steps yet. Add invocations to see them
          here.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/community/rituals/${ritualId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to ritual
          </Link>
        </Button>
      </div>
    );
  }

  const overallElapsed = (() => {
    // Approximation: assume completed steps fully consumed their stored
    // duration, plus the live position of the current step. Without
    // reading metadata for every video upfront we can't show a perfect
    // global timer, so we show the current step's clock prominently and
    // the global progress in step counts.
    return Math.floor(position);
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Player panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {ritualName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
              {activeItem ? ` — ${activeItem.title}` : ""}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/community/rituals/${ritualId}`}>
              <ArrowLeft className="mr-1.5 size-4" />
              Exit
            </Link>
          </Button>
        </div>

        {/* Video shell */}
        <div className="overflow-hidden rounded-xl border bg-black">
          {activeItem?.videoUrl ? (
            <video
              ref={videoRef}
              key={activeItem.tag}
              src={activeItem.videoUrl}
              controls
              autoPlay
              playsInline
              onEnded={handleEnded}
              onEmptied={handleEmptied}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              className="aspect-video w-full bg-black object-contain"
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black/90 text-white/70">
              <AlertTriangle className="size-8 text-amber-400" aria-hidden="true" />
              <p className="text-sm">Video asset is missing for this step.</p>
              <p className="text-xs text-white/40">
                Tag: <code>{activeItem?.tag ?? "—"}</code>
              </p>
              {/*
                Per spec Step 9 — never silently skip. We surface the
                missing-asset state explicitly. The user can still click
                back to a completed step or, when the next step exists
                and is unlocked, advance manually below.
              */}
              {currentStepIndex < highestUnlockedIndex && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                >
                  Skip to next step
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Per-step timer + progress text */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {fmtSeconds(overallElapsed)} / {fmtSeconds(duration)}
          </span>
          <span>
            {completedIndexes.size} of {totalSteps} complete
          </span>
        </div>

        {completedAll && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-amber-700">
              <Sparkles className="size-4" aria-hidden="true" />
              Ritual complete.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The full sequence is unlocked — replay any step from the
              playlist, or return to the ritual page.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCurrentStepIndex(0);
                  setCompletedAll(false);
                }}
              >
                <Play className="mr-1.5 size-3.5" />
                Replay from start
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/community/rituals/${ritualId}`}>
                  Back to ritual
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Playlist sidebar */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Playlist</h2>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {totalSteps} step{totalSteps !== 1 ? "s" : ""}
          </span>
        </div>
        <ol className="space-y-1.5">
          {playlist.map((item, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = completedIndexes.has(idx);
            const isLocked = idx > highestUnlockedIndex;
            // Style buckets:
            //   active   → primary border + filled background
            //   complete → emerald-tinted, checkmark
            //   locked   → muted, lock icon, pointer-events-none
            //   default  → standard row
            const baseClass =
              "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors";
            const stateClass = isActive
              ? "border-primary/60 bg-primary/10 text-foreground"
              : isCompleted
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 hover:bg-emerald-500/10"
              : isLocked
              ? "border-border/40 bg-muted/20 text-muted-foreground/60 cursor-not-allowed"
              : "border-border/60 bg-card hover:bg-muted/30";

            return (
              <li key={`${item.tag}-${idx}`}>
                <button
                  type="button"
                  className={`${baseClass} ${stateClass}`}
                  onClick={() => handleSelect(idx)}
                  disabled={isLocked}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={
                    isLocked
                      ? `Step ${idx + 1}, locked: ${item.title}`
                      : `Step ${idx + 1}: ${item.title}`
                  }
                  title={
                    isLocked
                      ? "Finish the current step to unlock"
                      : undefined
                  }
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : isLocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    ) : isLocked ? (
                      <Lock className="size-3" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[9px] ${kindBadgeClass(item.kind)}`}
                  >
                    {kindLabel(item.kind)}
                  </Badge>
                  {item.missing && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[9px] border-amber-500/40 bg-amber-500/10 text-amber-700"
                      title={`No video mapping for tag ${item.tag}`}
                    >
                      Missing
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="pt-2 text-[10px] text-muted-foreground">
          Future steps unlock as you complete the current video.
        </p>
      </aside>
    </div>
  );
}
