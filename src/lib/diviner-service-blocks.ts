/**
 * V2 block helpers for the landing-page simplification.
 *
 * Replaces `src/lib/landing-page-builder.ts`. Under V2 there is no
 * page-level publish lifecycle, no draft/published split, no
 * auto-creation of a container on read. Blocks are simple rows with
 * (diviner_id, service_template_id, slot) coordinates; the public route
 * reads them through the `diviner_service_blocks` view and renders them
 * inside the hardcoded legacy template at two fixed slots.
 *
 * Introduced in Task 03 of docs/tasks/2026-04-21/landing-page-simplification.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockSlot } from "./landing-page-section-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DivinerServiceBlock {
  id: string;
  diviner_id: string;
  service_template_id: string;
  section_type: "text" | "image" | "html";
  slot: BlockSlot;
  title: string | null;
  content_json: Record<string, unknown> | null;
  body_html: string | null;
  primary_image_url: string | null;
  display_order: number;
  is_enabled: boolean;
  moderation_status: "approved" | "pending_review" | "flagged" | "rejected";
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlocksBySlot {
  about_diviner: DivinerServiceBlock[];
  extra: DivinerServiceBlock[];
}

// ── Public read ───────────────────────────────────────────────────────────────

/**
 * Fetch the diviner's blocks for a service template, grouped by slot.
 *
 * Filters to only enabled blocks with moderation_status IN ('approved',
 * 'pending_review'). Flagged/rejected blocks are excluded at the query
 * layer so the public renderer never has to filter them out.
 *
 * Returns `{ about_diviner: [], extra: [] }` when the diviner has not
 * added any blocks yet — no rows are created on read.
 */
export async function getDivinerBlocks(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
): Promise<BlocksBySlot> {
  const { data, error } = await supabase
    .from("diviner_service_blocks")
    .select(
      "id, diviner_id, service_template_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .eq("is_enabled", true)
    .in("moderation_status", ["approved", "pending_review"])
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const result: BlocksBySlot = { about_diviner: [], extra: [] };
  for (const row of (data ?? []) as DivinerServiceBlock[]) {
    if (row.slot === "about_diviner") result.about_diviner.push(row);
    else if (row.slot === "extra") result.extra.push(row);
  }
  return result;
}

/**
 * Fetch blocks for the builder (owner view). Returns ALL blocks including
 * disabled and pending/flagged — the builder UI surfaces these states so
 * the diviner can act on them.
 */
export async function getDivinerBlocksForOwner(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
): Promise<BlocksBySlot> {
  const { data, error } = await supabase
    .from("diviner_service_blocks")
    .select(
      "id, diviner_id, service_template_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const result: BlocksBySlot = { about_diviner: [], extra: [] };
  for (const row of (data ?? []) as DivinerServiceBlock[]) {
    if (row.slot === "about_diviner") result.about_diviner.push(row);
    else if (row.slot === "extra") result.extra.push(row);
  }
  return result;
}

// ── Write path (lazy container bootstrap) ─────────────────────────────────────

/**
 * Deploy-1 reality: `service_landing_page_sections.landing_page_id` is
 * still NOT NULL with an FK back to `service_landing_pages`. To satisfy
 * the FK without surfacing the container to the diviner, the first block
 * INSERT lazy-creates the container row. `ON CONFLICT DO NOTHING` makes
 * concurrent writers safe.
 *
 * In Deploy 2 this function becomes a no-op and is removed — `landing_page_id`
 * is dropped and blocks live directly under `(diviner_id, service_template_id)`.
 */
export async function ensureLandingPageContainer(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
  userId: string | null,
): Promise<string> {
  // Upsert — ON CONFLICT guarded by the existing unique index on
  // (diviner_id, service_template_id). We select after to get the id back
  // regardless of whether the row was created now or already existed.
  const { error: upsertErr } = await supabase
    .from("service_landing_pages")
    .upsert(
      {
        diviner_id: divinerId,
        service_template_id: serviceTemplateId,
        status: "draft",
        draft_version: 1,
        moderation_status: "approved",
        created_by: userId,
        updated_by: userId,
      },
      {
        onConflict: "diviner_id,service_template_id",
        ignoreDuplicates: true,
      },
    );
  if (upsertErr) throw upsertErr;

  const { data, error: selErr } = await supabase
    .from("service_landing_pages")
    .select("id")
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (!data?.id) {
    throw new Error("Container row missing after upsert — RLS policy likely denied the read.");
  }
  return data.id as string;
}

/**
 * Count blocks currently in a slot. Used to enforce `max_per_slot` at
 * the POST handler.
 */
export async function countBlocksInSlot(
  supabase: SupabaseClient,
  divinerId: string,
  serviceTemplateId: string,
  slot: BlockSlot,
): Promise<number> {
  const { count, error } = await supabase
    .from("diviner_service_blocks")
    .select("id", { count: "exact", head: true })
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .eq("slot", slot);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Resolve the highest display_order currently used in a slot, so new
 * blocks append cleanly.
 */
export async function nextDisplayOrderInSlot(
  supabase: SupabaseClient,
  landingPageId: string,
  slot: BlockSlot,
): Promise<number> {
  const { data, error } = await supabase
    .from("service_landing_page_sections")
    .select("display_order")
    .eq("landing_page_id", landingPageId)
    .eq("slot", slot)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const current = data?.display_order ?? 0;
  return current + 10;
}
