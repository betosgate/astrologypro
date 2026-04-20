/**
 * Maps canonical service/template slugs to product image filenames in
 * /images/services/. Some older callers still pass the filename slug directly,
 * so those aliases are included too.
 */
const SERVICE_SLUG_TO_IMAGE: Record<string, string> = {
  "nativity-birth-chart": "natal-chart",
  "natal-chart": "natal-chart",
  "solar-return": "solar-return",
  "monthly-transits-lunar-return": "monthly-transit",
  "monthly-transit": "monthly-transit",
  "saturn-return": "saturn-return",
  "jupiter-return": "jupiter-return",
  "weekly-transits": "weekly-transits",
  "romantic-relationships": "romantic-relationships",
  "friendship-relationships": "friendship-relationships",
  "business-relationship": "business-relationships",
  "business-relationships": "business-relationships",
  "predictive-event-horary": "horary",
  horary: "horary",
  "mars-return": "astrology-freelance",
  "uranus-opposition": "astrology-freelance",
  "astrology-freelance": "astrology-freelance",
  "3-card-basic-question-spread": "3-card-basic",
  "3-card-basic": "3-card-basic",
  "5-card-complex-question-spread": "5-card-complex",
  "5-card-complex": "5-card-complex",
  "7-card-6-month-forward-review": "7-card-forecast",
  "7-card-forecast": "7-card-forecast",
  "7-card-horseshoe-spread-major-read": "7-card-horseshoe",
  "7-card-horseshoe": "7-card-horseshoe",
  "10-card-relationship-spread": "10-card-relationship",
  "10-card-relationship": "10-card-relationship",
  "10-card-celtic-cross-major-read": "10-card-celtic-cross",
  "10-card-celtic-cross": "10-card-celtic-cross",
  "12-card-astrological-spread-major-read": "12-card-astrological",
  "12-card-astrological": "12-card-astrological",
  "tarot-freelance": "tarot-freelance",
};

export function getServiceImageUrl(slug: string): string | null {
  const imageKey = SERVICE_SLUG_TO_IMAGE[slug];
  return imageKey ? `/images/services/${imageKey}.png` : null;
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
  "mars-return": "astrology-freelance",
  "uranus-opposition": "astrology-freelance",
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

export function getReadingImageUrl(readingSlug: string): string | null {
  const imageKey = READING_SLUG_TO_IMAGE[readingSlug];
  return imageKey ? `/images/services/${imageKey}.png` : null;
}
