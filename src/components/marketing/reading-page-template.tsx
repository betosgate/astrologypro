import Link from "next/link";
import Image from "next/image";
import { Star, BadgeCheck, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { getReadingImageUrl } from "@/lib/service-images";
import { ReadingLeadCapture } from "@/components/marketing/reading-lead-capture";
import { ReadingLeadForm } from "@/components/marketing/reading-lead-form";
import { ReadingStickyBar } from "@/components/marketing/reading-sticky-bar";

export interface DivinerLandingCard {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  startingPrice: number | null;
  specialties?: string[] | null;
}

export interface ReadingPageTemplateProps {
  serviceType: "astrology" | "tarot";
  badge: string;
  heroTitleBefore: string;
  heroTitleGradient: string;
  heroSubtitle: string;
  heroStats: Array<{ value: string; label: string }>;
  startingPrice: number;
  whatIsTitle: string;
  whatIsParagraphs: [string, string, string];
  revealsItems: Array<{ label: string; desc: string }>;
  expectCards: Array<{ icon: string; title: string; desc: string }>;
  testimonials: Array<{ quote: string; name: string; location: string; service: string }>;
  diviners: DivinerLandingCard[];
  discoverLink: string;
  discoverLabel: string;
  divinerSectionTitle: string;
  divinerSectionSubtitle: string;
  emailGuideSubject: string;
  faqItems: Array<{ q: string; a: string }>;
  ctaTitle: string;
  ctaBody: string;
  ctaButtonLabel: string;
  pageUrl: string;
  serviceSlug?: string;
  heroImage?: string | null;
  relatedReadings?: Array<{ title: string; href: string; icon: string }>;
}

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    icon: "🔍",
    title: "Browse Certified Readers",
    desc: "Explore practitioner profiles, read their backgrounds and specialties, and find someone whose approach resonates with you.",
  },
  {
    number: "02",
    icon: "📅",
    title: "Book Your Session",
    desc: "Choose a time that works, complete a brief intake form, and confirm your booking instantly — no back-and-forth emails required.",
  },
  {
    number: "03",
    icon: "✨",
    title: "Receive Your Reading",
    desc: "Connect live via video or phone, or receive a detailed recorded reading delivered directly to your inbox.",
  },
];

function getReadingSlugFromHref(href: string): string {
  try {
    const pathname = href.startsWith("http") ? new URL(href).pathname : href.split("?")[0];
    return pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return href.split("?")[0].split("/").filter(Boolean).pop() ?? "";
  }
}

function getLocalImagePath(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/")) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return url.hostname === "astrologypro.com" ? url.pathname : null;
  } catch {
    return null;
  }
}

function DivinerCard({
  diviner,
  serviceSlug,
}: {
  diviner: DivinerLandingCard;
  serviceSlug: string;
}) {
  const avatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);
  const bookingHref = serviceSlug ? `/${diviner.username}/book/${serviceSlug}` : `/${diviner.username}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]">
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-[#c9a84c]/10 to-[#c97a4c]/10">
        {diviner.isCertified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0d1117]/80 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c] backdrop-blur-sm">
            <BadgeCheck className="size-3" aria-hidden="true" />
            DIB Certified
          </span>
        )}
      </div>
      <div className="relative -mt-7 flex flex-col px-5">
        <div className="flex items-end justify-between">
          <Image
            src={avatarUrl}
            alt={diviner.displayName}
            width={56}
            height={56}
            className="size-14 rounded-full border-2 border-[#0d1117] object-cover ring-1 ring-[#c9a84c]/20"
          />
        </div>
        <div className="mt-3">
          <h3 className="font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {diviner.displayName}
          </h3>
          {diviner.tagline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">{diviner.tagline}</p>
          )}
        </div>
        <div className="mt-3">
          {diviner.startingPrice !== null && (
            <span className="text-sm font-medium text-[#f5f0e8]">From ${diviner.startingPrice}</span>
          )}
        </div>
        {diviner.specialties && diviner.specialties.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {diviner.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-2 py-0.5 text-[10px] font-medium text-[#c9a84c]/80"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mb-5 mt-4">
          <Link
            href={bookingHref}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
          >
            Book This Reading <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ReadingPageTemplate(props: ReadingPageTemplateProps) {
  const {
    serviceType,
    badge,
    heroTitleBefore,
    heroTitleGradient,
    heroSubtitle,
    heroStats,
    startingPrice,
    whatIsTitle,
    whatIsParagraphs,
    revealsItems,
    expectCards,
    testimonials,
    diviners,
    discoverLink,
    discoverLabel,
    divinerSectionTitle,
    divinerSectionSubtitle,
    emailGuideSubject,
    faqItems,
    ctaTitle,
    ctaBody,
    ctaButtonLabel,
    relatedReadings = [],
    pageUrl,
    serviceSlug: explicitServiceSlug,
    heroImage,
  } = props;

  const readerLabel = serviceType === "tarot" ? "Tarot Reader" : "Reader";
  const serviceLabel = heroTitleBefore.trim().replace(/:$/, "");
  const readingSlug = explicitServiceSlug ?? getReadingSlugFromHref(pageUrl);
  const serviceImage = getReadingImageUrl(readingSlug) ?? getLocalImagePath(heroImage);
  const primaryCtaHref = diviners.length > 0 ? "#diviners" : discoverLink;
  const primaryCtaLabel = diviners.length > 0 ? `Find a ${readerLabel}` : discoverLabel;
  const sessionLabel = serviceType === "tarot" ? "tarot readers" : "readers";
  const sessionType = serviceType === "astrology" ? "personalized astrological" : "tarot";

  // Build initials from name
  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Fixed radial background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(201,120,28,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MarketingHeader />

        <main className="flex-1">
          {/* JSON-LD: BreadcrumbList */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://astrologypro.com" },
                  { "@type": "ListItem", position: 2, name: "Readings", item: "https://astrologypro.com/readings" },
                  { "@type": "ListItem", position: 3, name: serviceLabel, item: pageUrl },
                ],
              }),
            }}
          />

          {/* JSON-LD: Service + AggregateRating */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                name: `${serviceLabel} Reading`,
                description: heroSubtitle,
                url: pageUrl,
                serviceType: serviceType === "astrology" ? "Astrology Reading" : "Tarot Reading",
                areaServed: "Worldwide",
                provider: {
                  "@type": "Organization",
                  name: "AstrologyPro",
                  url: "https://astrologypro.com",
                },
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: String(startingPrice),
                  url: pageUrl,
                  availability: "https://schema.org/InStock",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  bestRating: "5",
                  worstRating: "1",
                  ratingCount: "12000",
                },
              }),
            }}
          />

          {/* SECTION A — Hero */}
          <section className="relative overflow-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.07)_0%,transparent_60%)]" />
            <div className="relative mx-auto max-w-6xl px-4">
              <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
                {/* Left: text content */}
                <div className="text-center md:text-left">
                  {/* Badge pill */}
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                    <span className="inline-block size-1.5 rounded-full bg-[#c9a84c]" />
                    {badge}
                  </div>

                  {/* H1 */}
                  <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl lg:text-6xl">
                    {heroTitleBefore}{" "}
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #f8d275 0%, #c9a84c 50%, #a07838 100%)",
                      }}
                    >
                      {heroTitleGradient}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75 md:mx-0">
                    {heroSubtitle}
                  </p>

                  {/* Stats row */}
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-10 md:justify-start">
                    {heroStats.map((stat, i) => (
                      <div key={stat.label} className="flex items-center gap-10">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-[#c9a84c]">{stat.value}</p>
                          <p className="mt-1 text-sm text-[#b8bcd0]/50">{stat.label}</p>
                        </div>
                        {i < heroStats.length - 1 && (
                          <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                        )}
                      </div>
                    ))}
                    {heroStats.length > 0 && (
                      <div className="h-10 w-px bg-white/10" aria-hidden="true" />
                    )}
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#c9a84c]">${startingPrice}</p>
                      <p className="mt-1 text-sm text-[#b8bcd0]/50">Starting Price</p>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                    <a
                      href={primaryCtaHref}
                      className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]"
                    >
                      {primaryCtaLabel}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                    <a
                      href="#free-guide"
                      className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#c9a84c]/25 px-6 text-sm font-semibold text-[#e2c97e] transition-colors hover:border-[#c9a84c]/45 hover:bg-[#c9a84c]/10"
                    >
                      Get the Guide
                    </a>
                  </div>

                  {/* Hero inline lead capture */}
                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" aria-hidden="true" />
                      <span className="text-xs uppercase tracking-widest text-[#b8bcd0]/35">
                        or get a free reading guide
                      </span>
                      <div className="h-px flex-1 bg-white/10" aria-hidden="true" />
                    </div>
                    <div className="mx-auto max-w-sm md:mx-0">
                      <ReadingLeadCapture subject={emailGuideSubject} />
                    </div>
                  </div>
                </div>

                {/* Right: service image card — desktop only */}
                {serviceImage && (
                  <div className="hidden md:block">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[#c9a84c]/20 blur-2xl" />
                      <Image
                        src={serviceImage}
                        alt=""
                        aria-hidden="true"
                        width={320}
                        height={420}
                        priority
                        sizes="16rem"
                        className="relative h-[420px] w-64 rounded-2xl border border-[#c9a84c]/20 object-cover shadow-[0_0_60px_rgba(201,168,76,0.15)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION B — Trust Bar */}
          <section className="border-y border-white/[0.06] bg-white/[0.015] px-4 py-4">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 md:gap-10">
              <span className="flex items-center gap-2 text-sm text-[#b8bcd0]/60">
                ⭐ 4.9★ average rating
              </span>
              <span className="hidden text-white/20 md:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-[#b8bcd0]/60">
                📅 12,000+ sessions completed
              </span>
              <span className="hidden text-white/20 md:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-[#b8bcd0]/60">
                🏆 50+ certified readers
              </span>
              <span className="hidden text-white/20 md:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-[#b8bcd0]/60">
                🔒 Secure instant booking
              </span>
            </div>
          </section>

          {/* Divider — between Trust Bar and What Is */}
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
          </div>

          {/* SECTION B.5 — Service Visual CTA */}
          <section className="px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-[#c9a84c]/10 bg-[#0d1117]/70">
                {serviceImage ? (
                  <Image
                    src={serviceImage}
                    alt={`${serviceLabel} reading visual`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 38vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(201,168,76,0.18)_0%,transparent_65%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-[#06080f]/35 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/80">
                    {serviceType === "tarot" ? "Spread Focus" : "Chart Focus"}
                  </p>
                  <p className="mt-1 max-w-sm text-xl font-bold text-[#f5f0e8]">
                    {serviceLabel} Reading
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
                  Start with the right context
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                  Book this service with a reader who works in this exact style.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#b8bcd0]/65">
                  Review what the session covers, send your question or birth details, then choose a practitioner without losing the reading context.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {revealsItems.slice(0, 3).map((item) => (
                    <div key={item.label} className="border-l border-[#c9a84c]/25 pl-4">
                      <p className="text-sm font-semibold text-[#f5f0e8]">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#b8bcd0]/50">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={primaryCtaHref}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#c9a84c] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
                  >
                    {diviners.length > 0 ? "Choose a Reader" : discoverLabel}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#free-guide"
                    className="inline-flex h-11 items-center rounded-lg border border-white/[0.08] px-5 text-sm font-semibold text-[#f5f0e8] transition-colors hover:border-[#c9a84c]/25 hover:bg-white/[0.04]"
                  >
                    Send My Context First
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION C — What Is */}
          <section id="what-is" className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 md:grid-cols-2">
                {/* Left col */}
                <div>
                  <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">{whatIsTitle}</h2>
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#b8bcd0]/70">
                    {whatIsParagraphs.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* Right col */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">
                    <span aria-hidden="true">✨</span>
                    What {serviceType === "astrology" ? "This Reading" : "a Reading"} Reveals
                  </h3>
                  <div className="space-y-3">
                    {revealsItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <span className="mt-0.5 shrink-0 text-xs font-bold text-[#c9a84c]">✓</span>
                        <div>
                          <p className="text-sm font-semibold text-[#f5f0e8]">{item.label}</p>
                          <p className="mt-0.5 text-xs text-[#b8bcd0]/50">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION D — How It Works */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                How It Works
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                Three simple steps to your reading
              </p>
              <div className="grid gap-8 sm:grid-cols-3">
                {HOW_IT_WORKS_STEPS.map((step, idx) => (
                  <div
                    key={step.number}
                    className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/20"
                  >
                    {/* Decorative bg number */}
                    <span className="absolute right-4 top-4 text-5xl font-black leading-none text-white/[0.04]">
                      {step.number}
                    </span>
                    <span className="text-3xl" aria-hidden="true">{step.icon}</span>
                    <h3 className="mb-2 mt-4 text-base font-semibold text-[#f5f0e8]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[#b8bcd0]/60">{step.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/70">
                      <span className="size-1 rounded-full bg-[#c9a84c]/70" />
                      Step {step.number}
                    </div>
                    {/* Connector arrow — desktop only, not on last card */}
                    {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                      <div
                        className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 sm:block"
                        aria-hidden="true"
                      >
                        <ArrowRight className="size-5 text-[#c9a84c]/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION D.5 — Qualified Lead Form (mid-page, after education) */}
          <section id="free-guide" className="scroll-mt-20 px-4 pb-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/20 bg-[#0d1117]/80 p-8 sm:p-10">
                <div className="pointer-events-none absolute -left-10 -top-10 size-52 rounded-full bg-[#c9a84c]/6 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 size-52 rounded-full bg-[#c9a84c]/6 blur-3xl" />
                <div className="relative">
                  {/* Header */}
                  <div className="mb-6 text-center">
                    <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10">
                      <span className="text-xl" aria-hidden="true">
                        {serviceType === "astrology" ? "🔮" : "🃏"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#f5f0e8]">
                      Get a Free{" "}
                      {serviceType === "astrology" ? "Astrology" : "Tarot"} Reading Guide
                      <span className="ml-2 inline-block rounded-full bg-[#c9a84c]/15 px-2 py-0.5 text-xs font-semibold text-[#c9a84c]">
                        Free
                      </span>
                    </h2>
                    <p className="mt-2 text-sm text-[#b8bcd0]/55">
                      {serviceType === "astrology"
                        ? "Share your birth details and we'll send a personalised guide for your " + serviceLabel + " reading."
                        : "Tell us your question and we'll match you with the right tarot reader for " + serviceLabel + "."}
                    </p>
                  </div>

                  <ReadingLeadForm
                    serviceType={serviceType}
                    serviceName={serviceLabel}
                    serviceSlug={readingSlug}
                    sourceUrl={pageUrl}
                    diviners={diviners}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION E — What to Expect */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                What to Expect
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                A {sessionType} session tailored to your question
              </p>
              <div className="grid gap-6 sm:grid-cols-3">
                {expectCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/20 hover:bg-white/[0.04]"
                  >
                    <span className="text-3xl" aria-hidden="true">{card.icon}</span>
                    <h3 className="mt-4 text-base font-semibold text-[#f5f0e8]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/60">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider — between What to Expect and Mid-page CTA */}
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
          </div>

          {/* SECTION F — Mid-page CTA Banner (only shown when readers are available) */}
          {diviners.length > 0 && (
            <section className="px-4 pb-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-6 py-5 sm:flex-row">
                  <p className="text-sm text-[#b8bcd0]/70">
                    <span className="font-semibold text-[#f5f0e8]">Ready to book?</span>
                    {" "}Browse available {sessionLabel} and find your match.
                  </p>
                  <a
                    href="#diviners"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
                  >
                    Find a Reader <ArrowRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* SECTION G — Client Testimonials */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                What Clients Say
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                Real experiences from real clients
              </p>
              <div className="grid gap-6 sm:grid-cols-3">
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:border-[#c9a84c]/10"
                  >
                    {/* Decorative quote mark */}
                    <div className="mb-2 select-none font-serif text-5xl leading-none text-[#c9a84c]/10" aria-hidden="true">
                      &ldquo;
                    </div>
                    {/* Stars */}
                    <div className="mb-4 flex gap-0.5" aria-label="5 stars">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="size-3.5 fill-[#c9a84c] text-[#c9a84c]"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    {/* Quote */}
                    <p className="mb-5 text-sm italic leading-relaxed text-[#b8bcd0]/70">
                      {t.quote}
                    </p>
                    {/* Author */}
                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/20 text-xs font-bold text-[#c9a84c]">
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#f5f0e8]">{t.name}</p>
                        <p className="text-xs text-[#b8bcd0]/50">
                          {t.location} · {t.service}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Divider — between Testimonials and Guarantee */}
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
          </div>

          {/* SECTION G.5 — Guarantee / Risk Reversal */}
          <section className="px-4 pb-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-base">🛡️</span>
                  <div>
                    <p className="text-sm font-semibold text-[#f5f0e8]">Satisfaction Guaranteed</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#b8bcd0]/55">
                      Not happy with your reading?{" "}
                      <Link href="/refund-policy" className="text-[#c9a84c]/80 underline-offset-2 hover:underline">
                        We make it right.
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-base">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-[#f5f0e8]">Vetted & Certified Readers</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#b8bcd0]/55">
                      Every practitioner is reviewed before listing. DIB Certified readers meet our highest standards.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-base">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-[#f5f0e8]">Secure Booking</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#b8bcd0]/55">
                      Payments are processed securely via Stripe. Your details are never shared with the reader.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION H — Diviner Grid (hidden entirely when no readers available) */}
          {diviners.length > 0 && (
            <section id="diviners" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                  {divinerSectionTitle}
                </h2>
                <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                  {divinerSectionSubtitle}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {diviners.map((d) => (
                    <DivinerCard key={d.username} diviner={d} serviceSlug={readingSlug} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION J — FAQ with JSON-LD */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                Frequently Asked Questions
              </h2>

              {/* FAQ JSON-LD schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: faqItems.map((item) => ({
                      "@type": "Question",
                      name: item.q,
                      acceptedAnswer: { "@type": "Answer", text: item.a },
                    })),
                  }),
                }}
              />

              <div className="space-y-3">
                {faqItems.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-white/[0.07] bg-white/[0.02]"
                  >
                    <summary className="flex list-none cursor-pointer items-center justify-between gap-4 p-5 text-sm font-semibold text-[#f5f0e8] transition-colors hover:text-[#c9a84c]">
                      {item.q}
                      <span className="shrink-0 text-[#c9a84c]/50 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-white/[0.05] px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-[#b8bcd0]/65">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION K — Related Readings */}
          {relatedReadings.length > 0 && (
            <section className="px-4 pb-6 pt-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                  Explore More Readings
                </h2>
                <p className="mb-8 text-center text-sm text-[#b8bcd0]/50">
                  Keep comparing adjacent services before choosing your reader.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {relatedReadings.map((r) => {
                    const relatedImage = getReadingImageUrl(getReadingSlugFromHref(r.href));

                    return (
                      <Link
                        key={r.href}
                        href={r.href}
                        className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-colors hover:border-[#c9a84c]/30 hover:bg-white/[0.04]"
                      >
                        <div className="relative h-36 overflow-hidden bg-[#0d1117]">
                          {relatedImage ? (
                            <Image
                              src={relatedImage}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
                              {r.icon}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-transparent to-transparent" />
                        </div>
                        <div className="flex items-center gap-3 p-4">
                          <span className="text-2xl shrink-0" aria-hidden="true">{r.icon}</span>
                          <span className="text-sm font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                            {r.title}
                          </span>
                          <ArrowRight className="ml-auto size-4 shrink-0 text-[#c9a84c]/40 transition-colors group-hover:text-[#c9a84c]" aria-hidden="true" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Divider — between Related Readings and Bottom CTA */}
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
          </div>

          {/* SECTION L — Bottom CTA */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#c9a84c]/10 p-10 text-center md:p-14">
              {/* Background layers */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />
              {/* Content */}
              <div className="relative">
                <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">{ctaTitle}</h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                  {ctaBody}
                </p>
                <div className="mt-8">
                  <a
                    href={diviners.length > 0 ? "#diviners" : discoverLink}
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]"
                  >
                    {diviners.length > 0 ? ctaButtonLabel : discoverLabel}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <ReadingStickyBar
          serviceLabel={heroTitleBefore.trim().replace(/:$/, "")}
          startingPrice={startingPrice}
          discoverLink={primaryCtaHref}
        />

        <MarketingFooter />
      </div>
    </div>
  );
}
