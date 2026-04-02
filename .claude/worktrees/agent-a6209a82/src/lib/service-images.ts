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
