import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/cron/publish-scheduled-posts
 * Runs every 5-10 minutes. Finds blog posts where status = 'scheduled'
 * and scheduled_at <= NOW(), then publishes them.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Find posts that are scheduled and past their publish time
  const { data: posts, error: fetchError } = await admin
    .from("blog_posts")
    .select("id, title, scheduled_at")
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error("[publish-scheduled-posts] query error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let published = 0;
  const errors: string[] = [];

  for (const post of posts) {
    const { error: updateError } = await admin
      .from("blog_posts")
      .update({
        status: "published",
        published_at: now,
      })
      .eq("id", post.id)
      .eq("status", "scheduled"); // guard against race conditions

    if (updateError) {
      console.error(
        `[publish-scheduled-posts] failed to publish post ${post.id}:`,
        updateError
      );
      errors.push(`${post.id}: ${updateError.message}`);
    } else {
      published++;
      console.log(
        `[publish-scheduled-posts] published "${post.title}" (${post.id})`
      );
    }
  }

  return NextResponse.json({
    published,
    total: posts.length,
    ...(errors.length > 0 && { errors }),
  });
}
