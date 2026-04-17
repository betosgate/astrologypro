# Task 06 - Modular Landing Page Builder: Data Layer + API + Section Engine - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 4 - Diviner Landing Page Builder
- Depends On: Tasks 01, 02, 05
- Blocks: Task 07

## Goal

Build the complete backend for a **modular, schema-driven page builder** for diviner service landing pages. Each landing page is composed of mandatory system-defined sections plus optional diviner-added custom sections. Sections are typed, reorderable, toggleable, and follow a draft/preview/publish workflow. Admin can moderate content, define allowed section types, and enforce limits.

This replaces the original simple override approach. Instead of fixed fields (custom_title, custom_banner), each landing page is a dynamic composition of section blocks.

## Architecture Overview

```
service_templates (base service data)
        │
        ▼
service_landing_pages (one per diviner per service)
        │
        ├── system sections (auto-created from template, controlled by platform)
        │     hero, pricing, booking_cta
        │
        └── custom sections (diviner-added, from section type registry)
              bio, expertise, text_content, image_banner, cta, faq,
              video_embed, testimonials, gallery, rich_content
```

**Rendering flow for `/{username}/services/{slug}`:**
1. Load `service_templates` for base data (name, description, price, duration)
2. Load `service_landing_pages` for this diviner + service template
3. If no landing page record → create one with system defaults (lazy initialization)
4. Load all `service_landing_page_sections` for this page, ordered by `display_order`
5. Render system sections first (non-removable), then custom sections in order
6. Only render sections where `is_enabled = true`
7. If page status is `draft` → only visible to diviner (preview mode) and admin
8. If page status is `published` → visible publicly

## Existing Assets to Reuse

| Asset | Path | How to Reuse |
|---|---|---|
| Tiptap rich text editor | `@tiptap/react`, `@tiptap/starter-kit` + 3 extensions | Use for all rich text section content |
| Rich text component | `src/components/ui/rich-text-editor.tsx` | Use directly in section editors |
| HTML editor component | `src/components/ui/html-editor.tsx` | Use for advanced rich content blocks |
| Media upload form | `src/components/dashboard/media-item-form.tsx` | Reuse upload logic for image/video sections |
| Supabase Storage | bucket `all-frontend-assets` | Store landing page images at `landing-pages/{diviner_id}/{template_id}/` |
| Zod | `zod@^4.3.6` | Validate section content at API layer |
| react-hook-form | `@hookform/resolvers@^5.2.2` | Form handling in section editors |
| shadcn/ui | `src/components/ui/` (35+ components) | Card, Dialog, Button, Switch, Badge, Tabs, Sheet, etc. |
| sonner | `sonner@^2.0.7` | Toast notifications for save/publish actions |

**Must install:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
**Why @dnd-kit:** Modern, accessible, lightweight, React 18+ compatible, works with Next.js App Router. Preferred over deprecated react-beautiful-dnd.

## Implementation Steps

### Step 1: Create Section Type Registry

**File to create:** `src/lib/landing-page-section-types.ts`

This is the schema-driven registry of all supported section types. New types can be added here without touching the database or UI components (the UI renders dynamically based on this registry).

```typescript
export interface SectionTypeDefinition {
  type: string;                        // unique key: 'bio', 'expertise', 'cta', etc.
  label: string;                       // human-readable: 'Bio Section'
  description: string;                 // shown in "Add Section" picker
  icon: string;                        // lucide-react icon name
  category: 'content' | 'media' | 'engagement' | 'navigation';
  is_system: boolean;                  // true = platform-controlled, cannot be removed by diviner
  is_removable: boolean;               // can diviner delete this section?
  is_reorderable: boolean;             // can diviner move this section?
  max_per_page: number;                // max instances per page (0 = unlimited)
  default_enabled: boolean;            // enabled by default when added
  schema: ZodSchema;                   // Zod schema for validating content_json
  default_content: Record<string, unknown>;  // default values for new instances
}

export const SECTION_TYPES: Record<string, SectionTypeDefinition> = {

  // ─── SYSTEM SECTIONS (auto-created, not removable) ───

  hero: {
    type: 'hero',
    label: 'Hero Section',
    description: 'Main banner with service title, tagline, and featured image',
    icon: 'LayoutTemplate',
    category: 'content',
    is_system: true,
    is_removable: false,
    is_reorderable: false,       // always at top
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      title: z.string().max(120).optional(),
      tagline: z.string().max(200).optional(),
      banner_url: z.string().url().optional().nullable(),
      overlay_opacity: z.number().min(0).max(100).optional(),
    }),
    default_content: { title: null, tagline: null, banner_url: null, overlay_opacity: 40 },
  },

  pricing: {
    type: 'pricing',
    label: 'Pricing & Booking',
    description: 'Service price, duration, and booking button',
    icon: 'DollarSign',
    category: 'engagement',
    is_system: true,
    is_removable: false,
    is_reorderable: false,       // always near top
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      show_price: z.boolean().optional(),
      show_duration: z.boolean().optional(),
      custom_cta_text: z.string().max(80).optional(),
      custom_cta_secondary_text: z.string().max(80).optional(),
    }),
    default_content: { show_price: true, show_duration: true, custom_cta_text: null, custom_cta_secondary_text: null },
  },

  booking_cta: {
    type: 'booking_cta',
    label: 'Booking Call-to-Action',
    description: 'Sticky/bottom CTA for booking',
    icon: 'CalendarCheck',
    category: 'engagement',
    is_system: true,
    is_removable: false,
    is_reorderable: false,       // always at bottom
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      cta_text: z.string().max(80).optional(),
      show_price_in_cta: z.boolean().optional(),
      sticky_on_mobile: z.boolean().optional(),
    }),
    default_content: { cta_text: 'Book Now', show_price_in_cta: true, sticky_on_mobile: true },
  },

  // ─── CUSTOM SECTIONS (diviner-added, reorderable) ───

  bio: {
    type: 'bio',
    label: 'Bio / Introduction',
    description: 'Personal introduction with rich text, photo, and credentials',
    icon: 'User',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      body_html: z.string().max(5000).optional(),
      image_url: z.string().url().optional().nullable(),
      image_position: z.enum(['left', 'right', 'top', 'background']).optional(),
    }),
    default_content: { heading: 'About Me', body_html: '', image_url: null, image_position: 'left' },
  },

  expertise: {
    type: 'expertise',
    label: 'Expertise / Specialties',
    description: 'List of skills, specialties, or credentials with optional icons',
    icon: 'Award',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      subtitle: z.string().max(200).optional(),
      display_style: z.enum(['tags', 'bullets', 'cards', 'icons']).optional(),
      items: z.array(z.object({
        label: z.string().max(100),
        description: z.string().max(300).optional(),
        icon: z.string().max(50).optional(),
      })).max(20).optional(),
    }),
    default_content: { heading: 'My Specialties', subtitle: null, display_style: 'tags', items: [] },
  },

  text_content: {
    type: 'text_content',
    label: 'Text Content Block',
    description: 'Free-form rich text section with heading',
    icon: 'FileText',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 5,             // allow up to 5 text blocks
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      subtitle: z.string().max(200).optional(),
      body_html: z.string().max(10000),
      text_alignment: z.enum(['left', 'center', 'right']).optional(),
      background_color: z.string().max(7).optional(),
    }),
    default_content: { heading: '', subtitle: null, body_html: '', text_alignment: 'left', background_color: null },
  },

  image_banner: {
    type: 'image_banner',
    label: 'Image / Banner',
    description: 'Single image or banner with optional caption and link',
    icon: 'Image',
    category: 'media',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      image_url: z.string().url(),
      alt_text: z.string().max(200).optional(),
      caption: z.string().max(300).optional(),
      link_url: z.string().url().optional().nullable(),
      aspect_ratio: z.enum(['16:9', '4:3', '1:1', 'auto']).optional(),
      full_width: z.boolean().optional(),
    }),
    default_content: { image_url: '', alt_text: '', caption: null, link_url: null, aspect_ratio: '16:9', full_width: false },
  },

  cta: {
    type: 'cta',
    label: 'Call-to-Action Block',
    description: 'Highlighted section with heading, text, and action button',
    icon: 'MousePointerClick',
    category: 'engagement',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120),
      body_text: z.string().max(500).optional(),
      button_label: z.string().max(50),
      button_url: z.string().url(),
      button_style: z.enum(['primary', 'secondary', 'outline']).optional(),
      background_color: z.string().max(7).optional(),
      text_color: z.string().max(7).optional(),
    }),
    default_content: { heading: '', body_text: '', button_label: 'Learn More', button_url: '', button_style: 'primary', background_color: null, text_color: null },
  },

  faq: {
    type: 'faq',
    label: 'FAQ Accordion',
    description: 'Frequently asked questions in expandable accordion format',
    icon: 'HelpCircle',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      items: z.array(z.object({
        question: z.string().max(300),
        answer: z.string().max(2000),
      })).max(20),
    }),
    default_content: { heading: 'Frequently Asked Questions', items: [] },
  },

  video_embed: {
    type: 'video_embed',
    label: 'Video Embed',
    description: 'Embedded video from YouTube, Vimeo, or uploaded file',
    icon: 'Video',
    category: 'media',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      video_source: z.enum(['youtube', 'vimeo', 'upload']),
      video_url: z.string().url(),
      thumbnail_url: z.string().url().optional().nullable(),
      caption: z.string().max(300).optional(),
      autoplay: z.boolean().optional(),
    }),
    default_content: { heading: null, video_source: 'youtube', video_url: '', thumbnail_url: null, caption: null, autoplay: false },
  },

  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Client testimonials and reviews for this service',
    icon: 'Quote',
    category: 'engagement',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      display_style: z.enum(['carousel', 'grid', 'list']).optional(),
      max_display: z.number().min(1).max(20).optional(),
      show_rating: z.boolean().optional(),
      featured_ids: z.array(z.string().uuid()).optional(),
      source: z.enum(['auto', 'manual']).optional(),  // auto = from testimonials table, manual = inline
      manual_items: z.array(z.object({
        name: z.string().max(100),
        text: z.string().max(1000),
        rating: z.number().min(1).max(5).optional(),
        avatar_url: z.string().url().optional().nullable(),
        date: z.string().optional(),
      })).max(10).optional(),
    }),
    default_content: { heading: 'What Clients Say', display_style: 'carousel', max_display: 6, show_rating: true, featured_ids: [], source: 'auto', manual_items: [] },
  },

  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    description: 'Grid or carousel of multiple images',
    icon: 'LayoutGrid',
    category: 'media',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 2,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      display_style: z.enum(['grid', 'carousel', 'masonry']).optional(),
      columns: z.number().min(2).max(4).optional(),
      images: z.array(z.object({
        url: z.string().url(),
        alt_text: z.string().max(200).optional(),
        caption: z.string().max(300).optional(),
      })).max(20),
    }),
    default_content: { heading: null, display_style: 'grid', columns: 3, images: [] },
  },

  rich_content: {
    type: 'rich_content',
    label: 'Rich Content Block',
    description: 'Advanced content with mixed media, columns, and formatting',
    icon: 'Newspaper',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      body_html: z.string().max(20000),
      layout: z.enum(['full', 'two-column', 'sidebar-left', 'sidebar-right']).optional(),
      sidebar_content_html: z.string().max(5000).optional(),
    }),
    default_content: { heading: '', body_html: '', layout: 'full', sidebar_content_html: null },
  },

  whats_included: {
    type: 'whats_included',
    label: "What's Included",
    description: 'Checklist of what the service includes',
    icon: 'CheckSquare',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      items: z.array(z.object({
        text: z.string().max(200),
        icon: z.string().max(50).optional(),
      })).max(15),
    }),
    default_content: { heading: "What's Included", items: [] },
  },

  who_its_for: {
    type: 'who_its_for',
    label: 'Who This Is For',
    description: 'Target audience description for this service',
    icon: 'Users',
    category: 'content',
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      description: z.string().max(500).optional(),
      items: z.array(z.object({
        text: z.string().max(200),
      })).max(10),
    }),
    default_content: { heading: 'Who This Reading Is For', description: null, items: [] },
  },
};

// Helper: get all custom (non-system) section types
export function getCustomSectionTypes(): SectionTypeDefinition[] {
  return Object.values(SECTION_TYPES).filter(t => !t.is_system);
}

// Helper: get system section types
export function getSystemSectionTypes(): SectionTypeDefinition[] {
  return Object.values(SECTION_TYPES).filter(t => t.is_system);
}

// Helper: validate section content against its type's schema
export function validateSectionContent(
  sectionType: string,
  content: unknown
): { success: boolean; errors?: string[] } {
  const typeDef = SECTION_TYPES[sectionType];
  if (!typeDef) return { success: false, errors: [`Unknown section type: ${sectionType}`] };
  const result = typeDef.schema.safeParse(content);
  if (result.success) return { success: true };
  return { success: false, errors: result.error.issues.map(i => i.message) };
}
```

### Step 2: Create Database Tables

**Migration file:** `supabase/migrations/20260417000004_landing_page_builder.sql`

```sql
-- ═══════════════════════════════════════════════════════════
-- Table: section_type_config (admin-managed registry)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE section_type_config (
  type VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(20) NOT NULL CHECK (category IN ('content', 'media', 'engagement', 'navigation')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_globally_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_per_page INTEGER NOT NULL DEFAULT 0,                -- 0 = unlimited
  max_body_length INTEGER DEFAULT 10000,                   -- chars
  max_image_size_bytes INTEGER DEFAULT 2097152,            -- 2MB default
  max_images_per_section INTEGER DEFAULT 20,
  allowed_image_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowed_video_sources TEXT[] DEFAULT ARRAY['youtube', 'vimeo', 'upload'],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed section types (matches the TypeScript registry)
INSERT INTO section_type_config (type, label, description, icon, category, is_system, max_per_page, sort_order) VALUES
  ('hero',            'Hero Section',         'Main banner with service title and image',       'LayoutTemplate',    'content',     TRUE,  1,  10),
  ('pricing',         'Pricing & Booking',    'Service price, duration, and booking button',    'DollarSign',        'engagement',  TRUE,  1,  20),
  ('booking_cta',     'Booking CTA',          'Sticky/bottom call-to-action for booking',      'CalendarCheck',     'engagement',  TRUE,  1,  30),
  ('bio',             'Bio / Introduction',   'Personal introduction with photo',               'User',              'content',     FALSE, 1,  100),
  ('expertise',       'Expertise',            'Skills, specialties, and credentials',           'Award',             'content',     FALSE, 1,  110),
  ('text_content',    'Text Content',         'Free-form rich text section',                    'FileText',          'content',     FALSE, 5,  120),
  ('image_banner',    'Image / Banner',       'Single image or banner with caption',            'Image',             'media',       FALSE, 3,  130),
  ('cta',             'Call-to-Action',       'Highlighted CTA with heading and button',        'MousePointerClick', 'engagement',  FALSE, 3,  140),
  ('faq',             'FAQ Accordion',        'Expandable FAQ list',                            'HelpCircle',        'content',     FALSE, 1,  150),
  ('video_embed',     'Video Embed',          'YouTube, Vimeo, or uploaded video',              'Video',             'media',       FALSE, 3,  160),
  ('testimonials',    'Testimonials',         'Client reviews and testimonials',                'Quote',             'engagement',  FALSE, 1,  170),
  ('gallery',         'Image Gallery',        'Grid or carousel of images',                    'LayoutGrid',        'media',       FALSE, 2,  180),
  ('rich_content',    'Rich Content',         'Advanced mixed content with layout options',     'Newspaper',         'content',     FALSE, 3,  190),
  ('whats_included',  'What''s Included',     'Checklist of service inclusions',               'CheckSquare',       'content',     FALSE, 1,  200),
  ('who_its_for',     'Who This Is For',      'Target audience description',                   'Users',             'content',     FALSE, 1,  210);

-- ═══════════════════════════════════════════════════════════
-- Table: service_landing_pages (one per diviner per service)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE service_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  service_template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,

  -- Page-level metadata
  slug VARCHAR(100),
  custom_page_title VARCHAR(120),
  custom_seo_title VARCHAR(70),
  custom_seo_description VARCHAR(160),
  custom_og_image_url TEXT,

  -- Branding
  accent_color VARCHAR(7),
  font_style VARCHAR(30),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'preview', 'published', 'unpublished', 'archived')),
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,

  -- Versioning (for future use)
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER DEFAULT NULL,

  -- Admin moderation
  moderation_status VARCHAR(20) DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending_review', 'flagged', 'rejected')),
  moderation_note TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  UNIQUE(diviner_id, service_template_id)
);

-- ═══════════════════════════════════════════════════════════
-- Table: service_landing_page_sections (individual blocks)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE service_landing_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES service_landing_pages(id) ON DELETE CASCADE,
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,

  -- Section identity
  section_type VARCHAR(50) NOT NULL REFERENCES section_type_config(type),
  instance_key VARCHAR(100),              -- unique key within page for multi-instance types (e.g., text_content_1, text_content_2)

  -- Content
  title VARCHAR(200),
  subtitle VARCHAR(300),
  content_json JSONB NOT NULL DEFAULT '{}',    -- validated against section type schema
  body_html TEXT,                               -- rendered HTML from rich text editor (sanitized)

  -- Media
  primary_image_url TEXT,
  images JSONB DEFAULT '[]',                   -- array of { url, alt_text, caption }

  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- State
  is_system BOOLEAN NOT NULL DEFAULT FALSE,    -- mirrors section_type_config.is_system at creation
  is_draft BOOLEAN NOT NULL DEFAULT TRUE,      -- true = changes not yet published
  draft_content_json JSONB,                    -- working draft (saved separately from published content)
  draft_body_html TEXT,
  published_content_json JSONB,                -- last published version
  published_body_html TEXT,

  -- Admin moderation
  moderation_status VARCHAR(20) DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending_review', 'flagged', 'rejected')),
  moderation_note TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Prevent duplicate system sections
  UNIQUE(landing_page_id, section_type) 
    -- NOTE: This UNIQUE only applies to system sections (max_per_page = 1).
    -- For multi-instance types, instance_key differentiates them.
    -- The API layer enforces max_per_page for custom types.
);

-- Replace the simple UNIQUE with a conditional one for system sections only:
ALTER TABLE service_landing_page_sections DROP CONSTRAINT IF EXISTS service_landing_page_sections_landing_page_id_section_type_key;

CREATE UNIQUE INDEX idx_system_section_unique
  ON service_landing_page_sections(landing_page_id, section_type)
  WHERE is_system = TRUE;

-- ═══════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════

-- Fast lookup: all sections for a landing page, ordered
CREATE INDEX idx_sections_page_order
  ON service_landing_page_sections(landing_page_id, display_order)
  WHERE is_enabled = TRUE;

-- Fast lookup: landing page for a diviner + service
CREATE INDEX idx_landing_page_diviner_template
  ON service_landing_pages(diviner_id, service_template_id);

-- Fast lookup: all landing pages for a diviner
CREATE INDEX idx_landing_page_diviner
  ON service_landing_pages(diviner_id, status);

-- Moderation queue
CREATE INDEX idx_sections_moderation
  ON service_landing_page_sections(moderation_status, updated_at DESC)
  WHERE moderation_status != 'approved';

CREATE INDEX idx_landing_page_moderation
  ON service_landing_pages(moderation_status, updated_at DESC)
  WHERE moderation_status != 'approved';

-- ═══════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE TRIGGER trg_landing_page_updated
  BEFORE UPDATE ON service_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

CREATE TRIGGER trg_section_updated
  BEFORE UPDATE ON service_landing_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

-- ═══════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════

ALTER TABLE section_type_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_landing_page_sections ENABLE ROW LEVEL SECURITY;

-- section_type_config: everyone can read, only admin can write
CREATE POLICY stc_read ON section_type_config FOR SELECT USING (TRUE);
CREATE POLICY stc_admin ON section_type_config FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- service_landing_pages: diviner owns, admin can manage all, public reads published
CREATE POLICY slp_diviner ON service_landing_pages FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY slp_admin ON service_landing_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY slp_public_read ON service_landing_pages FOR SELECT
  USING (status = 'published' AND moderation_status = 'approved');

-- service_landing_page_sections: same pattern
CREATE POLICY slps_diviner ON service_landing_page_sections FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY slps_admin ON service_landing_page_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY slps_public_read ON service_landing_page_sections FOR SELECT
  USING (
    is_enabled = TRUE
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM service_landing_pages slp
      WHERE slp.id = service_landing_page_sections.landing_page_id
        AND slp.status = 'published'
        AND slp.moderation_status = 'approved'
    )
  );
```

### Step 3: Create Landing Page Initialization Logic

**File to create:** `src/lib/landing-page-builder.ts`

```typescript
/**
 * Get or create a landing page for a diviner + service template.
 * Lazy initialization: if no landing page exists, create one with system sections.
 *
 * Called when:
 * - Diviner opens page builder for a service
 * - Public page is rendered for the first time
 */
export async function getOrCreateLandingPage(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
  createdBy?: string
): Promise<ServiceLandingPage> {
  // 1. Check if landing page exists
  // 2. If yes, return it with all sections
  // 3. If no, create it:
  //    a. Insert service_landing_pages row (status = 'draft')
  //    b. Create system sections (hero, pricing, booking_cta) with default content
  //    c. Return the new landing page with system sections
}

/**
 * Get the fully composed landing page for public rendering.
 * Returns null if page doesn't exist, is not published, or access is denied.
 */
export async function getPublishedLandingPage(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string
): Promise<ComposedLandingPage | null> {
  // 1. Fetch service_landing_pages WHERE status = 'published' AND moderation_status = 'approved'
  // 2. Fetch all sections WHERE is_enabled = true AND moderation_status = 'approved'
  //    ORDER BY: system sections first (by fixed positions), then custom by display_order
  // 3. For each section, use published_content_json (not draft)
  // 4. Merge with service_templates base data
  // 5. Return composed page or null
}

/**
 * Publish a landing page: copy draft content to published for all sections.
 */
export async function publishLandingPage(
  supabase: SupabaseClient,
  landingPageId: string,
  publishedBy: string
): Promise<void> {
  // 1. For each section with is_draft = true:
  //    - Copy draft_content_json → published_content_json
  //    - Copy draft_body_html → published_body_html
  //    - Set is_draft = false
  // 2. Update service_landing_pages:
  //    - Set status = 'published'
  //    - Set published_at = now()
  //    - Increment published_version
  //    - Set updated_by = publishedBy
  // 3. Also update diviner_services.is_published = true if not already
}

/**
 * Sanitize HTML content for safe storage and rendering.
 * Strip script tags, event handlers, data URIs, and potentially dangerous elements.
 */
export function sanitizeHtml(html: string): string {
  // Use a server-side HTML sanitizer
  // Allow: p, h1-h6, strong, em, u, s, ul, ol, li, a[href], blockquote, br, img[src,alt]
  // Strip: script, style, iframe, object, embed, form, input, event attributes (on*)
  // This is CRITICAL for XSS prevention
}
```

### Step 4: API Routes — Section CRUD

#### `src/app/api/dashboard/landing-pages/[templateId]/sections/route.ts`

```
GET /api/dashboard/landing-pages/{templateId}/sections
- Auth: diviner
- Validation: diviner_services.is_enabled = true for this template
- Action:
  1. Get or create landing page (lazy init)
  2. Fetch all sections ordered by display_order
  3. Return sections with draft content (not published)
- Returns: {
    landing_page: {
      id, status, custom_page_title, accent_color, draft_version, published_version,
      moderation_status
    },
    sections: [
      {
        id, section_type, instance_key, title, subtitle,
        content_json, body_html, primary_image_url, images,
        display_order, is_enabled, is_system, is_draft,
        moderation_status, created_at, updated_at
      },
      ...ordered by display_order
    ],
    available_section_types: [
      // section types the diviner can still add (respecting max_per_page limits)
      { type, label, description, icon, category, remaining_slots }
    ]
  }

POST /api/dashboard/landing-pages/{templateId}/sections
- Auth: diviner
- Body: {
    section_type: "bio",                    // required, must be in section_type_config
    title: "About Me",                      // optional
    subtitle: null,                         // optional
    content_json: { heading: "...", ... },  // validated against section type schema
    body_html: "<p>...</p>",               // optional, sanitized
    primary_image_url: null,                // optional
    images: [],                             // optional
    display_order: 5                        // optional, auto-assigned if omitted
  }
- Validation:
  1. section_type must exist in section_type_config AND is_globally_enabled = true
  2. section_type must NOT be is_system (cannot manually add system sections)
  3. max_per_page limit not exceeded for this type on this page
  4. content_json validated against the type's Zod schema
  5. body_html sanitized for XSS
  6. image URLs validated (must be valid URLs or Supabase storage paths)
  7. Admin-defined limits enforced (max_body_length, max_image_size_bytes, etc.)
- Action:
  1. Get or create landing page
  2. Validate all rules
  3. Insert section with is_draft = true, draft_content_json = content_json
  4. If no display_order provided, set to (max existing order + 10)
  5. Return created section
- Returns: 201 with section record
```

#### `src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/route.ts`

```
GET /api/dashboard/landing-pages/{templateId}/sections/{sectionId}
- Auth: diviner
- Returns: full section detail with both draft and published content

PATCH /api/dashboard/landing-pages/{templateId}/sections/{sectionId}
- Auth: diviner
- Body: partial update of any section field (title, subtitle, content_json, body_html, etc.)
- Validation:
  1. Section belongs to diviner's landing page
  2. content_json validated against type schema if provided
  3. body_html sanitized
  4. System sections: only content fields can be modified (not section_type, is_system)
  5. If section was flagged by admin (moderation_status = 'flagged'):
     allow edit but set moderation_status back to 'pending_review'
- Action:
  1. Update draft_content_json and/or draft_body_html
  2. Set is_draft = true (changes are draft until page is published)
  3. Update updated_at, updated_by
- Returns: updated section

DELETE /api/dashboard/landing-pages/{templateId}/sections/{sectionId}
- Auth: diviner
- Validation:
  1. Section belongs to diviner's landing page
  2. Section is NOT a system section (is_system = false)
  3. If is_system = true, return 422: "System sections cannot be deleted"
- Action:
  1. Hard delete the section record
  2. Reorder remaining sections to close gap
- Returns: 204 No Content
```

### Step 5: API Routes — Section Reorder

#### `src/app/api/dashboard/landing-pages/[templateId]/sections/reorder/route.ts`

```
PATCH /api/dashboard/landing-pages/{templateId}/sections/reorder
- Auth: diviner
- Body: {
    section_order: [
      { id: "section-uuid-1", display_order: 10 },
      { id: "section-uuid-2", display_order: 20 },
      { id: "section-uuid-3", display_order: 30 },
      ...
    ]
  }
- Validation:
  1. All section IDs belong to this landing page
  2. System sections with is_reorderable = false must retain their fixed positions
     (hero always first, booking_cta always last)
  3. No duplicate display_order values
- Action: update display_order for each section in a single batch
- Returns: { success: true, sections: [...updated order] }
```

### Step 6: API Routes — Section Toggle Visibility

#### `src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/toggle/route.ts`

```
PATCH /api/dashboard/landing-pages/{templateId}/sections/{sectionId}/toggle
- Auth: diviner
- Body: { is_enabled: boolean }
- Validation:
  1. Section belongs to diviner's landing page
  2. System sections with is_removable = false cannot be disabled
     (hero, pricing, booking_cta must stay enabled)
- Action: update is_enabled, set is_draft = true
- Returns: updated section
```

### Step 7: API Routes — Page-Level Actions

#### `src/app/api/dashboard/landing-pages/[templateId]/publish/route.ts`

```
POST /api/dashboard/landing-pages/{templateId}/publish
- Auth: diviner
- Validation:
  1. Landing page exists
  2. diviner_services.is_enabled = true
  3. At least one non-system section exists and is enabled
  4. No sections with moderation_status = 'flagged' or 'rejected'
  5. Page moderation_status = 'approved'
- Action: call publishLandingPage() from landing-page-builder.ts
- Returns: { success: true, published_version: N, published_at: "..." }

POST /api/dashboard/landing-pages/{templateId}/unpublish
- Auth: diviner
- Action:
  1. Set service_landing_pages.status = 'unpublished'
  2. Set unpublished_at = now()
  3. Update diviner_services.is_published = false
- Returns: { success: true }

GET /api/dashboard/landing-pages/{templateId}/preview
- Auth: diviner OR admin
- Returns: the full composed page using DRAFT content (not published)
  Same format as public page but uses draft_content_json instead of published_content_json
```

### Step 8: API Routes — Admin Moderation

#### `src/app/api/admin/landing-pages/moderation/route.ts`

```
GET /api/admin/landing-pages/moderation
- Auth: admin
- Query: ?status=pending_review&diviner_id=&template_id=&limit=50&cursor=
- Returns: {
    items: [
      {
        type: 'page' | 'section',
        landing_page_id, diviner_name, service_name,
        section_id, section_type,
        moderation_status, content_preview,
        submitted_at
      }
    ],
    next_cursor
  }

PATCH /api/admin/landing-pages/moderation/[targetId]
- Auth: admin
- Body: {
    target_type: 'page' | 'section',
    moderation_status: 'approved' | 'flagged' | 'rejected',
    moderation_note: "Inappropriate content in bio section"
  }
- Action:
  1. Update moderation_status on the target
  2. If rejecting a section: set is_enabled = false
  3. If rejecting a page: set status = 'unpublished'
  4. Log in service_access_audit_log
- Returns: updated record
```

#### Admin: Edit On Behalf of Diviner

**File to create:** `src/app/api/admin/landing-pages/[landingPageId]/sections/[sectionId]/route.ts`

```
GET /api/admin/landing-pages/{landingPageId}/sections/{sectionId}
- Auth: admin
- Returns: full section data (draft + published content)

PATCH /api/admin/landing-pages/{landingPageId}/sections/{sectionId}
- Auth: admin
- Body: same as diviner PATCH (title, subtitle, content_json, body_html, etc.)
- Action:
  1. Update draft_content_json and/or draft_body_html
  2. Set is_draft = true
  3. Set updated_by = admin user_id
  4. Sanitize body_html
  5. Log in service_access_audit_log with performed_by_role = 'admin'
- Returns: updated section
- Use case: admin fixes inappropriate content, corrects errors, or adds content
  for a diviner who requested help
```

**File to create:** `src/app/api/admin/landing-pages/[landingPageId]/sections/route.ts`

```
GET /api/admin/landing-pages/{landingPageId}/sections
- Auth: admin
- Returns: all sections for a landing page (same format as diviner endpoint)

POST /api/admin/landing-pages/{landingPageId}/sections
- Auth: admin
- Body: same as diviner POST (section_type, content_json, etc.)
- Action: creates section on behalf of diviner
- Sets created_by = admin user_id
- Bypasses max_per_page check if admin explicitly overrides
- Returns: created section
```

**File to create:** `src/app/api/admin/landing-pages/[landingPageId]/publish/route.ts`

```
POST /api/admin/landing-pages/{landingPageId}/publish
- Auth: admin
- Action: publish the page on behalf of diviner (same as diviner publish)
- Can override moderation blocks if admin chooses
- Logs action with performed_by_role = 'admin'

POST /api/admin/landing-pages/{landingPageId}/unpublish
- Auth: admin
- Action: unpublish the page
```

The admin RLS policy (`slp_admin` and `slps_admin`) already grants full read/write access to all landing pages and sections. These admin API routes simply provide the endpoints to exercise that access with proper audit logging.

#### `src/app/api/admin/landing-pages/section-types/route.ts`

```
GET /api/admin/landing-pages/section-types
- Auth: admin
- Returns: all section_type_config rows

PATCH /api/admin/landing-pages/section-types/[type]
- Auth: admin
- Body: {
    is_globally_enabled: boolean,
    max_per_page: number,
    max_body_length: number,
    max_image_size_bytes: number,
    max_images_per_section: number
  }
- Action: update section_type_config
- Effect: if is_globally_enabled set to false, that section type is hidden from
  "Add Section" picker for ALL diviners. Existing sections remain but cannot be added new.
```

### Step 9: API Routes — Image Upload for Sections

#### `src/app/api/dashboard/landing-pages/[templateId]/upload/route.ts`

```
POST /api/dashboard/landing-pages/{templateId}/upload
- Auth: diviner
- Content-Type: multipart/form-data
- Body: file (image)
- Validation:
  1. File type in allowed_image_types from section_type_config
  2. File size <= max_image_size_bytes from section_type_config
  3. Diviner has access to this template
- Action:
  1. Upload to Supabase Storage: all-frontend-assets/landing-pages/{diviner_id}/{template_id}/{filename}
  2. Return public URL
- Returns: { url: "https://...", filename: "...", size: N }
```

### Step 10: Update Public Landing Page Rendering

**File to modify:** `src/app/[username]/services/[slug]/page.tsx`

**Current:** Renders fixed sections from service template + services data
**Change:** Use `getPublishedLandingPage()` to get the composed page with all sections

```typescript
// Rendering logic:
// 1. Fetch published landing page with sections
// 2. If no landing page exists or not published → fallback to template-only rendering (current behavior)
// 3. If landing page exists and is published:
//    a. Render system sections (hero with custom content, pricing, booking_cta)
//    b. Render custom sections in display_order
//    c. Each section type maps to a React component via a section renderer
```

**File to create:** `src/components/landing/section-renderer.tsx`

```typescript
/**
 * Dynamic section renderer. Maps section_type to the correct React component.
 * This is the core of the modular rendering system.
 *
 * Usage:
 *   <SectionRenderer section={section} diviner={diviner} service={service} />
 */
export function SectionRenderer({ section, diviner, service }: SectionRendererProps) {
  // Switch on section.section_type:
  //   'hero' → <HeroSection content={section.published_content_json} />
  //   'bio' → <BioSection content={...} />
  //   'expertise' → <ExpertiseSection content={...} />
  //   'text_content' → <TextContentSection content={...} />
  //   'image_banner' → <ImageBannerSection content={...} />
  //   'cta' → <CtaSection content={...} />
  //   'faq' → <FaqSection content={...} />
  //   'video_embed' → <VideoEmbedSection content={...} />
  //   'testimonials' → <TestimonialsSection content={...} />
  //   'gallery' → <GallerySection content={...} />
  //   'rich_content' → <RichContentSection content={...} />
  //   'whats_included' → <WhatsIncludedSection content={...} />
  //   'who_its_for' → <WhoItsForSection content={...} />
  //   default → null (unknown type, skip)
}
```

**Files to create (one per section type):**
```
src/components/landing/sections/hero-section.tsx
src/components/landing/sections/bio-section.tsx
src/components/landing/sections/expertise-section.tsx
src/components/landing/sections/text-content-section.tsx
src/components/landing/sections/image-banner-section.tsx
src/components/landing/sections/cta-section.tsx
src/components/landing/sections/faq-section.tsx
src/components/landing/sections/video-embed-section.tsx
src/components/landing/sections/testimonials-section.tsx
src/components/landing/sections/gallery-section.tsx
src/components/landing/sections/rich-content-section.tsx
src/components/landing/sections/whats-included-section.tsx
src/components/landing/sections/who-its-for-section.tsx
src/components/landing/sections/pricing-section.tsx
src/components/landing/sections/booking-cta-section.tsx
```

Each component renders the published content from `content_json` using the appropriate UI layout. All are **Server Components** (no "use client") for SEO and performance.

### Step 11: Content Sanitization

**File to create:** `src/lib/html-sanitizer.ts`

```typescript
/**
 * Server-side HTML sanitizer for landing page content.
 * Must be called before storing body_html in the database.
 *
 * Allowed tags: p, h1-h6, strong, em, u, s, ul, ol, li, a[href,target,rel],
 *               blockquote, br, hr, img[src,alt,width,height], span, div
 * Stripped: script, style, iframe, object, embed, form, input, button,
 *           textarea, select, meta, link, base
 * Stripped attributes: on* (onclick, onload, etc.), style (optional: allow safe subset)
 * URLs: only allow http:, https:, mailto: protocols. Strip javascript:, data:, vbscript:
 */
export function sanitizeSectionHtml(html: string): string {
  // Implementation using a whitelist approach
  // Consider using: sanitize-html npm package or DOMPurify (with jsdom for server)
}
```

**Install required package:**
```bash
npm install sanitize-html
npm install -D @types/sanitize-html
```

## TypeScript Types

**File to create:** `src/types/landing-page-builder.ts`

```typescript
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
  status: 'draft' | 'preview' | 'published' | 'unpublished' | 'archived';
  published_at: string | null;
  unpublished_at: string | null;
  draft_version: number;
  published_version: number | null;
  moderation_status: 'approved' | 'pending_review' | 'flagged' | 'rejected';
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
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
  moderation_status: 'approved' | 'pending_review' | 'flagged' | 'rejected';
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComposedLandingPage {
  page: ServiceLandingPage;
  sections: LandingPageSection[];
  service_template: {
    name: string;
    slug: string;
    category: string;
    description: string;
    base_price: number;
    duration_minutes: number;
  };
  diviner: {
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
  category: 'content' | 'media' | 'engagement' | 'navigation';
  is_system: boolean;
  is_globally_enabled: boolean;
  max_per_page: number;
  max_body_length: number | null;
  max_image_size_bytes: number | null;
  max_images_per_section: number | null;
  allowed_image_types: string[];
  allowed_video_sources: string[];
}
```

## Verification Plan

1. Migration runs without errors: 3 tables created with correct schema
2. Section type seeds inserted: 15 types, 3 system + 12 custom
3. Lazy init: diviner opens builder for first time → landing page + 3 system sections created
4. Add section: POST bio section → created with correct content_json
5. Add section: POST second bio → rejected (max_per_page = 1)
6. Add section: POST 6th text_content → rejected (max_per_page = 5)
7. Add section: POST system section type → rejected (is_system = true)
8. Edit section: PATCH content_json → draft_content_json updated, is_draft = true
9. Delete section: DELETE bio → success. DELETE hero → rejected (is_system)
10. Reorder: PATCH reorder → display_order updated. Hero stays first.
11. Toggle: disable bio → is_enabled = false. Disable hero → rejected.
12. Publish: POST publish → draft content copied to published, status = 'published'
13. Public page: renders published_content_json, not draft
14. Unpublish: POST unpublish → page hidden from public
15. Preview: GET preview → returns draft content for authenticated diviner
16. Admin moderation: flag a section → diviner sees warning, section hidden from public
17. Admin disable section type globally → type removed from "Add Section" picker
18. XSS: content with `<script>` tags → sanitized to safe HTML
19. Image upload: valid image → uploaded to Supabase Storage, URL returned
20. Image upload: invalid file type → rejected
21. RLS: diviner cannot read other diviner's sections
22. RLS: public cannot read draft or unpublished sections

## Rollback Plan

```sql
DROP TABLE IF EXISTS service_landing_page_sections;
DROP TABLE IF EXISTS service_landing_pages;
DROP TABLE IF EXISTS section_type_config;
```

## Edge Cases

- Diviner with no landing page visits builder: lazy init creates page + system sections
- Admin disables a section type that has existing instances: existing sections remain (hidden from public), cannot add new ones
- Admin flags a section, diviner edits it: moderation_status resets to 'pending_review'
- Diviner publishes page with zero custom sections: valid — only system sections show
- Diviner adds 5 text_content sections, admin later reduces max to 3: existing 5 are kept, cannot add more
- Service disabled after page built: page data preserved, page not publicly accessible (enforced by Task 05)
- Concurrent editing: last-write-wins for section content. display_order reorder uses batch update.
- Video embed with malicious URL: validate URL against allowed_video_sources whitelist (youtube.com, vimeo.com domains only)
- Gallery with 20 images: validate against max_images_per_section from section_type_config
- Rich text with embedded images (base64 data URIs): strip data: URIs in sanitizer, require uploaded image URLs
