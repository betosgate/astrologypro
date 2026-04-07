import { createAdminClient } from '@/lib/supabase/admin'
import type { DivinerEntitlements } from './feature-gate'

/**
 * Fetch plan + add-on entitlements for a diviner by their diviners.id.
 * Uses the admin client so it bypasses RLS and is safe to call server-side.
 */
export async function getDivinerEntitlements(divinerId: string): Promise<DivinerEntitlements> {
  const admin = createAdminClient()

  // Fetch subscription and joined plan in parallel with active add-ons
  const [subResult, addonsResult] = await Promise.all([
    admin
      .from('diviner_plan_subscriptions')
      .select('status, diviner_plans(features)')
      .eq('diviner_id', divinerId)
      .maybeSingle(),
    admin
      .from('diviner_active_addons')
      .select('diviner_plan_addons(feature_key)')
      .eq('diviner_id', divinerId)
      .eq('status', 'active'),
  ])

  if (!subResult.data) {
    return { planFeatures: [], addonFeatures: [], isActive: false }
  }

  const subscription = subResult.data
  const isActive =
    subscription.status === 'active' || subscription.status === 'trialing'

  // Type-narrow the nested join — Supabase returns it as an object or null
  const plan = (subscription.diviner_plans as unknown) as { features: string[] } | null
  const planFeatures: string[] = Array.isArray(plan?.features) ? plan.features : []

  // Collect feature keys from active add-ons
  const addonFeatures: string[] = (addonsResult.data ?? [])
    .map((row) => {
      const addon = (row.diviner_plan_addons as unknown) as { feature_key: string } | null
      return addon?.feature_key ?? ''
    })
    .filter(Boolean)

  return { planFeatures, addonFeatures, isActive }
}
