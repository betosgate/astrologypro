"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

export interface StreamPlatformConfig {
  id: string;
  diviner_id: string;
  platform: string;
  display_name: string | null;
  stream_url: string | null;
  embed_url: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  isLive: boolean;
  livePlatforms: string[];
  platformConfigs: StreamPlatformConfig[];
  fallbackContent?: string | null;
  nextLiveAt?: string | null;
  divinerId: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  zoom: "Zoom",
  other: "Live Stream",
};

const PLATFORM_EMOJI: Record<string, string> = {
  youtube: "📺",
  facebook: "👤",
  instagram: "📷",
  tiktok: "🎵",
  zoom: "💻",
  other: "🌐",
};

/** Platforms that can be reliably embedded via iframe */
const EMBEDDABLE_PLATFORMS = new Set(["youtube", "facebook"]);

function buildEmbedUrl(config: StreamPlatformConfig): string | null {
  if (config.embed_url) return config.embed_url;
  if (!config.stream_url) return null;

  if (config.platform === "youtube") {
    // stream_url may be a channel ID (UCxxx) or a full URL
    const raw = config.stream_url;
    // If it looks like a channel ID (starts with UC or is short)
    if (/^UC[\w-]{20,}$/.test(raw)) {
      return `https://www.youtube.com/embed/live_stream?channel=${raw}`;
    }
    // If it's a full youtube URL, try to extract channel or video ID
    const channelMatch = raw.match(/youtube\.com\/channel\/([\w-]+)/);
    if (channelMatch) {
      return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}`;
    }
    const videoMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
    if (videoMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}`;
    }
    return `https://www.youtube.com/embed/live_stream?channel=${raw}`;
  }

  if (config.platform === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(config.stream_url)}&width=720&autoplay=false&show_text=false`;
  }

  return null;
}

function PlatformEmbed({ config }: { config: StreamPlatformConfig }) {
  const [embedError, setEmbedError] = useState(false);
  const platformLabel = PLATFORM_LABELS[config.platform] ?? config.platform;
  const displayName = config.display_name ?? platformLabel;

  if (!EMBEDDABLE_PLATFORMS.has(config.platform)) {
    // Non-embeddable platform: show a link button
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
        <span className="text-4xl">{PLATFORM_EMOJI[config.platform] ?? "🌐"}</span>
        <div>
          <p className="font-medium text-cream">{displayName}</p>
          <p className="mt-1 text-sm text-silver/60">Live on {platformLabel}</p>
        </div>
        {config.stream_url && (
          <a
            href={config.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold transition-all hover:border-gold/70 hover:bg-gold/5"
          >
            Watch on {platformLabel}
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    );
  }

  const embedUrl = buildEmbedUrl(config);

  if (!embedUrl || embedError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
        <span className="text-3xl">{PLATFORM_EMOJI[config.platform] ?? "🌐"}</span>
        <p className="text-sm text-silver/60">Stream unavailable on this platform</p>
        {config.stream_url && (
          <a
            href={config.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gold underline underline-offset-2 hover:no-underline"
          >
            Watch on {platformLabel}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07]">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={embedUrl}
          title={`${displayName} Live Stream`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setEmbedError(true)}
        />
      </div>
    </div>
  );
}

function formatNextLive(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString;
  }
}

export function LiveStreamSection({
  isLive,
  livePlatforms,
  platformConfigs,
  fallbackContent,
  nextLiveAt,
}: Props) {
  // Only configs for currently-active live platforms
  const activeLiveConfigs = platformConfigs.filter(
    (c) => livePlatforms.includes(c.platform) && c.is_enabled
  );

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
    activeLiveConfigs[0]?.platform ?? null
  );

  // Not live state
  if (!isLive) {
    if (!fallbackContent && !nextLiveAt) return null;

    return (
      <section id="live" className="py-8">
        <div className="mx-auto max-w-3xl px-4">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white/[0.04]">
              <span className="text-2xl">🔮</span>
            </div>
            {fallbackContent ? (
              <p className="text-sm leading-relaxed text-silver/70">{fallbackContent}</p>
            ) : (
              <p className="text-sm text-silver/50">Not currently live</p>
            )}
            {nextLiveAt && (
              <p className="mt-4 text-sm font-medium text-gold">
                Next live: {formatNextLive(nextLiveAt)}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Live with no configured platforms — show generic live badge
  if (activeLiveConfigs.length === 0) {
    return (
      <section id="live" className="py-8">
        <div className="mx-auto max-w-3xl px-4">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-semibold text-red-400">🔴 LIVE NOW</span>
            </div>
            <p className="text-sm text-silver/60">
              Live stream in progress. Check back shortly for the embed link.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentConfig =
    activeLiveConfigs.find((c) => c.platform === selectedPlatform) ?? activeLiveConfigs[0];

  return (
    <section id="live" className="py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-semibold text-red-400">🔴 LIVE NOW</span>
          </div>

          {/* Platform tabs — only shown for multiple platforms */}
          {activeLiveConfigs.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-1">
              {activeLiveConfigs.map((c) => {
                const label = c.display_name ?? PLATFORM_LABELS[c.platform] ?? c.platform;
                const emoji = PLATFORM_EMOJI[c.platform] ?? "🌐";
                return (
                  <button
                    key={c.platform}
                    onClick={() => setSelectedPlatform(c.platform)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedPlatform === c.platform
                        ? "bg-gold/20 text-gold"
                        : "text-silver/60 hover:text-silver"
                    }`}
                  >
                    {emoji} {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Embed */}
        <PlatformEmbed config={currentConfig} />

        {/* Watch Live external link */}
        {currentConfig.stream_url && (
          <div className="mt-3 flex justify-end">
            <a
              href={currentConfig.stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-silver/50 underline underline-offset-2 hover:text-silver"
            >
              Watch on{" "}
              {currentConfig.display_name ??
                PLATFORM_LABELS[currentConfig.platform] ??
                currentConfig.platform}
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
