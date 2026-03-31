import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star, Calendar, Sparkles } from "lucide-react";

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
    <>
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#06080f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <Link href={`/${username}`} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#c9a84c]" />
            <span className="font-display text-sm font-semibold text-[#f5f0e8]">{displayName}</span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <a href="#about" className="text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">About</a>
            <a href="#services" className="text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Services</a>
            <a href="#reviews" className="text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Reviews</a>
            <Link
              href={`/${username}/book/natal-chart`}
              className="rounded-full bg-[#c9a84c] px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-[#e2c97e]"
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero section — horizontal layout */}
      <section
        id="hero"
        className="relative overflow-hidden border-b border-white/5 px-4 py-10 md:py-14"
      >
        {/* Cosmic gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_80%_70%,rgba(45,27,78,0.2)_0%,transparent_50%)]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
          {/* Left: Avatar */}
          <div className="shrink-0">
            <div className="relative">
              {/* Orbital ring */}
              <div
                className="absolute -inset-3 rounded-full border border-[#c9a84c]/25"
                style={{ animation: "zodiac-spin 20s linear infinite" }}
              >
                <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
              </div>
              {/* Avatar */}
              <div className="relative size-28 overflow-hidden rounded-full border-2 border-white/10 shadow-[0_0_30px_rgba(201,168,76,0.12)] md:size-36">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1a1f5c] font-display text-2xl text-[#c9a84c] md:text-3xl">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Live badge */}
            {hasLiveStream && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 backdrop-blur-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Live Now</span>
              </div>
            )}

            {/* Name */}
            <h1 className="font-display text-3xl font-bold text-[#f5f0e8] md:text-5xl">
              {displayName}
            </h1>

            {/* Tagline */}
            {tagline && (
              <p className="mt-2 font-display text-base italic text-[#b8bcd0]/80 md:text-lg">
                {tagline}
              </p>
            )}

            {/* Specialty pills */}
            {specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-[#c9a84c]/25 px-3 py-0.5 text-xs capitalize text-[#c9a84c]/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Trust signals row */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[#b8bcd0]/70 md:justify-start">
              <span className="inline-flex items-center gap-1 text-[#22c55e]">
                <ShieldCheck className="size-3.5" />
                Verified
              </span>
              {completedSessions > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {completedSessions} readings
                </span>
              )}
              {averageRating && reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[#c9a84c]">
                  <Star className="size-3 fill-[#c9a84c]" />
                  {averageRating.toFixed(1)} ({reviewCount} reviews)
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href={`/${username}/book/natal-chart`}
                className="rounded-full bg-[#c9a84c] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#c9a84c]/20 transition-colors hover:bg-[#e2c97e]"
              >
                Book a Reading
              </Link>
              <a
                href="#services"
                className="rounded-full border border-[#c9a84c]/30 px-6 py-2.5 text-sm text-[#e2c97e] transition-colors hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
              >
                View Services
              </a>
            </div>
          </div>
        </div>

        {/* Live stream embed */}
        {hasLiveStream && (
          <div className="relative z-10 mx-auto mt-8 max-w-6xl">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="relative w-full" style={{ paddingBottom: "40%" }}>
                {youtubeChannelId ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/live_stream?channel=${youtubeChannelId}&autoplay=1&mute=1`}
                    title="Live Stream"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : facebookLiveUrl ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookLiveUrl)}&width=720&autoplay=true`}
                    title="Facebook Live"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
