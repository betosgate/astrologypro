"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type MediaItem,
  TYPE_LABELS,
  TYPE_BADGE_CLASSES,
  TYPE_GRADIENT,
  formatDuration,
} from "./media-gallery";

interface MediaGalleryClientProps {
  items: MediaItem[];
  divinerId: string;
  presentTypes: MediaItem["type"][];
  platformLabels: Record<string, string>;
}

function MediaCard({
  item,
  platformLabels,
  featured = false,
  onOpenImage,
}: {
  item: MediaItem;
  platformLabels: Record<string, string>;
  featured?: boolean;
  onOpenImage: (item: MediaItem) => void;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const hasThumbnail = !!item.thumbnail_url;
  const showThumbnail = hasThumbnail && !thumbnailFailed;
  const isImage = item.type === "image";
  const cardClassName = `group block w-full overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] text-left transition-all hover:border-[#c9a84c]/30 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${featured ? "md:flex" : ""}`;

  const content = (
    <>
      <div
        className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${TYPE_GRADIENT[item.type]} ${featured ? "h-48 md:h-auto md:w-56" : "h-48"}`}
        aria-hidden="true"
      >
        {showThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="flex flex-col items-center gap-3 text-white/25">
              <TypeIcon type={item.type} />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                {TYPE_LABELS[item.type]}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          {isImage ? (
            <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white">
              View image
            </span>
          ) : (
            <ExternalLink className="size-6 text-white" aria-hidden="true" />
          )}
        </div>
        {item.duration_seconds != null && (item.type === "video" || item.type === "audio") && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(item.duration_seconds)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGE_CLASSES[item.type]}`}
            role="status"
            aria-label={`Type: ${TYPE_LABELS[item.type]}`}
          >
            {TYPE_LABELS[item.type]}
          </span>
          {item.platform && (
            <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/50">
              {platformLabels[item.platform] ?? item.platform}
            </span>
          )}
          {item.album_name && (
            <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/50">
              {item.album_name}
            </span>
          )}
          {item.is_featured && (
            <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-2 py-0.5 text-[11px] text-[#c9a84c]">
              Featured
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#f5f0e8]">
          {item.title}
        </h3>

        {item.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-white/50">
            {item.description}
          </p>
        )}
      </div>
    </>
  );

  if (isImage) {
    return (
      <button
        type="button"
        className={cardClassName}
        onClick={() => onOpenImage(item)}
        aria-label={`${TYPE_LABELS[item.type]}: ${item.title} — opens in lightbox`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClassName}
      aria-label={`${TYPE_LABELS[item.type]}: ${item.title} — opens in new tab`}
    >
      {content}
    </a>
  );
}

function TypeIcon({ type }: { type: MediaItem["type"] }) {
  const size = "size-16";
  switch (type) {
    case "video":
      return (
        <svg className={`${size} text-current`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "audio":
      return (
        <svg className={`${size} text-current`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
        </svg>
      );
    case "article":
      return (
        <svg className={`${size} text-current`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case "link":
      return (
        <svg className={`${size} text-current`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      );
    case "image":
      return (
        <svg className={`${size} text-current`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
  }
}

const ALL_TAB = "all" as const;
type TabValue = MediaItem["type"] | typeof ALL_TAB;

export function MediaGalleryClient({
  items,
  presentTypes,
  platformLabels,
}: MediaGalleryClientProps) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = (searchParams.get("media_type") as TabValue) ?? ALL_TAB;

  const validTab: TabValue =
    activeTab === ALL_TAB || presentTypes.includes(activeTab as MediaItem["type"])
      ? activeTab
      : ALL_TAB;

  const imageAlbums = Array.from(
    new Set(
      items
        .filter((item) => item.type === "image")
        .map((item) => item.album_name?.trim() || "Unsorted")
    )
  );
  const activeAlbum =
    validTab === "image" ? searchParams.get("album") ?? "all" : "all";
  const validAlbum =
    activeAlbum === "all" || imageAlbums.includes(activeAlbum) ? activeAlbum : "all";

  const filteredItems = (
    validTab === ALL_TAB ? items : items.filter((i) => i.type === validTab)
  ).filter((item) =>
    validTab === "image" && validAlbum !== "all"
      ? (item.album_name?.trim() || "Unsorted") === validAlbum
      : true
  );

  const featuredItems = filteredItems.filter((i) => i.is_featured);
  const regularItems = filteredItems.filter((i) => !i.is_featured);

  function tabHref(tab: TabValue): string {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("album");
    if (tab === ALL_TAB) {
      sp.delete("media_type");
    } else {
      sp.set("media_type", tab);
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const tabs: Array<{ value: TabValue; label: string }> = [
    { value: ALL_TAB, label: "All" },
    ...presentTypes.map((t) => ({ value: t as TabValue, label: TYPE_LABELS[t] })),
  ];

  function albumHref(album: string): string {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("media_type", "image");
    if (album === "all") {
      sp.delete("album");
    } else {
      sp.set("album", album);
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const groupedImages = imageAlbums.map((album) => ({
    album,
    items: filteredItems.filter(
      (item) => item.type === "image" && (item.album_name?.trim() || "Unsorted") === album
    ),
  }));

  return (
    <>
      <div className="space-y-6">
        <nav
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter media by type"
        >
          {tabs.map((tab) => {
            const isActive = validTab === tab.value;
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                scroll={false}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "border border-[#c9a84c]/40 bg-[#c9a84c]/20 text-[#c9a84c]"
                    : "border border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {validTab === "image" && imageAlbums.length > 0 && (
          <nav className="flex flex-wrap gap-2" aria-label="Filter images by album">
            <Link
              href={albumHref("all")}
              scroll={false}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs transition-all ${
                validAlbum === "all"
                  ? "border border-[#c9a84c]/40 bg-[#c9a84c]/20 text-[#c9a84c]"
                  : "border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80"
              }`}
            >
              All Albums
            </Link>
            {imageAlbums.map((album) => (
              <Link
                key={album}
                href={albumHref(album)}
                scroll={false}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs transition-all ${
                  validAlbum === album
                    ? "border border-[#c9a84c]/40 bg-[#c9a84c]/20 text-[#c9a84c]"
                    : "border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80"
                }`}
              >
                {album}
              </Link>
            ))}
          </nav>
        )}

        {validTab !== "image" && featuredItems.length > 0 && (
          <section aria-label="Featured media">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {featuredItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  platformLabels={platformLabels}
                  featured
                  onOpenImage={setLightboxItem}
                />
              ))}
            </div>
          </section>
        )}

        {validTab !== "image" && regularItems.length > 0 && (
          <section aria-label="Media items">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {regularItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  platformLabels={platformLabels}
                  onOpenImage={setLightboxItem}
                />
              ))}
            </div>
          </section>
        )}

        {validTab === "image" && filteredItems.length > 0 && (
          <section aria-label="Image albums" className="space-y-8">
            {groupedImages
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.album} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f5f0e8]">
                        {group.album}
                      </h3>
                      <p className="text-xs text-white/45">
                        {group.items.length} image{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        platformLabels={platformLabels}
                        onOpenImage={setLightboxItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        )}

        {filteredItems.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">
            No {validTab !== ALL_TAB ? TYPE_LABELS[validTab as MediaItem["type"]] : ""} media items yet.
          </p>
        )}
      </div>

      <Dialog open={lightboxItem !== null} onOpenChange={(open) => !open && setLightboxItem(null)}>
        <DialogContent className="max-w-5xl border-white/10 bg-cosmos-950/95 p-0 text-cream shadow-2xl" showCloseButton>
          {lightboxItem && (
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative flex min-h-[320px] items-center justify-center bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.title}
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-4 p-6">
                <DialogHeader className="text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGE_CLASSES[lightboxItem.type]}`}>
                      {TYPE_LABELS[lightboxItem.type]}
                    </span>
                    {lightboxItem.album_name && (
                      <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/60">
                        {lightboxItem.album_name}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl text-cream">
                    {lightboxItem.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-white/65">
                    {lightboxItem.description ?? "No description provided for this image yet."}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
