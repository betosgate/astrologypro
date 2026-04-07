import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();

  const { data: categories, error } = await admin
    .from("blog_categories")
    .select("id, name, slug, description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  if (!categories || categories.length === 0) {
    return NextResponse.json([]);
  }

  // Count published posts per category via pivot
  const { data: pivotRows } = await admin
    .from("blog_post_categories")
    .select("category_id, blog_posts!inner(status)")
    .eq("blog_posts.status" as never, "published");

  const countMap: Record<string, number> = {};
  for (const row of pivotRows ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
  }

  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    sort_order: c.sort_order,
    post_count: countMap[c.id] ?? 0,
  }));

  return NextResponse.json(result);
}
