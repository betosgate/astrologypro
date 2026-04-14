"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  getLivePlatformEmoji,
  getLivePlatformLabel,
  type GovernedStreamPlatformConfig,
  type LivePlatformKey,
} from "@/lib/live-platform-governance";

export type StreamPlatformConfig = GovernedStreamPlatformConfig;

interface Props {
  isLive: boolean;
  livePlatforms: string[];
  platformConfigs: StreamPlatformConfig[];
  fallbackContent?: string | null;
  nextLiveAt?: string | null;
  divinerId: string;
  divinerName?: string;
  fallbackImageUrl?: string | null;
}

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

  if (config.platform === "twitch") {
    const host =
      typeof window !== "undefined" && window.location.hostname
        ? window.location.hostname
        : "astrologypro.com";
    const raw = config.stream_url.trim();
    const channelMatch = raw.match(/twitch\.tv\/([A-Za-z0-9_]+)/i);
    const channel = channelMatch?.[1] ?? raw.replace(/^@/, "");
    return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(host)}`;
  }

  return null;
}

function PlatformEmbed({ config }: { config: StreamPlatformConfig }) {
  const [embedError, setEmbedError] = useState(false);
  const platformLabel = getLivePlatformLabel(config.platform, config.platform_display_name);
  const displayName = config.display_name ?? platformLabel;
  const platformEmoji = getLivePlatformEmoji(config.platform);

  if (config.playback_mode !== "embedded_player" || !config.supports_embed) {
    // Non-embeddable platform: show a link button
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
        <span className="text-4xl">{platformEmoji}</span>
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
        <span className="text-3xl">{platformEmoji}</span>
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
  divinerName,
  fallbackImageUrl,
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
    return (
      <section id="live" className="py-8">
        <div className="mx-auto max-w-3xl px-4">
          <div className="glass-card overflow-hidden rounded-2xl">
            {fallbackImageUrl ? (
              <div className="relative h-56 w-full overflow-hidden border-b border-white/[0.06]">
                <img
                  src={fallbackImageUrl}
                  alt={divinerName ? `${divinerName} profile` : "Diviner profile"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cosmos-900 via-cosmos-900/20 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-cosmos-900/75 px-3 py-1 text-xs font-medium tracking-[0.2em] text-silver/80 uppercase">
                  Offline now
                </div>
              </div>
            ) : null}

            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white/[0.04]">
                <span className="text-2xl">🔮</span>
              </div>
              {fallbackContent ? (
                <p className="text-sm leading-relaxed text-silver/70">{fallbackContent}</p>
              ) : (
                <p className="text-sm text-silver/60">
                  {divinerName
                    ? `${divinerName} is not live right now. Browse media, testimonials, or book a private session below.`
                    : "Not currently live."}
                </p>
              )}
            {nextLiveAt && (
              <p className="mt-4 text-sm font-medium text-gold">
                Next live: {formatNextLive(nextLiveAt)}
              </p>
            )}
            </div>
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
                const label = c.display_name ?? getLivePlatformLabel(c.platform, c.platform_display_name);
                const emoji = getLivePlatformEmoji(c.platform as LivePlatformKey);
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
                getLivePlatformLabel(currentConfig.platform, currentConfig.platform_display_name) ??
                currentConfig.platform}
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
