// Feature keys that can be gated by plan
export const FEATURES = {
  PUBLIC_PROFILE: 'public_profile',
  PRODUCT_CATALOG: 'product_catalog',
  BOOKING_SYSTEM: 'booking_system',
  CUSTOMER_MANAGEMENT: 'customer_management',
  TESTIMONIALS: 'testimonials',
  MEDIA_GALLERY: 'media_gallery',
  LIVE_SESSIONS: 'live_sessions',
  CHECK_IN: 'check_in',
  GIVEAWAYS: 'giveaways',
  AFFILIATE_MANAGEMENT: 'affiliate_management',
  ANALYTICS: 'analytics',
  AI_QUESTION_HELPER: 'ai_question_helper',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

export interface DivinerEntitlements {
  planFeatures: string[]
  addonFeatures: string[]
  isActive: boolean
}

/**
 * Check if a diviner has access to a specific feature.
 * Pass the result of getDivinerEntitlements() for efficiency.
 */
export function hasFeature(entitlements: DivinerEntitlements, feature: FeatureKey): boolean {
  if (!entitlements.isActive) return false
  return (
    entitlements.planFeatures.includes(feature) ||
    entitlements.addonFeatures.includes(feature)
  )
}
