"use client";

import Link from "next/link";
import {
  Radio,
  Video,
  FileText,
  PlayCircle,
  Megaphone,
  ExternalLink,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MandalismContent = {
  id: string;
  title: string;
  content_type:
    | "live_stream"
    | "video"
    | "document"
    | "youtube"
    | "announcement";
  access_control: string;
  url: string | null;
  pdf_url: string | null;
  content_thumbnail_url: string | null;
  duration_label: string | null;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
};

interface MandalismContentPreviewProps {
  initialItems: MandalismContent[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract a YouTube video ID from common URL formats:
 * - https://youtu.be/{id}
 * - https://www.youtube.com/watch?v={id}
 * - https://youtube.com/watch?v={id}
 */
function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLiveStreamStatus(
  start_at: string | null,
  end_at: string | null
): "live" | "upcoming" | "past" | "unknown" {
  const now = Date.now();
  const start = start_at ? new Date(start_at).getTime() : null;
  const end = end_at ? new Date(end_at).getTime() : null;

  if (start && end) {
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    return "past";
  }
  if (start && now < start) return "upcoming";
  if (end && now > end) return "past";
  return "unknown";
}

// ── Card renderers ───────────────────────────────────────────────────────────

function VideoCard({ item }: { item: MandalismContent }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {item.content_thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.content_thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-600/30 to-indigo-600/30 flex items-center justify-center">
            <Video className="size-8 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-black/60">
            <PlayCircle className="size-6 text-white" />
          </div>
        </div>
        {item.duration_label && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0 hover:bg-black/70">
            {item.duration_label}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm leading-snug line-clamp-2">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-4">
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        {item.url && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-full">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <PlayCircle className="size-3.5" />
              Watch
              <ExternalLink className="size-3 opacity-70 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function YouTubeCard({ item }: { item: MandalismContent }) {
  const ytId = extractYouTubeId(item.url);
  const thumbSrc = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-red-600/20 to-rose-600/20 flex items-center justify-center">
            <PlayCircle className="size-8 text-red-500/50" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-600/90">
            <PlayCircle className="size-6 text-white" />
          </div>
        </div>
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm leading-snug line-clamp-2">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {item.url && (
          <Button asChild variant="outline" size="sm" className="w-full">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <PlayCircle className="size-3.5 text-red-500" />
              Watch on YouTube
              <ExternalLink className="size-3 opacity-70 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LiveStreamCard({ item }: { item: MandalismContent }) {
  const status = getLiveStreamStatus(item.start_at, item.end_at);

  const statusBadge = {
    live: (
      <Badge className="bg-red-500 text-white hover:bg-red-500 text-[10px] px-1.5 py-0 animate-pulse">
        Live
      </Badge>
    ),
    upcoming: (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">
        Upcoming
      </Badge>
    ),
    past: (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
        Past
      </Badge>
    ),
    unknown: null,
  }[status];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-600/20 to-rose-600/20 px-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500/15">
          <Radio className="size-5 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
            Live Stream
          </p>
        </div>
        {statusBadge}
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm leading-snug line-clamp-2">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-4">
        {item.start_at && (
          <p className="text-xs text-muted-foreground">
            {formatDate(item.start_at)}
            {item.end_at && ` – ${formatDate(item.end_at)}`}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        {item.url && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-full">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <Radio className="size-3.5 text-red-500" />
              Join Stream
              <ExternalLink className="size-3 opacity-70 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementCard({ item }: { item: MandalismContent }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <Megaphone className="size-5 text-amber-600" />
        </div>
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
          Announcement
        </p>
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm leading-snug line-clamp-2">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-4">
        {(item.start_at || item.end_at) && (
          <p className="text-xs text-muted-foreground">
            {item.start_at && formatDate(item.start_at)}
            {item.start_at && item.end_at && " – "}
            {item.end_at && formatDate(item.end_at)}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-4">
            {item.description}
          </p>
        )}
        {item.content_thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.content_thumbnail_url}
            alt={item.title}
            className="mt-1 rounded-md object-cover w-full max-h-32"
          />
        )}
      </CardContent>
    </Card>
  );
}

function DocumentCard({ item }: { item: MandalismContent }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
            <FileText className="size-4 text-orange-500" />
          </div>
          <CardTitle className="text-sm leading-snug line-clamp-2">
            {item.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-4">
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {item.description}
          </p>
        )}
        {item.pdf_url && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-full">
            <a
              href={item.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <Download className="size-3.5" />
              Download PDF
              <ExternalLink className="size-3 opacity-70 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ContentCard({ item }: { item: MandalismContent }) {
  switch (item.content_type) {
    case "video":
      return <VideoCard item={item} />;
    case "youtube":
      return <YouTubeCard item={item} />;
    case "live_stream":
      return <LiveStreamCard item={item} />;
    case "announcement":
      return <AnnouncementCard item={item} />;
    case "document":
      return <DocumentCard item={item} />;
    default:
      // Fallback for unknown types — render as a generic card
      return <DocumentCard item={item} />;
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export function MandalismContentPreview({
  initialItems,
}: MandalismContentPreviewProps) {
  const items = initialItems.slice(0, 6);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No content available yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
      <div className="flex justify-end">
        <Link
          href="/community/library"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          View Full Library →
        </Link>
      </div>
    </div>
  );
}
