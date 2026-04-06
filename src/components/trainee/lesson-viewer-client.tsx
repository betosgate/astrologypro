"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import Link from "next/link";
import { PdfPreviewModal } from "@/components/trainee/pdf-preview-modal";
import { LessonViewerQuiz, QuizQuestionClient } from "@/components/trainee/lesson-viewer-quiz";
import { LessonCompleteButton } from "@/components/trainee/lesson-complete-button";
import { cn } from "@/lib/utils";

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
  quizPassed: boolean;
  quizLastScore: number | null;
  quizLastTotal: number | null;

  // Completion
  isCompleted: boolean;

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
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch)
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`;
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
// Video player
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
    <div className="overflow-hidden rounded-xl border bg-black">
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
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
          className="w-full max-h-[480px]"
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
    quizPassed,
    quizLastScore,
    quizLastTotal,
    isCompleted: initialCompleted,
    sidebarLessons,
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
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [assetsExpanded, setAssetsExpanded] = useState(false);

  const hasQuiz = quizQuestions.length > 0;
  const canComplete = !hasQuiz || quizPassed;

  const handleVideoEnded = useCallback(() => {
    // Auto-advance to next video if available
    if (activeVideoIdx < allVideos.length - 1) {
      setActiveVideoIdx((i) => i + 1);
    }
  }, [activeVideoIdx, allVideos.length]);

  // Record lesson start on mount
  useEffect(() => {
    fetch(`/api/trainee/training/lessons/${lessonId}/start`, { method: "POST" })
      .catch(() => {}); // fire-and-forget, don't block UI
  }, [lessonId]);

  // Heartbeat every 30 seconds while the component is mounted
  useEffect(() => {
    let lastTick = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.round((now - lastTick) / 1000);
      lastTick = now;

      fetch(`/api/trainee/training/lessons/${lessonId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta_seconds: delta }),
      }).catch(() => {}); // fire-and-forget
    }, 30_000);

    return () => clearInterval(interval);
  }, [lessonId]);

  // All assets + legacy pdf_url
  const allAssets: LessonAsset[] = [
    ...assets,
    ...(pdfUrl && !assets.some((a) => a.url === pdfUrl)
      ? [
          {
            id: "legacy-pdf",
            title: "Lesson PDF",
            asset_type: "pdf" as const,
            url: pdfUrl,
            file_size_bytes: null,
            is_downloadable: true,
            priority: -1,
          },
        ]
      : []),
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

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Main content ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
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

          {/* Videos */}
          {allVideos.length > 0 && (
            <div className="space-y-3">
              {/* Tab strip if multiple videos */}
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
              <VideoPlayer
                video={allVideos[activeVideoIdx]}
                onEnded={handleVideoEnded}
              />
            </div>
          )}

          {/* Lesson content */}
          {content && (
            <div className="rounded-xl border bg-card p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {content}
              </p>
            </div>
          )}

          {/* Assets */}
          {allAssets.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
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
                        {/* Preview button */}
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
                        {/* Download button */}
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
        </div>

        {/* ── Right: Sidebar ────────────────────────────────────────────── */}
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

          {/* Quiz section */}
          {hasQuiz && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Lesson Quiz
                </p>
              </div>
              <div className="p-4">
                <LessonViewerQuiz
                  lessonId={lessonId}
                  questions={quizQuestions}
                  alreadyPassed={quizPassed}
                  lastScore={quizLastScore}
                  lastTotal={quizLastTotal}
                  onPassed={() => setIsCompleted(true)}
                />
              </div>
            </div>
          )}

          {/* Mark complete */}
          <LessonCompleteButton
            lessonId={lessonId}
            alreadyCompleted={isCompleted}
            disabled={!canComplete}
            disabledReason={
              !canComplete ? "Pass the quiz above to complete this lesson." : undefined
            }
            className="px-0"
          />
        </aside>
      </div>
    </>
  );
}
