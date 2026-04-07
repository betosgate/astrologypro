import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const LIST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  published_at,
  reading_time_minutes,
  featured,
  author:blog_authors ( id, name, slug, avatar_url ),
  categories:blog_post_categories ( category:blog_categories ( id, name, slug ) ),
  tags:blog_post_tags ( tag:blog_tags ( id, name, slug ) )
`.trim();

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";
  const tag = sp.get("tag") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "10", 10)));

  if (!q && !category && !tag) {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "q, category, or tag is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  // ── Resolve category filter ─────────────────────────────────────────────────
  let categoryPostIds: string[] | null = null;
  if (category) {
    const { data: catData } = await admin
      .from("blog_categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (!catData) {
      return NextResponse.json({ posts: [], total: 0, page, pages: 0 });
    }
    const { data: pivotRows } = await admin
      .from("blog_post_categories")
      .select("post_id")
      .eq("category_id", catData.id);
    categoryPostIds = (pivotRows ?? []).map((r) => r.post_id);
    if (categoryPostIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0, page, pages: 0 });
    }
  }

  // ── Resolve tag filter ──────────────────────────────────────────────────────
  let tagPostIds: string[] | null = null;
  if (tag) {
    const { data: tagData } = await admin
      .from("blog_tags")
      .select("id")
      .eq("slug", tag)
      .single();
    if (!tagData) {
      return NextResponse.json({ posts: [], total: 0, page, pages: 0 });
    }
    const { data: pivotRows } = await admin
      .from("blog_post_tags")
      .select("post_id")
      .eq("tag_id", tagData.id);
    tagPostIds = (pivotRows ?? []).map((r) => r.post_id);
    if (tagPostIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0, page, pages: 0 });
    }
  }

  // ── Use PostgreSQL full-text search via textSearch when q is provided ───────
  let query = admin
    .from("blog_posts")
    .select(LIST_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    // Use textSearch for FTS via tsvector — falls back gracefully if index absent
    query = query.textSearch("fts", q, { type: "websearch", config: "english" });
  }

  // Apply ID set intersections
  const idSets = [categoryPostIds, tagPostIds].filter(
    (s): s is string[] => s !== null
  );
  if (idSets.length > 0) {
    const intersected = idSets.reduce((a, b) => a.filter((id) => b.includes(id)));
    if (intersected.length === 0) {
      return NextResponse.json({ posts: [], total: 0, page, pages: 0 });
    }
    query = query.in("id", intersected);
  }

  const { data, error, count } = await query;

  if (error) {
    // If FTS column doesn't exist yet, fall back to ilike
    if (error.message.includes("fts") || error.message.includes("column")) {
      let fallback = admin
        .from("blog_posts")
        .select(LIST_SELECT, { count: "exact" })
        .eq("status", "published")
        .ilike("title", `%${q}%`)
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + limit - 1);

      if (idSets.length > 0) {
        const intersected = idSets.reduce((a, b) => a.filter((id) => b.includes(id)));
        fallback = fallback.in("id", intersected);
      }

      const { data: fbData, error: fbError, count: fbCount } = await fallback;
      if (fbError) {
        return NextResponse.json(
          { type: "about:blank", title: "Internal Server Error", status: 500, detail: fbError.message },
          { status: 500 }
        );
      }

      const total = fbCount ?? 0;
      const pages = Math.ceil(total / limit);
      return NextResponse.json({ posts: mapPosts(fbData ?? []), total, page, pages });
    }

    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({ posts: mapPosts(data ?? []), total, page, pages });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPosts(data: any[]) {
  return data.map((raw) => ({
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? null,
    featured_image_url: raw.cover_image_url ?? null,
    published_at: raw.published_at ?? null,
    read_time: raw.reading_time_minutes ?? null,
    featured: raw.featured ?? false,
    author: raw.author ?? null,
    categories: (raw.categories ?? []).map((pc: { category: unknown }) => pc.category).filter(Boolean),
    tags: (raw.tags ?? []).map((pt: { tag: unknown }) => pt.tag).filter(Boolean),
  }));
}
