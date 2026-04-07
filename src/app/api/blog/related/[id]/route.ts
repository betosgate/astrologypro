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
  categories:blog_post_categories ( category:blog_categories ( id, name, slug ) )
`.trim();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  if (!postId) {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Get the source post's categories, tags, and author_id
  const { data: sourcePost } = await admin
    .from("blog_posts")
    .select(`
      id,
      author_id,
      blog_post_categories ( category_id ),
      blog_post_tags ( tag_id )
    `)
    .eq("id", postId)
    .eq("status", "published")
    .single();

  if (!sourcePost) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Post not found" },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryIds = ((sourcePost as any).blog_post_categories ?? []).map(
    (pc: { category_id: string }) => pc.category_id
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagIds = ((sourcePost as any).blog_post_tags ?? []).map(
    (pt: { tag_id: string }) => pt.tag_id
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authorId: string | null = (sourcePost as any).author_id ?? null;

  const seen = new Set<string>([postId]);
  const results: unknown[] = [];

  // ── 1. Same category ────────────────────────────────────────────────────────
  if (categoryIds.length > 0 && results.length < 4) {
    const { data: catPivot } = await admin
      .from("blog_post_categories")
      .select("post_id")
      .in("category_id", categoryIds);

    const catIds = [...new Set((catPivot ?? []).map((r) => r.post_id))].filter(
      (id) => !seen.has(id)
    );

    if (catIds.length > 0) {
      const { data: catPosts } = await admin
        .from("blog_posts")
        .select(LIST_SELECT)
        .eq("status", "published")
        .in("id", catIds.slice(0, 20))
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(4 - results.length);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of (catPosts ?? []) as unknown as any[]) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(mapPost(p));
        }
      }
    }
  }

  // ── 2. Same tags ────────────────────────────────────────────────────────────
  if (tagIds.length > 0 && results.length < 4) {
    const { data: tagPivot } = await admin
      .from("blog_post_tags")
      .select("post_id")
      .in("tag_id", tagIds);

    const tagCandidateIds = [...new Set((tagPivot ?? []).map((r) => r.post_id))].filter(
      (id) => !seen.has(id)
    );

    if (tagCandidateIds.length > 0) {
      const { data: tagPosts } = await admin
        .from("blog_posts")
        .select(LIST_SELECT)
        .eq("status", "published")
        .in("id", tagCandidateIds.slice(0, 20))
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(4 - results.length);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of (tagPosts ?? []) as unknown as any[]) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(mapPost(p));
        }
      }
    }
  }

  // ── 3. Same author ──────────────────────────────────────────────────────────
  if (authorId && results.length < 4) {
    const { data: authorPosts } = await admin
      .from("blog_posts")
      .select(LIST_SELECT)
      .eq("status", "published")
      .eq("author_id", authorId)
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(4 - results.length);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (authorPosts ?? []) as unknown as any[]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push(mapPost(p));
      }
    }
  }

  return NextResponse.json({ posts: results.slice(0, 4) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(raw: any) {
  return {
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
  };
}
