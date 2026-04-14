import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/format";
import { getServiceImageUrl } from "@/lib/service-images";
import { APP_URL } from "@/lib/constants";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { PageTracker } from "@/components/landing/page-tracker";
import {
  buildPublicServicesIntro,
  filterVisiblePublicServices,
  getServiceCategoryLabel,
} from "@/lib/public-services";
import { applyRuntimePricesToServices } from "@/lib/runtime-service-pricing";
import { canPubliclySellService } from "@/lib/payout-readiness";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ ref?: string }>;
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

async function getServices(divinerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  return applyRuntimePricesToServices(supabase, data ?? []);
}

/* ------------------------------------------------------------------ */
/*  SEO metadata                                                       */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const diviner = await getDiviner(username);
  if (!diviner) return { title: "Not Found" };

  const title = `Services by ${diviner.display_name} | AstrologyPro`;
  const description = `Browse astrology and tarot reading services offered by ${diviner.display_name}. Book a personal session today.`;
  const canonical = `${APP_URL}/${username}/services`;

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
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Service index card (local to this page)                            */
/* ------------------------------------------------------------------ */

function ServiceIndexCard({
  service,
  username,
  refParam,
}: {
  service: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    duration_minutes: number;
    base_price: number;
    category: string;
    is_featured: boolean;
    booking_enabled?: boolean;
  };
  username: string;
  refParam: string;
}) {
  const imageUrl = getServiceImageUrl(service.slug);

  return (
    <div
      className={`glass-card group relative overflow-hidden rounded-xl transition-all duration-300 hover:border-white/15 hover:shadow-lg ${
        service.is_featured
          ? "border-gold/20 shadow-[0_0_20px_rgba(201,168,76,0.08)]"
          : ""
      }`}
    >
      {service.is_featured && (
        <div className="absolute right-4 top-0 z-10">
          <span className="inline-flex items-center rounded-b-lg border border-t-0 border-gold/40 bg-gold/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
            Popular
          </span>
        </div>
      )}

      {/* Image header */}
      {imageUrl && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={service.name}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cosmos-900/80 to-transparent" />
          {/* Category badge on image */}
          <div className="absolute bottom-3 left-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-cosmos-900/70 px-2.5 py-0.5 text-[10px] font-medium text-gold backdrop-blur-sm">
              <Sparkles className="size-2.5" />
              {getServiceCategoryLabel(service.category)}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Name + category (only show inline badge when no image) */}
        {!imageUrl && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] font-medium text-gold/80">
            <Sparkles className="size-2.5" />
            {getServiceCategoryLabel(service.category)}
          </span>
        )}

        <h3 className="font-display text-lg font-semibold leading-tight text-cream">
          {service.name}
        </h3>

        {service.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-silver/60">
            {service.description}
          </p>
        )}

        {/* Price + duration */}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-gold">
            {formatCurrency(Number(service.base_price))}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/15 px-2.5 py-0.5 text-[11px] text-gold/70">
            <Clock className="size-2.5" />
            {service.duration_minutes} min
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/${username}/services/${service.slug}${refParam}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gold/80 transition-colors hover:text-gold"
          >
            View Details
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {service.booking_enabled !== false ? (
            <Link
              href={`/${username}/book/${service.slug}${refParam}`}
              className="ml-auto rounded-lg bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              Book Now
            </Link>
          ) : (
            <span className="ml-auto rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-silver/45">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function ServicesIndexPage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { ref } = await searchParams;

  const diviner = await getDiviner(username);
  if (!diviner) notFound();

  const allServices = await getServices(diviner.id);
  const publicServices = filterVisiblePublicServices(allServices).map((service) => ({
    ...service,
    booking_enabled: canPubliclySellService(service, diviner),
  }));
  const hasUnavailablePaidServices = publicServices.some(
    (service) => service.booking_enabled === false
  );

  if (publicServices.length === 0) {
    notFound();
  }

  const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const profileUrl = `/${username}${refParam}`;

  const astroServices = publicServices.filter((s) => s.category === "astrology");
  const tarotServices = publicServices.filter((s) => s.category === "tarot");
  const otherServices = publicServices.filter(
    (s) => s.category !== "astrology" && s.category !== "tarot"
  );

  const avatarUrl = getDivinerAvatarUrl(diviner.avatar_url);

  return (
    <>
      {/* ===== TOP NAV ===== */}
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
            <span className="text-silver/40">Services</span>
          </div>
          <Link
            href={profileUrl}
            className="text-xs text-silver/60 transition-colors hover:text-gold"
          >
            View Profile
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-white/5 bg-cosmos-900 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(201,168,76,0.05)_0%,transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
          {/* Avatar */}
          <div className="mx-auto mb-5 relative size-20 overflow-hidden rounded-full border-2 border-gold/20">
            <Image
              src={avatarUrl}
              alt={diviner.display_name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>

          <h1 className="font-display text-3xl font-bold text-cream md:text-4xl lg:text-5xl">
            {diviner.display_name}&apos;s Services
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-silver/60">
            {buildPublicServicesIntro(publicServices)}
          </p>
          {hasUnavailablePaidServices && (
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-500/20 bg-amber-500/8 px-5 py-4 text-sm text-amber-100/85">
              Some paid services are temporarily unavailable while payment setup is being completed.
            </div>
          )}
        </div>
      </section>

      {/* ===== SERVICES GRID ===== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* Astrology section */}
          {astroServices.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-cream">
                <Star className="size-5 text-gold" />
                {getServiceCategoryLabel("astrology")} Readings
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {astroServices.map((service) => (
                  <ServiceIndexCard
                    key={service.id}
                    service={service}
                    username={username}
                    refParam={refParam}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tarot section */}
          {tarotServices.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-cream">
                <Sparkles className="size-5 text-gold" />
                {getServiceCategoryLabel("tarot")} Readings
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tarotServices.map((service) => (
                  <ServiceIndexCard
                    key={service.id}
                    service={service}
                    username={username}
                    refParam={refParam}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other services */}
          {otherServices.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-cream">
                Other Services
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otherServices.map((service) => (
                  <ServiceIndexCard
                    key={service.id}
                    service={service}
                    username={username}
                    refParam={refParam}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 font-display text-2xl font-semibold text-cream md:text-3xl">
            Not sure which reading is right for you?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-silver/60">
            Visit {diviner.display_name}&apos;s profile to learn more about their approach and expertise.
          </p>
          <Link
            href={profileUrl}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-gold/40 px-6 text-sm font-medium text-gold transition-all hover:border-gold/70 hover:bg-gold/5"
          >
            View Profile
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <PageTracker divinerId={diviner.id} path={`/${username}/services`} username={diviner.username} />
    </>
  );
}
