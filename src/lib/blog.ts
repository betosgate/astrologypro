import { createAdminClient } from "@/lib/supabase/admin";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type BlogAuthor = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  twitter_handle: string | null;
  website_url: string | null;
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

export type BlogSeries = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
};

export type ContentBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 2 | 3 | 4; content: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "quote"; content: string; attribution?: string }
  | { type: "callout"; variant: "info" | "warning" | "tip"; content: string }
  | { type: "divider" }
  | { type: "cta"; ctaBlockId: string };

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  featured: boolean;
  hero: boolean;
  author: Pick<BlogAuthor, "id" | "name" | "slug" | "avatar_url"> | null;
  categories: Pick<BlogCategory, "id" | "name" | "slug">[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_blocks: ContentBlock[];
  published_at: string | null;
  reading_time_minutes: number | null;
  featured: boolean;
  hero: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  author: BlogAuthor | null;
  series: BlogSeries | null;
  series_order: number | null;
  categories: Pick<BlogCategory, "id" | "name" | "slug">[];
  tags: Pick<BlogTag, "id" | "name" | "slug">[];
};

// ─────────────────────────────────────────────
// Internal select fragments
// ─────────────────────────────────────────────

const LIST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  published_at,
  reading_time_minutes,
  featured,
  hero,
  author:blog_authors ( id, name, slug, avatar_url ),
  categories:blog_post_categories ( category:blog_categories ( id, name, slug ) )
`.trim();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListItem(raw: any): BlogListItem {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? null,
    cover_image_url: raw.cover_image_url ?? null,
    published_at: raw.published_at ?? null,
    reading_time_minutes: raw.reading_time_minutes ?? null,
    featured: raw.featured ?? false,
    hero: raw.hero ?? false,
    author: raw.author ?? null,
    categories: (raw.categories ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((pc: any) => pc.category)
      .filter(Boolean),
  };
}

// ─────────────────────────────────────────────
// Listing helpers
// ─────────────────────────────────────────────

export async function getPublishedPosts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  seriesSlug?: string;
  search?: string;
  cursor?: string;
}): Promise<{ posts: BlogListItem[]; nextCursor: string | null }> {
  const { limit = 12, categorySlug, tagSlug, authorSlug, seriesSlug, search, cursor } = options;

  const admin = createAdminClient();
  let query = admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false }) // deterministic tie-breaker
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (cursor) {
    query = query.lt("id", cursor);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (authorSlug) {
    const authorResult = await admin
      .from("blog_authors")
      .select("id")
      .eq("slug", authorSlug)
      .single();
    if (authorResult.data) {
      query = query.eq("author_id", authorResult.data.id);
    } else {
      return { posts: [], nextCursor: null };
    }
  }

  if (seriesSlug) {
    const seriesResult = await admin
      .from("blog_series")
      .select("id")
      .eq("slug", seriesSlug)
      .single();
    if (seriesResult.data) {
      query = query.eq("series_id", seriesResult.data.id);
    } else {
      return { posts: [], nextCursor: null };
    }
  }

  if (categorySlug) {
    const categoryResult = await admin
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (categoryResult.data) {
      const catId = categoryResult.data.id;
      // filter via pivot — get post ids in this category
      const { data: pivotRows } = await admin
        .from("blog_post_categories")
        .select("post_id")
        .eq("category_id", catId);
      const ids = (pivotRows ?? []).map((r) => r.post_id);
      if (ids.length === 0) return { posts: [], nextCursor: null };
      query = query.in("id", ids);
    } else {
      return { posts: [], nextCursor: null };
    }
  }

  if (tagSlug) {
    const tagResult = await admin
      .from("blog_tags")
      .select("id")
      .eq("slug", tagSlug)
      .single();
    if (tagResult.data) {
      const tagId = tagResult.data.id;
      const { data: pivotRows } = await admin
        .from("blog_post_tags")
        .select("post_id")
        .eq("tag_id", tagId);
      const ids = (pivotRows ?? []).map((r) => r.post_id);
      if (ids.length === 0) return { posts: [], nextCursor: null };
      query = query.in("id", ids);
    } else {
      return { posts: [], nextCursor: null };
    }
  }

  const { data, error } = await query;

  if (error || !data) return { posts: [], nextCursor: null };

  const hasNext = data.length > limit;
  const rows = hasNext ? data.slice(0, limit) : data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextCursor = hasNext ? (rows[rows.length - 1] as any).id as string : null;

  return { posts: rows.map(mapListItem), nextCursor };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
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

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt ?? null,
    cover_image_url: data.cover_image_url ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content_blocks: (data.content_blocks as any) ?? [],
    published_at: data.published_at ?? null,
    reading_time_minutes: data.reading_time_minutes ?? null,
    featured: data.featured ?? false,
    hero: data.hero ?? false,
    seo_title: data.seo_title ?? null,
    seo_description: data.seo_description ?? null,
    og_title: data.og_title ?? null,
    og_description: data.og_description ?? null,
    og_image_url: data.og_image_url ?? null,
    canonical_url: data.canonical_url ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    author: (data.author as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    series: (data.series as any) ?? null,
    series_order: data.series_order ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: ((data.categories as any[]) ?? []).map((pc) => pc.category).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: ((data.tags as any[]) ?? []).map((pt) => pt.tag).filter(Boolean),
  };
}

export async function getRelatedPosts(
  postId: string,
  categoryIds: string[],
  limit = 3
): Promise<BlogListItem[]> {
  if (categoryIds.length === 0) return [];
  const admin = createAdminClient();

  const { data: pivotRows } = await admin
    .from("blog_post_categories")
    .select("post_id")
    .in("category_id", categoryIds);

  const candidateIds = [...new Set((pivotRows ?? []).map((r) => r.post_id))].filter(
    (id) => id !== postId
  );

  if (candidateIds.length === 0) return [];

  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .in("id", candidateIds.slice(0, 50))
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapListItem);
}

export async function getFeaturedPost(): Promise<BlogListItem | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("hero", true)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return mapListItem(data);
}

export async function getHeroPosts(limit = 1): Promise<BlogListItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("hero", true)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapListItem);
}

export async function getLatestPosts(limit = 6): Promise<BlogListItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapListItem);
}

export async function getFeaturedPosts(limit = 3): Promise<BlogListItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapListItem);
}

export async function getAllCategories(): Promise<
  { id: string; name: string; slug: string; description: string | null; _count: number }[]
> {
  const admin = createAdminClient();
  const { data: categories } = await admin
    .from("blog_categories")
    .select("id, name, slug, description")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!categories) return [];

  // Get post counts per category
  const { data: pivotRows } = await admin
    .from("blog_post_categories")
    .select("category_id");

  const countMap: Record<string, number> = {};
  for (const row of pivotRows ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
  }

  return categories.map((c) => ({
    ...c,
    _count: countMap[c.id] ?? 0,
  }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<{ id: string; name: string; slug: string; description: string | null } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getTagBySlug(
  slug: string
): Promise<{ id: string; name: string; slug: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_authors")
    .select("id, name, slug, bio, avatar_url, twitter_handle, website_url")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getSeriesBySlug(slug: string): Promise<BlogSeries | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_series")
    .select("id, name, slug, description, cover_image_url")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getSeriesPosts(seriesId: string): Promise<BlogListItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(LIST_SELECT + ", series_order")
    .eq("status", "published")
    .eq("series_id", seriesId)
    .order("series_order", { ascending: true })
    .order("published_at", { ascending: true });

  return (data ?? []).map(mapListItem);
}

export async function getCtaBlock(
  ctaBlockId: string
): Promise<{ id: string; headline: string; body: string | null; cta_label: string; cta_url: string; variant: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_cta_blocks")
    .select("id, headline, body, cta_label, cta_url, variant")
    .eq("id", ctaBlockId)
    .single();
  return data ?? null;
}

export async function checkBlogRedirect(
  slug: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_redirects")
    .select("to_slug")
    .eq("from_slug", slug)
    .single();
  return data?.to_slug ?? null;
}

export async function getAllPublishedPostSlugs(): Promise<
  { slug: string; published_at: string | null }[]
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getAllAuthorSlugs(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("blog_authors").select("slug");
  return (data ?? []).map((r) => r.slug);
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("blog_categories").select("slug");
  return (data ?? []).map((r) => r.slug);
}
