import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  Clock,
  Star,
  Video,
  CalendarCheck,
  MessageSquare,
  Play,
  ArrowRight,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { getServiceImageUrl } from "@/lib/service-images";
import { APP_URL } from "@/lib/constants";
import { getDivinerAvatarUrl, getDivinerCoverImageUrl } from "@/lib/diviner-images";
import { PageTracker } from "@/components/landing/page-tracker";
import { RefLinkPreserver } from "./ref-link-preserver";
import { filterVisiblePublicServices, getServiceCategoryLabel } from "@/lib/public-services";
import { buildServiceDetailSchemaGraph } from "@/lib/seo/schema-builders";
import { applyRuntimePricesToServices } from "@/lib/runtime-service-pricing";
import { canPubliclySellService } from "@/lib/payout-readiness";
import { getDivinerBlocks } from "@/lib/diviner-service-blocks";
import { PreviewBanner } from "@/components/landing/preview-banner";
import { BlockSlotRenderer } from "@/components/landing/block-renderer";
import type { BlocksBySlot } from "@/types/landing-page-builder";

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ ref?: string; preview?: string }>;
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getDiviner(username: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("diviners")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();
  return data;
}

async function getService(
  divinerId: string,
  slug: string,
  opts: { allowUnpublished?: boolean } = {},
) {
  const supabase = createAdminClient();
  // In owner preview mode we need to see the service even if the diviner
  // toggled `is_active` off or never finished activating it — the builder
  // lets them edit and preview without the service being publicly live.
  let query = supabase
    .from("services")
    .select("*, template_id")
    .eq("diviner_id", divinerId)
    .eq("slug", slug);
  if (!opts.allowUnpublished) {
    query = query.eq("is_active", true);
  }
  const { data } = await query.maybeSingle();
  if (!data) return null;
  if (!opts.allowUnpublished && filterVisiblePublicServices([data]).length === 0) {
    return null;
  }

  // Task 05: enforce template access control — 404 if not enabled+published
  // In owner preview mode, `is_published` is bypassed so drafts can render.
  if (data.template_id) {
    const { data: ds } = await supabase
      .from("diviner_services")
      .select("is_enabled, is_published")
      .eq("diviner_id", divinerId)
      .eq("template_id", data.template_id)
      .maybeSingle();
    // Missing mapping or not enabled → treat as not found (don't reveal existence)
    if (!ds || !ds.is_enabled) {
      return null;
    }
    if (!opts.allowUnpublished && !ds.is_published) {
      return null;
    }
  }

  const [service] = await applyRuntimePricesToServices(supabase, [data]);
  return service ?? null;
}

async function isOwningDiviner(divinerId: string): Promise<boolean> {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;
  const { data } = await createAdminClient()
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", divinerId)
    .maybeSingle();
  return !!data;
}

async function getTestimonials(divinerId: string, limit = 3) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id, client_name, rating, text, service_type, featured")
    .eq("diviner_id", divinerId)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function getBookingCount(divinerId: string, serviceId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .eq("service_id", serviceId)
    .in("status", ["completed", "confirmed", "in_progress"]);
  return count ?? 0;
}

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const diviner = await getDiviner(username);
  if (!diviner) return { title: "Not Found" };

  const service = await getService(diviner.id, slug);
  if (!service) return { title: "Not Found" };

  const title = `${service.name} with ${diviner.display_name} | AstrologyPro`;
  const description =
    service.description ??
    `Book a ${service.name} session with ${diviner.display_name}. ${service.duration_minutes}-minute ${service.category} reading.`;

  const ogImage = getDivinerCoverImageUrl(diviner.cover_image_url || diviner.avatar_url);

  const canonical = `${APP_URL}/${username}/services/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630 }],
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

/* ------------------------------------------------------------------ */
/*  Inline sub-components                                              */
/* ------------------------------------------------------------------ */

function GoldStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "size-3" : "size-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sz} ${
            i < rating ? "fill-gold text-gold" : "fill-white/10 text-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const label = getServiceCategoryLabel(category);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/5 px-3 py-0.5 text-xs font-medium capitalize text-gold/90">
      <Sparkles className="size-3" />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function ServiceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { username, slug } = await params;
  const { ref, preview } = await searchParams;

  const diviner = await getDiviner(username);
  if (!diviner) notFound();

  // Preview mode: verify ownership first so we can bypass the `is_published`
  // check when the logged-in diviner wants to see their own draft.
  const wantsPreview = preview === "true";
  const isOwner = wantsPreview ? await isOwningDiviner(diviner.id) : false;

  const service = await getService(diviner.id, slug, { allowUnpublished: isOwner });
  if (!service) notFound();

  // ── Fetch diviner-authored blocks for the two fixed slots.
  //        The legacy hardcoded template ALWAYS renders. Blocks are
  //        optional overlays in `about_diviner` and `extra`. No
  //        builder-replaces-page branch exists any more.
  const inPreview = wantsPreview && isOwner;
  const emptyBlocks: BlocksBySlot = { about_diviner: [], extra: [] };
  const blocks: BlocksBySlot = service.template_id
    ? await getDivinerBlocks(createAdminClient(), diviner.id, service.template_id)
    : emptyBlocks;

  const [testimonials, bookingCount] = await Promise.all([
    getTestimonials(diviner.id, 3),
    getBookingCount(diviner.id, service.id),
  ]);

  const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const bookUrl = `/${username}/book/${service.slug}${refParam}`;
  const profileUrl = `/${username}${refParam}`;
  const serviceImageUrl = getServiceImageUrl(service.slug);
  const requiresBirthData = service.category === "astrology" || !!(service as Record<string, unknown>).requires_birth_data;
  const bookingEnabled = canPubliclySellService(service, diviner);

  const divinerAvatarUrl = getDivinerAvatarUrl(diviner.avatar_url);
  const locationLine = diviner.seo_is_remote_global
    ? "Available for remote readings worldwide"
    : diviner.seo_city && diviner.seo_country
      ? `Based in ${diviner.seo_city}, ${diviner.seo_country}`
      : diviner.seo_region && diviner.seo_country
        ? `Serving ${diviner.seo_region}, ${diviner.seo_country}`
        : "Delivered online through AstrologyPro";
  const serviceForBullets =
    service.category === "astrology"
      ? [
          "Clients who want clarity around timing, patterns, and big life transitions",
          "People preparing for a major decision, relationship shift, or career pivot",
          "Returning astrology clients who want a guided chart walkthrough instead of a generic report",
        ]
      : service.category === "tarot"
        ? [
            "Clients who need direct guidance on a specific question or crossroads",
            "People looking for intuitive reflection with clear next-step advice",
            "Returning clients who want a focused reading rather than a general session",
          ]
        : [
            "Clients who want tailored spiritual guidance in a live session",
            "People who value direct interpretation over self-serve content",
            "Anyone wanting a guided conversation with clear next steps",
          ];
  const proofBullets = [
    locationLine,
    bookingCount > 0
      ? `${bookingCount} booked session${bookingCount === 1 ? "" : "s"} for this service`
      : null,
    Array.isArray(diviner.seo_languages) && diviner.seo_languages.length > 0
      ? `Sessions available in ${diviner.seo_languages.slice(0, 3).join(", ")}`
      : null,
    diviner.seo_years_experience
      ? `${diviner.seo_years_experience}+ years of experience`
      : null,
  ].filter(Boolean) as string[];

  // Category-specific included bullets
  const includedBullets =
    service.category === "astrology"
      ? [
          "Professional natal/transit/synastry chart analysis",
          "Screen-shared chart walkthrough",
          "Session recording for revisiting insights",
        ]
      : service.category === "tarot"
        ? [
            "Professional card spread and interpretation",
            "Visual card layout shared on screen",
            "Session recording for reflection",
          ]
        : [
            "Personalized session tailored to your needs",
            "Screen-shared visuals during the reading",
            "Session recording included",
          ];

  // FAQ content
  const faqs = [
    {
      q: "What happens during the session?",
      a:
        service.category === "astrology"
          ? `Your ${service.duration_minutes}-minute session takes place over HD video. ${diviner.display_name} will share their screen to walk you through your chart, explain key placements and transits, and answer your questions. The entire session is recorded so you can revisit the insights later.`
          : service.category === "tarot"
            ? `Your ${service.duration_minutes}-minute session takes place over HD video. ${diviner.display_name} will draw cards specific to your question, share the card layout on screen, and explain each card's message in depth. The session is recorded for your reflection.`
            : `Your ${service.duration_minutes}-minute session takes place over HD video with ${diviner.display_name}. The session is recorded so you can revisit the guidance later.`,
    },
    {
      q: "Do I need to prepare anything?",
      a: requiresBirthData
        ? "Yes, please have your exact birth date, time, and location ready. The more accurate your birth data, the more precise and insightful your reading will be. You can also prepare any specific questions or areas of life you want to focus on."
        : "Just come with an open mind and any specific questions or topics you want to explore. Having a quiet, comfortable space for the video call will help you get the most from your session.",
    },
    {
      q: `How long is the session?`,
      a: `Your session is ${service.duration_minutes} minutes. If you and ${diviner.display_name} decide to extend the session, additional time is billed at ${formatCurrency(Number(service.overage_rate ?? 0))}/minute. You are never charged for overage without your consent.`,
    },
    {
      q: "Can I reschedule?",
      a: `Yes, you can reschedule your session up to 24 hours before the scheduled time at no charge. Simply visit your booking confirmation page and choose a new time from ${diviner.display_name}'s available slots.`,
    },
  ];

  // Schema.org structured data — rich entity graph with breadcrumbs
  const structuredData = buildServiceDetailSchemaGraph(
    diviner,
    service,
    [
      { name: "Home", url: `${APP_URL}` },
      { name: diviner.display_name, url: `${APP_URL}/${username}` },
      { name: "Services", url: `${APP_URL}/${username}/services` },
      { name: service.name, url: `${APP_URL}/${username}/services/${service.slug}` },
    ],
  );

  const builderUrl = service.template_id
    ? `/dashboard/landing-pages/${service.template_id}/builder`
    : "/dashboard/landing-pages";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {inPreview && service.template_id ? (
        <PreviewBanner templateId={service.template_id} builderUrl={builderUrl} />
      ) : null}

      {/* ===== STICKY TOP NAV ===== */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-cosmos-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={profileUrl}
              className="font-display font-semibold text-cream transition-colors hover:text-gold"
            >
              {diviner.display_name}
            </Link>
            <ChevronRight className="size-3 text-silver/40" />
            <Link
              href={`/${username}/services${refParam}`}
              className="text-silver/60 transition-colors hover:text-gold"
            >
              Services
            </Link>
            <ChevronRight className="size-3 text-silver/40" />
            <span className="text-silver/40 truncate max-w-[140px]">{service.name}</span>
          </div>
          {bookingEnabled ? (
            <Link
              href={bookUrl}
              className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-cosmos-900 transition-colors hover:bg-gold-light"
            >
              Book Now
            </Link>
          ) : (
            <span className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-silver/45">
              Booking unavailable
            </span>
          )}
        </div>
      </nav>

      {/* ===== 1. HERO SECTION ===== */}
      <section className="relative overflow-hidden border-b border-white/5 bg-cosmos-900">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            {/* Left: text content */}
            <div>
              <CategoryBadge category={service.category} />

              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-cream md:text-5xl lg:text-6xl">
                {service.name}
              </h1>

              {service.description && (
                <p className="mt-4 text-base leading-relaxed text-silver/70 md:text-lg">
                  {service.description}
                </p>
              )}

              {!bookingEnabled && (
                <div className="mt-5 max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100/85">
                  This paid service is temporarily unavailable while payment setup is being completed.
                </div>
              )}

              {/* Diviner attribution */}
              <Link
                href={profileUrl}
                className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 transition-colors hover:border-gold/20 hover:bg-gold/5"
              >
                <div className="relative size-9 overflow-hidden rounded-full border border-gold/20">
                  <Image
                    src={divinerAvatarUrl}
                    alt={diviner.display_name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
                <span className="text-sm text-cream/80">
                  with <span className="font-semibold text-cream">{diviner.display_name}</span>
                </span>
                <ChevronRight className="size-3.5 text-silver/40" />
              </Link>

              {/* Price + duration */}
              <div className="mt-8 flex flex-wrap items-end gap-4">
                <span className="font-display text-4xl font-bold text-gold md:text-5xl">
                  {formatCurrency(Number(service.base_price))}
                </span>
                <div className="mb-1 space-y-0.5">
                  <span className="flex items-center gap-1.5 text-sm text-silver/70">
                    <Clock className="size-3.5" />
                    {service.duration_minutes} min session
                  </span>
                  {service.overage_rate && Number(service.overage_rate) > 0 && (
                    <span className="text-xs text-silver/50">
                      {formatCurrency(Number(service.overage_rate))}/min after
                    </span>
                  )}
                </div>
              </div>

              {/* Booking count social proof */}
              {bookingCount > 0 && (
                <p className="mt-3 text-xs text-silver/50">
                  {bookingCount} session{bookingCount !== 1 ? "s" : ""} booked
                </p>
              )}

              {/* Primary CTA */}
              <div className="mt-8">
                {bookingEnabled ? (
                  <Link
                    href={bookUrl}
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
                  >
                    Book This Reading
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-12 items-center rounded-lg border border-white/10 px-8 text-sm font-semibold text-silver/45">
                    Booking temporarily unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Right: service image or decorative element */}
            <div className="relative hidden md:block">
              {serviceImageUrl ? (
                <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl">
                  <Image
                    src={serviceImageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cosmos-900/60 to-transparent" />
                </div>
              ) : (
                <div className="relative mx-auto flex aspect-square max-w-sm items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
                  <Sparkles className="size-20 text-gold/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. WHAT'S INCLUDED ===== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            What&apos;s Included
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Duration card */}
            <div className="glass-card flex items-start gap-4 rounded-xl p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <Clock className="size-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-cream">{service.duration_minutes} Minutes</p>
                <p className="mt-1 text-sm text-silver/60">
                  Full-length personal session
                </p>
              </div>
            </div>

            {/* HD Video card */}
            <div className="glass-card flex items-start gap-4 rounded-xl p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <Video className="size-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-cream">HD Video Session</p>
                <p className="mt-1 text-sm text-silver/60">
                  Face-to-face with recording included
                </p>
              </div>
            </div>

            {/* Session type card */}
            <div className="glass-card flex items-start gap-4 rounded-xl p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <Sparkles className="size-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-cream">
                  {service.category === "astrology" ? "Chart Analysis" : service.category === "tarot" ? "Card Reading" : "Personal Reading"}
                </p>
                <p className="mt-1 text-sm text-silver/60">
                  Professional interpretation & guidance
                </p>
              </div>
            </div>
          </div>

          {/* Category-specific bullets */}
          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-silver/50">
              Your Session Includes
            </h3>
            <ul className="space-y-3">
              {includedBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm text-cream/80"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold/60" />
                  {bullet}
                </li>
              ))}
            </ul>

            {requiresBirthData && (
              <div className="mt-5 rounded-lg border border-gold/15 bg-gold/5 px-4 py-3">
                <p className="text-xs text-gold/80">
                  <strong>Note:</strong> Please have your exact birth date, time, and location ready for the most accurate reading.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-gold/70">
              Who This Reading Is For
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cream">
              A clearer fit for the right client
            </h2>
            <div className="mt-5 space-y-3">
              {serviceForBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-white/8 bg-cosmos-950/40 px-4 py-3 text-sm text-cream/85"
                >
                  {bullet}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gold/15 bg-gold/[0.04] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-gold/70">
              Why Book Here
            </p>
            <div className="mt-5 space-y-3">
              {proofBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-gold/10 bg-cosmos-950/45 px-4 py-3 text-sm text-cream/85"
                >
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
      </section>

      {/* ===== 3. ABOUT YOUR DIVINER ===== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            About Your Diviner
          </h2>

          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-gold/20 sm:size-28">
                <Image
                  src={divinerAvatarUrl}
                  alt={diviner.display_name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-xl font-semibold text-cream">
                  {diviner.display_name}
                </h3>

                {diviner.tagline && (
                  <p className="mt-1 text-sm italic text-silver/60">
                    {diviner.tagline}
                  </p>
                )}

                {/* Bio excerpt */}
                {diviner.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-silver/70">
                    {diviner.bio.length > 300
                      ? `${diviner.bio.slice(0, 300)}...`
                      : diviner.bio}
                  </p>
                )}

                {/* Specialties */}
                {(diviner.specialties ?? []).length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {(diviner.specialties as string[]).map((spec: string) => (
                      <span
                        key={spec}
                        className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 text-[11px] font-medium text-gold/80"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={profileUrl}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
                >
                  View Full Profile
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ===== V2 SLOT: about_diviner — diviner-authored blocks ===== */}
          {blocks.about_diviner.length > 0 && (
            <div className="mt-8">
              <BlockSlotRenderer blocks={blocks.about_diviner} />
            </div>
          )}
        </div>

        <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
      </section>

      {/* ===== 4. HOW IT WORKS ===== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <CalendarCheck className="size-6 text-gold" />
              </div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                Step 1
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-cream">
                Choose Your Time
              </h3>
              <p className="text-sm leading-relaxed text-silver/60">
                Pick from available slots on {diviner.display_name}&apos;s calendar
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <MessageSquare className="size-6 text-gold" />
              </div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                Step 2
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-cream">
                Share Your Details
              </h3>
              <p className="text-sm leading-relaxed text-silver/60">
                Tell us what you&apos;d like to focus on
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                <Play className="size-6 text-gold" />
              </div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                Step 3
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-cream">
                Join Your Session
              </h3>
              <p className="text-sm leading-relaxed text-silver/60">
                HD video session with recording included
              </p>
            </div>
          </div>
        </div>

        <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
      </section>

      {/* ===== 5. TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
              Client Testimonials
            </h2>

            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="glass-card flex flex-col rounded-xl p-5"
                >
                  <GoldStars rating={t.rating} size="sm" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-silver/70">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <p className="text-sm font-medium text-cream/80">
                      {t.client_name}
                    </p>
                    {t.service_type && (
                      <p className="text-xs text-silver/50">{t.service_type}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href={`${profileUrl}#reviews`}
                className="inline-flex items-center gap-1.5 text-sm text-gold/70 transition-colors hover:text-gold"
              >
                See all reviews
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
        </section>
      )}

      {/* ===== 6. FAQ ===== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="glass-card rounded-xl p-5">
                <h3 className="mb-2 font-display text-base font-semibold text-cream">
                  {faq.q}
                </h3>
                <p className="text-sm leading-relaxed text-silver/60">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
      </section>

      {/* ===== V2 SLOT: extra — diviner-authored blocks between FAQ and Final CTA ===== */}
      {blocks.extra.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-4xl px-4">
            <BlockSlotRenderer blocks={blocks.extra} />
          </div>
          <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
        </section>
      )}

      {/* ===== 7. FINAL CTA ===== */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-semibold text-cream md:text-4xl">
            Ready to Book Your {service.name}?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-silver/60">
            {service.duration_minutes}-minute session with {diviner.display_name}
            {" "}&mdash; {formatCurrency(Number(service.base_price))}
          </p>
          {bookingEnabled ? (
            <Link
              href={bookUrl}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
            >
              Book This Reading
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex h-12 items-center rounded-lg border border-white/10 px-8 text-sm font-semibold text-silver/45">
              Booking temporarily unavailable
            </span>
          )}
        </div>
      </section>

      {/* ===== STICKY PRICING BAR (desktop: right sidebar; mobile: bottom bar) ===== */}
      <Suspense fallback={null}>
        <RefLinkPreserver bookUrl={bookingEnabled ? bookUrl : profileUrl}>
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-cosmos-900/95 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="mx-auto flex max-w-lg items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cream">{service.name}</p>
                <p className="text-xs text-silver/60">
                  {formatCurrency(Number(service.base_price))} &middot; {service.duration_minutes} min
                </p>
              </div>
              {bookingEnabled ? (
                <Link
                  href={bookUrl}
                  className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-cosmos-900 transition-colors hover:bg-gold-light"
                >
                  Book Now
                </Link>
              ) : (
                <span className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-silver/45">
                  Unavailable
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-silver/40">
              <Shield className="size-3" />
              30-day satisfaction guarantee
            </div>
          </div>
        </RefLinkPreserver>
      </Suspense>

      {/* Bottom padding on mobile for sticky bar */}
      <div className="h-24 md:hidden" />

      <PageTracker
        divinerId={diviner.id}
        path={`/${username}/services/${slug}`}
        username={diviner.username}
        serviceTemplateId={service.template_id ?? undefined}
        serviceSlug={service.slug}
      />
    </>
  );
}
