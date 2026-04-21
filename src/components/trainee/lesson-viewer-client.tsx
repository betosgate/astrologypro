"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Link2,
  Image as ImageIcon,
  File,
  ChevronRight,
  Lock,
  Clock,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { PdfPreviewModal } from "@/components/trainee/pdf-preview-modal";
import {
  LessonViewerQuiz,
  QuizQuestionClient,
  QuizQuestionProgressClient,
} from "@/components/trainee/lesson-viewer-quiz";
import { LessonCompleteButton } from "@/components/trainee/lesson-complete-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types (mirrors the API response shape)
// ---------------------------------------------------------------------------
export type LessonVideo = {
  id: string;
  title: string | null;
  video_url: string;
  duration_mins: number | null;
  priority: number;
};

export type LessonAsset = {
  id: string;
  title: string;
  asset_type: "pdf" | "doc" | "image" | "link" | "other";
  url: string;
  file_size_bytes: number | null;
  is_downloadable: boolean;
  priority: number;
};

export type SidebarLesson = {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
  locked: boolean;
};

// ---------------------------------------------------------------------------
// Quiz Trigger types
// ---------------------------------------------------------------------------
export type TriggerUserProgress = {
  trigger_id: string;
  passed: boolean;
  attempts: number;
  last_rewind_at: string | null;
  rewatch_required_until_seconds: number | null;
  rewatch_completed: boolean;
  passed_at: string | null;
};

export type LessonQuizTrigger = {
  id: string;
  trigger_timestamp_seconds: number;
  rewind_target_seconds: number;
  question_id: string;
  question: {
    id: string;
    question: string;
    options: { text: string }[];
    explanation?: string | null;
  } | null;
  user_progress: TriggerUserProgress | null;
};

export type LessonViewerProps = {
  lessonId: string;
  programId: string;
  categoryId: string;

  // Lesson data
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null; // legacy single video
  pdfUrl: string | null;   // legacy single PDF
  durationMins: number | null;
  videos: LessonVideo[];
  assets: LessonAsset[];

  // Quiz
  quizQuestions: QuizQuestionClient[];
  quizProgress?: QuizQuestionProgressClient[];
  quizPassed: boolean;
  /** @deprecated Module 05 stepwise quiz model doesn't surface a "last attempt score". */
  quizLastScore?: number | null;
  /** @deprecated Module 05 stepwise quiz model doesn't surface a "last attempt total". */
  quizLastTotal?: number | null;

  // Video quiz triggers
  triggers?: LessonQuizTrigger[];

  // Playback resume
  lastPositionSeconds?: number;

  // Completion
  isCompleted: boolean;

  // Next-item routing — computed server-side, consistent with lock logic
  nextRoute: string | null;
  nextLabel: string | null;

  // Optional callback when lesson is marked complete
  onComplete?: () => void;

  // Sidebar nav
  sidebarLessons: SidebarLesson[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getVideoEmbed(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch)
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&autoplay=1&mute=1&playsinline=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch)
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&autoplay=1&muted=1`;
  return null;
}

function isHtml5Video(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function AssetTypeIcon({ type }: { type: LessonAsset["asset_type"] }) {
  switch (type) {
    case "pdf":
      return <FileText className="size-4 text-red-500 shrink-0" />;
    case "image":
      return <ImageIcon className="size-4 text-blue-500 shrink-0" />;
    case "link":
      return <Link2 className="size-4 text-violet-500 shrink-0" />;
    case "doc":
      return <FileText className="size-4 text-sky-500 shrink-0" />;
    default:
      return <File className="size-4 text-muted-foreground shrink-0" />;
  }
}

// ---------------------------------------------------------------------------
// Video player (basic — used for embed/unknown URLs)
// ---------------------------------------------------------------------------
function VideoPlayer({
  video,
  onEnded,
}: {
  video: { title: string | null; video_url: string; duration_mins: number | null };
  onEnded?: () => void;
}) {
  const embedUrl = getVideoEmbed(video.video_url);
  const isDirect = isHtml5Video(video.video_url);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-black">
      {embedUrl ? (
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.title ?? "Lesson video"}
          />
        </div>
      ) : isDirect ? (
        <video
          src={video.video_url}
          controls
          autoPlay
          muted
          playsInline
          className="aspect-video w-full bg-black object-contain"
          onEnded={onEnded}
        />
      ) : (
        <div className="flex h-24 items-center justify-center p-4 text-sm text-muted-foreground">
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Open video
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trigger-aware video player (HTML5 direct videos only)
// Wraps the <video> element and handles pause-on-trigger, scrub prevention,
// quiz overlay display, and rewatch enforcement.
// ---------------------------------------------------------------------------
type TriggerVideoPlayerProps = {
  video: { title: string | null; video_url: string; duration_mins: number | null };
  lessonId: string;
  triggers: LessonQuizTrigger[];
  initialPosition?: number;
  onPositionUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  onPassedIdsChange?: (passedIds: string[]) => void;
  onLessonCompleted?: () => void;
  /**
   * Module 05: when the stepwise lesson quiz fires a wrong answer with
   * remediation metadata, the parent passes the seek/replay window here.
   * The player pauses, seeks to startSeconds, plays, and watches currentTime
   * until it reaches replayUntilSeconds — then pauses and calls
   * `onRemediationComplete`. requestId is included so a new request with the
   * same start/until pair still re-triggers the effect.
   */
  remediationRequest?: {
    startSeconds: number;
    replayUntilSeconds: number;
    requestId: number;
  } | null;
  onRemediationComplete?: () => void;
};

function TriggerVideoPlayer({
  video,
  lessonId,
  triggers,
  initialPosition = 0,
  onPositionUpdate,
  onEnded,
  onPassedIdsChange,
  onLessonCompleted,
  remediationRequest,
  onRemediationComplete,
}: TriggerVideoPlayerProps) {
  const embedUrl = getVideoEmbed(video.video_url);
  const isDirect = isHtml5Video(video.video_url);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Track which triggers have been passed locally (optimistic after API confirms)
  const [localPassedIds, setLocalPassedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const t of triggers) {
      if (t.user_progress?.passed) s.add(t.id);
    }
    return s;
  });

  // Active trigger being presented to the user
  const [activeTrigger, setActiveTrigger] = useState<LessonQuizTrigger | null>(null);

  // Rewind notification state ("Incorrect. Rewinding in Xs...")
  const [rewindCountdown, setRewindCountdown] = useState<number | null>(null);
  const [rewindTarget, setRewindTarget] = useState<number>(0);

  // Rewatch gate message (shown when 403 rewatch-required returned)
  const [rewatchMessage, setRewatchMessage] = useState<string | null>(null);

  // Answer submission state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rewatch polling: once in rewind mode, poll rewatch endpoint as video plays
  const rewatchTriggerId = useRef<string | null>(null);
  const rewatchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sort unpassed triggers by timestamp
  const unpassedTriggers = triggers
    .filter((t) => !localPassedIds.has(t.id))
    .sort((a, b) => a.trigger_timestamp_seconds - b.trigger_timestamp_seconds);

  const getPlaybackBoundary = useCallback(() => {
    const triggerBoundary =
      unpassedTriggers[0]?.trigger_timestamp_seconds ?? Infinity;
    const rewatchBoundary = unpassedTriggers.reduce((min, trigger) => {
      const requiresRewatch =
        trigger.user_progress?.rewatch_completed === false &&
        trigger.user_progress?.rewatch_required_until_seconds != null;

      if (!requiresRewatch) return min;

      return Math.min(
        min,
        trigger.user_progress?.rewatch_required_until_seconds ?? Infinity
      );
    }, Infinity);

    return Math.min(triggerBoundary, rewatchBoundary);
  }, [unpassedTriggers]);

  // Set initial position when video loads (resume behavior)
  const initialPositionApplied = useRef(false);
  useEffect(() => {
    if (initialPositionApplied.current || initialPosition <= 0) return;
    const vid = videoRef.current;
    if (!vid) return;
    const handleCanPlay = () => {
      if (!initialPositionApplied.current && vid.readyState >= 2) {
        // Resume cannot jump past an active rewatch gate or the next trigger.
        const maxPos = getPlaybackBoundary();
        vid.currentTime = Math.min(initialPosition, maxPos);
        initialPositionApplied.current = true;
      }
    };
    vid.addEventListener("canplay", handleCanPlay);
    // Also try immediately in case already loaded
    handleCanPlay();
    return () => vid.removeEventListener("canplay", handleCanPlay);
  }, [getPlaybackBoundary, initialPosition]);

  useEffect(() => {
    onPassedIdsChange?.([...localPassedIds]);
  }, [localPassedIds, onPassedIdsChange]);

  // Report position to parent at ~10s cadence for heartbeat
  useEffect(() => {
    if (!onPositionUpdate) return;
    const interval = setInterval(() => {
      const vid = videoRef.current;
      if (vid && !vid.paused) {
        onPositionUpdate(Math.floor(vid.currentTime));
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [onPositionUpdate]);

  // Countdown timer for rewind notification
  useEffect(() => {
    if (rewindCountdown === null) return;
    if (rewindCountdown <= 0) {
      // Execute rewind
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = rewindTarget;
        vid.play().then(() => { }, () => { });
      }
      setRewindCountdown(null);
      setActiveTrigger(null);
      setSelectedOption(null);
      setRewatchMessage(null);
      // Start rewatch polling
      if (rewatchTriggerId.current) {
        const tId = rewatchTriggerId.current;
        if (rewatchPollRef.current) clearInterval(rewatchPollRef.current);
        rewatchPollRef.current = setInterval(() => {
          const vid = videoRef.current;
          if (!vid) return;
          const pos = Math.floor(vid.currentTime);
          fetch(
            `/api/trainee/training/lessons/${lessonId}/triggers/${tId}/rewatch`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ current_position_seconds: pos }),
            }
          ).then(async (res) => {
            const json = await res.json().catch(() => ({}));
            if (json.rewatch_completed) {
              if (rewatchPollRef.current) {
                clearInterval(rewatchPollRef.current);
                rewatchPollRef.current = null;
              }
              rewatchTriggerId.current = null;
            }
          }, () => { });
        }, 5000);
      }
      return;
    }
    const t = setTimeout(() => setRewindCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [rewindCountdown, rewindTarget, lessonId]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (rewatchPollRef.current) clearInterval(rewatchPollRef.current);
    };
  }, []);

  // ── Module 05: lesson-quiz remediation playback ─────────────────────────
  // When the parent passes a remediationRequest, seek to startSeconds, play,
  // and watch currentTime until it reaches replayUntilSeconds. Then pause and
  // signal the parent so the quiz can re-enable retry.
  useEffect(() => {
    if (!remediationRequest) return;
    const vid = videoRef.current;
    if (!vid) return;

    const { startSeconds, replayUntilSeconds } = remediationRequest;
    let cancelled = false;

    function start() {
      if (cancelled) return;
      try {
        vid!.pause();
        vid!.currentTime = startSeconds;
        // Initial lesson autoplay must be muted for browser policy compliance,
        // but remediation starts from a learner click, so replay the required
        // segment with normal audio for better review context.
        vid!.muted = false;
        vid!.play().catch(() => undefined);
      } catch {
        // ignore
      }
    }

    function tick() {
      if (cancelled) return;
      const v = videoRef.current;
      if (!v) return;
      if (v.currentTime >= replayUntilSeconds) {
        v.pause();
        onRemediationComplete?.();
        cancelled = true;
      }
    }

    start();
    const id = setInterval(tick, 250);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // requestId in remediationRequest changes on every new request so
    // back-to-back remediations re-fire even if start/until are equal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remediationRequest?.requestId]);

  // timeupdate handler: check if we've hit an unpassed trigger
  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || activeTrigger || rewindCountdown !== null) return;

    const current = vid.currentTime;
    for (const trigger of unpassedTriggers) {
      const ts = trigger.trigger_timestamp_seconds;
      // Fire when within 1s window of the trigger timestamp
      if (current >= ts && current < ts + 1) {
        vid.pause();
        setActiveTrigger(trigger);
        setSelectedOption(null);
        setRewatchMessage(null);
        break;
      }
    }
  }, [activeTrigger, rewindCountdown, unpassedTriggers]);

  // seeking handler: prevent scrubbing past an unpassed trigger
  const handleSeeking = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const seekTarget = vid.currentTime;
    const boundary = getPlaybackBoundary();
    if (seekTarget > boundary) {
      vid.currentTime = boundary;
    }
  }, [getPlaybackBoundary]);

  async function handleAnswerSubmit() {
    if (selectedOption === null || !activeTrigger || submitting) return;
    setSubmitting(true);
    setRewatchMessage(null);

    try {
      const res = await fetch(
        `/api/trainee/training/lessons/${lessonId}/triggers/${activeTrigger.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer_index: selectedOption }),
        }
      );

      if (res.status === 403) {
        setRewatchMessage("Please replay the highlighted segment before retrying.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setRewatchMessage("Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      const json: { correct: boolean; rewind_to?: number; lesson_complete?: boolean } =
        await res.json();

      if (json.correct) {
        // Mark passed locally and resume video
        setLocalPassedIds((prev) => {
          const next = new Set([...prev, activeTrigger.id]);
          return next;
        });
        setActiveTrigger(null);
        setSelectedOption(null);
        if (json.lesson_complete) {
          onLessonCompleted?.();
        }
        videoRef.current?.play().then(() => { }, () => { });
      } else {
        // Wrong answer — start rewind countdown
        rewatchTriggerId.current = activeTrigger.id;
        setRewindTarget(json.rewind_to ?? activeTrigger.rewind_target_seconds);
        setRewindCountdown(5);
      }
    } catch {
      setRewatchMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // For non-HTML5 or embed videos, fall back to standard VideoPlayer (no trigger support)
  if (embedUrl || !isDirect) {
    return <VideoPlayer video={video} onEnded={onEnded} />;
  }

  const q = activeTrigger?.question;
  const showOverlay = activeTrigger !== null && rewindCountdown === null;
  const showCountdown = rewindCountdown !== null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        src={video.video_url}
        controls={!showOverlay && !showCountdown}
        autoPlay
        muted
        playsInline
        className="aspect-video w-full bg-black object-contain"
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
      />

      {/* Rewind countdown notification */}
      {showCountdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="rounded-xl border border-red-500/40 bg-card p-6 max-w-sm w-full mx-4 text-center space-y-3 shadow-2xl">
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="size-5 text-red-500" />
              <p className="font-semibold text-red-500">Incorrect Answer</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Rewinding in{" "}
              <span className="tabular-nums font-bold text-foreground">
                {rewindCountdown}s
              </span>
              …
            </p>
            <p className="text-xs text-muted-foreground">
              Watch the segment again, then retry the question.
            </p>
          </div>
        </div>
      )}

      {/* Quiz overlay */}
      {showOverlay && q && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <div className="rounded-xl border bg-card p-5 max-w-md w-full shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start gap-2">
              <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Video Quiz
                </p>
                <p className="text-sm font-medium leading-snug mt-0.5">{q.question}</p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                    selectedOption === idx
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  )}
                  aria-pressed={selectedOption === idx}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {/* Rewatch gate message */}
            {rewatchMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-600">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{rewatchMessage}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              size="sm"
              className="w-full"
              disabled={selectedOption === null || submitting}
              onClick={handleAnswerSubmit}
            >
              {submitting ? "Checking…" : "Submit Answer"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Answer correctly to continue watching.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function LessonViewerClient(props: LessonViewerProps) {
  const {
    lessonId,
    programId,
    categoryId,
    title,
    description,
    content,
    videoUrl,
    pdfUrl,
    durationMins,
    videos,
    assets,
    quizQuestions,
    quizProgress = [],
    quizPassed,
    // quizLastScore / quizLastTotal: legacy props from the batch quiz model.
    // The Module 05 stepwise quiz model doesn't surface a "last attempt
    // score" because each question is graded immediately and re-tried until
    // correct. Kept on the props interface for backward compatibility with
    // the page component, but no longer destructured here.
    isCompleted: initialCompleted,
    nextRoute,
    nextLabel,
    sidebarLessons,
    triggers = [],
    onComplete,
  } = props;

  // Combine legacy single video + lesson_videos table entries
  const allVideos: LessonVideo[] = [
    ...videos,
    ...(videoUrl && !videos.some((v) => v.video_url === videoUrl)
      ? [
        {
          id: "legacy",
          title: null,
          video_url: videoUrl,
          duration_mins: durationMins,
          priority: -1,
        },
      ]
      : []),
  ].sort((a, b) => a.priority - b.priority);

  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isQuizPassed, setIsQuizPassed] = useState(quizPassed);
  const [passedTriggerIds, setPassedTriggerIds] = useState<string[]>(
    triggers
      .filter((trigger) => trigger.user_progress?.passed)
      .map((trigger) => trigger.id)
  );
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [assetsExpanded, setAssetsExpanded] = useState(false);

  // Module 05 — quiz remediation: when the stepwise quiz fires onWrongAnswer
  // with remediation metadata, we set this state to drive the video player
  // and the quiz waits for `remediationReady` before allowing retry.
  const [remediationRequest, setRemediationRequest] = useState<{
    startSeconds: number;
    replayUntilSeconds: number;
    requestId: number; // increments on every request so the player effect re-fires
  } | null>(null);
  const [pendingRemediationChoice, setPendingRemediationChoice] = useState<{
    startSeconds: number;
    replayUntilSeconds: number;
    videoIndex: number | null;
  } | null>(null);
  const [remediationReady, setRemediationReady] = useState(false);
  const remediationRequestSeqRef = useRef(0);
  const activeRemediationChoiceRef = useRef<{
    startSeconds: number;
    replayUntilSeconds: number;
    videoIndex: number | null;
  } | null>(null);
  const ignoreNextRemediationDialogCloseRef = useRef(false);
  const remediationPlaybackActiveRef = useRef(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  const hasQuiz = quizQuestions.length > 0;
  const hasSidebarRail = sidebarLessons.length > 0;

  // All in-video trigger questions must be answered correctly before completing.
  // A trigger counts as requiring a pass if it has a question attached.
  const hasTriggers = triggers.length > 0;
  const passedTriggerIdSet = new Set(passedTriggerIds);
  const allTriggersPassed =
    !hasTriggers ||
    triggers.every((t) => {
      // Only gate on triggers that have a question
      if (!t.question) return true;
      return passedTriggerIdSet.has(t.id);
    });

  // Completion gating: both trigger pass AND quiz pass must be satisfied
  // when the lesson has both. Previously trigger-only lessons skipped the
  // quiz check, which let learners complete a lesson without passing the
  // standard quiz if in-video triggers also existed.
  const triggersSatisfied = !hasTriggers || allTriggersPassed;
  const quizSatisfied = !hasQuiz || isQuizPassed;
  const canComplete = triggersSatisfied && quizSatisfied;

  const handleVideoEnded = () => {
    // Auto-advance to next video if available
    if (activeVideoIdx < allVideos.length - 1) {
      setActiveVideoIdx((i) => i + 1);
    }
  };

  // Record lesson start on mount
  useEffect(() => {
    fetch(`/api/trainee/training/lessons/${lessonId}/start`, { method: "POST" })
      .catch(() => { }); // fire-and-forget, don't block UI
  }, [lessonId]);

  // Track the latest video position for heartbeat reporting
  const latestPositionRef = useRef<number>(0);
  const handlePositionUpdate = useCallback((seconds: number) => {
    if (remediationPlaybackActiveRef.current) return;
    latestPositionRef.current = seconds;
  }, []);

  const scrollAndFocusSection = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => node.focus({ preventScroll: true }), 250);
  }, []);

  function startRemediationReplay(
    choice = pendingRemediationChoice,
  ) {
    if (!choice || allVideos.length === 0) {
      reattemptQuizWithoutReplay();
      return;
    }

    const { startSeconds, replayUntilSeconds, videoIndex } =
      choice;

    if (
      videoIndex != null &&
      videoIndex !== activeVideoIdx &&
      videoIndex >= 0 &&
      videoIndex < allVideos.length
    ) {
      setActiveVideoIdx(videoIndex);
    }

    ignoreNextRemediationDialogCloseRef.current = true;
    setPendingRemediationChoice(null);
    setRemediationReady(false);
    activeRemediationChoiceRef.current = choice;
    remediationPlaybackActiveRef.current = true;
    const requestId = remediationRequestSeqRef.current + 1;
    remediationRequestSeqRef.current = requestId;
    window.setTimeout(() => {
      scrollAndFocusSection(videoSectionRef.current);
      setRemediationRequest({
        startSeconds,
        replayUntilSeconds,
        requestId,
      });
    }, 100);
  }

  function reattemptQuizWithoutReplay() {
    setPendingRemediationChoice(null);
    setRemediationRequest(null);
    activeRemediationChoiceRef.current = null;
    remediationPlaybackActiveRef.current = false;
    setRemediationReady(true);
    scrollAndFocusSection(quizSectionRef.current);
  }

  // Heartbeat every 10 seconds while the component is mounted.
  // Remediation playback is intentionally excluded from position updates so
  // temporary wrong-answer replay timestamps do not become future start points.
  useEffect(() => {
    let lastTick = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.round((now - lastTick) / 1000);
      lastTick = now;

      fetch(`/api/trainee/training/lessons/${lessonId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta_seconds: delta,
          last_position_seconds: latestPositionRef.current,
        }),
      }).catch(() => { }); // fire-and-forget
    }, 10_000);

    return () => clearInterval(interval);
  }, [lessonId]);

  // All assets + legacy pdf_url (now supporting JSON array)
  let extraAssets: LessonAsset[] = [];
  if (pdfUrl) {
    if (pdfUrl.startsWith("[")) {
      try {
        const urls: string[] = JSON.parse(pdfUrl);
        extraAssets = urls.map((url, idx) => ({
          id: `extra-pdf-${idx}`,
          title: urls.length === 1 ? "Lesson PDF" : `Lesson PDF ${idx + 1}`,
          asset_type: "pdf" as const,
          url,
          file_size_bytes: null,
          is_downloadable: true,
          priority: -1,
        }));
      } catch {
        // Fallback for malformed JSON
        extraAssets = [
          {
            id: "extra-pdf",
            title: "Lesson PDF",
            asset_type: "pdf" as const,
            url: pdfUrl,
            file_size_bytes: null,
            is_downloadable: true,
            priority: -1,
          },
        ];
      }
    } else {
      extraAssets = [
        {
          id: "extra-pdf",
          title: "Lesson PDF",
          asset_type: "pdf" as const,
          url: pdfUrl,
          file_size_bytes: null,
          is_downloadable: true,
          priority: -1,
        },
      ];
    }
  }

  const allAssets: LessonAsset[] = [
    ...assets,
    ...extraAssets.filter((extra) => !assets.some((a) => a.url === extra.url)),
  ].sort((a, b) => a.priority - b.priority);

  return (
    <>
      {/* PDF preview modal */}
      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          title={pdfPreview.title}
          open={true}
          onClose={() => setPdfPreview(null)}
        />
      )}

      <Dialog
        open={pendingRemediationChoice != null}
        onOpenChange={(open) => {
          if (!open && pendingRemediationChoice) {
            if (ignoreNextRemediationDialogCloseRef.current) {
              ignoreNextRemediationDialogCloseRef.current = false;
              return;
            }
            reattemptQuizWithoutReplay();
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Review the lesson segment?</DialogTitle>
            <DialogDescription>
              The related lesson segment has finished playing. You can replay
              it once more or go back to the quiz and reattempt now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={reattemptQuizWithoutReplay}>
              Reattempt quiz
            </Button>
            <Button onClick={() => startRemediationReplay()}>
              Replay lesson segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={cn("flex w-full flex-col items-stretch gap-6", hasSidebarRail && "lg:flex-row lg:items-start")}>
        {/* ── Left: Main content ────────────────────────────────────────── */}
        <div className="w-full flex-1 min-w-0 space-y-5">
          {/* Lesson header */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="flex-1 text-xl font-bold tracking-tight min-w-0">
                {title}
              </h1>
              {isCompleted && (
                <Badge className="shrink-0 bg-green-500/15 text-green-600 border-green-500/30">
                  <CheckCircle2 className="size-3.5 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            {durationMins != null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{durationMins} min</span>
              </div>
            )}
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>

          <div className="w-full max-h-[72vh] overflow-y-auto overscroll-contain rounded-xl border bg-card p-4 pr-3 space-y-5">
            {allVideos.length > 0 && (
              <div
                ref={videoSectionRef}
                tabIndex={-1}
                className="w-full space-y-3 scroll-mt-24 outline-none"
              >
                {allVideos.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {allVideos.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => setActiveVideoIdx(i)}
                        className={cn(
                          "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                          activeVideoIdx === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {v.title ?? `Video ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}
                <TriggerVideoPlayer
                  video={allVideos[activeVideoIdx]}
                  lessonId={lessonId}
                  triggers={triggers}
                  initialPosition={0}
                  onPositionUpdate={handlePositionUpdate}
                  onEnded={handleVideoEnded}
                  onPassedIdsChange={setPassedTriggerIds}
                  onLessonCompleted={() => { /* completion is manual via button */ }}
                  remediationRequest={remediationRequest}
                  onRemediationComplete={() => {
                    remediationPlaybackActiveRef.current = false;
                    setRemediationRequest(null);
                    setPendingRemediationChoice(activeRemediationChoiceRef.current);
                  }}
                />
              </div>
            )}

            {content && (
              <div className="rounded-xl border bg-background/40 p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {content}
                </p>
              </div>
            )}

            {allAssets.length > 0 && (
              <div className="rounded-xl border bg-background/40 overflow-hidden">
                <button
                  onClick={() => setAssetsExpanded((e) => !e)}
                  className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
                  aria-expanded={assetsExpanded}
                >
                  <span>Downloads & Resources ({allAssets.length})</span>
                  <ChevronRight
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      assetsExpanded && "rotate-90"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    assetsExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="border-t divide-y">
                    {allAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <AssetTypeIcon type={asset.asset_type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {asset.title}
                          </p>
                          {asset.file_size_bytes != null && (
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(asset.file_size_bytes)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs h-7"
                            onClick={() => {
                              if (asset.asset_type === "pdf") {
                                setPdfPreview({
                                  url: asset.url,
                                  title: asset.title,
                                });
                              } else {
                                window.open(asset.url, "_blank", "noopener");
                              }
                            }}
                            aria-label={`Preview ${asset.title}`}
                          >
                            <Eye className="size-3.5" />
                            Preview
                          </Button>
                          {asset.is_downloadable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-7"
                              asChild
                            >
                              <a
                                href={asset.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Download ${asset.title}`}
                              >
                                <Download className="size-3.5" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasQuiz && (
              <div
                ref={quizSectionRef}
                tabIndex={-1}
                className="w-full rounded-xl border bg-background/40 overflow-hidden scroll-mt-24 outline-none"
              >
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold">Lesson Quiz</p>
                  {isQuizPassed ? (
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">
                      Passed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {quizQuestions.length} question{quizQuestions.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <LessonViewerQuiz
                    lessonId={lessonId}
                    questions={quizQuestions}
                    alreadyPassed={isQuizPassed}
                    initialProgress={quizProgress}
                    remediationReady={remediationReady}
                    onWrongAnswer={(remediation) => {
                      const start = remediation.start_seconds;
                      const until = remediation.replay_until_seconds;
                      if (start == null || until == null || until <= start) return;

                      startRemediationReplay({
                        startSeconds: start,
                        replayUntilSeconds: until,
                        videoIndex: remediation.video_index ?? null,
                      });
                    }}
                    onPassed={() => {
                      setIsQuizPassed(true);
                    }}
                  />
                </div>
                {!isQuizPassed && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="size-3 shrink-0" />
                      You must pass this quiz to mark the lesson complete.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Completion CTA lives at the bottom of the lesson flow so the
              content column keeps its full width and the right rail stays
              focused on navigation only. The header already shows completed
              state, so suppress the duplicate green "Lesson Complete" banner
              inside the content area. */}
          <LessonCompleteButton
            lessonId={lessonId}
            alreadyCompleted={isCompleted}
            disabled={!canComplete}
            disabledReason={
              !canComplete
                ? !triggersSatisfied && !quizSatisfied
                  ? "Answer all in-video questions and pass the lesson quiz to complete this lesson."
                  : !triggersSatisfied
                    ? "Answer all in-video quiz questions correctly to complete this lesson."
                    : "Pass the lesson quiz to complete this lesson."
                : undefined
            }
            nextRoute={nextRoute ?? null}
            nextLabel={nextLabel ?? null}
            onComplete={() => {
              setIsCompleted(true);
              onComplete?.();
            }}
            hideCompletedState
            className="pt-2"
          />
        </div>

        {/* ── Right: Sidebar ────────────────────────────────────────────── */}
        {hasSidebarRail && (
          <aside className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {/* Lesson navigation */}
            {sidebarLessons.length > 0 && (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Lessons
                  </p>
                </div>
                <div className="divide-y">
                  {sidebarLessons.map((l, i) => (
                    <div
                      key={l.id}
                      onClick={
                        l.locked
                          ? () =>
                            toast.warning("Locked", {
                              description:
                                "Complete the previous lesson first to continue in sequence.",
                            })
                          : undefined
                      }
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                        l.current ? "bg-primary/5" : "hover:bg-muted/40",
                        l.locked ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      {/* Status icon */}
                      <div className="shrink-0 w-4 flex justify-center">
                        {l.completed ? (
                          <CheckCircle2 className="size-3.5 text-green-500" />
                        ) : l.locked ? (
                          <Lock className="size-3 text-muted-foreground/50" />
                        ) : (
                          <div className="size-3.5 rounded-full border-2 border-muted-foreground/40" />
                        )}
                      </div>

                      {/* Number */}
                      <span className="text-xs text-muted-foreground/60 tabular-nums w-5 shrink-0">
                        {String(i + 1).padStart(2, "0")}.
                      </span>

                      {/* Title */}
                      {l.locked || l.current ? (
                        <span
                          className={cn(
                            "flex-1 text-xs truncate",
                            l.current ? "font-semibold text-primary" : "text-muted-foreground"
                          )}
                        >
                          {l.title}
                        </span>
                      ) : (
                        <Link
                          href={`/trainee/training/${programId}/${categoryId}/${l.id}`}
                          className="flex-1 text-xs truncate hover:text-primary transition-colors"
                        >
                          {l.title}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz section removed from sidebar — now rendered inline in the
              main content column (see below the assets section) so the
              learner sees it as part of the lesson flow rather than a
              buried sidebar widget. */}
          </aside>
        )}
      </div>
    </>
  );
}
