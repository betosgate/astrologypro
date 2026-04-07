import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Eye, FileText, MousePointerClick, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AnalyticsData = {
  total_views: number;
  total_posts: number;
  total_cta_clicks: number;
  avg_views_per_post: number;
  top_posts: { id: string; title: string; slug: string; view_count: number; cta_clicks: number }[];
  views_by_day: { date: string; views: number }[];
  top_categories: { name: string; slug: string; view_count: number }[];
  top_cta_blocks: { id: string; title: string; type: string; clicks: number }[];
  period_days: number;
};

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getAnalytics(days = 30): Promise<AnalyticsData> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [viewsResult, postsResult, ctaClicksResult, viewsWithPostId, ctaWithPostId, ctaBlockClicks] =
    await Promise.all([
      admin.from("blog_post_views").select("id", { count: "exact", head: true }).gte("viewed_at", since),
      admin.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("blog_cta_clicks").select("id", { count: "exact", head: true }).gte("clicked_at", since),
      admin.from("blog_post_views").select("post_id, viewed_at").gte("viewed_at", since),
      admin.from("blog_cta_clicks").select("post_id").gte("clicked_at", since),
      admin.from("blog_cta_clicks").select("cta_block_id").gte("clicked_at", since).not("cta_block_id", "is", null),
    ]);

  const totalViews = viewsResult.count ?? 0;
  const totalPosts = postsResult.count ?? 0;
  const totalCtaClicks = ctaClicksResult.count ?? 0;
  const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

  // Views by day
  const dayMap = new Map<string, number>();
  for (const row of viewsWithPostId.data ?? []) {
    const date = row.viewed_at.slice(0, 10);
    dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
  }
  const viewsByDay: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    viewsByDay.push({ date: dateStr, views: dayMap.get(dateStr) ?? 0 });
  }

  // Post view counts
  const postViewCount = new Map<string, number>();
  for (const row of viewsWithPostId.data ?? []) {
    if (row.post_id) postViewCount.set(row.post_id, (postViewCount.get(row.post_id) ?? 0) + 1);
  }

  const postCtaCount = new Map<string, number>();
  for (const row of ctaWithPostId.data ?? []) {
    if (row.post_id) postCtaCount.set(row.post_id, (postCtaCount.get(row.post_id) ?? 0) + 1);
  }

  const topPostIds = [...postViewCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);

  let topPosts: AnalyticsData["top_posts"] = [];
  if (topPostIds.length > 0) {
    const { data: postsData } = await admin.from("blog_posts").select("id, title, slug").in("id", topPostIds);
    topPosts = (postsData ?? [])
      .map((p) => ({ id: p.id, title: p.title, slug: p.slug, view_count: postViewCount.get(p.id) ?? 0, cta_clicks: postCtaCount.get(p.id) ?? 0 }))
      .sort((a, b) => b.view_count - a.view_count);
  }

  // Top categories
  let topCategories: AnalyticsData["top_categories"] = [];
  if (topPostIds.length > 0) {
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
    topCategories = [...catMap.values()].sort((a, b) => b.view_count - a.view_count).slice(0, 10);
  }

  // Top CTA blocks
  const ctaBlockIdCount = new Map<string, number>();
  for (const row of ctaBlockClicks.data ?? []) {
    if (row.cta_block_id) ctaBlockIdCount.set(row.cta_block_id, (ctaBlockIdCount.get(row.cta_block_id) ?? 0) + 1);
  }
  const topCtaBlockIds = [...ctaBlockIdCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);

  let topCtaBlocks: AnalyticsData["top_cta_blocks"] = [];
  if (topCtaBlockIds.length > 0) {
    const { data: blocksData } = await admin.from("blog_cta_blocks").select("id, title, type").in("id", topCtaBlockIds);
    topCtaBlocks = (blocksData ?? [])
      .map((b) => ({ id: b.id, title: b.title, type: b.type ?? "generic", clicks: ctaBlockIdCount.get(b.id) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks);
  }

  return { total_views: totalViews, total_posts: totalPosts, total_cta_clicks: totalCtaClicks, avg_views_per_post: avgViewsPerPost, top_posts: topPosts, views_by_day: viewsByDay, top_categories: topCategories, top_cta_blocks: topCtaBlocks, period_days: days };
}

// ─── CSS bar chart ─────────────────────────────────────────────────────────────

function CssBarChart({ data }: { data: { date: string; views: number }[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);
  // Show last 14 days for readability
  const display = data.slice(-14);

  return (
    <div className="space-y-1">
      {display.map((row) => {
        const pct = Math.round((row.views / maxViews) * 100);
        const label = new Date(row.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <div key={row.date} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{label}</span>
            <div className="flex-1 rounded-full bg-muted h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-xs text-muted-foreground text-right">{row.views}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CTA type badge ────────────────────────────────────────────────────────────

const CTA_TYPE_CLASSES: Record<string, string> = {
  course: "bg-blue-100 text-blue-700",
  service: "bg-purple-100 text-purple-700",
  newsletter: "bg-green-100 text-green-700",
  generic: "bg-gray-100 text-gray-700",
};

function CtaTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CTA_TYPE_CLASSES[type] ?? CTA_TYPE_CLASSES.generic}`}>
      {type}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogAnalyticsPage() {
  const data = await getAnalytics(30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Analytics</h1>
          <p className="text-muted-foreground">Last {data.period_days} days</p>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Link href="/admin/blog" className="hover:text-foreground transition-colors">Posts</Link>
          <span>·</span>
          <Link href="/admin/blog/cta-blocks" className="hover:text-foreground transition-colors">CTA Blocks</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views (30d)</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_views.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_posts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTA Clicks (30d)</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_cta_clicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views / Post</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avg_views_per_post.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Views by day chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4" />
            Views by Day (last 14 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.views_by_day.every((d) => d.views === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No view data in this period.</p>
          ) : (
            <CssBarChart data={data.views_by_day} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Posts by Views</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_posts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No post view data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">CTA Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[200px]">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="text-sm font-medium hover:text-amber-600 transition-colors truncate block"
                        >
                          {post.title}
                        </Link>
                        <span className="text-xs text-muted-foreground font-mono">/blog/{post.slug}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{post.view_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{post.cta_clicks.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No category data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_categories.map((cat) => (
                    <TableRow key={cat.slug}>
                      <TableCell className="text-sm font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right text-sm">{cat.view_count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top CTA blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top CTA Blocks by Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_cta_blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No CTA click data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_cta_blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="text-sm font-medium">{block.title}</TableCell>
                    <TableCell><CtaTypeBadge type={block.type} /></TableCell>
                    <TableCell className="text-right text-sm">{block.clicks.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
