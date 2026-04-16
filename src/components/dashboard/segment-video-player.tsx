"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

interface Segment {
  key: string;
  size: number;
  url: string;
}

interface SegmentVideoPlayerProps {
  segments: Segment[];
}

/**
 * Plays an array of MP4 segment URLs back-to-back as a seamless recording.
 * When one segment ends, automatically advances to the next.
 */
export function SegmentVideoPlayer({ segments }: SegmentVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [segmentDurations, setSegmentDurations] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Probe all segment durations on mount so we can show total time
  useEffect(() => {
    let cancelled = false;

    async function probeDurations() {
      const durations: number[] = [];
      for (const seg of segments) {
        const dur = await getVideoDuration(seg.url);
        if (cancelled) return;
        durations.push(dur);
      }
      setSegmentDurations(durations);
      setTotalDuration(durations.reduce((sum, d) => sum + d, 0));
    }

    probeDurations();
    return () => { cancelled = true; };
  }, [segments]);

  // When segment ends, advance to next
  const handleEnded = useCallback(() => {
    if (currentIndex < segments.length - 1) {
      setCurrentIndex((i) => i + 1);
      // Auto-play will be triggered by the useEffect below
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, segments.length]);

  // When currentIndex changes, load and play the new segment
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = segments[currentIndex].url;
    video.load();

    if (isPlaying) {
      video.play().catch(() => {});
    }
  }, [currentIndex, segments]);

  // Track current playback position across all segments
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const elapsed = segmentDurations
        .slice(0, currentIndex)
        .reduce((sum, d) => sum + d, 0);
      setCurrentTime(elapsed + video.currentTime);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [currentIndex, segmentDurations]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (currentIndex < segments.length - 1) setCurrentIndex((i) => i + 1);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Progress bar click to seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const targetTime = fraction * totalDuration;

    // Find which segment this falls in
    let accumulated = 0;
    for (let i = 0; i < segmentDurations.length; i++) {
      if (accumulated + segmentDurations[i] > targetTime) {
        const seekTo = targetTime - accumulated;
        setCurrentIndex(i);
        // Wait for segment to load, then seek
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = seekTo;
            if (isPlaying) videoRef.current.play().catch(() => {});
          }
        }, 100);
        return;
      }
      accumulated += segmentDurations[i];
    }
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-border bg-black" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full"
          playsInline
        />
      </div>

      {/* Custom controls */}
      <div className="space-y-1">
        {/* Progress bar */}
        <div
          className="h-1.5 w-full cursor-pointer rounded-full bg-zinc-700"
          onClick={handleProgressClick}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : "0%" }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePrev} disabled={currentIndex === 0}>
              <SkipBack className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleNext} disabled={currentIndex === segments.length - 1}>
              <SkipForward className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
            <span className="text-[10px]">Segment {currentIndex + 1}/{segments.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Probe video duration by loading metadata in a temporary element */
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
