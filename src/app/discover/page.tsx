import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";
import { DiscoverFilters } from "./discover-filters";

export const metadata = {
  title: "Find a Reader - AstrologyPro",
  description:
    "Browse our community of verified astrologers and tarot readers. Book a personal reading today.",
  openGraph: {
    title: "Find an Astrologer or Tarot Reader | AstrologyPro",
    description:
      "Browse verified astrologers and tarot readers. Book a natal chart reading, compatibility report, tarot spread, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find an Astrologer or Tarot Reader | AstrologyPro",
    description:
      "Browse verified astrologers and tarot readers. Book a natal chart reading, compatibility report, tarot spread, and more.",
  },
};

interface DivinerCard {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  specialties: string[];
  completedSessions: number;
  averageRating: number | null;
  reviewCount: number;
  startingPrice: number | null;
}

async function getActiveDiviners(): Promise<DivinerCard[]> {
  const admin = createAdminClient();

  const { data: diviners } = await admin
    .from("diviners")
    .select("id, username, display_name, tagline, avatar_url, specialties")
    .eq("is_active", true)
    .eq("onboarding_completed", true);

  if (!diviners || diviners.length === 0) return [];

  // Fetch stats for each diviner in parallel
  const cards = await Promise.all(
    diviners.map(async (diviner) => {
      const [sessionsResult, ratingsResult, priceResult] = await Promise.all([
        admin
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("diviner_id", diviner.id)
          .eq("status", "completed"),
        admin
          .from("testimonials")
          .select("rating")
          .eq("diviner_id", diviner.id)
          .eq("status", "approved"),
        admin
          .from("services")
          .select("base_price")
          .eq("diviner_id", diviner.id)
          .eq("is_active", true)
          .order("base_price", { ascending: true })
          .limit(1),
      ]);

      const ratings = (ratingsResult.data ?? []).filter(
        (r: { rating: number | null }) => r.rating != null
      );
      const averageRating =
        ratings.length > 0
          ? ratings.reduce(
              (sum: number, r: { rating: number | null }) =>
                sum + (r.rating ?? 0),
              0
            ) / ratings.length
          : null;

      return {
        id: diviner.id,
        username: diviner.username,
        display_name: diviner.display_name,
        tagline: diviner.tagline,
        avatar_url: diviner.avatar_url,
        specialties: (diviner.specialties as string[]) ?? [],
        completedSessions: sessionsResult.count ?? 0,
        averageRating,
        reviewCount: ratings.length,
        startingPrice: priceResult.data?.[0]
          ? Number(priceResult.data[0].base_price)
          : null,
      };
    })
  );

  return cards;
}

export default async function DiscoverPage() {
  const diviners = await getActiveDiviners();

  // Featured: top-rated with at least 1 review
  const featured = [...diviners]
    .filter((d) => d.averageRating !== null && d.reviewCount > 0)
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#06080f]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-[#f5f0e8] md:text-5xl">
            Find Your Reader
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[#b8bcd0]/70">
            Browse our community of verified astrologers and tarot readers.
            Book a personal reading today.
          </p>
        </div>
      </section>

      {/* Featured Practitioners */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-2xl font-semibold text-[#c9a84c]">
            Featured Practitioners
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((diviner) => (
              <DivinerCardComponent
                key={diviner.id}
                diviner={diviner}
                featured
              />
            ))}
          </div>
          <div className="cosmic-divider mx-auto mt-12" />
        </section>
      )}

      {/* All diviners with filters */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-display text-2xl font-semibold text-[#f5f0e8]">
          All Readers
        </h2>
        <DiscoverFilters diviners={diviners} />
      </section>

      <MarketingFooter />
    </div>
  );
}

function DivinerCardComponent({
  diviner,
  featured = false,
}: {
  diviner: DivinerCard;
  featured?: boolean;
}) {
  return (
    <div
      className={`group rounded-2xl border p-6 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)] ${
        featured
          ? "border-[#c9a84c]/20 bg-[#0d1117]/80"
          : "border-white/5 bg-[#0d1117]/60"
      }`}
    >
      <div className="flex items-start gap-4">
        {diviner.avatar_url ? (
          <img
            src={diviner.avatar_url}
            alt={diviner.display_name}
            className="size-14 rounded-full border border-[#c9a84c]/20 object-cover"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-[#c9a84c]/10 text-lg font-semibold text-[#c9a84c]">
            {diviner.display_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-[#f5f0e8]">
            {diviner.display_name}
          </h3>
          {diviner.tagline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">
              {diviner.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Specialties */}
      {diviner.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {diviner.specialties.slice(0, 3).map((spec) => (
            <Badge
              key={spec}
              variant="outline"
              className="border-[#c9a84c]/10 bg-[#c9a84c]/5 text-[10px] text-[#c9a84c]/80"
            >
              {spec}
            </Badge>
          ))}
          {diviner.specialties.length > 3 && (
            <Badge
              variant="outline"
              className="border-white/5 text-[10px] text-[#b8bcd0]/40"
            >
              +{diviner.specialties.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        {diviner.averageRating !== null && (
          <span className="flex items-center gap-1 text-[#c9a84c]">
            <Star className="size-3.5 fill-current" />
            {diviner.averageRating.toFixed(1)}
            <span className="text-[#b8bcd0]/40">({diviner.reviewCount})</span>
          </span>
        )}
        {diviner.completedSessions > 0 && (
          <span className="text-[#b8bcd0]/50">
            {diviner.completedSessions} session
            {diviner.completedSessions !== 1 ? "s" : ""}
          </span>
        )}
        {diviner.startingPrice !== null && (
          <span className="ml-auto text-[#f5f0e8]">
            From ${diviner.startingPrice}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="mt-5">
        <Button
          asChild
          variant="outline"
          className="w-full border-[#c9a84c]/20 text-[#c9a84c] hover:bg-[#c9a84c]/5 hover:border-[#c9a84c]/40"
        >
          <Link href={`/${diviner.username}`}>
            View Profile
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export { DivinerCardComponent };
