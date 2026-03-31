import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star, Calendar, ChevronDown } from "lucide-react";

interface DivinerHeroProps {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  specialties: string[];
  youtubeChannelId: string | null;
  facebookLiveUrl: string | null;
  completedSessions?: number;
  averageRating?: number | null;
  reviewCount?: number;
  openSlotsThisWeek?: number;
}

export function DivinerHero({
  username,
  displayName,
  tagline,
  avatarUrl,
  specialties,
  youtubeChannelId,
  facebookLiveUrl,
  completedSessions = 0,
  averageRating = null,
  reviewCount = 0,
}: DivinerHeroProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasLiveStream = !!youtubeChannelId || !!facebookLiveUrl;

  return (
    <section
      id="hero"
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-24 md:py-32"
    >
      {/* Unique cosmic gradient for hero */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(45,27,78,0.25)_0%,transparent_50%),radial-gradient(ellipse_at_50%_90%,rgba(26,26,78,0.2)_0%,transparent_50%)]" />

      {/* Decorative zodiac wheel — faint, behind content */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-zodiac-spin size-[600px] rounded-full border border-white/[0.03] md:size-[800px]" />
        <div className="animate-zodiac-spin absolute inset-8 rounded-full border border-white/[0.02]" style={{ animationDirection: "reverse", animationDuration: "180s" }} />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Live stream badge */}
        {hasLiveStream && (
          <div className="mb-6 flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
              Live Now
            </span>
          </div>
        )}

        {/* Avatar with orbital ring */}
        <div className="relative mb-8">
          {/* Orbital ring */}
          <div
            className="absolute -inset-4 rounded-full border border-gold/30"
            style={{ animation: "zodiac-spin 20s linear infinite" }}
          />
          <div
            className="absolute -inset-4 rounded-full"
            style={{ animation: "zodiac-spin 20s linear infinite" }}
          >
            <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
          </div>

          {/* Avatar */}
          <div className="relative size-32 overflow-hidden rounded-full border-2 border-white/10 shadow-[0_0_40px_rgba(201,168,76,0.15)] md:size-40">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cosmos-700 font-display text-3xl text-gold md:text-4xl">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <h1 className="mb-3 font-display text-5xl font-semibold tracking-tight text-cream md:text-6xl lg:text-7xl">
          {displayName}
        </h1>

        {/* Tagline */}
        {tagline && (
          <p className="mx-auto mb-8 max-w-xl font-display text-lg italic text-silver md:text-xl">
            {tagline}
          </p>
        )}

        {/* Specialty badges */}
        {specialties.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {specialties.map((specialty) => (
              <span
                key={specialty}
                className="rounded-full border border-gold/30 px-3 py-1 text-xs font-medium text-gold/90 transition-colors hover:border-gold/50 hover:text-gold"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Trust signals row */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-silver/80">
          {averageRating !== null && reviewCount > 0 && (
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-gold text-gold" />
              <span className="font-medium text-cream">{averageRating.toFixed(1)}</span>
            </span>
          )}
          {completedSessions > 0 && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-silver/60" />
              {completedSessions} reading{completedSessions !== 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-green-400/80" />
            Verified Practitioner
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={`/${username}/book`}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          >
            Book a Reading
          </Link>
          <Link
            href={`/${username}#services`}
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-gold/40 px-8 text-sm font-medium text-gold transition-all hover:border-gold/70 hover:bg-gold/5"
          >
            View Services
          </Link>
        </div>

        {/* Live stream embed */}
        {hasLiveStream && (
          <div className="mx-auto mt-12 w-full max-w-2xl">
            {youtubeChannelId && (
              <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/live_stream?channel=${youtubeChannelId}&autoplay=1&mute=1`}
                    title="Live Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            {facebookLiveUrl && (
              <div className={`overflow-hidden rounded-xl border border-white/10 shadow-2xl${youtubeChannelId ? " mt-4" : ""}`}>
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookLiveUrl)}&width=720&autoplay=true`}
                    title="Facebook Live Stream"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Link
          href={`/${username}#about`}
          className="flex flex-col items-center gap-1 text-silver/40 transition-colors hover:text-silver/60"
          aria-label="Scroll to content"
        >
          <span className="text-[10px] uppercase tracking-widest">Explore</span>
          <ChevronDown className="size-5 animate-bounce" />
        </Link>
      </div>
    </section>
  );
}
