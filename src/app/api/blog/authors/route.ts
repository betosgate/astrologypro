import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();

  // 1. Fetch all active authors ordered by name
  const { data: authors, error: authorsError } = await admin
    .from("blog_authors")
    .select("id, name, slug, bio, avatar_url")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (authorsError) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: authorsError.message,
      },
      { status: 500 }
    );
  }

  const rows = authors ?? [];

  // 2. Count published posts per author in a single query
  const authorIds = rows.map((a) => a.id);
  let countMap: Record<string, number> = {};

  if (authorIds.length > 0) {
    const { data: postCounts } = await admin
      .from("blog_posts")
      .select("author_id")
      .eq("status", "published")
      .in("author_id", authorIds);

    for (const row of postCounts ?? []) {
      if (row.author_id) {
        countMap[row.author_id] = (countMap[row.author_id] ?? 0) + 1;
      }
    }
  }

  const result = rows.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    bio: a.bio ?? null,
    avatar_url: a.avatar_url ?? null,
    post_count: countMap[a.id] ?? 0,
  }));

  return NextResponse.json({ authors: result });
}
