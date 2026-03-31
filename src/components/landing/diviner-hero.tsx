import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Star, Clock, Calendar } from "lucide-react";

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
  openSlotsThisWeek,
}: DivinerHeroProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasLiveStream = !!youtubeChannelId || !!facebookLiveUrl;

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-card to-background py-16 md:py-24">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        {/* Avatar */}
        <Avatar className="mx-auto mb-6 size-28 md:size-36 ring-4 ring-primary/20">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="text-2xl md:text-3xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {displayName}
        </h1>

        {/* Tagline */}
        {tagline && (
          <p className="mx-auto mb-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            {tagline}
          </p>
        )}

        {/* Trust Signals */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <Badge
            variant="secondary"
            className="gap-1.5 border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
          >
            <ShieldCheck className="size-3.5" />
            Verified Practitioner
          </Badge>
          {completedSessions > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Calendar className="size-3.5" />
              {completedSessions} reading{completedSessions !== 1 ? "s" : ""} completed
            </Badge>
          )}
          {averageRating !== null && reviewCount > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              {averageRating.toFixed(1)} from {reviewCount} review{reviewCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {openSlotsThisWeek !== undefined && openSlotsThisWeek < 5 && (
            <Badge
              variant="secondary"
              className="gap-1.5 border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
            >
              <Clock className="size-3.5" />
              Limited availability this week
            </Badge>
          )}
        </div>

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button asChild size="lg" className="gap-2 text-base">
          <Link href={`/${username}#services`}>
            <Sparkles className="size-5" />
            Book a Reading
          </Link>
        </Button>

        {/* Live Stream Section */}
        {hasLiveStream && (
          <div className="mx-auto mt-10 max-w-2xl">
            {/* LIVE NOW Banner */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
                Live Now
              </span>
            </div>

            {/* YouTube Live Embed */}
            {youtubeChannelId && (
              <div className="overflow-hidden rounded-xl border shadow-lg">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
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

            {/* Facebook Live Embed */}
            {facebookLiveUrl && (
              <div
                className={`overflow-hidden rounded-xl border shadow-lg${youtubeChannelId ? " mt-4" : ""}`}
              >
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
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
    </section>
  );
}
