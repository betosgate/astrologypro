import Link from "next/link";
import Image from "next/image";
import { Star, BadgeCheck, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { ReadingLeadCapture } from "@/components/marketing/reading-lead-capture";
import { ReadingStickyBar } from "@/components/marketing/reading-sticky-bar";

export interface DivinerLandingCard {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  startingPrice: number | null;
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

function DivinerCard({ diviner }: { diviner: DivinerLandingCard }) {
  const avatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);
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
        <div className="mb-5 mt-4">
          <Link
            href={`/${diviner.username}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
          >
            Book a Reading <ArrowRight className="size-3.5" aria-hidden="true" />
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
  } = props;

  const readerLabel = serviceType === "tarot" ? "Tarot Reader" : "Reader";
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
          {/* SECTION A — Hero */}
          <section className="relative overflow-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.07)_0%,transparent_60%)]" />
            <div className="relative mx-auto max-w-4xl px-4 text-center">
              {/* Badge pill */}
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
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
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#b8bcd0]/75">
                {heroSubtitle}
              </p>

              {/* Stats row */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
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
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#diviners"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]"
                >
                  Find a {readerLabel} ↓
                </a>
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
                  <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#c9a84c]">
                    What {serviceType === "astrology" ? "This Reading" : "a Reading"} Reveals
                  </h3>
                  <div className="space-y-3">
                    {revealsItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#c9a84c]" />
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
                {HOW_IT_WORKS_STEPS.map((step) => (
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
                  </div>
                ))}
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

          {/* SECTION F — Mid-page CTA Banner */}
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
                      &ldquo;{t.quote}&rdquo;
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

          {/* SECTION H — Diviner Grid */}
          <section id="diviners" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-2 text-center text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
                {divinerSectionTitle}
              </h2>
              <p className="mb-10 text-center text-sm text-[#b8bcd0]/50">
                {divinerSectionSubtitle}
              </p>
              {diviners.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {diviners.map((d) => (
                    <DivinerCard key={d.username} diviner={d} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16 text-center">
                  <p className="text-[#b8bcd0]/50">
                    New practitioners are joining soon. Browse all readers in the meantime.
                  </p>
                </div>
              )}
              <div className="mt-8 text-center">
                <Link
                  href={discoverLink}
                  className="inline-flex items-center gap-1.5 text-sm text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]"
                >
                  {discoverLabel} <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION I — Email Lead Capture */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/20 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)] p-10 text-center">
                {/* Gold glow accents */}
                <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-[#c9a84c]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-[#c9a84c]/10 blur-3xl" />

                <div className="relative">
                  {/* Envelope icon circle */}
                  <div className="mb-5 inline-flex size-14 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10">
                    <svg
                      className="size-7 text-[#e2c97e]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                  </div>

                  <h2 className="mb-3 text-2xl font-bold text-[#f5f0e8]">
                    Get Your Free Reading Guide
                  </h2>
                  <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-[#b8bcd0]/70">
                    Learn what to expect from {emailGuideSubject}, what questions to prepare, and
                    how to get the most from your session.
                  </p>

                  <ReadingLeadCapture subject={emailGuideSubject} />

                  <p className="mt-4 text-xs text-[#b8bcd0]/40">No spam. Unsubscribe anytime.</p>
                </div>
              </div>
            </div>
          </section>

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
                <h2 className="mb-6 text-center text-xl font-bold text-[#f5f0e8]">
                  Explore More Readings
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {relatedReadings.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all hover:border-[#c9a84c]/30 hover:bg-white/[0.04]"
                    >
                      <span className="text-2xl shrink-0" aria-hidden="true">{r.icon}</span>
                      <span className="text-sm font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
                        {r.title}
                      </span>
                      <ArrowRight className="ml-auto size-4 shrink-0 text-[#c9a84c]/40 transition-colors group-hover:text-[#c9a84c]" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION L — Bottom CTA */}
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#c9a84c]/10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)] p-10 text-center md:p-14">
              <h2 className="text-2xl font-bold text-[#f5f0e8] sm:text-3xl">{ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b8bcd0]/65">
                {ctaBody}
              </p>
              <div className="mt-8">
                <a
                  href="#diviners"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#c9a84c] px-8 text-sm font-semibold text-black shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-[#e2c97e]"
                >
                  {ctaButtonLabel}
                </a>
              </div>
            </div>
          </section>
        </main>

        <ReadingStickyBar
          serviceLabel={heroTitleBefore.trim().replace(/:$/, "")}
          startingPrice={startingPrice}
          discoverLink="#diviners"
        />

        <MarketingFooter />
      </div>
    </div>
  );
}
