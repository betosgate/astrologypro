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

interface PageProps {
  params: Promise<{ slug: string }>;
}

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
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-600"
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr]">
          <div>
            <Link
              href="/services"
              className="text-sm font-medium text-sky-200/80 hover:text-sky-200"
            >
              All Services
            </Link>
            <div className="mt-5 inline-flex items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-100/80">
              {getServiceCategoryLabel(template.category)}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              {template.name}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              {template.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Starting Price
                </div>
                <div className="mt-2 text-2xl font-semibold text-amber-300">
                  {formatCurrency(Number(template.base_price))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Session Length
                </div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                  <Clock className="size-5 text-sky-300" />
                  {template.duration_minutes} min
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Booking Model
                </div>
                <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                  <Calendar className="size-5 text-sky-300" />
                  Choose by availability or profile
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
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
              <div className="flex h-full min-h-[280px] items-center justify-center p-10 text-slate-400">
                <UserRound className="size-10" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.72fr,1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">
                How to Choose
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li>
                  Use <span className="font-medium text-white">View Availability</span> if you
                  want the fastest route to booking this service.
                </li>
                <li>
                  Use <span className="font-medium text-white">View Profile</span> if you want to
                  compare style, specialties, and background first.
                </li>
                <li>
                  Every card below stays locked to this service, so you will not
                  lose the service context when you proceed.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">
                Service Coverage
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This page is the broad service entry point. Diviner-specific
                pages stay on branded direct-conversion routes, while this page
                exists to help customers compare available practitioners.
              </p>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Available Diviners
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Sorted to prioritize bookable diviners with active availability.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                {diviners.length} diviner{diviners.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="grid gap-4">
              {diviners.map((diviner) => (
                <article
                  key={diviner.divinerId}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
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
                          <h3 className="text-xl font-semibold text-white">
                            {diviner.displayName}
                          </h3>
                          {diviner.isCertified && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                              <Shield className="size-3" />
                              Certified
                            </span>
                          )}
                          {diviner.availabilityConfigured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200">
                              <Calendar className="size-3" />
                              Availability active
                            </span>
                          )}
                        </div>
                        {diviner.tagline && (
                          <p className="text-sm text-slate-300">{diviner.tagline}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
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
                                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300"
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/20"
                      >
                        View Availability
                        <Calendar className="size-4" />
                      </Link>
                      <Link
                        href={`/${diviner.username}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
                      >
                        View Profile
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href={`/${diviner.username}/services/${template.slug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-400/15"
                      >
                        Diviner-Specific Page
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}

              {diviners.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
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
