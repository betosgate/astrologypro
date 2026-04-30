import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { DiscoverFilters } from "./discover-filters";
import { APP_URL } from "@/lib/constants";
import { getBaseServiceTemplateSlug } from "@/lib/service-template-form";
import { canPubliclySellService } from "@/lib/payout-readiness";

// Cookie read requires dynamic rendering — cannot use ISR
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Find a Diviner | AstrologyPro",
    description:
      "Browse certified astrologers, tarot readers, and oracle practitioners. Book a personal reading today.",
    openGraph: {
      title: "Find a Diviner | AstrologyPro",
      description:
        "Browse certified astrologers, tarot readers, and oracle practitioners. Book a natal chart reading, compatibility report, tarot spread, and more.",
      type: "website",
      url: `${APP_URL}/discover`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Find a Diviner | AstrologyPro",
      description:
        "Browse certified astrologers, tarot readers, and oracle practitioners. Book a personal reading today.",
    },
  };
}

export type DivinerSubType = "astrologer" | "tarot" | "oracle";

export interface DivinerCard {
  username: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isCertified: boolean;
  specialties: string[];
  subType: DivinerSubType;
  startingPrice: number | null;
  reviewCount: number;
  averageRating: number | null;
  completedSessions: number;
  availabilityConfigured?: boolean;
  matchedServiceSlug?: string | null;
  matchedTemplateSlug?: string | null;
}

async function getActiveDiviners(): Promise<DivinerCard[]> {
  const admin = createAdminClient();

  // Fetch all active, onboarding-complete diviners
  const { data: diviners, error } = await admin
    .from("diviners")
    .select(
      "id, username, display_name, tagline, bio, avatar_url, cover_image_url, specialties, is_certified"
    )
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("account_status", "active")
    .eq("charges_enabled", true);

  if (error || !diviners || diviners.length === 0) return [];

  const divinerIds = diviners.map((d) => d.id as string);

  // Fetch all services for these diviners in one query
  const { data: allServices } = await admin
    .from("services")
    .select("diviner_id, category, base_price")
    .in("diviner_id", divinerIds)
    .eq("is_active", true);

  // Fetch all approved testimonials (with ratings) in one query
  const { data: allTestimonials } = await admin
    .from("testimonials")
    .select("diviner_id, rating")
    .in("diviner_id", divinerIds)
    .eq("status", "approved");

  // Fetch completed session counts in one query via a group-by approach
  // We use a count per diviner via individual select with count — batch them
  const { data: allBookings } = await admin
    .from("bookings")
    .select("diviner_id")
    .in("diviner_id", divinerIds)
    .eq("status", "completed");

  // Build lookup maps
  const servicesByDiviner = new Map<string, { category: string; base_price: number }[]>();
  for (const svc of allServices ?? []) {
    const id = svc.diviner_id as string;
    if (!servicesByDiviner.has(id)) servicesByDiviner.set(id, []);
    servicesByDiviner.get(id)!.push({
      category: svc.category as string,
      base_price: Number(svc.base_price),
    });
  }

  const testimonialsByDiviner = new Map<string, number[]>();
  for (const t of allTestimonials ?? []) {
    const id = t.diviner_id as string;
    if (!testimonialsByDiviner.has(id)) testimonialsByDiviner.set(id, []);
    if (t.rating != null) testimonialsByDiviner.get(id)!.push(t.rating as number);
  }

  const sessionCountByDiviner = new Map<string, number>();
  for (const b of allBookings ?? []) {
    const id = b.diviner_id as string;
    sessionCountByDiviner.set(id, (sessionCountByDiviner.get(id) ?? 0) + 1);
  }

  const cards: DivinerCard[] = diviners.map((diviner) => {
    const id = diviner.id as string;
    const services = servicesByDiviner.get(id) ?? [];
    const ratings = testimonialsByDiviner.get(id) ?? [];
    const completedSessions = sessionCountByDiviner.get(id) ?? 0;

    // Derive sub-type from service categories
    const hasAstrology = services.some((s) => s.category === "astrology");
    const hasTarot = services.some((s) => s.category === "tarot");
    let subType: DivinerSubType = "astrologer";
    if (hasAstrology && hasTarot) subType = "oracle";
    else if (hasTarot) subType = "tarot";
    else subType = "astrologer"; // default / astrology-only

    // Starting price: minimum base_price across active services
    const startingPrice =
      services.length > 0
        ? Math.min(...services.map((s) => s.base_price))
        : null;

    // Average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : null;

    return {
      username: diviner.username as string,
      displayName: diviner.display_name as string,
      tagline: (diviner.tagline as string | null) ?? null,
      bio: (diviner.bio as string | null) ?? null,
      avatarUrl: (diviner.avatar_url as string | null) ?? null,
      coverImageUrl: (diviner.cover_image_url as string | null) ?? null,
      isCertified: !!(diviner.is_certified as boolean | null),
      specialties: (diviner.specialties as string[]) ?? [],
      subType,
      startingPrice,
      reviewCount: ratings.length,
      averageRating,
      completedSessions,
    };
  });

  // Default sort: certified first, then by review count desc, then by sessions desc
  cards.sort((a, b) => {
    if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    return b.completedSessions - a.completedSessions;
  });

  return cards;
}

async function getTemplateMatchedDiviners(templateSlug: string): Promise<{
  templateName: string | null;
  templateCategory: "astrology" | "tarot" | null;
  diviners: DivinerCard[];
}> {
  const admin = createAdminClient();
  const trimmedSlug = templateSlug.trim();
  const baseSlug = getBaseServiceTemplateSlug(trimmedSlug);

  const [baseTemplateResult, requestedTemplateResult] = await Promise.all([
    admin
      .from("service_templates")
      .select("id, name, slug, category")
      .eq("slug", baseSlug)
      .eq("is_active", true)
      .maybeSingle(),
    admin
      .from("service_templates")
      .select("id, name, slug, category")
      .eq("slug", trimmedSlug)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  const template = baseTemplateResult.data;
  const displayTemplate = requestedTemplateResult.data ?? template;

  if (!template) {
    return { templateName: null, templateCategory: null, diviners: [] };
  }

  const { data: services, error } = await admin
    .from("services")
    .select(
      "id, slug, base_price, category, duration_minutes, diviner_id, template_id, " +
        "diviners!inner(id, username, display_name, tagline, bio, avatar_url, cover_image_url, specialties, is_certified, is_active, onboarding_completed, account_status, charges_enabled, payouts_enabled, stripe_account_id)",
    )
    .or(`template_id.eq.${template.id},slug.eq.${baseSlug}`)
    .eq("is_active", true);

  if (error || !services || services.length === 0) {
    return {
      templateName: displayTemplate?.name ?? null,
      templateCategory: (displayTemplate?.category as "astrology" | "tarot" | null) ?? null,
      diviners: [],
    };
  }

  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select("diviner_id")
    .eq("template_id", template.id)
    .eq("is_enabled", true)
    .eq("is_published", true);

  const publishedDivinerIds = new Set((divinerServices ?? []).map((row) => row.diviner_id as string));

  const visibleServices = (services as Array<Record<string, unknown>>).filter((row) => {
    const divinerId = (row.diviner_id as string) ?? "";
    if (!publishedDivinerIds.has(divinerId)) return false;

    const divinerRelation = row.diviners;
    const diviner = Array.isArray(divinerRelation) ? divinerRelation[0] : divinerRelation;
    if (!diviner || typeof diviner !== "object") return false;

    return canPubliclySellService(row, diviner as Record<string, unknown>);
  });

  if (visibleServices.length === 0) {
    return {
      templateName: displayTemplate?.name ?? null,
      templateCategory: (displayTemplate?.category as "astrology" | "tarot" | null) ?? null,
      diviners: [],
    };
  }

  const dedupedServicesByDiviner = new Map<string, Record<string, unknown>>();
  const explicitTemplateMatchByDiviner = new Map<string, boolean>();
  for (const row of visibleServices) {
    const divinerId = (row.diviner_id as string) ?? "";
    if (!divinerId) continue;

    const isExplicitTemplateMatch = row.template_id === template.id;
    const existing = dedupedServicesByDiviner.get(divinerId);
    if (existing) {
      const existingIsExplicit =
        explicitTemplateMatchByDiviner.get(divinerId) === true;
      if (existingIsExplicit && !isExplicitTemplateMatch) continue;
      if (
        existingIsExplicit === isExplicitTemplateMatch &&
        Number(existing.base_price ?? 0) <= Number(row.base_price ?? 0)
      ) {
        continue;
      }
    }

    dedupedServicesByDiviner.set(divinerId, row);
    explicitTemplateMatchByDiviner.set(divinerId, isExplicitTemplateMatch);
  }

  const matchedServices = [...dedupedServicesByDiviner.values()];

  const divinerIds = matchedServices
    .map((row) => ((row.diviner_id as string) ?? ""))
    .filter(Boolean);

  const [{ data: testimonials }, { data: bookings }, { data: templates }, { data: weeklySlots }] =
    await Promise.all([
      admin
        .from("testimonials")
        .select("diviner_id, rating")
        .in("diviner_id", divinerIds)
        .eq("status", "approved"),
      admin
        .from("bookings")
        .select("diviner_id")
        .in("diviner_id", divinerIds)
        .eq("status", "completed"),
      admin
        .from("availability_templates")
        .select("diviner_id, owner_id, is_active")
        .or(divinerIds.map((id) => `diviner_id.eq.${id},owner_id.eq.${id}`).join(","))
        .eq("is_active", true),
      admin
        .from("availability_slots")
        .select("diviner_id, owner_id, is_active")
        .or(divinerIds.map((id) => `diviner_id.eq.${id},owner_id.eq.${id}`).join(","))
        .eq("is_active", true),
    ]);

  const ratingsByDiviner = new Map<string, number[]>();
  for (const row of testimonials ?? []) {
    const key = row.diviner_id as string | null;
    if (!key) continue;
    if (!ratingsByDiviner.has(key)) ratingsByDiviner.set(key, []);
    if (typeof row.rating === "number") ratingsByDiviner.get(key)?.push(row.rating);
  }

  const completedSessionsByDiviner = new Map<string, number>();
  for (const row of bookings ?? []) {
    const key = row.diviner_id as string | null;
    if (!key) continue;
    completedSessionsByDiviner.set(key, (completedSessionsByDiviner.get(key) ?? 0) + 1);
  }

  const availabilityByDiviner = new Set<string>();
  for (const row of [...(templates ?? []), ...(weeklySlots ?? [])]) {
    const key =
      (typeof row.diviner_id === "string" && row.diviner_id) ||
      (typeof row.owner_id === "string" && row.owner_id) ||
      "";
    if (key) availabilityByDiviner.add(key);
  }

  const cards = matchedServices.map((row) => {
    const divinerRelation = row.diviners;
    const diviner = (Array.isArray(divinerRelation)
      ? divinerRelation[0]
      : divinerRelation) as Record<string, unknown>;
    const divinerId = diviner.id as string;
    const ratings = ratingsByDiviner.get(divinerId) ?? [];
    const category = row.category as string;

    return {
      username: diviner.username as string,
      displayName: diviner.display_name as string,
      tagline: (diviner.tagline as string | null) ?? null,
      bio: (diviner.bio as string | null) ?? null,
      avatarUrl: (diviner.avatar_url as string | null) ?? null,
      coverImageUrl: (diviner.cover_image_url as string | null) ?? null,
      isCertified: diviner.is_certified === true,
      specialties: Array.isArray(diviner.specialties) ? (diviner.specialties as string[]) : [],
      subType: category === "tarot" ? "tarot" : "astrologer",
      startingPrice: Number(row.base_price ?? 0),
      reviewCount: ratings.length,
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      completedSessions: completedSessionsByDiviner.get(divinerId) ?? 0,
      availabilityConfigured: availabilityByDiviner.has(divinerId),
      matchedServiceSlug: (row.slug as string) ?? null,
      matchedTemplateSlug: template.slug as string,
    } satisfies DivinerCard;
  });

  cards.sort((left, right) => {
    if ((left.availabilityConfigured ?? false) !== (right.availabilityConfigured ?? false)) {
      return left.availabilityConfigured ? -1 : 1;
    }
    if (left.isCertified !== right.isCertified) {
      return left.isCertified ? -1 : 1;
    }
    const leftRating = left.averageRating ?? 0;
    const rightRating = right.averageRating ?? 0;
    if (Math.abs(rightRating - leftRating) > 0.001) {
      return rightRating - leftRating;
    }
    if (right.completedSessions !== left.completedSessions) {
      return right.completedSessions - left.completedSessions;
    }
    return (left.startingPrice ?? Number.MAX_SAFE_INTEGER) - (right.startingPrice ?? Number.MAX_SAFE_INTEGER);
  });

  return {
    templateName: (displayTemplate?.name as string | null) ?? null,
    templateCategory: (displayTemplate?.category as "astrology" | "tarot" | null) ?? null,
    diviners: cards,
  };
}

async function getPreferredDiviner(username: string): Promise<DivinerCard | null> {
  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select(
      "id, username, display_name, tagline, bio, avatar_url, cover_image_url, specialties, is_certified"
    )
    .eq("username", username)
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("account_status", "active")
    .eq("charges_enabled", true)
    .single();

  if (!diviner) return null;

  const id = diviner.id as string;

  const [servicesResult, testimonialsResult, bookingsResult] = await Promise.all([
    admin
      .from("services")
      .select("diviner_id, category, base_price")
      .eq("diviner_id", id)
      .eq("is_active", true),
    admin
      .from("testimonials")
      .select("rating")
      .eq("diviner_id", id)
      .eq("status", "approved"),
    admin
      .from("bookings")
      .select("diviner_id", { count: "exact", head: true })
      .eq("diviner_id", id)
      .eq("status", "completed"),
  ]);

  const services = (servicesResult.data ?? []).map((s) => ({
    category: s.category as string,
    base_price: Number(s.base_price),
  }));
  const ratings = (testimonialsResult.data ?? [])
    .filter((t) => t.rating != null)
    .map((t) => t.rating as number);
  const completedSessions = bookingsResult.count ?? 0;

  const hasAstrology = services.some((s) => s.category === "astrology");
  const hasTarot = services.some((s) => s.category === "tarot");
  let subType: DivinerSubType = "astrologer";
  if (hasAstrology && hasTarot) subType = "oracle";
  else if (hasTarot) subType = "tarot";

  const startingPrice =
    services.length > 0
      ? Math.min(...services.map((s) => s.base_price))
      : null;

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

  return {
    username: diviner.username as string,
    displayName: diviner.display_name as string,
    tagline: (diviner.tagline as string | null) ?? null,
    bio: (diviner.bio as string | null) ?? null,
    avatarUrl: (diviner.avatar_url as string | null) ?? null,
    coverImageUrl: (diviner.cover_image_url as string | null) ?? null,
    isCertified: !!(diviner.is_certified as boolean | null),
    specialties: (diviner.specialties as string[]) ?? [],
    subType,
    startingPrice,
    reviewCount: ratings.length,
    averageRating,
    completedSessions,
  };
}

interface PageProps {
  searchParams: Promise<{ template?: string; submission?: string; type?: string; search?: string; sort?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const preferredUsername = cookieStore.get("preferred_diviner")?.value ?? null;
  const params = await searchParams;
  const templateSlug = params.template?.trim() || "";

  const [{ diviners, templateName, templateCategory }, preferredDiviner] = await Promise.all([
    templateSlug ? getTemplateMatchedDiviners(templateSlug) : getActiveDiviners().then((rows) => ({
      diviners: rows,
      templateName: null,
      templateCategory: null,
    })),
    preferredUsername ? getPreferredDiviner(preferredUsername) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-[#06080f]">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-[#f5f0e8] md:text-5xl">
            {templateName ? `Choose a Diviner for ${templateName}` : "Find a Diviner"}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[#b8bcd0]/70">
            {templateName
              ? "Only diviners with an active, publicly bookable matching service are shown here."
              : "Browse certified astrologers, tarot readers, and oracle practitioners. Book a personal reading today."}
          </p>
        </div>
      </section>

      {/* All diviners with filters */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <DiscoverFilters
          diviners={diviners}
          total={diviners.length}
          preferredDiviner={templateSlug ? null : preferredDiviner}
          templateName={templateName}
          templateCategory={templateCategory}
        />
      </section>

      <MarketingFooter />
    </div>
  );
}
