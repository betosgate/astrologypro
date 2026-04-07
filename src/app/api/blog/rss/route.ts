import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BASE_URL = "https://astrologypro.com";
const BLOG_TITLE = "AstrologyPro Blog";
const BLOG_DESCRIPTION =
  "Expert advice on running a profitable astrology and tarot practice — pricing, client growth, planetary insights, and more.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      published_at,
      author:blog_authors ( name ),
      categories:blog_post_categories ( category:blog_categories ( name ) )
    `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);

  const items = (posts ?? [])
    .map((post) => {
      const link = `${BASE_URL}/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authorName = (post.author as any)?.name ?? "AstrologyPro";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryName = ((post.categories as any[])?.[0] as any)?.category?.name ?? "";
      const description = post.excerpt ? escapeXml(post.excerpt) : "";

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(authorName)}</author>
      ${categoryName ? `<category>${escapeXml(categoryName)}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BLOG_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(BLOG_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/api/blog/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
