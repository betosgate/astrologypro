import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Video,
  CalendarCheck,
  MessageSquare,
  Play,
  ArrowRight,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { getServiceImageUrl } from "@/lib/service-images";
import { getServiceCategoryLabel } from "@/lib/public-services";

interface FaqItem {
  question: string;
  answer: string;
}

interface ServiceTemplatePublicPageTemplate {
  category: string;
  name: string;
  slug: string;
  description: string | null;
  long_description?: string | null;
  image_url?: string | null;
  duration_minutes: number;
  base_price: number;
  overage_rate?: number | null;
  requires_birth_data?: boolean;
  whats_included?: string[];
  who_its_for?: string[];
  faq?: FaqItem[];
}

interface ServiceTemplatePublicPageDiviner {
  divinerId: string;
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  specialties: string[];
  price: number;
  durationMinutes: number;
  completedSessions: number;
  reviewCount: number;
  averageRating: number | null;
  availabilityConfigured: boolean;
}

interface ServiceTemplatePublicPageProps {
  template: ServiceTemplatePublicPageTemplate;
  diviners: ServiceTemplatePublicPageDiviner[];
  embedded?: boolean;
  disableLinks?: boolean;
  emptyStateMessage?: string;
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

function MaybeLink({
  href,
  className,
  children,
  disabled,
}: {
  href: string;
  className: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className={`${className} cursor-default opacity-90`}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function getIncludedBullets(template: ServiceTemplatePublicPageTemplate) {
  if (template.whats_included && template.whats_included.length > 0) {
    return template.whats_included.filter(Boolean);
  }

  return template.category === "astrology"
    ? [
        "Professional natal/transit/synastry chart analysis",
        "Screen-shared chart walkthrough",
        "Session recording for revisiting insights",
      ]
    : template.category === "tarot"
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
}

function getAudienceBullets(template: ServiceTemplatePublicPageTemplate) {
  if (template.who_its_for && template.who_its_for.length > 0) {
    return template.who_its_for.filter(Boolean);
  }

  return template.category === "astrology"
    ? [
        "Clients who want clarity around timing, patterns, and big life transitions",
        "People preparing for a major decision, relationship shift, or career pivot",
        "Returning astrology clients who want a guided chart walkthrough instead of a generic report",
      ]
    : template.category === "tarot"
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
}

function getFaqItems(template: ServiceTemplatePublicPageTemplate): FaqItem[] {
  if (template.faq && template.faq.length > 0) {
    return template.faq
      .filter((item) => item.question?.trim() && item.answer?.trim())
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }));
  }

  return [
    {
      question: "What happens during the session?",
      answer:
        template.category === "astrology"
          ? `Your ${template.duration_minutes}-minute session takes place over HD video. You will receive a professional chart walkthrough, practical interpretation, and time for questions.`
          : template.category === "tarot"
            ? `Your ${template.duration_minutes}-minute session takes place over HD video. The reading focuses on your question, the card spread, and the practical guidance that emerges from the session.`
            : `Your ${template.duration_minutes}-minute session takes place over HD video with a live practitioner and is designed to give direct, personalized guidance.`,
    },
    {
      question: "Do I need to prepare anything?",
      answer: template.requires_birth_data
        ? "Yes, please have your exact birth date, time, and location ready. Accurate birth data improves precision and helps the practitioner give a deeper reading."
        : "Come with the question, topic, or situation you want to explore. A clear focus helps the session stay practical and useful.",
    },
    {
      question: "How long is the session?",
      answer: `This reading is ${template.duration_minutes} minutes. ${
        template.overage_rate && Number(template.overage_rate) > 0
          ? `If additional time is offered, it may be billed at ${formatCurrency(Number(template.overage_rate))}/minute.`
          : ""
      }`.trim(),
    },
    {
      question: "How do I choose the right practitioner?",
      answer: "You can compare available diviners by profile, specialties, and bookable availability before choosing the one that fits your style and needs.",
    },
  ];
}

export function ServiceTemplatePublicPage({
  template,
  diviners,
  embedded = false,
  disableLinks = false,
  emptyStateMessage = "Preview mode: public diviner cards will appear here once practitioners offer this template.",
}: ServiceTemplatePublicPageProps) {
  const serviceImageUrl = template.image_url ?? getServiceImageUrl(template.slug);
  const requiresBirthData =
    template.category === "astrology" || template.requires_birth_data === true;
  const includedBullets = getIncludedBullets(template);
  const audienceBullets = getAudienceBullets(template);
  const faqItems = getFaqItems(template);
  const proofBullets = [
    `${diviners.length} practitioner${diviners.length === 1 ? "" : "s"} currently available for this service`,
    "Choose by profile style or immediate availability",
    "HD video sessions with clear online booking flow",
    requiresBirthData
      ? "Best experience when accurate birth data is available"
      : "Works well for focused questions and present-moment guidance",
  ];

  return (
    <div
      className={
        embedded
          ? "overflow-hidden rounded-2xl border border-white/10 bg-cosmos-950"
          : "bg-cosmos-950"
      }
    >
      <div className={`${embedded ? "" : "min-h-screen"} bg-cosmos-950 text-white`}>
          <nav className="sticky top-0 z-40 border-b border-white/5 bg-cosmos-900/80 backdrop-blur-xl">
            <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
              <div className="flex items-center gap-2 text-sm">
                <MaybeLink
                  href="/services"
                  disabled={disableLinks}
                  className="font-display font-semibold text-cream transition-colors hover:text-gold"
                >
                  Services
                </MaybeLink>
                <ChevronRight className="size-3 text-silver/40" />
                <span className="max-w-[160px] truncate text-silver/40">{template.name}</span>
              </div>
              <MaybeLink
                href="/services"
                disabled={disableLinks}
                className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-cosmos-900 transition-colors hover:bg-gold-light"
              >
                Choose Diviner
              </MaybeLink>
            </div>
          </nav>

          <section className="relative overflow-hidden border-b border-white/5 bg-cosmos-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                <div>
                  <CategoryBadge category={template.category} />

                  <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-cream md:text-5xl lg:text-6xl">
                    {template.name}
                  </h1>

                  {template.description && (
                    <p className="mt-4 text-base leading-relaxed text-silver/70 md:text-lg">
                      {template.description}
                    </p>
                  )}

                  <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2">
                    <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-gold/20 bg-gold/8">
                      <Sparkles className="size-4 text-gold/80" />
                    </div>
                    <span className="text-sm text-cream/80">
                      with <span className="font-semibold text-cream">an AstrologyPro practitioner</span>
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-end gap-4">
                    <span className="font-display text-4xl font-bold text-gold md:text-5xl">
                      {formatCurrency(Number(template.base_price))}
                    </span>
                    <div className="mb-1 space-y-0.5">
                      <span className="flex items-center gap-1.5 text-sm text-silver/70">
                        <Clock className="size-3.5" />
                        {template.duration_minutes} min session
                      </span>
                      {template.overage_rate && Number(template.overage_rate) > 0 && (
                        <span className="text-xs text-silver/50">
                          {formatCurrency(Number(template.overage_rate))}/min after
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-silver/50">
                    {diviners.length} practitioner{diviners.length === 1 ? "" : "s"} available
                  </p>

                  <div className="mt-8">
                    <MaybeLink
                      href="/services"
                      disabled={disableLinks}
                      className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
                    >
                      Choose Your Diviner
                      <ArrowRight className="size-4" />
                    </MaybeLink>
                  </div>
                </div>

                <div className="relative hidden md:block">
                  {serviceImageUrl ? (
                    <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl">
                      <Image
                        src={serviceImageUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 384px"
                        priority={!embedded}
                      />
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

          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                What&apos;s Included
              </h2>

              {template.long_description && (
                <div className="mb-6 glass-card rounded-xl p-6">
                  <p className="text-sm leading-relaxed text-silver/70 md:text-base">
                    {template.long_description}
                  </p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="glass-card flex items-start gap-4 rounded-xl p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Clock className="size-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-cream">{template.duration_minutes} Minutes</p>
                    <p className="mt-1 text-sm text-silver/60">Full-length personal session</p>
                  </div>
                </div>

                <div className="glass-card flex items-start gap-4 rounded-xl p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Video className="size-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-cream">HD Video Session</p>
                    <p className="mt-1 text-sm text-silver/60">Face-to-face with recording included</p>
                  </div>
                </div>

                <div className="glass-card flex items-start gap-4 rounded-xl p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Sparkles className="size-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-cream">
                      {template.category === "astrology"
                        ? "Chart Analysis"
                        : template.category === "tarot"
                          ? "Card Reading"
                          : "Personal Reading"}
                    </p>
                    <p className="mt-1 text-sm text-silver/60">Professional interpretation & guidance</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 glass-card rounded-xl p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-silver/50">
                  Your Session Includes
                </h3>
                <ul className="space-y-3">
                  {includedBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm text-cream/80">
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
                <p className="text-xs uppercase tracking-[0.24em] text-gold/70">Who This Reading Is For</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-cream">
                  A clearer fit for the right client
                </h2>
                <div className="mt-5 space-y-3">
                  {audienceBullets.map((bullet) => (
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
                <p className="text-xs uppercase tracking-[0.24em] text-gold/70">Why Book Here</p>
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

          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-5xl px-4">
              <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                Available Diviners
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {diviners.length > 0 ? (
                  diviners.map((diviner) => (
                    <div key={diviner.divinerId} className="glass-card rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-display text-xl font-semibold text-cream">
                            {diviner.displayName}
                          </h3>
                          {diviner.tagline && (
                            <p className="text-sm text-silver/60">{diviner.tagline}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {diviner.isCertified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 text-[11px] font-medium text-gold/80">
                                <Shield className="size-3" />
                                Certified
                              </span>
                            )}
                            {diviner.availabilityConfigured && (
                              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-silver/70">
                                Availability active
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-silver/60">
                            {formatCurrency(diviner.price)} · {diviner.durationMinutes} min · {diviner.completedSessions} session{diviner.completedSessions === 1 ? "" : "s"}
                          </div>
                        </div>

                        <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-gold/20 bg-white/[0.02]">
                          {diviner.avatarUrl ? (
                            <Image
                              src={getDivinerAvatarUrl(diviner.avatarUrl)}
                              alt={diviner.displayName}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Sparkles className="size-5 text-gold/40" />
                            </div>
                          )}
                        </div>
                      </div>

                      {diviner.specialties.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {diviner.specialties.slice(0, 4).map((specialty) => (
                            <span
                              key={specialty}
                              className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 text-[11px] font-medium text-gold/80"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <MaybeLink
                          href={`/${diviner.username}/book/${template.slug}`}
                          disabled={disableLinks}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
                        >
                          View Availability
                          <ArrowRight className="size-3.5" />
                        </MaybeLink>
                        <MaybeLink
                          href={`/${diviner.username}`}
                          disabled={disableLinks}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-silver/70 transition-colors hover:text-gold"
                        >
                          View Profile
                          <ArrowRight className="size-3.5" />
                        </MaybeLink>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center text-sm text-silver/60 sm:col-span-2">
                    {emptyStateMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
          </section>

          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                How It Works
              </h2>

              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                    <CalendarCheck className="size-6 text-gold" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                    Step 1
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-cream">Choose Your Diviner</h3>
                  <p className="text-sm leading-relaxed text-silver/60">
                    Compare available practitioners by style, profile, and bookable availability.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                    <MessageSquare className="size-6 text-gold" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                    Step 2
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-cream">Share Your Details</h3>
                  <p className="text-sm leading-relaxed text-silver/60">
                    Let your chosen practitioner know what you want to focus on during the session.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                    <Play className="size-6 text-gold" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                    Step 3
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-cream">Join Your Session</h3>
                  <p className="text-sm leading-relaxed text-silver/60">
                    Meet live by video and receive a recorded session you can revisit later.
                  </p>
                </div>
              </div>
            </div>

            <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
          </section>

          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {faqItems.map((faq) => (
                  <div key={faq.question} className="glass-card rounded-xl p-5">
                    <h3 className="mb-2 font-display text-base font-semibold text-cream">
                      {faq.question}
                    </h3>
                    <p className="text-sm leading-relaxed text-silver/60">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
          </section>

          <section className="relative overflow-hidden py-14 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />

            <div className="relative mx-auto max-w-3xl px-4 text-center">
              <h2 className="mb-4 font-display text-3xl font-semibold text-cream md:text-4xl">
                Ready to Book Your {template.name}?
              </h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-silver/60">
                {template.duration_minutes}-minute session starting at {formatCurrency(Number(template.base_price))}
              </p>
              <MaybeLink
                href="/services"
                disabled={disableLinks}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
              >
                Choose Your Diviner
                <ArrowRight className="size-4" />
              </MaybeLink>
            </div>
          </section>
      </div>
    </div>
  );
}
