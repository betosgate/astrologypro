/**
 * Structured-data (JSON-LD) builders for diviner public pages.
 *
 * All builders return plain objects. Callers stringify and inject them via
 *   <script type="application/ld+json" dangerouslySetInnerHTML=... />
 *
 * Design rules:
 * - Local claims (city, country, geo) only emitted when DB fields are set
 * - Aggregate rating only emitted when reviewCount >= MIN_RATING_COUNT
 * - Remote-global flag drives areaServed and availableChannel output
 * - sameAs only populated from explicitly stored URLs
 */

import { APP_URL } from "@/lib/constants";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";

// ── Minimum thresholds ───────────────────────────────────────────────────────

const MIN_RATING_COUNT = 3; // below this, do not emit AggregateRating

// ── Shared field types ───────────────────────────────────────────────────────

export type ServiceSchemaInput = {
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  duration_minutes?: number | null;
  category?: string | null;
};

export type DivinerSchemaInput = {
  username: string;
  display_name: string;
  bio?: string | null;
  tagline?: string | null;
  avatar_url?: string | null;
  specialties?: string[] | null;
  // SEO fields
  seo_city?: string | null;
  seo_region?: string | null;
  seo_country?: string | null;
  seo_country_code?: string | null;
  seo_is_remote_global?: boolean | null;
  seo_service_area_mode?: string | null;
  seo_service_areas?: string[] | null;
  seo_languages?: string[] | null;
  seo_credentials?: string[] | null;
  seo_years_experience?: number | null;
  seo_same_as_urls?: string[] | null;
  seo_show_aggregate_rating?: boolean | null;
  seo_show_testimonials_in_schema?: boolean | null;
};

export type RatingInput = {
  averageRating: number | null;
  reviewCount: number;
};

// ── Profile page schema graph ────────────────────────────────────────────────

/**
 * Builds the full @graph for the diviner profile page.
 * Emits: Person + ProfessionalService + Service[] + AggregateRating (conditional)
 */
export function buildProfileSchemaGraph(
  diviner: DivinerSchemaInput,
  services: ServiceSchemaInput[],
  rating: RatingInput,
) {
  const profileUrl = `${APP_URL}/${diviner.username}`;
  const avatarUrl = getDivinerAvatarUrl(diviner.avatar_url ?? null);

  // ── Person node ────────────────────────────────────────────────────────
  const personNode: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: diviner.display_name,
    url: profileUrl,
    ...(avatarUrl && { image: avatarUrl }),
    ...(diviner.bio && { description: diviner.bio }),
    ...(diviner.seo_same_as_urls && diviner.seo_same_as_urls.length > 0 && {
      sameAs: diviner.seo_same_as_urls,
    }),
    ...(diviner.seo_languages && diviner.seo_languages.length > 0 && {
      knowsLanguage: diviner.seo_languages,
    }),
    ...(diviner.specialties && diviner.specialties.length > 0 && {
      hasOccupation: {
        "@type": "Occupation",
        name: diviner.specialties[0],
        skills: diviner.specialties.join(", "),
      },
    }),
  };

  // ── ProfessionalService node ───────────────────────────────────────────
  const serviceNodeBase: Record<string, unknown> = {
    "@type": "ProfessionalService",
    "@id": `${profileUrl}#service`,
    name: diviner.display_name,
    url: profileUrl,
    provider: { "@id": `${profileUrl}#person` },
    ...(diviner.tagline && { description: diviner.tagline }),
    ...(avatarUrl && { image: avatarUrl }),
    ...(diviner.specialties && diviner.specialties.length > 0 && {
      serviceType: diviner.specialties,
    }),
  };

  // Geography — only when DB fields confirm it
  if (diviner.seo_city && diviner.seo_country) {
    serviceNodeBase.address = {
      "@type": "PostalAddress",
      addressLocality: diviner.seo_city,
      ...(diviner.seo_region && { addressRegion: diviner.seo_region }),
      addressCountry: diviner.seo_country_code ?? diviner.seo_country,
    };
  }

  // Service area
  if (diviner.seo_is_remote_global) {
    serviceNodeBase.areaServed = "Worldwide";
    serviceNodeBase.availableChannel = {
      "@type": "ServiceChannel",
      serviceType: "Online",
      availableLanguage: diviner.seo_languages ?? ["English"],
    };
  } else if (diviner.seo_service_areas && diviner.seo_service_areas.length > 0) {
    serviceNodeBase.areaServed = diviner.seo_service_areas;
  }

  // Price range from services
  if (services.length > 0) {
    const prices = services.map((s) => Number(s.base_price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    serviceNodeBase.priceRange = min === max ? `$${min}` : `$${min} – $${max}`;
  }

  // Aggregate rating — only when threshold met and policy allows
  const canShowRating =
    diviner.seo_show_aggregate_rating !== false &&
    rating.averageRating !== null &&
    rating.reviewCount >= MIN_RATING_COUNT;

  if (canShowRating) {
    serviceNodeBase.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.averageRating!.toFixed(1),
      reviewCount: rating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // ── Service offering nodes ─────────────────────────────────────────────
  const offeringNodes = services.map((svc) => ({
    "@type": "Service",
    "@id": `${profileUrl}/services/${svc.slug}#service`,
    name: svc.name,
    ...(svc.description && { description: svc.description }),
    provider: { "@id": `${profileUrl}#person` },
    ...(svc.duration_minutes && {
      duration: `PT${svc.duration_minutes}M`,
    }),
    ...(svc.category && { serviceType: svc.category }),
    offers: {
      "@type": "Offer",
      price: Number(svc.base_price).toFixed(2),
      priceCurrency: "USD",
      url: `${profileUrl}/services/${svc.slug}`,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [personNode, serviceNodeBase, ...offeringNodes],
  };
}

// ── Service detail page schema graph ────────────────────────────────────────

export function buildServiceDetailSchemaGraph(
  diviner: DivinerSchemaInput,
  service: ServiceSchemaInput,
  breadcrumbs: { name: string; url: string }[],
) {
  const profileUrl = `${APP_URL}/${diviner.username}`;
  const serviceUrl = `${profileUrl}/services/${service.slug}`;

  const graph: unknown[] = [
    {
      "@type": "Service",
      "@id": `${serviceUrl}#service`,
      name: service.name,
      ...(service.description && { description: service.description }),
      provider: {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        name: diviner.display_name,
        url: profileUrl,
      },
      ...(service.duration_minutes && { duration: `PT${service.duration_minutes}M` }),
      ...(service.category && { serviceType: service.category }),
      offers: {
        "@type": "Offer",
        price: Number(service.base_price).toFixed(2),
        priceCurrency: "USD",
        url: serviceUrl,
        availability: "https://schema.org/InStock",
      },
      ...(diviner.seo_is_remote_global && {
        availableChannel: {
          "@type": "ServiceChannel",
          serviceType: "Online",
          availableLanguage: diviner.seo_languages ?? ["English"],
        },
      }),
    },
  ];

  // BreadcrumbList
  if (breadcrumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
