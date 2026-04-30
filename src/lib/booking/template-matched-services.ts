/**
 * Template → compatible diviner-services resolver.
 *
 * Single source of truth for "who can I actually book this template with?".
 * Extracted from the discover page so both the discover flow and the new
 * `/book/template/[slug]` shared-calendar flow apply identical rules.
 *
 * A service is considered compatible when ALL of these hold:
 *   1. service.template_id == the resolved canonical template
 *   2. service.is_active = true
 *   3. diviners row is active + onboarding_completed + account_status='active'
 *      + charges_enabled = true
 *   4. diviner_services row exists for (diviner_id, template_id) with
 *      is_enabled AND is_published
 *   5. canPubliclySellService(service, diviner) passes
 *
 * See tasks/23.04.2026/book-without-diviner-flow/00-implementation-note.md
 * for the full audit.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { canPubliclySellService } from "@/lib/payout-readiness";
import { getBaseServiceTemplateSlug } from "@/lib/service-template-form";

type AnySupabase = SupabaseClient<any, any, any>;

export interface TemplateMatch {
  template: {
    id: string;
    slug: string;
    name: string;
    category: "astrology" | "tarot";
    description: string | null;
    duration_minutes: number | null;
    base_price: number | null;
  };
  baseSlug: string;
  diviners: TemplateMatchedDiviner[];
}

export interface TemplateMatchedDiviner {
  divinerId: string;
  username: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  specialties: string[];
  averageRating: number | null;
  reviewCount: number;
  completedSessions: number;
  timezone: string | null;
  // Matched service row (so the handoff URL can use its slug directly)
  service: {
    id: string;
    slug: string;
    name: string;
    category: "astrology" | "tarot";
    basePrice: number;
    durationMinutes: number;
  };
}

/**
 * Look up compatible diviners for a template slug. Handles the `general-*`
 * alias by resolving to the canonical base slug.
 *
 * Returns `null` when no matching active template exists — callers should
 * treat that as 404 / not-found.
 */
export async function resolveTemplateMatches(
  admin: AnySupabase,
  rawSlug: string,
): Promise<TemplateMatch | null> {
  const trimmed = rawSlug.trim();
  if (!trimmed) return null;
  const baseSlug = getBaseServiceTemplateSlug(trimmed);

  const { data: template } = await admin
    .from("service_templates")
    .select("id, slug, name, category, description, duration_minutes, base_price")
    .eq("slug", baseSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!template) return null;

  const category = (template.category as string) === "tarot" ? "tarot" : "astrology";

  // Services that target this template.
  //
  // Older/custom services may predate `services.template_id` and only carry
  // the canonical slug. They are still eligible if the diviner has an enabled
  // + published diviner_services assignment for this template; otherwise a
  // live diviner can be invisible to the shared template calendar even though
  // their availability is attached to the right service slug.
  const { data: services } = await admin
    .from("services")
    .select(
      "id, slug, name, category, base_price, duration_minutes, diviner_id, template_id, " +
        "diviners!inner(id, username, display_name, tagline, bio, avatar_url, specialties, is_certified, is_active, onboarding_completed, account_status, charges_enabled, payouts_enabled, stripe_account_id, timezone)",
    )
    .or(`template_id.eq.${template.id},slug.eq.${baseSlug}`)
    .eq("is_active", true);

  if (!services || services.length === 0) {
    return {
      template: {
        id: template.id as string,
        slug: template.slug as string,
        name: template.name as string,
        category,
        description: (template.description as string | null) ?? null,
        duration_minutes: (template.duration_minutes as number | null) ?? null,
        base_price: (template.base_price as number | null) ?? null,
      },
      baseSlug,
      diviners: [],
    };
  }

  // Published diviner_services gate — only enabled + published count.
  const { data: publishedRows } = await admin
    .from("diviner_services")
    .select("diviner_id")
    .eq("template_id", template.id)
    .eq("is_enabled", true)
    .eq("is_published", true);
  const publishedDivinerIds = new Set(
    (publishedRows ?? []).map((row) => row.diviner_id as string),
  );

  const visibleServices = (services as unknown as Array<
    Record<string, unknown>
  >).filter((row) => {
    const divinerId = (row.diviner_id as string) ?? "";
    if (!publishedDivinerIds.has(divinerId)) return false;
    const divinerRelation = row.diviners;
    const diviner = Array.isArray(divinerRelation)
      ? divinerRelation[0]
      : divinerRelation;
    if (!diviner || typeof diviner !== "object") return false;
    return canPubliclySellService(row, diviner as Record<string, unknown>);
  });

  if (visibleServices.length === 0) {
    return {
      template: {
        id: template.id as string,
        slug: template.slug as string,
        name: template.name as string,
        category,
        description: (template.description as string | null) ?? null,
        duration_minutes: (template.duration_minutes as number | null) ?? null,
        base_price: (template.base_price as number | null) ?? null,
      },
      baseSlug,
      diviners: [],
    };
  }

  // Hydrate ratings + completed-sessions counts.
  const divinerIds = [
    ...new Set(
      visibleServices.map((row) => (row.diviner_id as string) ?? "").filter(Boolean),
    ),
  ];
  const serviceIds = [
    ...new Set(
      visibleServices.map((row) => (row.id as string) ?? "").filter(Boolean),
    ),
  ];

  const [testimonialsRes, bookingsRes, availabilityTemplatesRes] = await Promise.all([
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
      .select("service_id, duration_minutes, created_at")
      .in("service_id", serviceIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const ratingsByDiviner = new Map<string, number[]>();
  for (const row of testimonialsRes.data ?? []) {
    const key = row.diviner_id as string | null;
    if (!key) continue;
    if (typeof row.rating !== "number") continue;
    const arr = ratingsByDiviner.get(key) ?? [];
    arr.push(row.rating);
    ratingsByDiviner.set(key, arr);
  }
  const sessionsByDiviner = new Map<string, number>();
  for (const row of bookingsRes.data ?? []) {
    const key = row.diviner_id as string | null;
    if (!key) continue;
    sessionsByDiviner.set(key, (sessionsByDiviner.get(key) ?? 0) + 1);
  }
  const availabilityDurationByService = new Map<string, number>();
  for (const row of availabilityTemplatesRes.data ?? []) {
    const serviceId = row.service_id as string | null;
    if (!serviceId || availabilityDurationByService.has(serviceId)) continue;
    if (typeof row.duration_minutes === "number" && row.duration_minutes > 0) {
      availabilityDurationByService.set(serviceId, row.duration_minutes);
    }
  }

  // Dedup so each diviner appears once even if multiple services under the
  // template match. Pick the service with the lowest base_price — that's the
  // one surfaced when we hand off to /{username}/book/{serviceSlug}. Prefer an
  // explicit template_id match over a legacy slug-only match when both exist.
  const byDiviner = new Map<string, TemplateMatchedDiviner>();
  const explicitTemplateMatchByDiviner = new Map<string, boolean>();
  for (const row of visibleServices) {
    const divinerRelation = row.diviners;
    const diviner = (Array.isArray(divinerRelation)
      ? divinerRelation[0]
      : divinerRelation) as Record<string, unknown>;
    const divinerId = diviner.id as string;
    const svcCategory =
      ((row.category as string) === "tarot" ? "tarot" : "astrology") as
        | "astrology"
        | "tarot";
    const servicePayload = {
      id: row.id as string,
      slug: row.slug as string,
      name: (row.name as string) ?? "Session",
      category: svcCategory,
      basePrice: Number(row.base_price ?? 0),
      durationMinutes:
        Number(
          availabilityDurationByService.get(row.id as string) ??
            row.duration_minutes ??
            template.duration_minutes ??
            0,
        ) || 0,
    };
    const isExplicitTemplateMatch = row.template_id === template.id;

    const existing = byDiviner.get(divinerId);
    if (existing) {
      const existingIsExplicit =
        explicitTemplateMatchByDiviner.get(divinerId) === true;
      if (existingIsExplicit && !isExplicitTemplateMatch) {
        continue;
      }
      if (
        existingIsExplicit === isExplicitTemplateMatch &&
        existing.service.basePrice <= servicePayload.basePrice
      ) {
        continue; // keep the cheaper matched service
      }
    }

    const ratings = ratingsByDiviner.get(divinerId) ?? [];
    byDiviner.set(divinerId, {
      divinerId,
      username: diviner.username as string,
      displayName: diviner.display_name as string,
      tagline: (diviner.tagline as string | null) ?? null,
      bio: (diviner.bio as string | null) ?? null,
      avatarUrl: (diviner.avatar_url as string | null) ?? null,
      isCertified: diviner.is_certified === true,
      specialties: Array.isArray(diviner.specialties)
        ? (diviner.specialties as string[])
        : [],
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : null,
      reviewCount: ratings.length,
      completedSessions: sessionsByDiviner.get(divinerId) ?? 0,
      timezone: (diviner.timezone as string | null) ?? null,
      service: servicePayload,
    });
    explicitTemplateMatchByDiviner.set(divinerId, isExplicitTemplateMatch);
  }

  const diviners = [...byDiviner.values()];

  // Cap to avoid pathological fan-out on month availability.
  const MAX_COMPATIBLE_DIVINERS = 20;
  if (diviners.length > MAX_COMPATIBLE_DIVINERS) {
    console.warn(
      `[template-matched-services] ${diviners.length} compatible diviners for template=${baseSlug}; capping at ${MAX_COMPATIBLE_DIVINERS}.`,
    );
  }
  const capped = diviners.slice(0, MAX_COMPATIBLE_DIVINERS);

  return {
    template: {
      id: template.id as string,
      slug: template.slug as string,
      name: template.name as string,
      category,
      description: (template.description as string | null) ?? null,
      duration_minutes: (template.duration_minutes as number | null) ?? null,
      base_price: (template.base_price as number | null) ?? null,
    },
    baseSlug,
    diviners: capped,
  };
}

/** Stable default ordering (no-date context). See `rankDinersForDate` for
 * date-aware ordering used on the shared calendar. */
export function sortDivinersDefault(
  diviners: TemplateMatchedDiviner[],
): TemplateMatchedDiviner[] {
  return [...diviners].sort((a, b) => {
    if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
    const ar = a.averageRating ?? 0;
    const br = b.averageRating ?? 0;
    if (Math.abs(br - ar) > 0.001) return br - ar;
    if (a.completedSessions !== b.completedSessions)
      return b.completedSessions - a.completedSessions;
    return a.service.basePrice - b.service.basePrice;
  });
}
