/**
 * Maps service slugs to their product images in /images/services/.
 * Image filenames match the slug with .png extension.
 */
const SERVICE_IMAGE_SLUGS = new Set([
  "natal-chart",
  "solar-return",
  "monthly-transit",
  "saturn-return",
  "jupiter-return",
  "weekly-transits",
  "romantic-relationships",
  "friendship-relationships",
  "business-relationships",
  "horary",
  "astrology-freelance",
  "3-card-basic",
  "5-card-complex",
  "7-card-forecast",
  "7-card-horseshoe",
  "10-card-relationship",
  "10-card-celtic-cross",
  "12-card-astrological",
  "tarot-freelance",
]);

export function getServiceImageUrl(slug: string): string | null {
  if (SERVICE_IMAGE_SLUGS.has(slug)) {
    return `/images/services/${slug}.png`;
  }
  return null;
}

/**
 * Maps /readings/[slug] page slugs to their service image filename.
 * Used for OG image metadata on reading landing pages.
 */
const READING_SLUG_TO_IMAGE: Record<string, string> = {
  "nativity-birth-chart": "natal-chart",
  "solar-return": "solar-return",
  "saturn-return": "saturn-return",
  "jupiter-return": "jupiter-return",
  "weekly-transits": "weekly-transits",
  "monthly-transits-lunar-return": "monthly-transit",
  "romantic-relationships": "romantic-relationships",
  "friendship-relationships": "friendship-relationships",
  "business-relationship": "business-relationships",
  "predictive-event-horary": "horary",
  "3-card-basic-question-spread": "3-card-basic",
  "5-card-complex-question-spread": "5-card-complex",
  "7-card-6-month-forward-review": "7-card-forecast",
  "7-card-horseshoe-spread-major-read": "7-card-horseshoe",
  "10-card-relationship-spread": "10-card-relationship",
  "10-card-celtic-cross-major-read": "10-card-celtic-cross",
  "12-card-astrological-spread-major-read": "12-card-astrological",
};

const APP_BASE = "https://astrologypro.com";
const DEFAULT_OG = `${APP_BASE}/images/home/og-card.jpg`;

/**
 * Returns a full absolute OG image URL for a given reading page slug.
 * Falls back to the site-wide OG card if no specific image exists.
 */
export function getReadingOgImageUrl(readingSlug: string): string {
  const imageKey = READING_SLUG_TO_IMAGE[readingSlug];
  if (imageKey) return `${APP_BASE}/images/services/${imageKey}.png`;
  return DEFAULT_OG;
}
