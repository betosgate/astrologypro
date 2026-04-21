export const READING_PAGE_MAP: Record<string, string> = {
  "nativity-birth-chart": "/readings/nativity-birth-chart",
  "solar-return": "/readings/solar-return",
  "weekly-transits": "/readings/weekly-transits",
  "monthly-transits-lunar-return": "/readings/monthly-transits-lunar-return",
  "romantic-relationships": "/readings/romantic-relationships",
  "friendship-relationships": "/readings/friendship-relationships",
  "business-relationship": "/readings/business-relationship",
  "predictive-event-horary": "/readings/predictive-event-horary",
  "jupiter-return": "/readings/jupiter-return",
  "saturn-return": "/readings/saturn-return",
  "mars-return": "/readings/mars-return",
  "uranus-opposition": "/readings/uranus-opposition",
  "3-card-basic-question-spread": "/readings/3-card-basic-question-spread",
  "5-card-complex-question-spread": "/readings/5-card-complex-question-spread",
  "7-card-6-month-forward-review": "/readings/7-card-6-month-forward-review",
  "7-card-horseshoe-spread-major-read": "/readings/7-card-horseshoe-spread-major-read",
  "10-card-relationship-spread": "/readings/10-card-relationship-spread",
  "10-card-celtic-cross-major-read": "/readings/10-card-celtic-cross-major-read",
  "12-card-astrological-spread-major-read": "/readings/12-card-astrological-spread-major-read",
};

export function getReadingGuideUrl(slug: string) {
  return READING_PAGE_MAP[slug] ?? null;
}

export function isGeneralServiceTemplateSlug(slug: string) {
  return slug.startsWith("general-");
}

export function getServiceTemplatePublicPath(slug: string) {
  return `/services/${slug}`;
}
