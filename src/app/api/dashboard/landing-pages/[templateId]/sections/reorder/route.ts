/**
 * PATCH /api/dashboard/landing-pages/[templateId]/sections/reorder
 *
 * Batch-update display_order for blocks **within a single slot**. Cross-slot
 * moves are explicitly rejected with 422 — to move a block between slots,
 * delete-and-recreate via the create endpoint (rare, by design).
 *
 * Rewritten in Task 03 of the 2026-04-21 landing-page-simplification.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBlockSlot } from "@/lib/landing-page-section-types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Forbidden");

  // Verify template access
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();
  if (!ds?.is_enabled) {
    return problem(403, "Forbidden", "This service template is not enabled for your account");
  }

  let body: {
    slot?: string;
    section_order?: Array<{ id: string; display_order: number }>;
  };
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  const slot = body.slot;
  const sectionOrder = body.section_order;

  if (!isBlockSlot(slot)) {
    return problem(
      422,
      "Invalid slot",
      "`slot` is required and must be 'about_diviner' or 'extra'.",
    );
  }

  if (!Array.isArray(sectionOrder) || sectionOrder.length === 0) {
    return problem(422, "Empty section_order", "Provide a non-empty `section_order` array.");
  }

  // Fetch all blocks the diviner owns for this template, with their slots.
  const { data: existingBlocks } = await admin
    .from("service_landing_page_sections")
    .select("id, slot")
    .eq("diviner_id", diviner.id)
    .in(
      "landing_page_id",
      (
        await admin
          .from("service_landing_pages")
          .select("id")
          .eq("diviner_id", diviner.id)
          .eq("service_template_id", templateId)
      ).data?.map((r) => r.id) ?? [],
    );

  const blockMap = new Map(existingBlocks?.map((b) => [b.id, b]) ?? []);

  // Validate: every id in payload must belong to this diviner AND be in the
  // target slot. Cross-slot moves are rejected.
  for (const item of sectionOrder) {
    const block = blockMap.get(item.id);
    if (!block) {
      return problem(
        422,
        "Invalid block id",
        `Block ${item.id} does not belong to this diviner/template.`,
      );
    }
    if (block.slot !== slot) {
      return problem(
        422,
        "Cross-slot reorder not allowed",
        `Block ${item.id} is in slot "${block.slot}", not "${slot}". Reorder is limited to one slot at a time.`,
      );
    }
  }

  // Batch update display_order within the slot.
  const errors: string[] = [];
  for (const item of sectionOrder) {
    const { error } = await admin
      .from("service_landing_page_sections")
      .update({ display_order: item.display_order, updated_by: user.id })
      .eq("id", item.id)
      .eq("diviner_id", diviner.id);
    if (error) errors.push(`${item.id}: ${error.message}`);
  }

  if (errors.length > 0) {
    return problem(500, "Partial failure", errors.join("; "));
  }

  // Return the freshly-ordered slot.
  const { data: updated } = await admin
    .from("service_landing_page_sections")
    .select("id, slot, section_type, display_order, is_enabled, title")
    .eq("diviner_id", diviner.id)
    .eq("slot", slot)
    .order("display_order", { ascending: true });

  return NextResponse.json({ slot, blocks: updated ?? [] });
}
