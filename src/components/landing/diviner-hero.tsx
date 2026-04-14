import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star, Calendar, Sparkles, Zap, BadgeCheck } from "lucide-react";
import { getDivinerAvatarUrl, getDivinerCoverImageUrl } from "@/lib/diviner-images";

interface DivinerHeroProps {
  username: string;
  displayName: string;
  hasServices?: boolean;
  bookHref?: string;
  tagline: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  specialties: string[];
  youtubeChannelId: string | null;
  facebookLiveUrl: string | null;
  completedSessions?: number;
  completedSessionsLast7Days?: number;
  completedSessionsLast30Days?: number;
  showSessionCountsBlock?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  openSlotsThisWeek?: number;
  isVerified?: boolean;
  isCertified?: boolean;
}

export function DivinerHero({
  username,
  displayName,
  hasServices = true,
  bookHref = "#booking",
  tagline,
  avatarUrl,
  coverImageUrl,
  specialties,
  youtubeChannelId,
  facebookLiveUrl,
  completedSessions = 0,
  completedSessionsLast7Days = 0,
  completedSessionsLast30Days = 0,
  showSessionCountsBlock = false,
  averageRating = null,
  reviewCount = 0,
  openSlotsThisWeek,
  isVerified = true,
  isCertified = false,
}: DivinerHeroProps) {
  const hasLiveStream = !!youtubeChannelId || !!facebookLiveUrl;
  const resolvedAvatarUrl = getDivinerAvatarUrl(avatarUrl);
  const resolvedCoverImageUrl = getDivinerCoverImageUrl(coverImageUrl);

  // Urgency: low slot warning when fewer than 5 slots remain
  const lowSlots =
    openSlotsThisWeek !== undefined && openSlotsThisWeek < 5;

  // Next-available label derived from slot count
  const nextAvailableLabel =
    openSlotsThisWeek === 0
      ? null
      : openSlotsThisWeek !== undefined && openSlotsThisWeek <= 2
        ? "Next available: today"
        : openSlotsThisWeek !== undefined && openSlotsThisWeek <= 5
          ? "Next available: tomorrow"
          : openSlotsThisWeek !== undefined
            ? "Next available: this week"
            : null;

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
            {hasServices && (
              <a href="#services" className="text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Services</a>
            )}
            <a href="#reviews" className="text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Reviews</a>
            <Link
              href={bookHref}
              className="rounded-full bg-[#c9a84c] px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-[#e2c97e]"
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero section — single horizontal band: avatar + text left, cover image right */}
      <section
        id="hero"
        className="relative overflow-hidden border-b border-white/5 bg-[#06080f]"
      >
        {/* Cover image — positioned absolute, fills right half on desktop */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[55%] lg:w-[50%]">
          <Image
            src={resolvedCoverImageUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority
          />
          {/* Gradient fade from left (dark) into image */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06080f] via-[#06080f]/70 to-transparent md:via-[#06080f]/50" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#06080f] to-transparent" />
        </div>

        {/* Content — avatar + text on the left side */}
        <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-6 px-4 py-10 md:gap-8 md:py-14 lg:py-16">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="relative">
              {/* Orbital ring */}
              <div
                className="absolute -inset-3 rounded-full border border-[#c9a84c]/25"
                style={{ animation: "zodiac-spin 20s linear infinite" }}
              >
                <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
              </div>
              {/* Avatar circle */}
              <div className="relative size-24 overflow-hidden rounded-full border-[3px] border-[#c9a84c]/30 shadow-[0_0_30px_rgba(201,168,76,0.12)] sm:size-28 md:size-32 lg:size-36">
                <Image
                  src={resolvedAvatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="144px"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1">
            {/* Live badge */}
            {hasLiveStream && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 backdrop-blur-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Live Now</span>
              </div>
            )}

            {/* Name */}
            <h1 className="font-display text-3xl font-bold text-[#f5f0e8] md:text-4xl lg:text-5xl">
              {displayName}
            </h1>

            {/* Tagline */}
            {tagline && (
              <p className="mt-1.5 font-display text-sm italic text-[#b8bcd0]/80 sm:text-base md:text-lg">
                {tagline}
              </p>
            )}

            {/* Specialty pills */}
            {specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/5 px-3 py-0.5 text-xs font-medium capitalize text-[#c9a84c]/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Trust signals row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#b8bcd0]/70">
              {isCertified && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/15 px-3 py-1 text-[#c9a84c] font-semibold text-xs shadow-sm">
                  <BadgeCheck className="size-4" />
                  ⭐ DIB Certified
                </span>
              )}
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[#22c55e]">
                  <ShieldCheck className="size-3.5" />
                  Verified
                </span>
              )}
              {!showSessionCountsBlock && completedSessions > 0 && (
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

            {/* Urgency signals */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {/* Low slots warning */}
              {lowSlots && openSlotsThisWeek !== undefined && openSlotsThisWeek > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                  <Zap className="size-3 fill-amber-400" />
                  Only {openSlotsThisWeek} slot{openSlotsThisWeek !== 1 ? "s" : ""} left this week
                </span>
              )}
              {openSlotsThisWeek === 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                  Fully booked this week
                </span>
              )}
              {/* Next available indicator */}
              {nextAvailableLabel && (
                <span className="text-[11px] text-[#b8bcd0]/50">
                  {nextAvailableLabel}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={bookHref}
                className="rounded-full bg-[#c9a84c] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#c9a84c]/20 transition-colors hover:bg-[#e2c97e]"
              >
                Book a Reading
              </Link>
              {hasServices && (
                <a
                  href="#services"
                  className="rounded-full border border-[#c9a84c]/30 px-6 py-2.5 text-sm text-[#e2c97e] transition-colors hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
                >
                  View Services
                </a>
              )}
            </div>

            {showSessionCountsBlock && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#c9a84c]/20 bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8bcd0]/60">
                    Sessions Completed
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f5f0e8]">
                    {completedSessions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8bcd0]/60">
                    Last 7 Days
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f5f0e8]">
                    {completedSessionsLast7Days.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8bcd0]/60">
                    Last 30 Days
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f5f0e8]">
                    {completedSessionsLast30Days.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live stream embed */}
        {hasLiveStream && (
          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8">
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
