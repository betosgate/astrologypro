/**
 * Schema-driven registry of all supported landing page section types.
 * This is the single source of truth for section type definitions.
 * New types can be added here without touching the database schema.
 *
 * Created in Task 06 of the 2026-04-17 sprint.
 */

import { z } from "zod";

export interface SectionTypeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: "content" | "media" | "engagement" | "navigation";
  is_system: boolean;
  is_removable: boolean;
  is_reorderable: boolean;
  max_per_page: number; // 0 = unlimited
  default_enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any>;
  default_content: Record<string, unknown>;
}

// ── Section Type Definitions ───────────────────────────────────────────────────

export const SECTION_TYPES: Record<string, SectionTypeDefinition> = {

  // ─── SYSTEM SECTIONS (auto-created, platform-controlled) ─────────────────

  hero: {
    type: "hero",
    label: "Hero Section",
    description: "Main banner with service title, tagline, and featured image",
    icon: "LayoutTemplate",
    category: "content",
    is_system: true,
    is_removable: false,
    is_reorderable: false,
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
    type: "pricing",
    label: "Pricing & Booking",
    description: "Service price, duration, and booking button",
    icon: "DollarSign",
    category: "engagement",
    is_system: true,
    is_removable: false,
    is_reorderable: false,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      show_price: z.boolean().optional(),
      show_duration: z.boolean().optional(),
      custom_cta_text: z.string().max(80).optional().nullable(),
      custom_cta_secondary_text: z.string().max(80).optional().nullable(),
    }),
    default_content: { show_price: true, show_duration: true, custom_cta_text: null, custom_cta_secondary_text: null },
  },

  booking_cta: {
    type: "booking_cta",
    label: "Booking Call-to-Action",
    description: "Sticky/bottom CTA for booking",
    icon: "CalendarCheck",
    category: "engagement",
    is_system: true,
    is_removable: false,
    is_reorderable: false,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      cta_text: z.string().max(80).optional(),
      show_price_in_cta: z.boolean().optional(),
      sticky_on_mobile: z.boolean().optional(),
    }),
    default_content: { cta_text: "Book Now", show_price_in_cta: true, sticky_on_mobile: true },
  },

  // ─── CUSTOM SECTIONS (diviner-added, reorderable) ─────────────────────────

  bio: {
    type: "bio",
    label: "Bio / Introduction",
    description: "Personal introduction with rich text, photo, and credentials",
    icon: "User",
    category: "content",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      body_html: z.string().max(5000).optional(),
      image_url: z.string().url().optional().nullable(),
      image_position: z.enum(["left", "right", "top", "background"]).optional(),
    }),
    default_content: { heading: "About Me", body_html: "", image_url: null, image_position: "left" },
  },

  expertise: {
    type: "expertise",
    label: "Expertise / Specialties",
    description: "List of skills, specialties, or credentials with optional icons",
    icon: "Award",
    category: "content",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      subtitle: z.string().max(200).optional().nullable(),
      display_style: z.enum(["tags", "bullets", "cards", "icons"]).optional(),
      items: z.array(z.object({
        label: z.string().max(100),
        description: z.string().max(300).optional(),
        icon: z.string().max(50).optional(),
      })).max(20).optional(),
    }),
    default_content: { heading: "My Specialties", subtitle: null, display_style: "tags", items: [] },
  },

  text_content: {
    type: "text_content",
    label: "Text Content Block",
    description: "Free-form rich text section with heading",
    icon: "FileText",
    category: "content",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 5,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      subtitle: z.string().max(200).optional().nullable(),
      body_html: z.string().max(10000),
      text_alignment: z.enum(["left", "center", "right"]).optional(),
      background_color: z.string().max(7).optional().nullable(),
    }),
    default_content: { heading: "", subtitle: null, body_html: "", text_alignment: "left", background_color: null },
  },

  image_banner: {
    type: "image_banner",
    label: "Image / Banner",
    description: "Single image or banner with optional caption and link",
    icon: "Image",
    category: "media",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      image_url: z.string().url(),
      alt_text: z.string().max(200).optional(),
      caption: z.string().max(300).optional().nullable(),
      link_url: z.string().url().optional().nullable(),
      aspect_ratio: z.enum(["16:9", "4:3", "1:1", "auto"]).optional(),
      full_width: z.boolean().optional(),
    }),
    default_content: { image_url: "", alt_text: "", caption: null, link_url: null, aspect_ratio: "16:9", full_width: false },
  },

  cta: {
    type: "cta",
    label: "Call-to-Action Block",
    description: "Highlighted section with heading, text, and action button",
    icon: "MousePointerClick",
    category: "engagement",
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
      button_style: z.enum(["primary", "secondary", "outline"]).optional(),
      background_color: z.string().max(7).optional().nullable(),
      text_color: z.string().max(7).optional().nullable(),
    }),
    default_content: { heading: "", body_text: "", button_label: "Learn More", button_url: "", button_style: "primary", background_color: null, text_color: null },
  },

  faq: {
    type: "faq",
    label: "FAQ Accordion",
    description: "Frequently asked questions in expandable accordion format",
    icon: "HelpCircle",
    category: "content",
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
    default_content: { heading: "Frequently Asked Questions", items: [] },
  },

  video_embed: {
    type: "video_embed",
    label: "Video Embed",
    description: "Embedded video from YouTube, Vimeo, or uploaded file",
    icon: "Video",
    category: "media",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional().nullable(),
      video_source: z.enum(["youtube", "vimeo", "upload"]),
      video_url: z.string().url(),
      thumbnail_url: z.string().url().optional().nullable(),
      caption: z.string().max(300).optional().nullable(),
      autoplay: z.boolean().optional(),
    }),
    default_content: { heading: null, video_source: "youtube", video_url: "", thumbnail_url: null, caption: null, autoplay: false },
  },

  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    description: "Client testimonials and reviews for this service",
    icon: "Quote",
    category: "engagement",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      display_style: z.enum(["carousel", "grid", "list"]).optional(),
      max_display: z.number().min(1).max(20).optional(),
      show_rating: z.boolean().optional(),
      featured_ids: z.array(z.string().uuid()).optional(),
      source: z.enum(["auto", "manual"]).optional(),
      manual_items: z.array(z.object({
        name: z.string().max(100),
        text: z.string().max(1000),
        rating: z.number().min(1).max(5).optional(),
        avatar_url: z.string().url().optional().nullable(),
        date: z.string().optional(),
      })).max(10).optional(),
    }),
    default_content: { heading: "What Clients Say", display_style: "carousel", max_display: 6, show_rating: true, featured_ids: [], source: "auto", manual_items: [] },
  },

  gallery: {
    type: "gallery",
    label: "Image Gallery",
    description: "Grid or carousel of multiple images",
    icon: "LayoutGrid",
    category: "media",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 2,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional().nullable(),
      display_style: z.enum(["grid", "carousel", "masonry"]).optional(),
      columns: z.number().min(2).max(4).optional(),
      images: z.array(z.object({
        url: z.string().url(),
        alt_text: z.string().max(200).optional(),
        caption: z.string().max(300).optional(),
      })).max(20),
    }),
    default_content: { heading: null, display_style: "grid", columns: 3, images: [] },
  },

  rich_content: {
    type: "rich_content",
    label: "Rich Content Block",
    description: "Advanced content with mixed media, columns, and formatting",
    icon: "Newspaper",
    category: "content",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 3,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      body_html: z.string().max(20000),
      layout: z.enum(["full", "two-column", "sidebar-left", "sidebar-right"]).optional(),
      sidebar_content_html: z.string().max(5000).optional().nullable(),
    }),
    default_content: { heading: "", body_html: "", layout: "full", sidebar_content_html: null },
  },

  whats_included: {
    type: "whats_included",
    label: "What's Included",
    description: "Checklist of what the service includes",
    icon: "CheckSquare",
    category: "content",
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
    type: "who_its_for",
    label: "Who This Is For",
    description: "Target audience description for this service",
    icon: "Users",
    category: "content",
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: 1,
    default_enabled: true,
    schema: z.object({
      heading: z.string().max(120).optional(),
      description: z.string().max(500).optional().nullable(),
      items: z.array(z.object({
        text: z.string().max(200),
      })).max(10),
    }),
    default_content: { heading: "Who This Reading Is For", description: null, items: [] },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getCustomSectionTypes(): SectionTypeDefinition[] {
  return Object.values(SECTION_TYPES).filter((t) => !t.is_system);
}

export function getSystemSectionTypes(): SectionTypeDefinition[] {
  return Object.values(SECTION_TYPES).filter((t) => t.is_system);
}

export function validateSectionContent(
  sectionType: string,
  content: unknown
): { success: boolean; errors?: string[] } {
  const typeDef = SECTION_TYPES[sectionType];
  if (!typeDef) {
    return { success: false, errors: [`Unknown section type: ${sectionType}`] };
  }
  const result = typeDef.schema.safeParse(content);
  if (result.success) return { success: true };
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
