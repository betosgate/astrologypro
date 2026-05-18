"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  Clock,
  MessageSquare,
  Play,
  Sparkles,
  Video,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getServiceImageUrl } from "@/lib/service-images";
import { getServiceCategoryLabel } from "@/lib/public-services";
import {
  hasRenderableServiceTemplateForm,
  resolveServiceTemplateFormConfig,
  type ServiceTemplateFormConfig,
} from "@/lib/service-template-form";
import { TemplateIntakeForm } from "@/components/services/template-intake-form";

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
  form_enabled?: boolean;
  form_config?: ServiceTemplateFormConfig | null;
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
  diviners?: ServiceTemplatePublicPageDiviner[];
  embedded?: boolean;
  disableLinks?: boolean;
  discountToken?: string | null;
}

interface CtaButtonProps {
  hasIntakeForm: boolean;
  href: string;
  label: string;
  className: string;
  disabled?: boolean;
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

function CtaButton({ hasIntakeForm, href, label, className, disabled }: CtaButtonProps) {
  const content = (
    <>
      {label}
      <ArrowRight className="size-4" />
    </>
  );

  if (disabled) {
    return <span className={`${className} cursor-default opacity-90`}>{content}</span>;
  }

  if (!hasIntakeForm) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const target = document.getElementById("template-intake-form");
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "#template-intake-form");
      }}
    >
      {content}
    </button>
  );
}

function appendDiscountToken(href: string, discountToken: string | null | undefined) {
  if (!discountToken) return href;
  if (href.startsWith("#")) return href;
  const [path, hash = ""] = href.split("#");
  const [pathname, query = ""] = path.split("?");
  const search = new URLSearchParams(query);
  search.set("discount_token", discountToken);
  return `${pathname}?${search.toString()}${hash ? `#${hash}` : ""}`;
}

function getIncludedBullets(template: ServiceTemplatePublicPageTemplate) {
  if (template.whats_included && template.whats_included.length > 0) {
    return template.whats_included.filter(Boolean);
  }

  return template.category === "astrology"
    ? [
        "A focused reading structure tailored to this product",
        "Pre-booking intake so the reading starts with the right context",
        "Recorded online session with practical interpretation",
      ]
    : template.category === "tarot"
      ? [
          "A focused spread tailored to the question or theme",
          "Live online session with practical interpretation",
          "Clear next-step guidance after the reading",
        ]
      : [
          "A personalized reading flow tailored to the product",
          "Live online session with clear preparation steps",
          "Structured follow-through after booking",
        ];
}

function getAudienceBullets(template: ServiceTemplatePublicPageTemplate) {
  if (template.who_its_for && template.who_its_for.length > 0) {
    return template.who_its_for.filter(Boolean);
  }

  return template.category === "astrology"
    ? [
        "Clients who want a prepared astrology session instead of starting from zero live.",
        "People who can provide accurate birth details and want a focused chart-based reading.",
        "Anyone looking for clearer timing, context, or relationship patterns through astrology.",
      ]
    : template.category === "tarot"
      ? [
          "Clients with a clear topic, crossroads, or question they want explored.",
          "People who want direct guidance without a complex setup step.",
          "Anyone seeking a structured reading with practical takeaway points.",
        ]
      : [
          "Clients who want a more guided product experience than a blank booking flow.",
          "People who value preparation before the live session starts.",
          "Anyone looking for clear structure from landing page to booking.",
        ];
}

function getFaqItems(template: ServiceTemplatePublicPageTemplate, hasIntakeForm: boolean): FaqItem[] {
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
      question: "What happens after I continue from this page?",
      answer: hasIntakeForm
        ? "You complete the intake form first, then continue into booking with the core reading details already captured."
        : "You go directly into the booking route for this product and complete the next step there.",
    },
    {
      question: "Do I need to prepare anything?",
      answer: template.requires_birth_data
        ? "Yes. Please have your exact birth date, time, and location ready. Accurate birth details improve chart precision and help the reading stay relevant."
        : "A clear topic, intention, or question is enough to begin. The more specific your focus, the better the reading can be tailored.",
    },
    {
      question: "How long is the session?",
      answer: `This reading is ${template.duration_minutes} minutes. ${
        template.overage_rate && Number(template.overage_rate) > 0
          ? `Additional time, when offered, may be billed at ${formatCurrency(Number(template.overage_rate))}/minute.`
          : ""
      }`.trim(),
    },
    {
      question: "Why is there an intake step?",
      answer: hasIntakeForm
        ? "The intake step makes the booking flow cleaner and gives the reading the right details upfront, especially for astrology products that depend on birth data."
        : "This product currently uses a direct booking flow. Intake requirements can be added later without changing the product page structure.",
    },
  ];
}

export function ServiceTemplatePublicPage(props: ServiceTemplatePublicPageProps) {
  const { template, embedded = false, disableLinks = false, discountToken = null } = props;
  const serviceImageUrl = template.image_url ?? getServiceImageUrl(template.slug);
  const requiresBirthData =
    template.category === "astrology" || template.requires_birth_data === true;
  const includedBullets = getIncludedBullets(template);
  const audienceBullets = getAudienceBullets(template);
  const resolvedFormConfig = resolveServiceTemplateFormConfig({
    category: template.category,
    slug: template.slug,
    form_config: template.form_config ?? null,
  });
  const hasIntakeForm = hasRenderableServiceTemplateForm({
    form_enabled: template.form_enabled,
    category: template.category,
    slug: template.slug,
    form_config: template.form_config ?? null,
  });
  // When a template has an intake form, the CTA scrolls to the form. When
  // it does not, we send the user straight to the shared calendar flow —
  // `/book/template/[slug]` handles the no-submission case by just showing
  // availability across compatible diviners. Previously this pointed at
  // the stale `/book/demo` placeholder (removed in the
  // book-without-diviner-flow bundle, 23.04.2026).
  const ctaHref = hasIntakeForm
    ? "#template-intake-form"
    : appendDiscountToken(
        `/book/template/${encodeURIComponent(template.slug)}`,
        discountToken,
      );
  const servicesHref = appendDiscountToken("/services", discountToken);
  const ctaLabel = hasIntakeForm ? "Start Intake" : "Continue to Booking";
  const faqItems = getFaqItems(template, hasIntakeForm);
  const proofBullets = hasIntakeForm
    ? [
        "Structured intake captures the reading context before booking.",
        requiresBirthData
          ? "Birth details are collected in a format suited to astrology workflows."
          : "The intake step keeps the booking flow focused and intentional.",
        "Product CTA buttons all lead to the same guided next step.",
        "The final booking handoff stays separate from product configuration.",
      ]
    : [
        "This product currently uses a direct booking route.",
        "The page can switch to a structured intake later without a redesign.",
        "CTA buttons already point to a stable booking handoff.",
        requiresBirthData
          ? "Birth-data collection can be enabled later when the intake schema is ready."
          : "No structured pre-booking data is required right now.",
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
                href={servicesHref}
                disabled={disableLinks}
                className="font-display font-semibold text-cream transition-colors hover:text-gold"
              >
                Services
              </MaybeLink>
              <ChevronRight className="size-3 text-silver/40" />
              <span className="max-w-[160px] truncate text-silver/40">{template.name}</span>
            </div>
            <CtaButton
              hasIntakeForm={hasIntakeForm}
              href={ctaHref}
              disabled={disableLinks}
              label={ctaLabel}
              className="flex rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-cosmos-900 transition-colors hover:bg-gold-light"
            />
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
                    Productized service flow with{" "}
                    <span className="font-semibold text-cream">guided next steps</span>
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

                {discountToken && (
                  <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    5% Community member discount active. Checkout will show the
                    platform-fee breakdown before payment.
                  </div>
                )}

                <p className="mt-3 text-xs text-silver/50">
                  {hasIntakeForm
                    ? "CTA buttons open the product intake form first."
                    : "CTA buttons currently go directly to booking."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <CtaButton
                    hasIntakeForm={hasIntakeForm}
                    href={ctaHref}
                    disabled={disableLinks}
                    label={ctaLabel}
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
                  />
                  <MaybeLink
                    href={servicesHref}
                    disabled={disableLinks}
                    className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 px-8 text-sm font-semibold text-cream transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    Browse More Services
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
                  <p className="mt-1 text-sm text-silver/60">Focused reading session</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-4 rounded-xl p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <Video className="size-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-cream">Online Delivery</p>
                  <p className="mt-1 text-sm text-silver/60">Live session with a clear handoff flow</p>
                </div>
              </div>

              <div className="glass-card flex items-start gap-4 rounded-xl p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <Sparkles className="size-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-cream">
                    {hasIntakeForm ? "Guided Intake" : "Direct Booking"}
                  </p>
                  <p className="mt-1 text-sm text-silver/60">
                    {hasIntakeForm
                      ? "Structured pre-booking details for this product"
                      : "Straightforward next step into the booking flow"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 glass-card rounded-xl p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-silver/50">
                This Product Includes
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
                    <strong>Note:</strong> Exact birth date, time, and location improve the quality of astrology-based readings.
                  </p>
                  </div>
                )}

                {discountToken && (
                  <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                    <p className="text-xs text-emerald-100">
                      Your Community member discount token will carry through to booking.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3 border-t border-white/8 pt-6">
                  <CtaButton
                    hasIntakeForm={hasIntakeForm}
                    href={ctaHref}
                    disabled={disableLinks}
                    label={hasIntakeForm ? "Complete Intake Details" : "Book This Reading"}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-gold px-6 text-sm font-semibold text-cosmos-900 transition-all hover:bg-gold-light"
                  />
                  <MaybeLink
                    href={servicesHref}
                    disabled={disableLinks}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-6 text-sm font-semibold text-cream transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    Compare Services
                  </MaybeLink>
                </div>
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
              <p className="text-xs uppercase tracking-[0.24em] text-gold/70">Why This Flow Works</p>
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
              <div className="mt-6">
                <CtaButton
                  hasIntakeForm={hasIntakeForm}
                  href={ctaHref}
                  disabled={disableLinks}
                  label={hasIntakeForm ? "Go To Intake Form" : "Continue to Booking"}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 px-5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
                />
              </div>
            </div>
          </div>

          <div className="cosmic-divider mx-auto mt-12 max-w-6xl md:mt-16" />
        </section>

        {hasIntakeForm && resolvedFormConfig && (
          <>
            <section className="py-12 md:py-16">
              <div className="mx-auto max-w-5xl px-4">
                <TemplateIntakeForm
                  config={resolvedFormConfig}
                  category={template.category}
                  templateName={template.name}
                  templateSlug={template.slug}
                  embedded={embedded}
                  discountToken={discountToken}
                />
              </div>
            </section>

            <div className="cosmic-divider mx-auto max-w-6xl" />
          </>
        )}

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
                <h3 className="mb-2 font-display text-lg font-semibold text-cream">
                  {hasIntakeForm ? "Complete the Intake" : "Review the Product"}
                </h3>
                <p className="text-sm leading-relaxed text-silver/60">
                  {hasIntakeForm
                    ? "Add the birth details and context this product needs before booking."
                    : "Read through the service details and move forward when you are ready."}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                  <MessageSquare className="size-6 text-gold" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                  Step 2
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-cream">
                  Continue to Booking
                </h3>
                <p className="text-sm leading-relaxed text-silver/60">
                  Move into the booking flow with the right context already established for the service.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                  <Play className="size-6 text-gold" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/60">
                  Step 3
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-cream">Join the Reading</h3>
                <p className="text-sm leading-relaxed text-silver/60">
                  Attend the scheduled session and receive the product experience you prepared for here.
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
              Ready for {template.name}?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-silver/60">
              {template.duration_minutes}-minute session starting at {formatCurrency(Number(template.base_price))}
            </p>
            <CtaButton
              hasIntakeForm={hasIntakeForm}
              href={ctaHref}
              disabled={disableLinks}
              label={ctaLabel}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-gold px-8 text-sm font-semibold text-cosmos-900 shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
