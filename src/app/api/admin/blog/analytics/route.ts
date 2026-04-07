import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const days = Math.min(Math.max(parseInt(sp.get("days") ?? "30", 10), 1), 365);

  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Run queries in parallel
  const [
    viewsResult,
    postsResult,
    viewsByDayResult,
    ctaClicksResult,
    ctaBlocksResult,
  ] = await Promise.all([
    // Total views in period
    admin
      .from("blog_post_views")
      .select("id", { count: "exact", head: true })
      .gte("viewed_at", since),

    // Total published posts
    admin
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),

    // Views grouped by day — fetch raw rows and group in JS
    admin
      .from("blog_post_views")
      .select("viewed_at")
      .gte("viewed_at", since)
      .order("viewed_at", { ascending: true }),

    // Total CTA clicks in period
    admin
      .from("blog_cta_clicks")
      .select("id", { count: "exact", head: true })
      .gte("clicked_at", since),

    // Top CTA blocks with click counts in period
    admin
      .from("blog_cta_clicks")
      .select("cta_block_id")
      .gte("clicked_at", since)
      .not("cta_block_id", "is", null),
  ]);

  const totalViews = viewsResult.count ?? 0;
  const totalPosts = postsResult.count ?? 0;
  const totalCtaClicks = ctaClicksResult.count ?? 0;
  const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

  // Views by day — bucket into date strings
  const dayMap = new Map<string, number>();
  for (const row of viewsByDayResult.data ?? []) {
    const date = row.viewed_at.slice(0, 10);
    dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
  }
  // Fill missing days with 0 so chart has no gaps
  const viewsByDay: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    viewsByDay.push({ date: dateStr, views: dayMap.get(dateStr) ?? 0 });
  }

  // Top 10 posts by view count in period
  const postViewsMap = new Map<string, number>();
  for (const row of viewsByDayResult.data ?? []) {
    // We need post_id — re-fetch with post_id
  }

  // Re-fetch views with post_id for top posts
  const { data: viewsWithPostId } = await admin
    .from("blog_post_views")
    .select("post_id")
    .gte("viewed_at", since);

  const postViewCount = new Map<string, number>();
  for (const row of viewsWithPostId ?? []) {
    if (row.post_id) {
      postViewCount.set(row.post_id, (postViewCount.get(row.post_id) ?? 0) + 1);
    }
  }

  // CTA clicks by post_id in period
  const { data: ctaWithPostId } = await admin
    .from("blog_cta_clicks")
    .select("post_id")
    .gte("clicked_at", since);

  const postCtaCount = new Map<string, number>();
  for (const row of ctaWithPostId ?? []) {
    if (row.post_id) {
      postCtaCount.set(row.post_id, (postCtaCount.get(row.post_id) ?? 0) + 1);
    }
  }

  // Get top 10 post IDs by view count
  const topPostIds = [...postViewCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topPosts: { id: string; title: string; slug: string; view_count: number; cta_clicks: number }[] = [];
  if (topPostIds.length > 0) {
    const { data: postsData } = await admin
      .from("blog_posts")
      .select("id, title, slug")
      .in("id", topPostIds);

    topPosts = (postsData ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      view_count: postViewCount.get(p.id) ?? 0,
      cta_clicks: postCtaCount.get(p.id) ?? 0,
    })).sort((a, b) => b.view_count - a.view_count);
  }

  // Top categories by view count
  const topCategoriesData = await (async () => {
    if (topPostIds.length === 0) return [];
    const { data: catPivot } = await admin
      .from("blog_post_categories")
      .select("post_id, blog_categories(id, name, slug)")
      .in("post_id", topPostIds);

    const catMap = new Map<string, { name: string; slug: string; view_count: number }>();
    for (const row of catPivot ?? []) {
      const cat = (row.blog_categories as unknown) as { id: string; name: string; slug: string } | null;
      if (!cat) continue;
      const existing = catMap.get(cat.id) ?? { name: cat.name, slug: cat.slug, view_count: 0 };
      existing.view_count += postViewCount.get(row.post_id) ?? 0;
      catMap.set(cat.id, existing);
    }
    return [...catMap.values()].sort((a, b) => b.view_count - a.view_count).slice(0, 10);
  })();

  // Top CTA blocks
  const ctaBlockIdCount = new Map<string, number>();
  for (const row of ctaBlocksResult.data ?? []) {
    if (row.cta_block_id) {
      ctaBlockIdCount.set(row.cta_block_id, (ctaBlockIdCount.get(row.cta_block_id) ?? 0) + 1);
    }
  }

  const topCtaBlockIds = [...ctaBlockIdCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topCtaBlocks: { id: string; title: string; type: string; clicks: number }[] = [];
  if (topCtaBlockIds.length > 0) {
    const { data: blocksData } = await admin
      .from("blog_cta_blocks")
      .select("id, title, type")
      .in("id", topCtaBlockIds);

    topCtaBlocks = (blocksData ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      type: b.type ?? "generic",
      clicks: ctaBlockIdCount.get(b.id) ?? 0,
    })).sort((a, b) => b.clicks - a.clicks);
  }

  return NextResponse.json({
    total_views: totalViews,
    total_posts: totalPosts,
    total_cta_clicks: totalCtaClicks,
    avg_views_per_post: avgViewsPerPost,
    top_posts: topPosts,
    views_by_day: viewsByDay,
    top_categories: topCategoriesData,
    top_cta_blocks: topCtaBlocks,
    period_days: days,
  });
}
