/**
 * Central access check utility for diviner service landing pages.
 * This is the single source of truth for whether a diviner has
 * access to a service template's landing page.
 *
 * Created in Task 02 of the 2026-04-17 sprint.
 * Used by: Tasks 05, 07, Campaign Tasks 02-03.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivinerServiceRecord } from "@/types/diviner-service";

// ─────────────────────────────────────────────────────────────────────────────
// Core access checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a diviner has access to a specific service template.
 * Returns the diviner_services record if access is granted, null otherwise.
 *
 * Access is granted when:
 * 1. diviner_services row exists for (diviner_id, template_id)
 * 2. is_enabled = true
 * 3. Optionally: is_published = true (for public access)
 */
export async function checkDivinerServiceAccess(
  supabase: SupabaseClient,
  divinerId: string,
  templateId: string,
  requirePublished: boolean = false
): Promise<DivinerServiceRecord | null> {
  let query = supabase
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .eq("is_enabled", true);

  if (requirePublished) {
    query = query.eq("is_published", true);
  }

  const { data } = await query.maybeSingle();
  return (data as DivinerServiceRecord | null);
}

/**
 * Check if a service is publicly accessible for a diviner.
 * Used by public pages (/[username]/services/[slug]) and booking flow.
 *
 * Rules:
 * - Template-based services: must have diviner_services.is_enabled AND is_published
 * - Freestyle services (template_id = null): accessible if services.is_active = true
 */
export async function isServicePubliclyAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  serviceSlug: string
): Promise<boolean> {
  // 1. Get the service record
  const { data: service } = await supabase
    .from("services")
    .select("id, template_id, is_active")
    .eq("diviner_id", divinerId)
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) return false;

  // 2. Freestyle services (no template) are accessible if active
  if (!service.template_id) return true;

  // 3. Template-based services must be enabled AND published
  const access = await checkDivinerServiceAccess(
    supabase,
    divinerId,
    service.template_id,
    true
  );
  return access !== null;
}

/**
 * Check if a service is accessible from the diviner dashboard.
 * Dashboard access requires only is_enabled (not is_published).
 * Used by: /dashboard/services, /dashboard/landing-pages
 */
export async function isServiceDashboardAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  templateId: string
): Promise<boolean> {
  const access = await checkDivinerServiceAccess(supabase, divinerId, templateId, false);
  return access !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all enabled services for a diviner (with template details).
 * Used by diviner dashboard "My Landing Pages" section.
 */
export async function getDivinerEnabledServices(
  supabase: SupabaseClient,
  divinerId: string
): Promise<DivinerServiceWithTemplate[]> {
  const { data } = await supabase
    .from("diviner_services")
    .select(`
      *,
      service_templates (
        id, name, slug, category, description,
        base_price, duration_minutes, is_primary,
        requires_birth_data, trigger_event, sort_order
      )
    `)
    .eq("diviner_id", divinerId)
    .eq("is_enabled", true)
    .order("created_at", { ascending: true });

  return (data as DivinerServiceWithTemplate[]) ?? [];
}

/**
 * Get all published landing pages for a diviner.
 * Used by public-facing pages (/[username]/services) to show available services.
 */
export async function getDivinerPublishedLandingPages(
  supabase: SupabaseClient,
  divinerId: string
): Promise<DivinerServiceWithTemplate[]> {
  const { data } = await supabase
    .from("diviner_services")
    .select(`
      *,
      service_templates (
        id, name, slug, category, description,
        base_price, duration_minutes, is_primary,
        requires_birth_data, trigger_event, sort_order
      )
    `)
    .eq("diviner_id", divinerId)
    .eq("is_enabled", true)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  return (data as DivinerServiceWithTemplate[]) ?? [];
}

/**
 * Get a map of template_id -> access state for all of a diviner's services.
 * Used by the dashboard to render enabled/disabled/published states efficiently.
 */
export async function getDivinerServiceAccessMap(
  supabase: SupabaseClient,
  divinerId: string
): Promise<Map<string, { is_enabled: boolean; is_published: boolean; publish_status: string }>> {
  const { data } = await supabase
    .from("diviner_services")
    .select("template_id, is_enabled, is_published, publish_status")
    .eq("diviner_id", divinerId);

  const map = new Map<string, { is_enabled: boolean; is_published: boolean; publish_status: string }>();
  for (const row of data ?? []) {
    map.set(row.template_id, {
      is_enabled: row.is_enabled,
      is_published: row.is_published,
      publish_status: row.publish_status,
    });
  }
  return map;
}

/**
 * Get template IDs for all enabled services of a diviner.
 * Lightweight version for filtering — avoids joining large template data.
 */
export async function getDivinerEnabledTemplateIds(
  supabase: SupabaseClient,
  divinerId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("diviner_services")
    .select("template_id")
    .eq("diviner_id", divinerId)
    .eq("is_enabled", true);

  return new Set((data ?? []).map((r) => r.template_id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DivinerServiceWithTemplate {
  id: string;
  diviner_id: string;
  template_id: string;
  price: number;
  is_enabled: boolean;
  is_published: boolean;
  publish_status: string;
  enabled_at: string | null;
  disabled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  service_templates: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    base_price: number;
    duration_minutes: number;
    is_primary: boolean;
    requires_birth_data: boolean;
    trigger_event: string | null;
    sort_order: number;
  };
}
