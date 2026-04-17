/**
 * Landing page builder — server-side helpers.
 * Handles lazy page initialization, section management, and publish workflow.
 *
 * Created in Task 06 of the 2026-04-17 sprint.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { SECTION_TYPES, getSystemSectionTypes } from "./landing-page-section-types";
import type { ServiceLandingPage, LandingPageSection, ComposedLandingPage } from "@/types/landing-page-builder";

// ── Lazy initialization ────────────────────────────────────────────────────────

/**
 * Get or create a landing page for a diviner + service template pair.
 * On first access, creates the page record and auto-inserts all three system sections
 * (hero, pricing, booking_cta) with their default content.
 *
 * Returns: { page, sections }
 */
export async function getOrCreateLandingPage(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
  createdBy?: string,
): Promise<{ page: ServiceLandingPage; sections: LandingPageSection[] }> {
  // 1. Check if landing page already exists
  const { data: existing } = await supabase
    .from("service_landing_pages")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .maybeSingle();

  let page: ServiceLandingPage;

  if (existing) {
    page = existing as ServiceLandingPage;
  } else {
    // 2. Create the landing page
    const { data: created, error: createErr } = await supabase
      .from("service_landing_pages")
      .insert({
        diviner_id: divinerId,
        service_template_id: serviceTemplateId,
        status: "draft",
        draft_version: 1,
        moderation_status: "approved",
        created_by: createdBy ?? null,
        updated_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (createErr || !created) {
      throw new Error(`Failed to create landing page: ${createErr?.message}`);
    }
    page = created as ServiceLandingPage;

    // 3. Auto-insert system sections with default content
    const systemSections = getSystemSectionTypes();
    const sectionInserts = systemSections.map((st, idx) => ({
      landing_page_id: page.id,
      diviner_id: divinerId,
      section_type: st.type,
      display_order: (idx + 1) * 10,
      is_enabled: true,
      is_system: true,
      is_draft: true,
      content_json: st.default_content,
      draft_content_json: st.default_content,
      created_by: createdBy ?? null,
      updated_by: createdBy ?? null,
    }));

    await supabase
      .from("service_landing_page_sections")
      .insert(sectionInserts);
  }

  // 4. Fetch all sections
  const { data: sections } = await supabase
    .from("service_landing_page_sections")
    .select("*")
    .eq("landing_page_id", page.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    page,
    sections: (sections ?? []) as LandingPageSection[],
  };
}

// ── Public rendering ───────────────────────────────────────────────────────────

/**
 * Fetch the fully composed landing page for public rendering.
 * Returns null if: page doesn't exist, status !== 'published', moderation_status !== 'approved'.
 * Sections returned use published_content_json (not draft).
 */
export async function getPublishedLandingPage(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
): Promise<ComposedLandingPage | null> {
  const { data: page } = await supabase
    .from("service_landing_pages")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .eq("status", "published")
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!page) return null;

  const { data: sections } = await supabase
    .from("service_landing_page_sections")
    .select("*")
    .eq("landing_page_id", page.id)
    .eq("is_enabled", true)
    .eq("moderation_status", "approved")
    .order("display_order", { ascending: true });

  const { data: template } = await supabase
    .from("service_templates")
    .select("id, name, slug, category, description, base_price, duration_minutes")
    .eq("id", serviceTemplateId)
    .maybeSingle();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username, display_name, avatar_url")
    .eq("id", divinerId)
    .maybeSingle();

  if (!template || !diviner) return null;

  return {
    page: page as ServiceLandingPage,
    sections: (sections ?? []) as LandingPageSection[],
    service_template: {
      id: template.id,
      name: template.name,
      slug: template.slug,
      category: template.category,
      description: template.description,
      base_price: template.base_price,
      duration_minutes: template.duration_minutes,
    },
    diviner: {
      id: diviner.id,
      username: diviner.username,
      display_name: diviner.display_name,
      avatar_url: diviner.avatar_url,
    },
  };
}

// ── Draft preview ──────────────────────────────────────────────────────────────

/**
 * Fetch the landing page using DRAFT content (for preview mode).
 * Returns null if page doesn't exist.
 */
export async function getDraftLandingPage(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
): Promise<ComposedLandingPage | null> {
  const { data: page } = await supabase
    .from("service_landing_pages")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .maybeSingle();

  if (!page) return null;

  const { data: sections } = await supabase
    .from("service_landing_page_sections")
    .select("*")
    .eq("landing_page_id", page.id)
    .order("display_order", { ascending: true });

  const { data: template } = await supabase
    .from("service_templates")
    .select("id, name, slug, category, description, base_price, duration_minutes")
    .eq("id", serviceTemplateId)
    .maybeSingle();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username, display_name, avatar_url")
    .eq("id", divinerId)
    .maybeSingle();

  if (!template || !diviner) return null;

  return {
    page: page as ServiceLandingPage,
    sections: (sections ?? []) as LandingPageSection[],
    service_template: {
      id: template.id,
      name: template.name,
      slug: template.slug,
      category: template.category,
      description: template.description,
      base_price: template.base_price,
      duration_minutes: template.duration_minutes,
    },
    diviner: {
      id: diviner.id,
      username: diviner.username,
      display_name: diviner.display_name,
      avatar_url: diviner.avatar_url,
    },
  };
}

// ── Publish workflow ───────────────────────────────────────────────────────────

/**
 * Publish a landing page:
 * 1. Copy draft_content_json → published_content_json for all sections with is_draft = true
 * 2. Set page status = 'published', increment published_version, record published_at
 * 3. Sync diviner_services.is_published = true
 */
export async function publishLandingPage(
  supabase: SupabaseClient,
  landingPageId: string,
  serviceTemplateId: string,
  divinerId: string,
  publishedBy: string,
): Promise<void> {
  // Step 1: promote draft content to published on all draft sections
  await supabase.rpc("publish_landing_page_sections", {
    p_landing_page_id: landingPageId,
  });

  // Fallback if RPC not available: update sections directly
  const { data: draftSections } = await supabase
    .from("service_landing_page_sections")
    .select("id, draft_content_json, draft_body_html")
    .eq("landing_page_id", landingPageId)
    .eq("is_draft", true);

  if (draftSections && draftSections.length > 0) {
    for (const s of draftSections) {
      await supabase
        .from("service_landing_page_sections")
        .update({
          published_content_json: s.draft_content_json,
          published_body_html: s.draft_body_html,
          is_draft: false,
          updated_by: publishedBy,
        })
        .eq("id", s.id);
    }
  }

  // Step 2: update landing page status
  const { data: currentPage } = await supabase
    .from("service_landing_pages")
    .select("published_version")
    .eq("id", landingPageId)
    .single();

  const nextVersion = (currentPage?.published_version ?? 0) + 1;

  await supabase
    .from("service_landing_pages")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_version: nextVersion,
      updated_by: publishedBy,
    })
    .eq("id", landingPageId);

  // Step 3: sync diviner_services published flag
  await supabase
    .from("diviner_services")
    .update({ is_published: true, publish_status: "live" })
    .eq("diviner_id", divinerId)
    .eq("template_id", serviceTemplateId)
    .eq("is_enabled", true);
}

/**
 * Unpublish a landing page.
 */
export async function unpublishLandingPage(
  supabase: SupabaseClient,
  landingPageId: string,
  serviceTemplateId: string,
  divinerId: string,
  unpublishedBy: string,
): Promise<void> {
  await supabase
    .from("service_landing_pages")
    .update({
      status: "unpublished",
      unpublished_at: new Date().toISOString(),
      updated_by: unpublishedBy,
    })
    .eq("id", landingPageId);

  await supabase
    .from("diviner_services")
    .update({ is_published: false, publish_status: "draft" })
    .eq("diviner_id", divinerId)
    .eq("template_id", serviceTemplateId);
}

// ── Section slot availability ──────────────────────────────────────────────────

/**
 * Return the list of custom section types a diviner can still add to this page,
 * with remaining_slots calculated from max_per_page and existing section counts.
 */
export function getAvailableSectionTypes(
  existingSections: LandingPageSection[],
  dbConfig: Record<string, { max_per_page: number; is_globally_enabled: boolean }>,
) {
  const countByType: Record<string, number> = {};
  for (const s of existingSections) {
    countByType[s.section_type] = (countByType[s.section_type] ?? 0) + 1;
  }

  return Object.values(SECTION_TYPES)
    .filter((st) => !st.is_system)
    .map((st) => {
      const cfg = dbConfig[st.type];
      const maxPerPage = cfg?.max_per_page ?? st.max_per_page;
      const isEnabled = cfg?.is_globally_enabled ?? true;
      const existing = countByType[st.type] ?? 0;
      const remaining = maxPerPage === 0 ? 999 : Math.max(0, maxPerPage - existing);

      return {
        type: st.type,
        label: st.label,
        description: st.description,
        icon: st.icon,
        category: st.category,
        is_globally_enabled: isEnabled,
        remaining_slots: remaining,
      };
    })
    .filter((t) => t.is_globally_enabled && t.remaining_slots > 0);
}
