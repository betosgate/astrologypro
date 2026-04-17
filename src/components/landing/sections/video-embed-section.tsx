interface VideoEmbedContent {
  heading?: string | null;
  video_source: "youtube" | "vimeo" | "upload";
  video_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  autoplay?: boolean;
}

function getEmbedUrl(source: string, url: string, autoplay: boolean): string | null {
  try {
    if (source === "youtube") {
      const parsed = new URL(url);
      let videoId = parsed.searchParams.get("v");
      if (!videoId && parsed.hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1);
      }
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1&mute=1" : ""}`;
    }
    if (source === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (!match) return null;
      return `https://player.vimeo.com/video/${match[1]}${autoplay ? "?autoplay=1&muted=1" : ""}`;
    }
  } catch {
    // invalid URL
  }
  return null;
}

export function VideoEmbedSection({ content }: { content: VideoEmbedContent }) {
  const { heading, video_source, video_url, caption, autoplay = false } = content;
  if (!video_url) return null;

  const embedUrl = getEmbedUrl(video_source, video_url, autoplay);
  if (!embedUrl && video_source !== "upload") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-6 font-display text-2xl font-semibold text-cream md:text-3xl">
            {heading}
          </h2>
        )}

        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06]">
          {video_source === "upload" ? (
            <video
              src={video_url}
              controls
              autoPlay={autoplay}
              muted={autoplay}
              className="h-full w-full object-cover"
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={heading ?? "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : null}
        </div>

        {caption && (
          <p className="mt-3 text-center text-sm text-silver/50">{caption}</p>
        )}
      </div>
    </section>
  );
}
