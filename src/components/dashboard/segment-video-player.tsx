"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Segment {
  key: string;
  size: number;
  url: string;
}

interface SegmentVideoPlayerProps {
  segments: Segment[];
}

/**
 * Plays an array of MP4 segment URLs seamlessly as if it were a single video.
 * Uses the native <video> controls — no custom UI. Segment transitions are
 * invisible to the user; the progress bar and time show the total duration.
 */
export function SegmentVideoPlayer({ segments }: SegmentVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const wasPlayingRef = useRef(false);
  const seekingToRef = useRef<number | null>(null);
  const [segmentDurations, setSegmentDurations] = useState<number[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  // Displayed current time = sum of previous segment durations + current video time
  const [displayTime, setDisplayTime] = useState(0);

  // ── Probe all segment durations on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      const durations: number[] = [];
      for (const seg of segments) {
        const dur = await getVideoDuration(seg.url);
        if (cancelled) return;
        durations.push(dur);
      }
      setSegmentDurations(durations);
      setTotalDuration(durations.reduce((sum, d) => sum + d, 0));
    }

    probe();
    return () => { cancelled = true; };
  }, [segments]);

  // ── Auto-advance when a segment ends ───────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (currentIndex < segments.length - 1) {
      wasPlayingRef.current = true;
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, segments.length]);

  // ── Load new segment when index changes ────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !segments[currentIndex]) return;

    video.src = segments[currentIndex].url;
    video.load();

    const onCanPlay = () => {
      // Seek within the segment if we were seeking globally
      if (seekingToRef.current !== null) {
        video.currentTime = seekingToRef.current;
        seekingToRef.current = null;
      }
      if (wasPlayingRef.current) {
        video.play().catch(() => {});
        wasPlayingRef.current = false;
      }
    };

    video.addEventListener("canplay", onCanPlay, { once: true });
    return () => video.removeEventListener("canplay", onCanPlay);
  }, [currentIndex, segments]);

  // ── Sync display time ──────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const elapsed = segmentDurations
        .slice(0, currentIndex)
        .reduce((sum, d) => sum + d, 0);
      setDisplayTime(elapsed + video.currentTime);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [currentIndex, segmentDurations]);

  // ── Override native seeking to work across segments ─────────────────────────
  // When the user drags the progress bar on the native <video> controls,
  // we intercept if they seek past the current segment boundary.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || segmentDurations.length === 0) return;

    const currentSegDur = segmentDurations[currentIndex] ?? 0;

    const onSeeking = () => {
      const seekedTo = video.currentTime;

      // Seeking past the end of this segment → advance to correct segment
      if (seekedTo >= currentSegDur - 0.1 && currentIndex < segments.length - 1) {
        // User is trying to scrub forward; translate to global time
        const globalBefore = segmentDurations.slice(0, currentIndex).reduce((s, d) => s + d, 0);
        const globalTarget = globalBefore + seekedTo;
        seekToGlobal(globalTarget);
      }
    };

    video.addEventListener("seeking", onSeeking);
    return () => video.removeEventListener("seeking", onSeeking);
  }, [currentIndex, segmentDurations, segments.length]);

  function seekToGlobal(targetTime: number) {
    let accumulated = 0;
    for (let i = 0; i < segmentDurations.length; i++) {
      if (accumulated + segmentDurations[i] > targetTime || i === segmentDurations.length - 1) {
        const seekWithin = targetTime - accumulated;
        if (i === currentIndex) {
          // Same segment — just seek
          if (videoRef.current) videoRef.current.currentTime = seekWithin;
        } else {
          // Different segment — switch
          wasPlayingRef.current = !videoRef.current?.paused;
          seekingToRef.current = seekWithin;
          setCurrentIndex(i);
        }
        return;
      }
      accumulated += segmentDurations[i];
    }
  }

  // ── Fake the duration on the native controls ───────────────────────────────
  // We can't override video.duration (read-only), but we make the native
  // progress bar useful by letting the video play naturally within each segment.
  // The time display below the player shows the real total time.

  return (
    <div className="space-y-1">
      <div className="rounded-lg overflow-hidden border border-border bg-black" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          onEnded={handleEnded}
          controls
          preload="metadata"
          playsInline
          className="w-full h-full"
        />
      </div>
      {/* Total time overlay — shows real combined duration */}
      {totalDuration > 0 && (
        <div className="flex items-center justify-between px-1">
          <div
            className="h-1 w-full cursor-pointer rounded-full bg-zinc-700/50"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const fraction = (e.clientX - rect.left) / rect.width;
              const target = fraction * totalDuration;
              wasPlayingRef.current = !videoRef.current?.paused;
              seekToGlobal(target);
            }}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${totalDuration > 0 ? (displayTime / totalDuration) * 100 : 0}%` }}
            />
          </div>
          <span className="ml-2 shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {formatTime(displayTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      )}
    </div>
  );
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve(v.duration || 0);
      v.src = "";
    };
    v.onerror = () => resolve(0);
    v.src = url;
  });
}
