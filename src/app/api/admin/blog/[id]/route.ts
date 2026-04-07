import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ContentBlock = {
  type: "paragraph" | "heading" | "image" | "quote" | "callout" | "divider" | "cta";
  content?: unknown;
};

function calculateReadingTime(contentBlocks: ContentBlock[]): number {
  const wordsPerMinute = 200;
  let totalWords = 0;
  for (const block of contentBlocks) {
    if (["paragraph", "heading", "quote", "callout"].includes(block.type)) {
      const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content ?? "");
      totalWords += text.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

function calculateWordCount(contentBlocks: ContentBlock[]): number {
  let total = 0;
  for (const block of contentBlocks) {
    if (["paragraph", "heading", "quote", "callout"].includes(block.type)) {
      const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content ?? "");
      total += text.split(/\s+/).filter(Boolean).length;
    }
  }
  return total;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("blog_posts")
    .select(
      `*,
       author:blog_authors(*),
       series:blog_series(*),
       blog_post_categories(category_id, blog_categories(id, name, slug)),
       blog_post_tags(tag_id, blog_tags(id, name, slug)),
       blog_post_revisions(id, changed_by, previous_title, previous_status, change_summary, created_at)`
    )
    .eq("id", id)
    .order("created_at", { referencedTable: "blog_post_revisions", ascending: false })
    .limit(10, { referencedTable: "blog_post_revisions" })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  // Fetch current post state for revision tracking
  const { data: current, error: fetchError } = await admin
    .from("blog_posts")
    .select("status, content_blocks, title")
    .eq("id", id)
    .single();

  if (fetchError) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const {
    title,
    slug,
    excerpt,
    content,
    image_url,
    cover_image_alt,
    status,
    author_id,
    series_id,
    featured,
    hero,
    og_title,
    og_description,
    og_image_url,
    seo_title,
    seo_description,
    canonical_url,
    content_blocks,
    category_ids,
    tag_names,
    scheduled_at,
    change_summary,
  } = body;

  const validStatuses = ["draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 422 }
    );
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (title !== undefined) update.title = title;
  if (slug !== undefined) update.slug = slug;
  if (excerpt !== undefined) update.excerpt = excerpt || null;
  if (content !== undefined) update.content = content || null;
  if (image_url !== undefined) update.image_url = image_url || null;
  if (cover_image_alt !== undefined) update.cover_image_alt = cover_image_alt || null;
  if (author_id !== undefined) update.author_id = author_id || null;
  if (series_id !== undefined) update.series_id = series_id || null;
  if (featured !== undefined) update.featured = featured;
  if (hero !== undefined) update.hero = hero;
  if (og_title !== undefined) update.og_title = og_title || null;
  if (og_description !== undefined) update.og_description = og_description || null;
  if (og_image_url !== undefined) update.og_image_url = og_image_url || null;
  if (seo_title !== undefined) update.seo_title = seo_title || null;
  if (seo_description !== undefined) update.seo_description = seo_description || null;
  if (canonical_url !== undefined) update.canonical_url = canonical_url || null;

  if (content_blocks !== undefined) {
    const blocks: ContentBlock[] = Array.isArray(content_blocks) ? content_blocks : [];
    update.content_blocks = blocks;
    update.reading_time_minutes = calculateReadingTime(blocks);
    update.word_count = calculateWordCount(blocks);
  }

  // Status transition logic
  if (status !== undefined) {
    update.status = status;
    update.is_published = status === "published";

    if (status === "published" && current.status !== "published") {
      update.published_at = new Date().toISOString();
    }
    if (status === "unpublished") {
      update.unpublished_at = new Date().toISOString();
    }
    if (status === "scheduled" && scheduled_at) {
      update.scheduled_at = scheduled_at;
    }
    if (status === "in_review") {
      update.reviewed_by = user.id;
      update.reviewed_at = new Date().toISOString();
    }
    if (status === "approved") {
      update.approved_by = user.id;
      update.approved_at = new Date().toISOString();
    }
  }

  // Record revision if status or content changed
  const statusChanged = status !== undefined && status !== current.status;
  const contentChanged = content_blocks !== undefined;
  const titleChanged = title !== undefined && title !== current.title;

  if (statusChanged || contentChanged || titleChanged) {
    await admin.from("blog_post_revisions").insert({
      post_id: id,
      changed_by: user.id,
      previous_content_blocks: current.content_blocks,
      previous_title: current.title,
      previous_status: current.status,
      change_summary: change_summary || null,
    });
  }

  const { data: updated, error: updateError } = await admin
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Update categories if provided
  if (Array.isArray(category_ids)) {
    await admin.from("blog_post_categories").delete().eq("post_id", id);
    if (category_ids.length > 0) {
      const cats = (category_ids as string[]).map((cid) => ({ post_id: id, category_id: cid }));
      await admin.from("blog_post_categories").insert(cats);
    }
  }

  // Update tags if provided
  if (Array.isArray(tag_names)) {
    await admin.from("blog_post_tags").delete().eq("post_id", id);
    if (tag_names.length > 0) {
      const tagIds = await upsertTags(admin, tag_names as string[]);
      if (tagIds.length > 0) {
        const tagRows = tagIds.map((tid) => ({ post_id: id, tag_id: tid }));
        await admin.from("blog_post_tags").insert(tagRows);
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Soft-archive — never hard delete
  const { data, error } = await admin
    .from("blog_posts")
    .update({ status: "archived", is_published: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}

async function upsertTags(
  admin: ReturnType<typeof createAdminClient>,
  tagNames: string[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data } = await admin
      .from("blog_tags")
      .upsert({ name: trimmed, slug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (data) ids.push(data.id);
  }
  return ids;
}
