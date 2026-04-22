/**
 * TypeScript types for the V2 landing-page builder.
 *
 * Trimmed in Task 03 of the 2026-04-21 landing-page-simplification:
 * - `LandingPageStatus` removed — publish status lives on `diviner_services.is_published`
 * - Page-level `published_at`, `draft_version`, `custom_*` SEO fields removed — the container table is scheduled for deletion in Deploy 2
 * - Block-level `draft_*`, `published_*`, `is_system`, `is_draft`, `instance_key`, `subtitle`, `images` removed — blocks are always "live", system/draft/image-array concepts are gone
 * - Added V2 block shapes: `BlockSlot`, `DivinerServiceBlock`, `BlocksBySlot`, `ComposedLandingPage`, `CreateBlockPayload`, `UpdateBlockPayload`
 */

export type BlockSlot = "about_diviner" | "extra";
export type BlockType = "text" | "image" | "html";
export type ModerationStatus = "approved" | "pending_review" | "flagged" | "rejected";
export type SectionCategory = "content" | "media" | "engagement" | "navigation";

/**
 * A single diviner-authored block rendered in one of the two V2 slots.
 * Mirrors the row shape returned by the V2 API endpoints.
 */
export interface DivinerServiceBlock {
  id: string;
  diviner_id: string;
  section_type: BlockType;
  slot: BlockSlot;
  title: string | null;
  content_json: Record<string, unknown>;
  body_html: string | null;
  primary_image_url: string | null;
  display_order: number;
  is_enabled: boolean;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Two fixed slots, each a sorted array of blocks. */
export interface BlocksBySlot {
  about_diviner: DivinerServiceBlock[];
  extra: DivinerServiceBlock[];
}

/**
 * The shape the public route composes from the legacy hardcoded template +
 * diviner-authored blocks. "page" is no longer a builder-owned entity —
 * everything about the page identity lives on the service_template + diviner.
 */
export interface ComposedLandingPage {
  blocks: BlocksBySlot;
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
  is_published: boolean;
  is_preview: boolean;
}

/** Light-weight block-type descriptor exposed by the list endpoint. */
export interface BlockTypeConfig {
  type: BlockType;
  label: string;
  description: string | null;
  icon: string | null;
  category: SectionCategory;
  max_per_slot: number;
}

/** Payload accepted by `POST /api/dashboard/landing-pages/:templateId/sections`. */
export interface CreateBlockPayload {
  section_type: BlockType;
  slot: BlockSlot;
  title?: string | null;
  content_json?: Record<string, unknown> | null;
  body_html?: string | null;
  primary_image_url?: string | null;
  display_order?: number;
}

/** Payload accepted by `PATCH /api/dashboard/landing-pages/:templateId/sections/:id`. */
export interface UpdateBlockPayload {
  title?: string | null;
  content_json?: Record<string, unknown> | null;
  body_html?: string | null;
  primary_image_url?: string | null;
  is_enabled?: boolean;
}

// ── Legacy compat aliases ─────────────────────────────────────────────────────
//
// Kept so existing builder UI files (section-list, section-editor-panel,
// builder-context, base-editor) compile during Deploy 1. Scheduled for removal
// in Deploy 2 once the builder UI has been rewritten against the V2 block
// shapes above. Do not use in new code.

/** @deprecated Use `DivinerServiceBlock` instead. */
export type LandingPageSection = DivinerServiceBlock & {
  landing_page_id?: string | null;
  instance_key?: string | null;
  subtitle?: string | null;
  images?: Array<{ url: string; alt_text?: string; caption?: string }>;
  is_system?: boolean;
  is_draft?: boolean;
  draft_content_json?: Record<string, unknown> | null;
  draft_body_html?: string | null;
  published_content_json?: Record<string, unknown> | null;
  published_body_html?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

/** @deprecated The service_landing_pages table is scheduled for removal in Deploy 2. Use `ComposedLandingPage` / `BlocksBySlot`. */
export interface ServiceLandingPage {
  id: string;
  diviner_id: string;
  service_template_id: string;
  slug: string | null;
  status: "draft" | "published" | "unpublished" | "archived" | "preview";
  created_at: string;
  updated_at: string;
}
