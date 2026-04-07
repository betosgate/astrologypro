import { createAdminClient } from '@/lib/supabase/admin'

export type EventCategory =
  | 'auth'
  | 'booking'
  | 'payment'
  | 'reading'
  | 'profile'
  | 'subscription'
  | 'admin'
  | 'system'

export interface LogActivityParams {
  userId: string
  actorId?: string
  eventCategory: EventCategory
  eventType: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Fire-and-forget activity logger. Never awaited, never blocks a response.
 * Uses the service-role admin client so it bypasses RLS and always succeeds
 * regardless of which user (or no user) is making the request.
 */
export function logActivity(params: LogActivityParams): void {
  createAdminClient()
    .from('user_activity_log')
    .insert({
      user_id: params.userId,
      actor_id: params.actorId ?? null,
      event_category: params.eventCategory,
      event_type: params.eventType,
      metadata: params.metadata ?? {},
      ip_address: params.ipAddress ?? null,
    })
    .then(() => {}, () => {})
}
