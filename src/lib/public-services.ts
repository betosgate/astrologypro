import { isFallbackManualService } from "@/lib/public-booking";

export interface PublicServiceShape {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  base_price?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  trigger_event?: string | null;
  [key: string]: unknown;
}

export function isTimeBasedPublicService(
  service: Pick<PublicServiceShape, "trigger_event" | "slug" | "name">
) {
  const triggerEvent = String(service.trigger_event ?? "").trim();
  const slug = String(service.slug ?? "").toLowerCase();
  const name = String(service.name ?? "").toLowerCase();

  return Boolean(
    triggerEvent ||
      slug.includes("return") ||
      slug.includes("transit") ||
      slug.includes("forecast") ||
      name.includes("return") ||
      name.includes("transit") ||
      name.includes("forecast")
  );
}

export function filterVisiblePublicServices<T extends PublicServiceShape>(services: T[]): T[] {
  return services.filter((service) => service.is_active !== false && !isFallbackManualService(service));
}

export function getHighlightedPublicService<T extends PublicServiceShape>(services: T[]): T | null {
  if (services.length === 0) return null;
  return services.find((service) => service.is_featured) ?? (services.length === 1 ? services[0] : null);
}

export function getServiceCategoryLabel(category: string | null | undefined) {
  switch ((category ?? "").toLowerCase()) {
    case "astrology":
      return "Astrology";
    case "tarot":
      return "Tarot";
    case "phone":
      return "Phone";
    case "freelance":
      return "Custom";
    default:
      return category ? category.charAt(0).toUpperCase() + category.slice(1) : "Service";
  }
}

export function buildPublicServicesIntro(services: PublicServiceShape[]) {
  const hasTimeBased = services.some((service) => isTimeBasedPublicService(service));
  const hasEvergreen = services.some((service) => !isTimeBasedPublicService(service));
  const categories = Array.from(
    new Set(
      services
        .map((service) => service.category)
        .filter((category): category is string => typeof category === "string" && category.length > 0)
    )
  );

  if (hasTimeBased && hasEvergreen) {
    return "Explore the readings this diviner currently offers, from major timing cycles to evergreen guidance.";
  }
  if (hasTimeBased) {
    return "Explore the time-based readings this diviner currently offers for major cycles, returns, and forecasting work.";
  }
  if (hasEvergreen && categories.length === 1) {
    return `Explore the ${getServiceCategoryLabel(categories[0]).toLowerCase()} readings this diviner currently offers.`;
  }
  return "Explore the readings this diviner currently offers right now.";
}
