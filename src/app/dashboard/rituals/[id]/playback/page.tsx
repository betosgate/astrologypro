import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BeginOverlay } from "./begin-overlay";

export const dynamic = "force-dynamic";

interface PlaybackVideo {
  id: string;
  title: string;
  video_url: string | null;
  youtube_url: string | null;
  tag_type: "opening" | "gate" | "main" | "closing";
}

interface PlaybackRitual {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
}

interface PlaybackResponse {
  ritual: PlaybackRitual;
  videos: PlaybackVideo[];
  is_dynamic: boolean;
}

function tagTypeBadgeColor(tagType: PlaybackVideo["tag_type"]): string {
  switch (tagType) {
    case "opening":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "gate":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "closing":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
}

function VideoPlayer({ video }: { video: PlaybackVideo }) {
  if (video.youtube_url) {
    // Extract YouTube video ID from various URL formats
    let videoId = "";
    try {
      const url = new URL(video.youtube_url);
      if (url.hostname === "youtu.be") {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get("v") ?? "";
      }
    } catch {
      videoId = "";
    }

    if (videoId) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
      );
    }
  }

  if (video.video_url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={video.video_url}
          controls
          className="size-full object-contain"
          title={video.title}
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
      <p className="text-sm text-muted-foreground">No playback URL available</p>
    </div>
  );
}

export default async function PlaybackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Resolve cookie store so server-side fetch includes session cookies
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/rituals/${id}/playback`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 404) notFound();

  if (!res.ok) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/rituals">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Ritual Playback</h1>
        </div>
        <p className="text-sm text-destructive">
          Failed to load ritual. Please try again.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/rituals">Back to My Rituals</Link>
        </Button>
      </div>
    );
  }

  const data: PlaybackResponse = await res.json();
  const { ritual, videos, is_dynamic } = data;

  const videoList = (
    <div className="space-y-8">
      {videos.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          No video content available for this ritual.
        </p>
      ) : (
        videos.map((video, idx) => (
          <div key={video.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </span>
              <h3 className="font-semibold">{video.title}</h3>
              <span
                className={`rounded border px-1.5 py-0.5 text-xs capitalize ${tagTypeBadgeColor(video.tag_type)}`}
              >
                {video.tag_type}
              </span>
            </div>
            <VideoPlayer video={video} />
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/rituals">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {ritual.ritual_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {videos.length} video{videos.length !== 1 ? "s" : ""} in sequence
          </p>
        </div>
      </div>

      {/* Ritual tags */}
      <div className="flex flex-wrap gap-1.5">
        {ritual.ritual_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Videos — wrapped in overlay if dynamic */}
      {is_dynamic ? (
        <BeginOverlay ritualName={ritual.ritual_name}>{videoList}</BeginOverlay>
      ) : (
        videoList
      )}

      {/* Footer link */}
      <div className="border-t pt-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/rituals">
            <ArrowLeft className="mr-2 size-3.5" />
            Back to My Rituals
          </Link>
        </Button>
      </div>
    </div>
  );
}
