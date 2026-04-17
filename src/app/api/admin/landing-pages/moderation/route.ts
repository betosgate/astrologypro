/**
 * GET  /api/admin/landing-pages/moderation  — moderation queue
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "pending_review";
  const diviner_id = sp.get("diviner_id");
  const template_id = sp.get("template_id");
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50", 10)));
  const cursor = sp.get("cursor") ?? null;

  // Flagged landing pages
  let pageQuery = admin
    .from("service_landing_pages")
    .select("id, diviner_id, service_template_id, moderation_status, moderation_note, updated_at")
    .eq("moderation_status", status)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (diviner_id) pageQuery = pageQuery.eq("diviner_id", diviner_id);
  if (template_id) pageQuery = pageQuery.eq("service_template_id", template_id);
  if (cursor) pageQuery = pageQuery.lt("updated_at", cursor);

  const { data: pages } = await pageQuery;

  // Flagged sections
  let sectionQuery = admin
    .from("service_landing_page_sections")
    .select("id, landing_page_id, diviner_id, section_type, moderation_status, moderation_note, updated_at, content_json, title")
    .eq("moderation_status", status)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (diviner_id) sectionQuery = sectionQuery.eq("diviner_id", diviner_id);
  if (cursor) sectionQuery = sectionQuery.lt("updated_at", cursor);

  const { data: sections } = await sectionQuery;

  const items = [
    ...(pages ?? []).map((p) => ({
      type: "page" as const,
      landing_page_id: p.id,
      diviner_id: p.diviner_id,
      service_template_id: p.service_template_id,
      moderation_status: p.moderation_status,
      moderation_note: p.moderation_note,
      submitted_at: p.updated_at,
    })),
    ...(sections ?? []).map((s) => ({
      type: "section" as const,
      landing_page_id: s.landing_page_id,
      section_id: s.id,
      diviner_id: s.diviner_id,
      section_type: s.section_type,
      content_preview: s.title ?? (s.content_json as Record<string, unknown>)?.heading ?? s.section_type,
      moderation_status: s.moderation_status,
      moderation_note: s.moderation_note,
      submitted_at: s.updated_at,
    })),
  ].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  const allDates = items.map((i) => i.submitted_at);
  const nextCursor = allDates.length > 0 ? allDates[allDates.length - 1] : null;

  return NextResponse.json({ items, next_cursor: nextCursor });
}
