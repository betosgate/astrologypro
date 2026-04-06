import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/social-advocacy-post
 * Runs daily. Posts active social advocacy items to Ayrshare based on their frequency.
 *
 * Frequency rules:
 *   Daily   — post if not already posted today
 *   Weekly  — post if last_posted_at is null or > 7 days ago
 *   Monthly — post if last_posted_at is null or > 30 days ago
 *   Custom  — post if last_posted_at is null (one-time unless reset)
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const ayrshareKey = process.env.AYRSHARE_API_KEY;
  if (!ayrshareKey) {
    return NextResponse.json({ message: "AYRSHARE_API_KEY not configured — skipping" });
  }

  const admin = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const { data: items, error } = await admin
    .from("social_advocacy")
    .select("id, title, frequency, link, image_url, last_posted_at")
    .eq("is_active", true);

  if (error) {
    console.error("[social-advocacy-post] fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toPost = (items ?? []).filter((item) => {
    const lastPosted = item.last_posted_at ? new Date(item.last_posted_at) : null;

    switch (item.frequency) {
      case "Daily":
        return !lastPosted || lastPosted < todayStart;
      case "Weekly":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return !lastPosted || lastPosted < sevenDaysAgo;
      case "Monthly":
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return !lastPosted || lastPosted < thirtyDaysAgo;
      case "Custom":
        return !lastPosted;
      default:
        return false;
    }
  });

  const results: { id: string; title: string; status: string; error?: string }[] = [];

  for (const item of toPost) {
    try {
      const postBody: Record<string, unknown> = {
        post: item.link
          ? `${item.title}\n\n${item.link}`
          : item.title,
        platforms: ["facebook", "twitter", "instagram"],
      };

      if (item.image_url) {
        postBody.mediaUrls = [item.image_url];
      }

      const res = await fetch("https://app.ayrshare.com/api/post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ayrshareKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postBody),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        await admin
          .from("social_advocacy")
          .update({ last_posted_at: now.toISOString(), updated_at: now.toISOString() })
          .eq("id", item.id);
        results.push({ id: item.id, title: item.title, status: "posted" });
      } else {
        console.error(`[social-advocacy-post] Ayrshare error for ${item.id}:`, data);
        results.push({ id: item.id, title: item.title, status: "failed", error: data.message ?? "Ayrshare error" });
      }
    } catch (err) {
      console.error(`[social-advocacy-post] Error posting ${item.id}:`, err);
      results.push({ id: item.id, title: item.title, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({
    success: true,
    checked: (items ?? []).length,
    posted: results.filter((r) => r.status === "posted").length,
    skipped: (items ?? []).length - toPost.length,
    results,
  });
}
