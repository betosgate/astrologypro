"use client";

import { useRef, useState } from "react";
import { PlayCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RitualVideoPlayerProps {
  videoUrl: string;
  stepName: string;
  onEnded: () => void;
  isLastStep: boolean;
}

export function RitualVideoPlayer({
  videoUrl,
  stepName,
  onEnded,
  isLastStep,
}: RitualVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playing, setPlaying] = useState(false);

  function handleEnded() {
    setVideoEnded(true);
    setPlaying(false);
  }

  function handlePlay() {
    setPlaying(true);
    setVideoEnded(false);
  }

  function handlePause() {
    setPlaying(false);
  }

  return (
    <div className="space-y-3">
      {/* Video player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-amber-500/20">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="size-full object-contain"
          title={stepName}
          onEnded={handleEnded}
          onPlay={handlePlay}
          onPause={handlePause}
        />

        {/* Play-overlay hint before first play */}
        {!playing && !videoEnded && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
            aria-hidden
          >
            <PlayCircle className="size-16 text-amber-400/70 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Auto-advance prompt after video ends */}
      {videoEnded && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-300/80">
            {isLastStep ? "Video complete — ready to finish the ritual." : "Video complete — ready for the next step."}
          </p>
          <Button
            size="sm"
            onClick={onEnded}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow"
          >
            {isLastStep ? "Complete Ritual" : "Next Step"}
            <ChevronRight className="ml-1.5 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
