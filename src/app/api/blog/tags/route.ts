import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));

  const admin = createAdminClient();

  // Get all tags
  const { data: tags, error } = await admin
    .from("blog_tags")
    .select("id, name, slug");

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  if (!tags || tags.length === 0) {
    return NextResponse.json([]);
  }

  // Count published posts per tag via pivot join
  const { data: pivotRows } = await admin
    .from("blog_post_tags")
    .select("tag_id, blog_posts!inner(status)")
    .eq("blog_posts.status" as never, "published");

  const countMap: Record<string, number> = {};
  for (const row of pivotRows ?? []) {
    countMap[row.tag_id] = (countMap[row.tag_id] ?? 0) + 1;
  }

  const result = tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      post_count: countMap[t.id] ?? 0,
    }))
    .sort((a, b) => b.post_count - a.post_count)
    .slice(0, limit);

  return NextResponse.json(result);
}
