import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DivinerHero } from "@/components/landing/diviner-hero";
import { ServiceCard } from "@/components/landing/service-card";
import { getServiceImageUrl } from "@/lib/service-images";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { StickyNav } from "@/components/landing/sticky-nav";
import { AvailabilityPreview } from "@/components/landing/availability-preview";
import { ServiceTabs } from "./service-tabs";
import { APP_URL } from "@/lib/constants";
import { Gift, ArrowRight } from "lucide-react";
import { PageTracker } from "@/components/landing/page-tracker";

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
    .order("sort_order", { ascending: true });

  return services ?? [];
}

async function getTestimonials(divinerId: string) {
  const supabase = await createClient();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(9);

  return testimonials ?? [];
}

async function getDivinerStats(divinerId: string) {
  const supabase = await createClient();

  const { count: completedSessions } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .eq("status", "completed");

  const { data: ratingData } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("diviner_id", divinerId)
    .eq("status", "approved");

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

  const astroServices = services.filter((s) => s.category === "astrology");
  const tarotServices = services.filter((s) => s.category === "tarot");

  // Build slug → image URL map for all services
  const serviceImages: Record<string, string | null> = {};
  for (const s of services) {
    serviceImages[s.slug] = getServiceImageUrl(s.slug);
  }

  // Extract a pull-quote from the bio (first sentence or first 120 chars)
  let pullQuote: string | null = null;
  if (diviner.bio) {
    const firstSentence = diviner.bio.match(/^[^.!?]+[.!?]/)?.[0];
    pullQuote = firstSentence ?? diviner.bio.slice(0, 120);
  }

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
        priceRange:
          services.length > 0
            ? `$${Math.min(...services.map((s) => Number(s.base_price)))} - $${Math.max(...services.map((s) => Number(s.base_price)))}`
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
          price: Number(service.base_price),
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

      {/* Sticky navigation */}
      <StickyNav
        displayName={diviner.display_name}
        username={username}
        hasBio={!!diviner.bio}
        hasServices={services.length > 0}
        hasTestimonials={testimonials.length > 0}
      />

      {/* ===== 1. HERO ===== */}
      <DivinerHero
        username={username}
        displayName={diviner.display_name}
        tagline={diviner.tagline}
        avatarUrl={diviner.avatar_url}
        coverImageUrl={diviner.cover_image_url ?? null}
        specialties={diviner.specialties ?? []}
        youtubeChannelId={diviner.youtube_channel_id ?? null}
        facebookLiveUrl={diviner.facebook_live_url ?? null}
        completedSessions={stats.completedSessions}
        averageRating={stats.averageRating}
        reviewCount={stats.reviewCount}
        openSlotsThisWeek={stats.openSlotsThisWeek}
        isVerified={!!(diviner as Record<string, unknown>).verified || !!(diviner as Record<string, unknown>).badge_verified}
      />

      {/* ===== 2. ABOUT SECTION ===== */}
      {diviner.bio && (
        <section id="about" className="py-10 md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
              About {diviner.display_name}
            </h2>

            <div className="grid items-start gap-12 md:grid-cols-5">
              {/* Bio text — 3 cols */}
              <div className="md:col-span-3">
                {/* Pull quote */}
                {pullQuote && (
                  <blockquote className="mb-8 border-l-2 border-gold/30 pl-6 font-display text-lg italic leading-relaxed text-cream/80 md:text-xl">
                    {pullQuote}
                  </blockquote>
                )}

                <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-silver/70">
                  {diviner.bio}
                </div>
              </div>

              {/* Credentials — 2 cols */}
              <div className="space-y-6 md:col-span-2">
                {/* Years of experience */}
                {diviner.years_experience && (
                  <div className="glass-card rounded-xl p-5">
                    <p className="font-display text-3xl font-semibold text-gold">
                      {diviner.years_experience}+
                    </p>
                    <p className="text-sm text-silver/60">Years of Practice</p>
                  </div>
                )}

                {/* Specialties list */}
                {(diviner.specialties ?? []).length > 0 && (
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-silver/50">
                      Specialties
                    </h3>
                    <ul className="space-y-2">
                      {(diviner.specialties as string[]).map(
                        (spec: string) => (
                          <li
                            key={spec}
                            className="flex items-center gap-2 text-sm text-cream/80"
                          >
                            <span className="size-1 rounded-full bg-gold/50" />
                            {spec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Approach */}
                {diviner.approach && (
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-silver/50">
                      My Approach
                    </h3>
                    <p className="text-sm leading-relaxed text-silver/70">
                      {diviner.approach}
                    </p>
                  </div>
                )}

                {/* Credentials & Certifications */}
                {(diviner as Record<string, unknown>).credentials && (
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-silver/50">
                      Credentials &amp; Certifications
                    </h3>
                    <ul className="space-y-2">
                      {String((diviner as Record<string, unknown>).credentials)
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2 text-sm text-cream/80"
                          >
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold/50" />
                            {line}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cosmic divider */}
          <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
        </section>
      )}

      {/* ===== 3. SERVICES SECTION ===== */}
      {services.length > 0 && (
        <section id="services" className="py-10 md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-2 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
              Services &amp; Offerings
            </h2>
            <p className="mx-auto mb-6 max-w-md text-center text-sm text-silver/60">
              Choose from a range of readings tailored to your questions
            </p>

            {/* Tabs for Astrology / Tarot (or single list) */}
            {astroServices.length > 0 && tarotServices.length > 0 ? (
              <ServiceTabs
                astroServices={astroServices}
                tarotServices={tarotServices}
                username={username}
                serviceImages={serviceImages}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    username={username}
                    imageUrl={serviceImages[service.slug]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cosmic divider */}
          <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
        </section>
      )}

      {/* ===== 4. TESTIMONIALS ===== */}
      <TestimonialSection testimonials={testimonials} />

      {/* ===== 5. AVAILABILITY PREVIEW ===== */}
      <section id="booking" className="py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-2 font-display text-3xl font-semibold text-cream md:text-4xl">
            Next Available
          </h2>
          <p className="mx-auto mb-10 max-w-md text-sm text-silver/60">
            Reserve your spot for a personal reading
          </p>
          <AvailabilityPreview
            divinerId={diviner.id}
            username={username}
          />
        </div>

        {/* Cosmic divider */}
        <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
      </section>

      {/* ===== 6. GIFT A READING ===== */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-2xl px-4">
          <div className="glass-card rounded-2xl border-gold/10 p-10 text-center md:p-14">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-gold/10">
              <Gift className="size-6 text-gold" />
            </div>
            <h2 className="mb-3 font-display text-2xl font-semibold text-cream md:text-3xl">
              Gift a Reading
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-silver/60">
              Know someone who would love a session with{" "}
              {diviner.display_name}? Give the gift of cosmic insight.
            </p>
            <Link
              href={`/${username}/gift`}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-gold/40 px-6 text-sm font-medium text-gold transition-all hover:border-gold/70 hover:bg-gold/5"
            >
              Purchase Gift Certificate
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 7. FINAL CTA ===== */}
      <section className="relative overflow-hidden py-12 md:py-16">
        {/* Cosmic gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />

        {/* Decorative zodiac wheel */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
          <div className="animate-zodiac-spin size-[500px] rounded-full border border-gold" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 font-display text-3xl font-semibold text-cream md:text-4xl lg:text-5xl">
            Ready to discover what the stars reveal?
          </h2>
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-silver/60">
            Book a personal reading with {diviner.display_name} and gain
            clarity on the questions that matter most.
          </p>
          <Link
            href={`/${username}/book`}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          >
            Book a Reading
          </Link>
        </div>
      </section>

      <PageTracker divinerId={diviner.id} path={`/${username}`} />
    </>
  );
}
