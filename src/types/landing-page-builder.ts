/**
 * TypeScript types for the modular landing page builder.
 * Created in Task 06 of the 2026-04-17 sprint.
 */

export type LandingPageStatus = 'draft' | 'preview' | 'published' | 'unpublished' | 'archived';
export type ModerationStatus = 'approved' | 'pending_review' | 'flagged' | 'rejected';
export type SectionCategory = 'content' | 'media' | 'engagement' | 'navigation';

export interface ServiceLandingPage {
  id: string;
  diviner_id: string;
  service_template_id: string;
  slug: string | null;
  custom_page_title: string | null;
  custom_seo_title: string | null;
  custom_seo_description: string | null;
  custom_og_image_url: string | null;
  accent_color: string | null;
  font_style: string | null;
  status: LandingPageStatus;
  published_at: string | null;
  unpublished_at: string | null;
  draft_version: number;
  published_version: number | null;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface LandingPageSection {
  id: string;
  landing_page_id: string;
  diviner_id: string;
  section_type: string;
  instance_key: string | null;
  title: string | null;
  subtitle: string | null;
  content_json: Record<string, unknown>;
  body_html: string | null;
  primary_image_url: string | null;
  images: Array<{ url: string; alt_text?: string; caption?: string }>;
  display_order: number;
  is_enabled: boolean;
  is_system: boolean;
  is_draft: boolean;
  draft_content_json: Record<string, unknown> | null;
  draft_body_html: string | null;
  published_content_json: Record<string, unknown> | null;
  published_body_html: string | null;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ComposedLandingPage {
  page: ServiceLandingPage;
  sections: LandingPageSection[];
  service_template: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    base_price: number;
    duration_minutes: number;
  };
  diviner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface SectionTypeConfig {
  type: string;
  label: string;
  description: string | null;
  icon: string | null;
  category: SectionCategory;
  is_system: boolean;
  is_globally_enabled: boolean;
  max_per_page: number;
  max_body_length: number | null;
  max_image_size_bytes: number | null;
  max_images_per_section: number | null;
  allowed_image_types: string[];
  allowed_video_sources: string[];
  sort_order: number;
}

/** Section type as returned by the landing page sections API (for dashboard builder) */
export interface SectionTypeWithSlots extends SectionTypeConfig {
  remaining_slots: number;
}

/** Payload for creating a new landing page section */
export interface CreateSectionPayload {
  section_type: string;
  title?: string | null;
  subtitle?: string | null;
  content_json?: Record<string, unknown>;
  body_html?: string | null;
  primary_image_url?: string | null;
  images?: Array<{ url: string; alt_text?: string; caption?: string }>;
  display_order?: number;
}

/** Payload for updating a landing page section */
export interface UpdateSectionPayload {
  title?: string | null;
  subtitle?: string | null;
  content_json?: Record<string, unknown>;
  body_html?: string | null;
  primary_image_url?: string | null;
  images?: Array<{ url: string; alt_text?: string; caption?: string }>;
  is_enabled?: boolean;
}
