"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RitualPlaylistItem } from "@/lib/community/ritual-video-map";

interface RitualPlaylistPlayerProps {
  ritualId: string;
  ritualName: string;
  playlist: RitualPlaylistItem[];
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

export function RitualPlaylistPlayer({
  ritualId,
  ritualName,
  playlist,
  initialHighestStepIndex = 0,
}: RitualPlaylistPlayerProps) {
  const totalSteps = playlist.length;

  const safeInitialHighest = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.min(Math.max(initialHighestStepIndex, 0), totalSteps - 1);
  }, [initialHighestStepIndex, totalSteps]);

  const [currentStepIndex, setCurrentStepIndex] = useState(safeInitialHighest);
  const [highestUnlockedIndex, setHighestUnlockedIndex] =
    useState(safeInitialHighest);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(() => {
    const resumed = new Set<number>();
    for (let i = 0; i < safeInitialHighest; i += 1) resumed.add(i);
    return resumed;
  });
  const [completedAll, setCompletedAll] = useState(false);

  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [stepDurations, setStepDurations] = useState<Record<number, number>>(
    {}
  );
  const [settings, setSettings] = useState({
    video_loop: false,
    video_autoplay: true,
    video_controls: true,
    video_muted: false,
  });

  useEffect(() => {
    fetch("/api/community/ritual-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeItem: RitualPlaylistItem | null = useMemo(() => {
    if (totalSteps === 0) return null;
    const idx = Math.min(Math.max(currentStepIndex, 0), totalSteps - 1);
    return playlist[idx] ?? null;
  }, [currentStepIndex, playlist, totalSteps]);

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

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeItem) return;
    el.load();
    el.play().catch(() => {
      // Autoplay may be blocked until the first user interaction.
    });
  }, [activeItem?.tag, activeItem]);

  const handleEmptied = useCallback(() => {
    setDuration(0);
    setPosition(0);
  }, []);

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
      
      // If loop is enabled and we have multiple steps, restart from index 0.
      // For single-step rituals, native video looping handles it.
      if (settings.video_loop && totalSteps > 1) {
        setCurrentStepIndex(0);
      }
      return;
    }

    const nextIdx = idx + 1;
    setHighestUnlockedIndex((prev) => Math.max(prev, nextIdx));
    setCurrentStepIndex(nextIdx);
    void patchProgress({ current_step: nextIdx + 1 });
  }, [activeItem, currentStepIndex, patchProgress, totalSteps, settings.video_loop]);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    setDuration(el.duration);
    setStepDurations((prev) => {
      if (!Number.isFinite(el.duration) || el.duration <= 0) return prev;
      if (prev[currentStepIndex] === el.duration) return prev;
      return { ...prev, [currentStepIndex]: el.duration };
    });
  }, [currentStepIndex]);

  const handleStepMetadataLoaded = useCallback(
    (idx: number, event: SyntheticEvent<HTMLVideoElement>) => {
      const loadedDuration = event.currentTarget.duration;
      if (!Number.isFinite(loadedDuration) || loadedDuration <= 0) return;

      setStepDurations((prev) => {
        if (prev[idx] === loadedDuration) return prev;
        return { ...prev, [idx]: loadedDuration };
      });
    },
    []
  );

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (el) setPosition(el.currentTime);
  }, []);

  const handleSelect = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      if (idx > highestUnlockedIndex) return;
      setCurrentStepIndex(idx);
    },
    [highestUnlockedIndex, totalSteps]
  );

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

  const overallElapsed = Math.floor(position);
  const ritualTiming = (() => {
    const hasUnplayableStep = playlist.some((item) => !item.videoUrl);
    const allDurationsKnown =
      !hasUnplayableStep &&
      playlist.every((_, idx) => Number.isFinite(stepDurations[idx]));

    if (!allDurationsKnown) {
      return {
        elapsed: null,
        left: null,
        total: null,
      };
    }

    const total = playlist.reduce(
      (sum, _, idx) => sum + (stepDurations[idx] ?? 0),
      0
    );
    const completedDuration = playlist
      .slice(0, currentStepIndex)
      .reduce((sum, _, idx) => sum + (stepDurations[idx] ?? 0), 0);
    const currentDuration = stepDurations[currentStepIndex] ?? 0;
    const currentElapsed = completedAll
      ? currentDuration
      : Math.min(Math.max(position, 0), currentDuration);
    const elapsed = completedAll
      ? total
      : Math.min(completedDuration + currentElapsed, total);

    return {
      elapsed,
      left: Math.max(total - elapsed, 0),
      total,
    };
  })();

  return (
    <div className="space-y-5">
      <div
        className="pointer-events-none fixed bottom-0 right-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      >
        {playlist.map((item, idx) =>
          item.videoUrl ? (
            <video
              key={`${item.tag}-${idx}-metadata`}
              src={item.videoUrl}
              preload="metadata"
              muted
              onLoadedMetadata={(event) => handleStepMetadataLoaded(idx, event)}
            />
          ) : null
        )}
      </div>
      <div className="space-y-2 flex items-start gap-3">
        <Link
            href={`/community/rituals/${ritualId}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-card/70 text-muted-foreground transition-colors hover:border-amber-500/30 hover:text-foreground"
            aria-label="Back to previous page"
          >
            <ArrowLeft className="size-4" />
          </Link>
        <div className="">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight">
            {ritualName}
          </h1>
          <p className="text-xs text-muted-foreground">
          {`Step ${Math.min(currentStepIndex + 1, totalSteps)} of ${totalSteps}${
            activeItem ? ` - ${activeItem.title}` : ""
          }`}
        </p>
        </div>
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,360px)]">
        <section className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border bg-black">
            {activeItem?.videoUrl ? (
              <video
                ref={videoRef}
                key={activeItem.tag}
                src={activeItem.videoUrl}
                controls={settings.video_controls}
                autoPlay={settings.video_autoplay}
                loop={settings.video_loop && totalSteps === 1}
                muted={settings.video_muted}
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
                  Tag: <code>{activeItem?.tag ?? "-"}</code>
                </p>
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
                The full sequence is unlocked - replay any step from the
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

        <aside className="flex min-h-0 flex-col rounded-2xl border border-border/50 bg-card/35 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Playlist</h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {totalSteps} step{totalSteps !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-slate-950/70 px-3 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Elapsed
              </p>
              <p className="mt-2 text-md font-semibold text-foreground">
                {ritualTiming.elapsed === null
                  ? "--:--"
                  : fmtSeconds(ritualTiming.elapsed)}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-slate-950/70 px-3 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Left
              </p>
              <p className="mt-2 text-md font-semibold text-foreground">
                {ritualTiming.left === null
                  ? "--:--"
                  : fmtSeconds(ritualTiming.left)}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-slate-950/70 px-3 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="mt-2 text-md font-semibold text-foreground">
                {ritualTiming.total === null
                  ? "--:--"
                  : fmtSeconds(ritualTiming.total)}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="text-sm text-foreground">
              {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps}
            </p>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 max-h-[470px]">
            <ol className="space-y-1.5">
              {playlist.map((item, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = completedIndexes.has(idx);
              const isLocked = idx > highestUnlockedIndex;
              const baseClass =
                "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors";
              const stateClass = isActive
                ? "border-primary/60 bg-primary/10 text-foreground"
                : isCompleted
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 hover:bg-emerald-500/10"
                : isLocked
                ? "cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground/60"
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
                          className="shrink-0 border-amber-500/40 bg-amber-500/10 text-[9px] text-amber-700"
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
          </div>
          {/* <p className="pt-3 text-[10px] text-muted-foreground">
            Future steps unlock as you complete the current video.
          </p> */}
        </aside>
      </div>
    </div>
  );
}
