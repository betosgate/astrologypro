import { Suspense } from "react";
import { MediaGalleryClient } from "./media-gallery-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  diviner_id: string;
  type: "video" | "audio" | "article" | "link" | "image";
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  platform: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_featured: boolean;
  view_count: number;
  created_at: string;
}

interface MediaGalleryProps {
  items: MediaItem[];
  divinerId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export const TYPE_LABELS: Record<MediaItem["type"], string> = {
  video: "Video",
  audio: "Audio",
  article: "Article",
  link: "Link",
  image: "Image",
};

export const TYPE_BADGE_CLASSES: Record<MediaItem["type"], string> = {
  video: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  audio: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  article: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  link: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  image: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
};

export const TYPE_GRADIENT: Record<MediaItem["type"], string> = {
  video: "from-purple-900/40 to-purple-700/20",
  audio: "from-teal-900/40 to-teal-700/20",
  article: "from-blue-900/40 to-blue-700/20",
  link: "from-gray-900/40 to-gray-700/20",
  image: "from-amber-900/40 to-amber-700/20",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  spotify: "Spotify",
  apple_podcasts: "Apple Podcasts",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "External",
};

// ─── Server component ─────────────────────────────────────────────────────────

export function MediaGallery({ items, divinerId }: MediaGalleryProps) {
  if (items.length === 0) return null;

  // Collect present types for tab rendering
  const presentTypes = Array.from(new Set(items.map((i) => i.type))) as MediaItem["type"][];

  return (
    <Suspense fallback={<MediaGalleryLoading />}>
      <MediaGalleryClient
        items={items}
        divinerId={divinerId}
        presentTypes={presentTypes}
        platformLabels={PLATFORM_LABELS}
      />
    </Suspense>
  );
}

function MediaGalleryLoading() {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading media gallery">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.03] border border-white/[0.07] h-64 animate-pulse"
          role="presentation"
        />
      ))}
    </div>
  );
}
