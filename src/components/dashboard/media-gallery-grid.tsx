"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  Link2,
  Star,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Tag,
  Globe,
} from "lucide-react";
import {
  MediaActiveToggle,
  MediaFeaturedToggle,
  MediaDeleteButton,
  MediaEditButton,
  MediaReorderButtons,
} from "@/components/dashboard/media-controls";

interface MediaItem {
  id: string;
  type: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  album_name: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  moderation_status: string;
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
  admin_review_notes: string | null;
  view_count: number | null;
  created_at: string;
}

interface ReorderItem {
  id: string;
  sort_order: number;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video:   { label: "Video",   icon: Video,    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  audio:   { label: "Audio",   icon: Music,    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  image:   { label: "Image",   icon: ImageIcon, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  article: { label: "Article", icon: FileText, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  link:    { label: "Link",    icon: Link2,    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    // youtu.be/ID
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}?autoplay=1&rel=0`;
    // youtube.com/embed/ID already
    if (u.pathname.startsWith("/embed/")) return url;
  } catch { /* ignore */ }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function MediaLightbox({
  item,
  items,
  onClose,
  onNavigate,
}: {
  item: MediaItem;
  items: MediaItem[];
  onClose: () => void;
  onNavigate: (item: MediaItem) => void;
}) {
  const meta = TYPE_META[item.type] ?? TYPE_META.link;
  const Icon = meta.icon;
  const idx = items.findIndex((i) => i.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(items[idx - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(items[idx + 1]);
    },
    [idx, hasPrev, hasNext, items, onNavigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const embedUrl = item.type === "video" ? youtubeEmbedUrl(item.url) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>

        {/* ── Media preview ── */}
        <div className="relative bg-black">
          {/* Nav arrows */}
          {hasPrev && (
            <button
              onClick={() => onNavigate(items[idx - 1])}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Previous item"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => onNavigate(items[idx + 1])}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Next item"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {idx + 1} / {items.length}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/80 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          {/* Content */}
          {item.type === "video" && embedUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={item.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : item.type === "image" && item.thumbnail_url ? (
            <div className="flex max-h-[60vh] items-center justify-center bg-black">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="max-h-[60vh] w-full object-contain"
              />
            </div>
          ) : item.thumbnail_url ? (
            <div className="flex h-56 items-center justify-center bg-muted">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`flex size-16 items-center justify-center rounded-full ${meta.color}`}>
                  <Icon className="size-8" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex h-48 items-center justify-center ${meta.color}`}>
              <Icon className="size-16 opacity-60" />
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div className="overflow-y-auto max-h-[50vh] p-6 space-y-5">
          {/* Title + type + open link */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={`shrink-0 text-xs ${meta.color}`}>
                  <Icon className="mr-1 size-3" />
                  {meta.label}
                </Badge>
                {item.is_featured && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                    Featured
                  </Badge>
                )}
                {!item.is_active && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold leading-snug">{item.title}</h2>
              {item.description && (
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 size-3.5" />
                Open
              </a>
            </Button>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Views</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Eye className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">{(item.view_count ?? 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Added</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">{formatDate(item.created_at)}</span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-block size-2 rounded-full ${item.moderation_status === "approved" ? "bg-green-500" : item.moderation_status === "blocked" ? "bg-red-500" : "bg-amber-400"}`} />
                <span className="text-sm font-semibold capitalize">{item.moderation_status}</span>
              </div>
            </div>
            {item.album_name && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Album</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Tag className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold truncate">{item.album_name}</span>
                </div>
              </div>
            )}
            {item.url && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">URL</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary truncate hover:underline"
                  >
                    {item.url}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Admin notes */}
          {item.admin_review_notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-900/10">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">Admin note</p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">{item.admin_review_notes}</p>
            </div>
          )}

          {/* Divider + controls */}
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3" />
                <MediaFeaturedToggle
                  itemId={item.id}
                  featured={item.is_featured}
                  blocked={item.moderation_status === "blocked"}
                />
              </div>
              <MediaActiveToggle
                itemId={item.id}
                active={item.is_active}
                blocked={item.moderation_status === "blocked"}
              />
            </div>
            <div className="flex items-center gap-1">
              <MediaEditButton itemId={item.id} />
              <MediaDeleteButton itemId={item.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Grid ─────────────────────────────────────────────────────────────────── */
export function MediaGalleryGrid({ items }: { items: MediaItem[] }) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const reorderItems: ReorderItem[] = items.map((i) => ({ id: i.id, sort_order: i.sort_order }));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const meta = TYPE_META[item.type] ?? TYPE_META.link;
          const Icon = meta.icon;
          return (
            <div key={item.id} className="group relative rounded-lg border bg-card p-4 space-y-3">
              {/* Clickable thumbnail */}
              <button
                type="button"
                onClick={() => setLightboxItem(item)}
                className="relative aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`View details for ${item.title}`}
              >
                {item.thumbnail_url ? (
                  <>
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                      <div className="scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <Icon className={`size-5 ${meta.color.split(" ").find(c => c.startsWith("text-")) ?? "text-foreground"}`} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`flex size-12 items-center justify-center rounded-full ${meta.color}`}>
                    <Icon className="size-6" />
                  </div>
                )}
                {/* Type badge overlay on thumbnail */}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className={`text-[10px] py-0.5 px-1.5 ${meta.color}`}>
                    {meta.label}
                  </Badge>
                </div>
              </button>

              {/* Title */}
              <div
                className="min-w-0 cursor-pointer"
                onClick={() => setLightboxItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setLightboxItem(item)}
              >
                <p className="truncate font-medium text-sm hover:text-primary transition-colors">{item.title}</p>
                {item.type === "image" && item.album_name && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">Album: {item.album_name}</p>
                )}
              </div>

              {/* View count */}
              {(item.view_count ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="size-3" />
                  {item.view_count} view{item.view_count !== 1 ? "s" : ""}
                </div>
              )}

              {/* Controls row */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3" />
                    <MediaFeaturedToggle itemId={item.id} featured={item.is_featured} blocked={item.moderation_status === "blocked"} />
                  </div>
                  <MediaActiveToggle itemId={item.id} active={item.is_active} blocked={item.moderation_status === "blocked"} />
                </div>
                <div className="flex items-center gap-1">
                  <MediaReorderButtons itemId={item.id} allItems={reorderItems} />
                  <MediaEditButton itemId={item.id} />
                  <MediaDeleteButton itemId={item.id} />
                </div>
              </div>

              <div className="space-y-1 rounded-md border border-dashed border-muted px-3 py-2 text-xs">
                <p className="font-medium text-foreground">
                  Review status:{" "}
                  <span className="capitalize">{String(item.moderation_status).replace("_", " ")}</span>
                </p>
                {item.moderation_status === "pending" && (
                  <p className="text-muted-foreground">Awaiting admin review before this item can appear publicly.</p>
                )}
                {item.moderation_status === "blocked" && (
                  <p className="text-destructive">Permanently blocked by admin. This item cannot be republished.</p>
                )}
                {item.admin_review_notes && (
                  <p className="text-muted-foreground">Admin note: {item.admin_review_notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <MediaLightbox
          item={lightboxItem}
          items={items}
          onClose={() => setLightboxItem(null)}
          onNavigate={setLightboxItem}
        />
      )}
    </>
  );
}
