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
      {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "slug is required",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Fetch author by slug
  const { data: author, error: authorError } = await admin
    .from("blog_authors")
    .select("id, name, slug, bio, avatar_url")
    .eq("slug", slug)
    .single();

  if (authorError || !author) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: `Author '${slug}' not found`,
      },
      { status: 404 }
    );
  }

  // 2. Fetch last 10 published posts by this author
  const { data: posts, error: postsError } = await admin
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image_url, published_at, reading_time_minutes"
    )
    .eq("author_id", author.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10);

  if (postsError) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: postsError.message,
      },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedPosts = (posts ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    featured_image_url: p.cover_image_url ?? null,
    published_at: p.published_at ?? null,
    read_time_minutes: p.reading_time_minutes ?? null,
  }));

  return NextResponse.json({
    author: {
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio ?? null,
      avatar_url: author.avatar_url ?? null,
    },
    posts: mappedPosts,
  });
}
