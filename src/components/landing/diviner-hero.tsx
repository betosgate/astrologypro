import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface DivinerHeroProps {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  specialties: string[];
  youtubeChannelId: string | null;
}

export function DivinerHero({
  username,
  displayName,
  tagline,
  avatarUrl,
  specialties,
  youtubeChannelId,
}: DivinerHeroProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

        {/* YouTube Live Embed */}
        {youtubeChannelId && (
          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-xl border shadow-lg">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/live_stream?channel=${youtubeChannelId}`}
                title="Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
