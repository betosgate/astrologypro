import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateReadingTime(contentBlocks: ContentBlock[]): number {
  const wordsPerMinute = 200;
  let totalWords = 0;
  for (const block of contentBlocks) {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote" || block.type === "callout") {
      const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content);
      totalWords += text.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

function calculateWordCount(contentBlocks: ContentBlock[]): number {
  let total = 0;
  for (const block of contentBlocks) {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote" || block.type === "callout") {
      const text = typeof block.content === "string" ? block.content : JSON.stringify(block.content);
      total += text.split(/\s+/).filter(Boolean).length;
    }
  }
  return total;
}

type ContentBlock = {
  type: "paragraph" | "heading" | "image" | "quote" | "callout" | "divider" | "cta";
  content?: unknown;
};

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const categoryId = sp.get("category_id");
  const search = sp.get("search");
  const cursor = sp.get("cursor"); // updated_at value for cursor pagination
  const cursorId = sp.get("cursor_id"); // id tie-breaker
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 100);

  const admin = createAdminClient();

  let query = admin
    .from("blog_posts")
    .select(
      `id, title, slug, status, excerpt, image_url, cover_image_alt,
       featured, hero, reading_time_minutes, published_at, scheduled_at,
       updated_at, created_at,
       author:blog_authors(id, name, avatar_url),
       blog_post_categories(category_id, blog_categories(id, name, slug)),
       blog_post_tags(tag_id, blog_tags(id, name, slug))`
    )
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Cursor-based pagination
  if (cursor && cursorId) {
    query = query.or(`updated_at.lt.${cursor},and(updated_at.eq.${cursor},id.lt.${cursorId})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by category in post-processing if categoryId provided (pivot table join)
  let posts = data ?? [];
  if (categoryId) {
    posts = posts.filter((p) =>
      (p.blog_post_categories as Array<{ category_id: string }>).some(
        (pc) => pc.category_id === categoryId
      )
    );
  }

  const nextCursor =
    posts.length === limit
      ? { cursor: posts[posts.length - 1].updated_at, cursor_id: posts[posts.length - 1].id }
      : null;

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    slug: slugInput,
    excerpt,
    content,
    image_url,
    cover_image_alt,
    status = "draft",
    author_id,
    series_id,
    featured = false,
    hero = false,
    og_title,
    og_description,
    og_image_url,
    seo_title,
    seo_description,
    canonical_url,
    content_blocks = [],
    category_ids = [],
    tag_names = [],
    scheduled_at,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 422 });
  }

  const validStatuses = ["draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 422 });
  }

  const slug = slugInput?.trim() || toSlug(title);
  const blocks: ContentBlock[] = Array.isArray(content_blocks) ? content_blocks : [];
  const reading_time_minutes = calculateReadingTime(blocks);
  const word_count = calculateWordCount(blocks);

  const admin = createAdminClient();

  const insertPayload: Record<string, unknown> = {
    title: title.trim(),
    slug,
    excerpt: excerpt || null,
    content: content || null,
    image_url: image_url || null,
    cover_image_alt: cover_image_alt || null,
    status,
    author_id: author_id || null,
    series_id: series_id || null,
    featured,
    hero,
    og_title: og_title || null,
    og_description: og_description || null,
    og_image_url: og_image_url || null,
    seo_title: seo_title || null,
    seo_description: seo_description || null,
    canonical_url: canonical_url || null,
    content_blocks: blocks,
    reading_time_minutes,
    word_count,
    is_published: status === "published",
  };

  if (status === "published") {
    insertPayload.published_at = new Date().toISOString();
  }
  if (status === "scheduled" && scheduled_at) {
    insertPayload.scheduled_at = scheduled_at;
  }

  const { data: post, error: insertError } = await admin
    .from("blog_posts")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Attach categories
  if (category_ids.length > 0) {
    const cats = (category_ids as string[]).map((cid) => ({ post_id: post.id, category_id: cid }));
    const { error: catErr } = await admin.from("blog_post_categories").insert(cats);
    if (catErr) {
      // Non-fatal — post was created
      console.error("blog_post_categories insert error:", catErr.message);
    }
  }

  // Attach tags (auto-create if needed)
  if (tag_names.length > 0) {
    const tagIds = await upsertTags(admin, tag_names as string[]);
    if (tagIds.length > 0) {
      const tagRows = tagIds.map((tid) => ({ post_id: post.id, tag_id: tid }));
      const { error: tagErr } = await admin.from("blog_post_tags").insert(tagRows);
      if (tagErr) {
        console.error("blog_post_tags insert error:", tagErr.message);
      }
    }
  }

  return NextResponse.json(post, { status: 201 });
}

async function upsertTags(
  admin: ReturnType<typeof createAdminClient>,
  tagNames: string[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = toSlug(trimmed);
    const { data, error } = await admin
      .from("blog_tags")
      .upsert({ name: trimmed, slug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) {
      console.error(`[blog] upsertTags error for "${trimmed}":`, error.message);
      continue;
    }
    if (data) ids.push(data.id);
  }
  return ids;
}
