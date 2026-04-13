import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DivinerHero } from "@/components/landing/diviner-hero";
import { ServiceCard } from "@/components/landing/service-card";
import { getServiceImageUrl } from "@/lib/service-images";
import { StickyNav } from "@/components/landing/sticky-nav";
import { AvailabilityPreview } from "@/components/landing/availability-preview";
import { ServiceTabs } from "./service-tabs";
import { APP_URL } from "@/lib/constants";
import { Gift, ArrowRight, ShieldAlert } from "lucide-react";
import { PageTracker } from "@/components/landing/page-tracker";
import { MediaGallery, type MediaItem } from "@/components/public/media-gallery";
import { LiveStreamSection, type StreamPlatformConfig } from "@/components/public/live-stream-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { PublicContentTabs } from "@/components/public/public-content-tabs";
import { BlogSubscribeForm } from "@/app/blog/subscribe-form";
import { CheckInForm } from "@/components/diviner/check-in-form";
import { WeeklySubscriptionSignup } from "@/components/public/weekly-subscription-signup";
import { isFallbackManualService } from "@/lib/public-booking";
import { isPublicSectionBlocked, normalizePublishPolicy } from "@/lib/diviner-publishing";
import { getDivinerAvatarUrl, getDivinerCoverImageUrl } from "@/lib/diviner-images";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function isTimeBasedService(service: Record<string, unknown>) {
  const triggerEvent = String(service.trigger_event ?? "").trim();
  const slug = String(service.slug ?? "").toLowerCase();
  const name = String(service.name ?? "").toLowerCase();

  return Boolean(
    triggerEvent ||
      slug.includes("return") ||
      slug.includes("transit") ||
      slug.includes("forecast") ||
      name.includes("return") ||
      name.includes("transit") ||
      name.includes("forecast"),
  );
}

async function getDiviner(username: string) {
  const supabase = createAdminClient();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  return diviner;
}

async function getServices(divinerId: string) {
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id, client_name, rating, text, service_type, featured")
    .eq("diviner_id", divinerId)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(9);

  return testimonials ?? [];
}

async function getMediaItems(divinerId: string): Promise<MediaItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media_items")
    .select(
      "id, diviner_id, type, url, title, description, thumbnail_url, category, album_name, platform, duration_seconds, sort_order, is_featured, view_count, created_at"
    )
    .eq("diviner_id", divinerId)
    .eq("is_active", true)
    .eq("moderation_status", "approved")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as MediaItem[];
}

async function getLivePlatforms(divinerId: string): Promise<StreamPlatformConfig[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stream_platform_configs")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as StreamPlatformConfig[];
}

async function getActiveGiveaway(divinerId: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("giveaways")
    .select("id")
    .eq("diviner_id", divinerId)
    .eq("status", "active")
    .is("ends_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data;

  // Also check giveaways with ends_at in the future
  const { data: withEnd } = await admin
    .from("giveaways")
    .select("id")
    .eq("diviner_id", divinerId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return withEnd ?? null;
}

async function getWeeklySubscriptionProduct(divinerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("weekly_subscription_products")
    .select("id, title, description, price_cents, is_active")
    .eq("diviner_id", divinerId)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

async function getPolicies() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_policies")
    .select("type, title, content")
    .order("type", { ascending: true });
  return data ?? [];
}

async function getDivinerStats(divinerId: string) {
  const supabase = createAdminClient();

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  const [templatesResult, legacySlotsResult] = await Promise.all([
    supabase
      .from("availability_templates")
      .select("*")
      .or(`owner_id.eq.${divinerId},diviner_id.eq.${divinerId}`)
      .eq("is_active", true),
    supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time")
      .or(`owner_id.eq.${divinerId},diviner_id.eq.${divinerId}`)
      .eq("is_active", true),
  ]);

  let slotPatterns = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  const templates = templatesResult.data ?? [];
  const legacySlots = legacySlotsResult.data ?? [];
  const hasAnyAvailability = templates.length > 0 || legacySlots.length > 0;
  const hasUnscopedAvailability =
    templates.some((template) => {
      const serviceId = (template as Record<string, unknown>).service_id;
      return !serviceId;
    }) || legacySlots.length > 0;
  const unscopedDurationMinutes =
    ((templates.find((template) => {
      const serviceId = (template as Record<string, unknown>).service_id;
      return !serviceId;
    }) as Record<string, unknown> | undefined)?.duration_minutes as number | undefined) ?? null;

  while (cursor <= endOfWeek) {
    const dayStr = formatLocalDate(cursor);
    const dayOfWeek = cursor.getDay();

    for (const template of templates) {
      const weekdays = Array.isArray(template.weekdays)
        ? template.weekdays.map((value: unknown) => Number(value))
        : [];
      if (!weekdays.includes(dayOfWeek)) continue;
      if (dayStr < template.start_date || dayStr > template.end_date) continue;

      const [startHour = 0, startMinute = 0] = (template.start_time ?? "00:00").split(":").map(Number);
      const [endHour = 0, endMinute = 0] = (template.end_time ?? "00:00").split(":").map(Number);
      const windowMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      const cadence = Math.max(1, template.duration_minutes ?? 60);
      slotPatterns += Math.max(0, Math.floor(windowMinutes / cadence));
    }

    for (const slot of legacySlots) {
      if (slot.day_of_week !== dayOfWeek) continue;
      const [startHour = 0, startMinute = 0] = (slot.start_time ?? "00:00").split(":").map(Number);
      const [endHour = 0, endMinute = 0] = (slot.end_time ?? "00:00").split(":").map(Number);
      const windowMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      slotPatterns += Math.max(0, Math.floor(windowMinutes / 60));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  const { count: bookedThisWeek } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .in("status", ["confirmed", "in_progress"])
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", endOfWeek.toISOString());

  const openSlots = Math.max(0, (slotPatterns ?? 0) - (bookedThisWeek ?? 0));

  return {
    completedSessions: completedSessions ?? 0,
    averageRating,
    reviewCount,
    openSlotsThisWeek: openSlots,
    hasAnyAvailability,
    hasUnscopedAvailability,
    unscopedDurationMinutes,
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
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (publishPolicy.publicPublishBlocked) {
    return { title: "Not Found" };
  }
  const heroBlocked = isPublicSectionBlocked(publishPolicy, "hero");
  const bioBlocked = isPublicSectionBlocked(publishPolicy, "bio");

  const title = `${diviner.display_name} - Book a Reading`;
  const description =
    !heroBlocked && diviner.tagline
      ? diviner.tagline
      : !bioBlocked && diviner.bio
        ? diviner.bio
        : `Book an astrology or tarot reading with ${diviner.display_name}`;

  const ogImage = heroBlocked ? null : getDivinerCoverImageUrl(diviner.cover_image_url) || getDivinerAvatarUrl(diviner.avatar_url);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${username}`,
      type: "profile",
      ...(ogImage && {
        images: [
          diviner.cover_image_url
            ? { url: getDivinerCoverImageUrl(diviner.cover_image_url), width: 1200, height: 400 }
            : { url: getDivinerAvatarUrl(diviner.avatar_url), width: 400, height: 400 },
        ],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function DivinerPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { tab } = await searchParams;
  const diviner = await getDiviner(username);

  if (!diviner) {
    notFound();
  }
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (publishPolicy.publicPublishBlocked) {
    notFound();
  }
  const heroBlocked = isPublicSectionBlocked(publishPolicy, "hero");
  const bioBlocked = isPublicSectionBlocked(publishPolicy, "bio");
  const servicesBlocked = isPublicSectionBlocked(publishPolicy, "services");
  const liveBlocked = isPublicSectionBlocked(publishPolicy, "live");
  const mediaBlocked = isPublicSectionBlocked(publishPolicy, "media");
  const testimonialsBlocked = isPublicSectionBlocked(publishPolicy, "testimonials");
  const weeklySubscriptionBlocked = isPublicSectionBlocked(publishPolicy, "weekly_subscription");

  const [services, testimonials, stats, policies, mediaItems, livePlatformConfigs, activeGiveaway, weeklySubscriptionProduct] = await Promise.all([
    servicesBlocked ? Promise.resolve([]) : getServices(diviner.id),
    testimonialsBlocked ? Promise.resolve([]) : getTestimonials(diviner.id),
    getDivinerStats(diviner.id),
    getPolicies(),
    mediaBlocked ? Promise.resolve([]) : getMediaItems(diviner.id),
    liveBlocked ? Promise.resolve([]) : getLivePlatforms(diviner.id),
    getActiveGiveaway(diviner.id),
    weeklySubscriptionBlocked ? Promise.resolve(null) : getWeeklySubscriptionProduct(diviner.id),
  ]);

  const filteredMediaItems = mediaItems.filter(
    (item) => !publishPolicy.blockedMediaTypes.includes(item.type)
  );
  const publicServices = services.filter((service) => !isFallbackManualService(service));
  const astroServices = publicServices.filter((s) => s.category === "astrology");
  const tarotServices = publicServices.filter((s) => s.category === "tarot");
  const activeTab = !bioBlocked && tab === "bio" ? "bio" : "home";
  const birthChartService =
    publicServices.find((service) => service.slug === "natal-chart") ??
    publicServices.find((service) =>
      String(service.name ?? "").toLowerCase().includes("natal chart"),
    ) ??
    null;
  const timeBasedServices = publicServices.filter(
    (service) =>
      service.id !== birthChartService?.id && isTimeBasedService(service),
  );
  const evergreenServices = publicServices.filter(
    (service) =>
      service.id !== birthChartService?.id && !isTimeBasedService(service),
  );
  const primaryPublicService =
    publicServices.find((service) => service.is_featured) ?? publicServices[0] ?? null;
  const fallbackBookingService =
    services.find((service) => isFallbackManualService(service)) ?? null;
  const bookingPreview = servicesBlocked
    ? null
    : primaryPublicService
      ? {
          serviceId: primaryPublicService.id,
          bookPath: `/book/${primaryPublicService.slug}`,
          durationMinutes: primaryPublicService.duration_minutes,
          serviceName: primaryPublicService.name,
        }
      : stats.hasAnyAvailability
        ? {
            serviceId: null,
            bookPath: "/book",
            durationMinutes:
              stats.unscopedDurationMinutes ??
              fallbackBookingService?.duration_minutes ??
              60,
            serviceName: undefined,
          }
        : null;
  const bookHref = bookingPreview ? "#booking" : `/${username}`;
  const heroOpenSlotsThisWeek =
    stats.openSlotsThisWeek > 0
      ? stats.openSlotsThisWeek
      : stats.hasAnyAvailability
        ? undefined
        : 0;

  // Build slug → image URL map for all services
  const serviceImages: Record<string, string | null> = {};
  for (const s of publicServices) {
    serviceImages[s.slug] = getServiceImageUrl(s.slug);
  }

  // Extract a pull-quote from the bio (first sentence or first 120 chars)
  let pullQuote: string | null = null;
  if (!bioBlocked && diviner.bio) {
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
        description: heroBlocked ? undefined : diviner.tagline ?? (!bioBlocked ? diviner.bio : undefined) ?? undefined,
        url: `${APP_URL}/${username}`,
        ...(!heroBlocked && { image: getDivinerAvatarUrl(diviner.avatar_url) }),
        priceRange:
          publicServices.length > 0
            ? `$${Math.min(...publicServices.map((s) => Number(s.base_price)))} - $${Math.max(...publicServices.map((s) => Number(s.base_price)))}`
            : undefined,
      },
      ...publicServices.map((service) => ({
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
        hasBio={!bioBlocked && !!diviner.bio}
        hasServices={publicServices.length > 0}
        hasTestimonials={!testimonialsBlocked && testimonials.length > 0}
        bookHref={bookHref}
      />

      <section className="border-b border-white/[0.06] bg-cosmos-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <Link
              href={`/${username}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "home"
                  ? "bg-gold text-cosmos-900"
                  : "text-silver/70 hover:text-cream"
              }`}
            >
              Home
            </Link>
            {!bioBlocked && (
              <Link
                href={`/${username}?tab=bio`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "bio"
                    ? "bg-gold text-cosmos-900"
                    : "text-silver/70 hover:text-cream"
                }`}
              >
                Bio
              </Link>
            )}
          </div>

          <Link
            href="/login?redirect=/portal"
            className="text-sm font-medium text-gold transition-colors hover:text-gold-light"
          >
            Access your personal divination back office
          </Link>
        </div>
      </section>

      {/* ===== 1. HERO ===== */}
      <DivinerHero
        username={username}
        displayName={diviner.display_name}
        tagline={heroBlocked ? null : diviner.tagline}
        avatarUrl={heroBlocked ? null : getDivinerAvatarUrl(diviner.avatar_url)}
        coverImageUrl={heroBlocked ? null : getDivinerCoverImageUrl(diviner.cover_image_url)}
        specialties={heroBlocked ? [] : diviner.specialties ?? []}
        youtubeChannelId={heroBlocked ? null : diviner.youtube_channel_id ?? null}
        facebookLiveUrl={heroBlocked ? null : diviner.facebook_live_url ?? null}
        completedSessions={stats.completedSessions}
        averageRating={stats.averageRating}
        reviewCount={stats.reviewCount}
        openSlotsThisWeek={heroOpenSlotsThisWeek}
        hasServices={publicServices.length > 0}
        bookHref={bookHref}
        isVerified={!!(diviner as Record<string, unknown>).verified || !!(diviner as Record<string, unknown>).badge_verified}
        isCertified={!!(diviner as Record<string, unknown>).is_certified}
      />

      {activeTab === "home" ? (
        <>
          {!liveBlocked && (
            <LiveStreamSection
              isLive={(diviner as Record<string, unknown>).is_live === true}
              livePlatforms={((diviner as Record<string, unknown>).live_platforms as string[]) ?? []}
              platformConfigs={livePlatformConfigs}
              fallbackContent={((diviner as Record<string, unknown>).fallback_content as string) ?? null}
              nextLiveAt={((diviner as Record<string, unknown>).next_live_at as string) ?? null}
              divinerId={diviner.id}
              divinerName={diviner.display_name}
              fallbackImageUrl={getDivinerCoverImageUrl(diviner.cover_image_url ?? getDivinerAvatarUrl(diviner.avatar_url))}
            />
          )}

          {!liveBlocked && (diviner as Record<string, unknown>).is_live === true && (
            <section className="py-6">
              <div className="mx-auto max-w-xl px-4">
                <CheckInForm
                  divinerUsername={diviner.username}
                  activeGiveawayId={activeGiveaway?.id ?? null}
                />
              </div>
            </section>
          )}

          {bookingPreview && (
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
                  serviceId={bookingPreview.serviceId}
                  bookPath={bookingPreview.bookPath}
                  durationMinutes={bookingPreview.durationMinutes}
                  serviceName={bookingPreview.serviceName}
                />
              </div>

              <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
            </section>
          )}

          {weeklySubscriptionProduct && !weeklySubscriptionBlocked && (
            <section className="py-10 md:py-14">
              <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    Subscription
                  </span>
                  <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
                    Weekly personalised updates from {diviner.display_name}
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-silver/75">
                    Subscribe for recurring transit guidance, curated spiritual context, and ongoing touchpoints branded to this diviner&apos;s practice.
                  </p>
                  <div className="grid gap-3 text-sm text-silver/70 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      Delivered automatically every week
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      Managed inside your subscription portal
                    </div>
                  </div>
                </div>

                <WeeklySubscriptionSignup
                  divinerUsername={diviner.username}
                  productTitle={weeklySubscriptionProduct.title}
                  description={weeklySubscriptionProduct.description}
                  priceCents={weeklySubscriptionProduct.price_cents}
                />
              </div>

              <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
            </section>
          )}

          {publicServices.length > 0 && (
            <section id="services" className="py-10 md:py-14">
              <div className="mx-auto max-w-6xl px-4">
                <h2 className="mb-2 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                  Services &amp; Offerings
                </h2>
                <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-silver/60">
                  Time-based readings for major cycles, non-time-based readings for deeper guidance, and a featured birth-chart path for first-time clients.
                </p>

                {birthChartService ? (
                  <div className="mb-8 rounded-3xl border border-gold/25 bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(8,10,18,0.7))] p-6 md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-2xl">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">
                          Featured Nativity Offering
                        </p>
                        <h3 className="font-display text-2xl font-semibold text-cream md:text-3xl">
                          {birthChartService.name}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-silver/70">
                          {birthChartService.description ??
                            "The birth chart is the foundation of this practice and the best place for many clients to begin."}
                        </p>
                      </div>
                      <Link
                        href={`/${username}/book/${birthChartService.slug}`}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-cosmos-900 transition-colors hover:bg-gold-light"
                      >
                        Book {birthChartService.name}
                      </Link>
                    </div>
                  </div>
                ) : null}

                {timeBasedServices.length > 0 && (
                  <div className="mb-10">
                    <h3 className="mb-4 text-xl font-semibold text-cream">
                      Time-Based Products
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {timeBasedServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          username={username}
                          imageUrl={serviceImages[service.slug]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {evergreenServices.length > 0 && (
                  <div className="mb-10">
                    <h3 className="mb-4 text-xl font-semibold text-cream">
                      Non-Time-Based Products
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {evergreenServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          username={username}
                          imageUrl={serviceImages[service.slug]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!birthChartService && astroServices.length > 0 && tarotServices.length > 0 && (
                  <ServiceTabs
                    astroServices={astroServices}
                    tarotServices={tarotServices}
                    username={username}
                    serviceImages={serviceImages}
                  />
                )}
              </div>

              <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
            </section>
          )}

          <PublicContentTabs
            media={
              !mediaBlocked && filteredMediaItems.length > 0 ? (
                <div>
                  <h2 className="mb-2 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                    My Media
                  </h2>
                  <p className="mx-auto mb-8 max-w-md text-center text-sm text-silver/60">
                    Past lives, clips, articles, and linked content from {diviner.display_name}
                  </p>
                  <MediaGallery items={filteredMediaItems} divinerId={diviner.id} />
                </div>
              ) : (
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-10 text-center">
                  <h2 className="font-display text-2xl font-semibold text-cream">
                    My Media
                  </h2>
                  <p className="mt-3 text-sm text-silver/60">
                    {mediaBlocked
                      ? "This media section is currently unavailable."
                      : `Media highlights will appear here as soon as ${diviner.display_name} adds past lives, videos, or articles.`}
                  </p>
                </div>
              )
            }
            testimonials={
              testimonialsBlocked ? (
                <section id="testimonials" className="py-10 md:py-14">
                  <div className="mx-auto max-w-6xl px-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-10 text-center">
                      <h2 className="font-display text-2xl font-semibold text-cream">
                        Testimonials
                      </h2>
                      <p className="mt-3 text-sm text-silver/60">
                        Testimonials are currently unavailable on this profile.
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <TestimonialsSection
                  divinerId={diviner.id}
                  divinerUsername={username}
                  divinerName={diviner.display_name}
                />
              )
            }
          />

          <section className="py-10 md:py-14">
            <div className="mx-auto max-w-3xl px-4">
              <div className="glass-card rounded-2xl border border-white/10 p-8 text-center md:p-10">
                <h2 className="font-display text-2xl font-semibold text-cream md:text-3xl">
                  Already a client?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-silver/65">
                  Access your personal divination back office to review past purchased readings, bookings, deliverables, and session history.
                </p>
                <div className="mt-6">
                  <Link
                    href="/login?redirect=/portal"
                    className="inline-flex h-11 items-center rounded-full border border-gold/40 px-6 text-sm font-semibold text-gold transition-colors hover:border-gold/70 hover:bg-gold/5"
                  >
                    Open Client Login
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section id="about" className="py-10 md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
              About {diviner.display_name}
            </h2>

            <div className="grid items-start gap-12 md:grid-cols-5">
              <div className="md:col-span-3">
                {pullQuote && (
                  <blockquote className="mb-8 border-l-2 border-gold/30 pl-6 font-display text-lg italic leading-relaxed text-cream/80 md:text-xl">
                    {pullQuote}
                  </blockquote>
                )}

                <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-silver/70">
                  {bioBlocked
                    ? "This bio is currently unavailable."
                    : diviner.bio ?? `${diviner.display_name} is building their public bio.`}
                </div>
              </div>

              <div className="space-y-6 md:col-span-2">
                {!heroBlocked && (diviner.specialties ?? []).length > 0 && (
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-silver/50">
                      Specialties
                    </h3>
                    <ul className="space-y-2">
                      {(diviner.specialties as string[]).map((spec: string) => (
                        <li
                          key={spec}
                          className="flex items-center gap-2 text-sm text-cream/80"
                        >
                          <span className="size-1 rounded-full bg-gold/50" />
                          {spec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="glass-card rounded-xl p-5">
                  <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-silver/50">
                    Client Access
                  </h3>
                  <p className="text-sm leading-relaxed text-silver/70">
                    Returning clients can log in to review prior orders, deliverables, and booked sessions.
                  </p>
                  <Link
                    href="/login?redirect=/portal"
                    className="mt-4 inline-flex text-sm font-medium text-gold hover:text-gold-light"
                  >
                    Access your personal divination back office
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
        </section>
      )}

      {activeTab === "home" && (
        <>
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

          {policies.length > 0 && (
            <section className="py-10 md:py-14">
              <div className="mx-auto max-w-4xl px-4">
                <div className="mb-6 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-silver/40" />
                  <h2 className="font-display text-xl font-semibold text-cream/80">
                    Booking &amp; Refund Policies
                  </h2>
                </div>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.type} className="glass-card rounded-xl p-5">
                      <h3 className="mb-2 text-sm font-semibold text-cream/90">
                        {policy.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-silver/60">
                        {policy.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
            </section>
          )}

          <section className="relative py-10 md:py-14">
            <div className="mx-auto max-w-xl px-4 text-center">
              <h2 className="mb-2 font-display text-2xl font-semibold text-cream">
                Stay Connected with {diviner.display_name}
              </h2>
              <p className="mb-1 text-sm text-silver/60">
                Get cosmic insights, updates, and exclusive offers delivered to your inbox.
              </p>
              <BlogSubscribeForm divinerUsername={username} />
            </div>
          </section>

          <section className="relative overflow-hidden py-12 md:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
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
                href={bookHref}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
              >
                Book a Reading
              </Link>
            </div>
          </section>
        </>
      )}

      <PageTracker divinerId={diviner.id} path={`/${username}`} username={diviner.username} />
    </>
  );
}
