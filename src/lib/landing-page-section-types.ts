/**
 * V2 landing-page block-type registry.
 *
 * Replaces the 15-entry "section types" catalog with exactly three generic
 * block types — `text`, `image`, `html` — that can be placed into one of two
 * fixed slots: `about_diviner` or `extra`. The legacy template (hero /
 * pricing / booking CTA / About Your Diviner / FAQ / etc.) is hardcoded in
 * the public route; diviners no longer add or remove those. They only add
 * optional blocks in the two slots.
 *
 * Simplified in Task 03 of docs/tasks/2026-04-21/landing-page-simplification.
 */

import { z } from "zod";

export type BlockSlot = "about_diviner" | "extra";
export type BlockType = "text" | "image" | "html";

export interface SectionTypeDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: "content" | "media" | "engagement" | "navigation";
  /** Per-slot cap. 0 means unlimited. */
  max_per_slot: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any>;
  default_content: Record<string, unknown>;

  // ── Legacy-shape compatibility (kept so existing builder UI does not crash
  //    while the V2 builder UI is rolled out). New code should read
  //    `max_per_slot` / `slot`. These fields carry sensible defaults.
  is_system: false;
  is_removable: true;
  is_reorderable: true;
  max_per_page: number;
  default_enabled: true;
}

const DEFAULT_MAX_PER_SLOT = 10;

// ── The three V2 block types ──────────────────────────────────────────────────

export const SECTION_TYPES: Record<BlockType, SectionTypeDefinition> = {
  text: {
    type: "text",
    label: "Text",
    description:
      "Plain-text block with an optional title and paragraph list. Safe, simple, never escapes.",
    icon: "FileText",
    category: "content",
    max_per_slot: DEFAULT_MAX_PER_SLOT,
    schema: z.object({
      paragraphs: z.array(z.string().max(4000)).max(20).default([]),
    }),
    default_content: { paragraphs: [] },
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: DEFAULT_MAX_PER_SLOT,
    default_enabled: true,
  },

  image: {
    type: "image",
    label: "Image",
    description:
      "Single image block. Upload through the builder's image endpoint; uses the block title as alt text.",
    icon: "Image",
    category: "media",
    max_per_slot: DEFAULT_MAX_PER_SLOT,
    schema: z.object({}).passthrough(),
    default_content: {},
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: DEFAULT_MAX_PER_SLOT,
    default_enabled: true,
  },

  html: {
    type: "html",
    label: "HTML",
    description:
      "Custom HTML block. Content is sanitized server-side against a strict allowlist before it is stored.",
    icon: "Code",
    category: "content",
    max_per_slot: DEFAULT_MAX_PER_SLOT,
    schema: z.object({}).passthrough(),
    default_content: {},
    is_system: false,
    is_removable: true,
    is_reorderable: true,
    max_per_page: DEFAULT_MAX_PER_SLOT,
    default_enabled: true,
  },
};

// ── Slot registry ─────────────────────────────────────────────────────────────

export interface SlotDefinition {
  slot: BlockSlot;
  label: string;
  description: string;
  /** Total cap across all block types in this slot. */
  max_per_slot: number;
}

export const SLOTS: Record<BlockSlot, SlotDefinition> = {
  about_diviner: {
    slot: "about_diviner",
    label: "About Your Diviner",
    description:
      "Blocks rendered after the hardcoded 'About Your Diviner' card on the public page.",
    max_per_slot: DEFAULT_MAX_PER_SLOT,
  },
  extra: {
    slot: "extra",
    label: "Extra",
    description:
      "Blocks rendered between the FAQ and the final CTA on the public page.",
    max_per_slot: DEFAULT_MAX_PER_SLOT,
  },
};

export function isBlockType(v: unknown): v is BlockType {
  return v === "text" || v === "image" || v === "html";
}

export function isBlockSlot(v: unknown): v is BlockSlot {
  return v === "about_diviner" || v === "extra";
}

// ── Legacy compatibility helpers ──────────────────────────────────────────────
//
// Kept so the existing builder UI continues to import from this module while
// it is rewritten in the same PR. Under V2 there are no system sections and
// no "custom vs. system" split — every block is user-owned.

export function getCustomSectionTypes(): SectionTypeDefinition[] {
  return Object.values(SECTION_TYPES);
}

export function getSystemSectionTypes(): SectionTypeDefinition[] {
  return [];
}

export function validateSectionContent(
  sectionType: string,
  content: unknown,
): { success: boolean; errors?: string[] } {
  if (!isBlockType(sectionType)) {
    return { success: false, errors: [`Unknown block type: ${sectionType}`] };
  }
  const typeDef = SECTION_TYPES[sectionType];
  const result = typeDef.schema.safeParse(content ?? {});
  if (result.success) return { success: true };
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
