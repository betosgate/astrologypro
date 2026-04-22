import { createAdminClient } from "@/lib/supabase/admin";
import { canPubliclySellService } from "@/lib/payout-readiness";
import type { ServiceTemplateFormConfig } from "@/lib/service-template-form";

export interface ServiceTemplateLanding {
  id: string;
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
  is_primary: boolean;
  requires_birth_data: boolean;
  trigger_event: string | null;
  sort_order: number;
  whats_included?: string[];
  who_its_for?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

export interface ServiceLandingDiviner {
  divinerId: string;
  username: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
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

export async function getServiceLandingTemplates() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_templates")
    .select("*")
    .eq("is_active", true)           // Task 05: only show admin-active templates
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[service-landings] Failed to load templates:", error.message);
    return [];
  }

  return (data ?? []) as ServiceTemplateLanding[];
}

export async function getServiceLandingTemplate(slug: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[service-landings] Failed to load template:", error.message);
    return null;
  }

  return (data as ServiceTemplateLanding | null) ?? null;
}

export async function getServiceLandingDiviners(serviceSlug: string) {
  const admin = createAdminClient();

  // Task 05: first resolve the template_id for this slug so we can check diviner_services
  const { data: template } = await admin
    .from("service_templates")
    .select("id")
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .maybeSingle();

  const { data: services, error } = await admin
    .from("services")
    .select(
      "id, slug, name, description, duration_minutes, base_price, category, diviner_id, template_id, " +
        "diviners!inner(id, username, display_name, tagline, bio, avatar_url, is_certified, specialties, is_active, onboarding_completed, account_status, charges_enabled, payouts_enabled, stripe_account_id)",
    )
    .eq("slug", serviceSlug)
    .eq("is_active", true);

  if (error || !services) {
    console.error("[service-landings] Failed to load service-only diviners:", error?.message);
    return [];
  }

  // Task 05: fetch all diviner_services rows that are enabled+published for this template
  // Freestyle services (template_id = null) skip this check
  let publishedDivinerIds: Set<string> | null = null;
  if (template) {
    const { data: ds } = await admin
      .from("diviner_services")
      .select("diviner_id")
      .eq("template_id", template.id)
      .eq("is_enabled", true)
      .eq("is_published", true);
    publishedDivinerIds = new Set((ds ?? []).map((r) => r.diviner_id));
  }

  const visibleServices = (services as unknown as Array<Record<string, unknown>>).filter((row) => {
    // Task 05: enforce access control — skip diviners who haven't published this template
    if (template && publishedDivinerIds !== null) {
      const divinerId = (row.diviner_id as string) ?? "";
      if (!publishedDivinerIds.has(divinerId)) return false;
    }
    // Freestyle services (no template): skip access control check
    const divinerRelation = row.diviners;
    const diviner = Array.isArray(divinerRelation) ? divinerRelation[0] : divinerRelation;
    if (!diviner || typeof diviner !== "object") return false;

    return canPubliclySellService(row, diviner as Record<string, unknown>);
  });

  const divinerIds = visibleServices
    .map((row) => {
      const divinerRelation = row.diviners;
      const diviner = Array.isArray(divinerRelation) ? divinerRelation[0] : divinerRelation;
      return typeof (diviner as { id?: unknown })?.id === "string"
        ? ((diviner as { id: string }).id)
        : "";
    })
    .filter(Boolean);

  const [{ data: testimonials }, { data: bookings }, { data: templates }, { data: weeklySlots }] =
    await Promise.all([
      divinerIds.length
        ? admin
            .from("testimonials")
            .select("diviner_id, rating")
            .in("diviner_id", divinerIds)
            .eq("status", "approved")
        : Promise.resolve({ data: [] }),
      divinerIds.length
        ? admin
            .from("bookings")
            .select("diviner_id")
            .in("diviner_id", divinerIds)
            .eq("status", "completed")
        : Promise.resolve({ data: [] }),
      divinerIds.length
        ? admin
            .from("availability_templates")
            .select("diviner_id, owner_id, is_active")
            .or(divinerIds.map((id) => `diviner_id.eq.${id},owner_id.eq.${id}`).join(","))
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      divinerIds.length
        ? admin
            .from("availability_slots")
            .select("diviner_id, owner_id, is_active")
            .or(divinerIds.map((id) => `diviner_id.eq.${id},owner_id.eq.${id}`).join(","))
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
    ]);

  const ratingsByDiviner = new Map<string, number[]>();
  for (const row of testimonials ?? []) {
    if (!row.diviner_id) continue;
    const key = row.diviner_id;
    if (!ratingsByDiviner.has(key)) ratingsByDiviner.set(key, []);
    if (typeof row.rating === "number") ratingsByDiviner.get(key)?.push(row.rating);
  }

  const completedSessionsByDiviner = new Map<string, number>();
  for (const row of bookings ?? []) {
    if (!row.diviner_id) continue;
    completedSessionsByDiviner.set(
      row.diviner_id,
      (completedSessionsByDiviner.get(row.diviner_id) ?? 0) + 1,
    );
  }

  const availabilityByDiviner = new Set<string>();
  for (const row of [...(templates ?? []), ...(weeklySlots ?? [])]) {
    const key =
      (typeof row.diviner_id === "string" && row.diviner_id) ||
      (typeof row.owner_id === "string" && row.owner_id) ||
      "";
    if (key) availabilityByDiviner.add(key);
  }

  const rows = visibleServices.map((row) => {
    const divinerRelation = row.diviners;
    const diviner = (Array.isArray(divinerRelation)
      ? divinerRelation[0]
      : divinerRelation) as Record<string, unknown>;
    const divinerId = diviner.id as string;
    const ratings = ratingsByDiviner.get(divinerId) ?? [];

    return {
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
      price: Number(row.base_price ?? 0),
      durationMinutes: Number(row.duration_minutes ?? 0),
      completedSessions: completedSessionsByDiviner.get(divinerId) ?? 0,
      reviewCount: ratings.length,
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      availabilityConfigured: availabilityByDiviner.has(divinerId),
    } satisfies ServiceLandingDiviner;
  });

  return rows.sort((left, right) => {
    if (left.availabilityConfigured !== right.availabilityConfigured) {
      return left.availabilityConfigured ? -1 : 1;
    }
    if (left.isCertified !== right.isCertified) {
      return left.isCertified ? -1 : 1;
    }
    if (right.completedSessions !== left.completedSessions) {
      return right.completedSessions - left.completedSessions;
    }
    return left.price - right.price;
  });
}
