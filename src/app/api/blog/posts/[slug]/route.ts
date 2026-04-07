import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "slug is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      cover_image_url,
      content_blocks,
      published_at,
      reading_time_minutes,
      featured,
      hero,
      seo_title,
      seo_description,
      og_title,
      og_description,
      og_image_url,
      canonical_url,
      series_order,
      author:blog_authors ( id, name, slug, bio, avatar_url, twitter_handle, website_url ),
      series:blog_series ( id, name, slug, description, cover_image_url ),
      categories:blog_post_categories ( category:blog_categories ( id, name, slug ) ),
      tags:blog_post_tags ( tag:blog_tags ( id, name, slug ) )
      `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: `Post '${slug}' not found` },
      { status: 404 }
    );
  }

  // Increment view_count — fire and forget
  admin
    .from("blog_posts")
    .update({ view_count: (data as unknown as { view_count?: number }).view_count ? (data as unknown as { view_count: number }).view_count + 1 : 1 })
    .eq("id", data.id)
    .then(() => {}, () => {});

  // Alternatively use rpc if available — using a simpler approach via raw SQL increment
  admin.rpc("increment_blog_view_count" as never, { post_id: data.id }).then(() => {}, () => {});

  const post = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt ?? null,
    featured_image_url: data.cover_image_url ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content_blocks: (data.content_blocks as any) ?? [],
    published_at: data.published_at ?? null,
    read_time: data.reading_time_minutes ?? null,
    featured: data.featured ?? false,
    hero: data.hero ?? false,
    seo_title: data.seo_title ?? null,
    seo_description: data.seo_description ?? null,
    og_title: data.og_title ?? null,
    og_description: data.og_description ?? null,
    og_image_url: data.og_image_url ?? null,
    canonical_url: data.canonical_url ?? null,
    series_order: data.series_order ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    author: (data.author as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    series: (data.series as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: ((data.categories as any[]) ?? []).map((pc) => pc.category).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: ((data.tags as any[]) ?? []).map((pt) => pt.tag).filter(Boolean),
  };

  return NextResponse.json(post);
}
