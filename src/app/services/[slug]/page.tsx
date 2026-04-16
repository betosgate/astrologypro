import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  Clock,
  Shield,
  Star,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { getServiceImageUrl } from "@/lib/service-images";
import { getServiceCategoryLabel } from "@/lib/public-services";
import {
  getServiceLandingDiviners,
  getServiceLandingTemplate,
} from "@/lib/service-landings";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const READING_PAGE_MAP: Record<string, string> = {
  "nativity-birth-chart": "/readings/nativity-birth-chart",
  "solar-return": "/readings/solar-return",
  "weekly-transits": "/readings/weekly-transits",
  "monthly-transits-lunar-return": "/readings/monthly-transits-lunar-return",
  "romantic-relationships": "/readings/romantic-relationships",
  "friendship-relationships": "/readings/friendship-relationships",
  "business-relationship": "/readings/business-relationship",
  "predictive-event-horary": "/readings/predictive-event-horary",
  "jupiter-return": "/readings/jupiter-return",
  "saturn-return": "/readings/saturn-return",
  "mars-return": "/readings/mars-return",
  "uranus-opposition": "/readings/uranus-opposition",
  "3-card-basic-question-spread": "/readings/3-card-basic-question-spread",
  "5-card-complex-question-spread": "/readings/5-card-complex-question-spread",
  "7-card-6-month-forward-review": "/readings/7-card-6-month-forward-review",
  "7-card-horseshoe-spread-major-read": "/readings/7-card-horseshoe-spread-major-read",
  "10-card-relationship-spread": "/readings/10-card-relationship-spread",
  "10-card-celtic-cross-major-read": "/readings/10-card-celtic-cross-major-read",
  "12-card-astrological-spread-major-read": "/readings/12-card-astrological-spread-major-read",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getServiceLandingTemplate(slug);
  if (!template) return { title: "Not Found" };

  return {
    title: `${template.name} | Choose Your Diviner | AstrologyPro`,
    description:
      template.description ??
      `Learn about ${template.name}, then choose a diviner by availability or profile.`,
    alternates: { canonical: `${APP_URL}/services/${slug}` },
    openGraph: {
      title: `${template.name} | AstrologyPro`,
      description:
        template.description ??
        `Choose a diviner for ${template.name} on AstrologyPro.`,
      url: `${APP_URL}/services/${slug}`,
      type: "website",
    },
  };
}

function RatingStars({ averageRating }: { averageRating: number | null }) {
  const fullStars = Math.round(averageRating ?? 0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${
            index < fullStars
              ? "fill-[#c9a84c] text-[#c9a84c]"
              : "fill-transparent text-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export default async function ServiceOnlyLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const [template, diviners] = await Promise.all([
    getServiceLandingTemplate(slug),
    getServiceLandingDiviners(slug),
  ]);

  if (!template) notFound();

  const serviceImage = getServiceImageUrl(template.slug);
  const readingPageUrl = READING_PAGE_MAP[template.slug] ?? null;

  return (
    <div className="min-h-screen bg-[#06080f] text-white">
      {/* Fixed radial gradient overlay */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(201,120,28,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        {/* Hero section */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.07)_0%,transparent_60%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.25fr,0.75fr]">
            <div>
              <Link
                href="/services"
                className="text-sm font-medium text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors"
              >
                All Services
              </Link>
              <div className="mt-5 inline-flex items-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
                {getServiceCategoryLabel(template.category)}
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#f5f0e8] md:text-5xl">
                {template.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#b8bcd0]/75 md:text-lg">
                {template.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#b8bcd0]/50">
                    Starting Price
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[#c9a84c]">
                    {formatCurrency(Number(template.base_price))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#b8bcd0]/50">
                    Session Length
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                    <Clock className="size-5 text-[#c9a84c]" />
                    {template.duration_minutes} min
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#b8bcd0]/50">
                    Booking Model
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <Calendar className="size-5 text-[#c9a84c]" />
                    Choose by availability or profile
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
              {serviceImage ? (
                <div className="relative h-full min-h-[280px] w-full">
                  <Image
                    src={serviceImage}
                    alt={template.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center p-10 text-[#b8bcd0]/40">
                  <UserRound className="size-10" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cross-link to /readings/ guide banner */}
        {readingPageUrl && (
          <div className="mt-8 rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[#b8bcd0]/70">
              <span className="font-semibold text-[#f5f0e8]">
                Learn more about {template.name}
              </span>{" "}
              — read the complete educational guide for this service.
            </p>
            <Link
              href={readingPageUrl}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c9a84c] hover:text-[#e2c97e] transition-colors"
            >
              Read the Guide <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.72fr,1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-lg font-semibold text-[#f5f0e8]">
                How to Choose
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#b8bcd0]/70">
                <li>
                  Use{" "}
                  <span className="font-medium text-[#f5f0e8]">
                    View Availability
                  </span>{" "}
                  if you want the fastest route to booking this service.
                </li>
                <li>
                  Use{" "}
                  <span className="font-medium text-[#f5f0e8]">
                    View Profile
                  </span>{" "}
                  if you want to compare style, specialties, and background
                  first.
                </li>
                <li>
                  Every card below stays locked to this service, so you will
                  not lose the service context when you proceed.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-lg font-semibold text-[#f5f0e8]">
                About This Listing
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#b8bcd0]/70">
                This page shows all available practitioners who offer this
                service — sorted by availability and certification. Visit
                individual practitioner profiles for detailed bios, portfolios,
                and booking availability.
              </p>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#f5f0e8]">
                  Available Diviners
                </h2>
                <p className="mt-1 text-sm text-[#b8bcd0]/60">
                  Sorted to prioritize bookable diviners with active
                  availability.
                </p>
              </div>
              <div className="text-sm text-[#b8bcd0]/50">
                {diviners.length} diviner{diviners.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="grid gap-4">
              {diviners.map((diviner) => (
                <article
                  key={diviner.divinerId}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-[#c9a84c]/20 transition-all"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <Image
                        src={getDivinerAvatarUrl(diviner.avatarUrl)}
                        alt={diviner.displayName}
                        width={72}
                        height={72}
                        className="size-[72px] rounded-2xl object-cover"
                      />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-[#f5f0e8]">
                            {diviner.displayName}
                          </h3>
                          {diviner.isCertified && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                              <Shield className="size-3" />
                              Certified
                            </span>
                          )}
                          {diviner.availabilityConfigured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2.5 py-1 text-xs text-[#c9a84c]/80">
                              <Calendar className="size-3" />
                              Availability active
                            </span>
                          )}
                        </div>
                        {diviner.tagline && (
                          <p className="text-sm text-[#b8bcd0]/60">
                            {diviner.tagline}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#b8bcd0]/50">
                          <span>{formatCurrency(diviner.price)}</span>
                          <span>{diviner.durationMinutes} min</span>
                          <span>{diviner.completedSessions} sessions</span>
                          <span className="inline-flex items-center gap-2">
                            <RatingStars averageRating={diviner.averageRating} />
                            {diviner.reviewCount > 0
                              ? `${diviner.averageRating?.toFixed(1)} (${diviner.reviewCount})`
                              : "No reviews yet"}
                          </span>
                        </div>
                        {diviner.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {diviner.specialties.slice(0, 4).map((specialty) => (
                              <span
                                key={specialty}
                                className="rounded-full border border-white/[0.07] px-2.5 py-1 text-xs text-[#b8bcd0]/60"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 md:w-[220px]">
                      <Link
                        href={`/${diviner.username}/book/${template.slug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a84c] px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#e2c97e]"
                      >
                        View Availability
                        <Calendar className="size-4" />
                      </Link>
                      <Link
                        href={`/${diviner.username}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm font-medium text-[#f5f0e8] transition-colors hover:bg-white/[0.04]"
                      >
                        View Profile
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href={`/${diviner.username}/services/${template.slug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-2.5 text-sm font-medium text-[#c9a84c] transition-colors hover:bg-[#c9a84c]/10"
                      >
                        Diviner-Specific Page
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}

              {diviners.length === 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center text-[#b8bcd0]/50">
                  No active diviners are currently bookable for this service.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
