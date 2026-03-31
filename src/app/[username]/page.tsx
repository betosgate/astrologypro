import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DivinerHero } from "@/components/landing/diviner-hero";
import { ServiceCard } from "@/components/landing/service-card";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getDiviner(username: string) {
  const supabase = await createClient();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  return diviner;
}

async function getServices(divinerId: string) {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("price", { ascending: true });

  return services ?? [];
}

async function getTestimonials(divinerId: string) {
  const supabase = await createClient();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(9);

  return testimonials ?? [];
}

async function getDivinerStats(divinerId: string) {
  const supabase = await createClient();

  // Get completed booking count
  const { count: completedSessions } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .eq("status", "completed");

  // Get average rating and review count from testimonials
  const { data: ratingData } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("diviner_id", divinerId)
    .eq("is_approved", true);

  let averageRating: number | null = null;
  let reviewCount = 0;
  if (ratingData && ratingData.length > 0) {
    const ratings = ratingData.filter((r) => r.rating != null);
    reviewCount = ratings.length;
    if (reviewCount > 0) {
      averageRating =
        ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount;
    }
  }

  // Count open slots this week (bookings with status 'available' or similar)
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const { count: openSlots } = await supabase
    .from("availability_slots")
    .select("*", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .eq("is_booked", false)
    .gte("start_time", now.toISOString())
    .lte("start_time", endOfWeek.toISOString());

  return {
    completedSessions: completedSessions ?? 0,
    averageRating,
    reviewCount,
    openSlotsThisWeek: openSlots ?? undefined,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const diviner = await getDiviner(username);

  if (!diviner) {
    return { title: "Not Found" };
  }

  const title = `${diviner.display_name} - Book a Reading`;
  const description =
    diviner.tagline ??
    `Book an astrology or tarot reading with ${diviner.display_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${username}`,
      type: "profile",
      ...(diviner.avatar_url && {
        images: [{ url: diviner.avatar_url, width: 400, height: 400 }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function DivinerPage({ params }: PageProps) {
  const { username } = await params;
  const diviner = await getDiviner(username);

  if (!diviner) {
    notFound();
  }

  const [services, testimonials, stats] = await Promise.all([
    getServices(diviner.id),
    getTestimonials(diviner.id),
    getDivinerStats(diviner.id),
  ]);

  const featuredServices = services.filter((s) => s.is_featured);
  const astroServices = services.filter((s) => s.category === "astrology");
  const tarotServices = services.filter((s) => s.category === "tarot");

  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: diviner.display_name,
        description: diviner.tagline ?? diviner.bio ?? undefined,
        url: `${APP_URL}/${username}`,
        ...(diviner.avatar_url && { image: diviner.avatar_url }),
        priceRange: services.length > 0
          ? `$${Math.min(...services.map((s) => s.price))} - $${Math.max(...services.map((s) => s.price))}`
          : undefined,
      },
      ...services.map((service) => ({
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: {
          "@type": "Person",
          name: diviner.display_name,
        },
        offers: {
          "@type": "Offer",
          price: service.price,
          priceCurrency: "USD",
          url: `${APP_URL}/${username}/book/${service.slug}`,
        },
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero */}
      <DivinerHero
        username={username}
        displayName={diviner.display_name}
        tagline={diviner.tagline}
        avatarUrl={diviner.avatar_url}
        specialties={diviner.specialties ?? []}
        youtubeChannelId={diviner.youtube_channel_id ?? null}
        facebookLiveUrl={diviner.facebook_live_url ?? null}
        completedSessions={stats.completedSessions}
        averageRating={stats.averageRating}
        reviewCount={stats.reviewCount}
        openSlotsThisWeek={stats.openSlotsThisWeek}
      />

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <section id="services" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-2 text-center text-2xl font-bold md:text-3xl">
              Featured Readings
            </h2>
            <p className="mb-10 text-center text-muted-foreground">
              Most popular services
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredServices.slice(0, 4).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  username={username}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Separator className="mx-auto max-w-6xl" />

      {/* All Services by Category */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
            All Services
          </h2>

          {astroServices.length > 0 && (
            <div className="mb-12">
              <details open className="group">
                <summary className="mb-6 flex cursor-pointer list-none items-center gap-2 text-xl font-semibold">
                  <span className="transition-transform group-open:rotate-90">
                    &#9654;
                  </span>
                  Astrology
                  <span className="text-sm font-normal text-muted-foreground">
                    ({astroServices.length} services)
                  </span>
                </summary>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {astroServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      username={username}
                    />
                  ))}
                </div>
              </details>
            </div>
          )}

          {tarotServices.length > 0 && (
            <div className="mb-12">
              <details open className="group">
                <summary className="mb-6 flex cursor-pointer list-none items-center gap-2 text-xl font-semibold">
                  <span className="transition-transform group-open:rotate-90">
                    &#9654;
                  </span>
                  Tarot
                  <span className="text-sm font-normal text-muted-foreground">
                    ({tarotServices.length} services)
                  </span>
                </summary>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tarotServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      username={username}
                    />
                  ))}
                </div>
              </details>
            </div>
          )}

          {services.length === 0 && (
            <p className="text-center text-muted-foreground">
              No services available at this time.
            </p>
          )}

          {/* Gift a Reading CTA */}
          <div className="mt-12 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-8 text-center dark:border-violet-800/40 dark:from-violet-950/20 dark:to-purple-950/20">
            <p className="mb-2 text-3xl">
              <span role="img" aria-label="gift">&#127873;</span>
            </p>
            <h3 className="mb-2 text-xl font-bold">
              Gift a Reading
            </h3>
            <p className="mb-4 text-muted-foreground">
              Know someone who would love a session with{" "}
              {diviner.display_name}? Give the gift of cosmic insight.
            </p>
            <Button
              asChild
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Link href={`/${username}/gift`}>
                Purchase a Gift Certificate
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialSection testimonials={testimonials} />

      {/* About / Bio */}
      {diviner.bio && (
        <>
          <Separator className="mx-auto max-w-6xl" />
          <section className="py-16">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">
                About {diviner.display_name}
              </h2>
              <div className="prose prose-neutral dark:prose-invert mx-auto max-w-none whitespace-pre-wrap text-muted-foreground">
                {diviner.bio}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
