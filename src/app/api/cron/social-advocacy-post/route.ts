import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { dispatchPost } from "@/lib/social/dispatcher";
import { isPlatformEnabled } from "@/lib/social/platform-registry";
import type { Platform } from "@/lib/social/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/social-advocacy-post
 *
 * Runs daily. Posts active social-advocacy items to the admin's connected
 * social accounts, based on each item's frequency:
 *   Daily   — post if not already posted today
 *   Weekly  — last_posted_at null or > 7 days ago
 *   Monthly — last_posted_at null or > 30 days ago
 *   Custom  — last_posted_at null (one-time unless reset)
 *
 * Uses the native dispatcher (lib/social/dispatcher.ts) against the brand
 * (admin-owner) connections in social_accounts. Replaces the old Ayrshare
 * fan-out below, which is kept commented out for rollback safety.
 */

// Platforms we attempt to post to per item. Only enabled ones actually
// dispatch — disabled platforms are filtered out before the loop.
const ADMIN_BROADCAST_PLATFORMS: Platform[] = [
  "twitter",
  "facebook",
  "instagram",
];

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const activePlatforms = ADMIN_BROADCAST_PLATFORMS.filter(isPlatformEnabled);
  if (activePlatforms.length === 0) {
    return NextResponse.json({
      message:
        "No enabled broadcast platforms. Enable at least one in platform-registry.ts and connect it via /admin/social-connections.",
    });
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
      case "Weekly": {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return !lastPosted || lastPosted < sevenDaysAgo;
      }
      case "Monthly": {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return !lastPosted || lastPosted < thirtyDaysAgo;
      }
      case "Custom":
        return !lastPosted;
      default:
        return false;
    }
  });

  const results: Array<{
    id: string;
    title: string;
    status: "posted" | "partial" | "failed";
    perPlatform: Array<{ platform: Platform; ok: boolean; error?: string; permalink?: string | null }>;
  }> = [];

  for (const item of toPost) {
    const text = item.link ? `${item.title}\n\n${item.link}` : item.title;

    try {
      const dispatch = await dispatchPost({
        owner: { type: "admin", id: null },
        platforms: activePlatforms,
        content: { text, imageUrl: item.image_url ?? null },
      });

      const okCount = dispatch.filter((d) => d.ok).length;
      const status: "posted" | "partial" | "failed" =
        okCount === activePlatforms.length
          ? "posted"
          : okCount > 0
            ? "partial"
            : "failed";

      if (okCount > 0) {
        await admin
          .from("social_advocacy")
          .update({
            last_posted_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", item.id);
      }

      results.push({
        id: item.id,
        title: item.title,
        status,
        perPlatform: dispatch.map((d) => ({
          platform: d.platform,
          ok: d.ok,
          error: d.error,
          permalink: d.permalink ?? null,
        })),
      });
    } catch (err) {
      console.error(`[social-advocacy-post] dispatch error for ${item.id}:`, err);
      results.push({
        id: item.id,
        title: item.title,
        status: "failed",
        perPlatform: [],
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked: (items ?? []).length,
    attempted: toPost.length,
    posted: results.filter((r) => r.status === "posted").length,
    partial: results.filter((r) => r.status === "partial").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: (items ?? []).length - toPost.length,
    results,
  });

  // ─────────────────────────────────────────────────────────────────────
  // LEGACY Ayrshare code path (commented out — replaced by dispatchPost
  // against admin-owned social_accounts connections). Kept for rollback.
  // ─────────────────────────────────────────────────────────────────────
  //
  // const ayrshareKey = process.env.AYRSHARE_API_KEY;
  // if (!ayrshareKey) {
  //   return NextResponse.json({ message: "AYRSHARE_API_KEY not configured — skipping" });
  // }
  //
  // for (const item of toPost) {
  //   try {
  //     const postBody: Record<string, unknown> = {
  //       post: item.link ? `${item.title}\n\n${item.link}` : item.title,
  //       platforms: ["facebook", "twitter", "instagram"],
  //     };
  //     if (item.image_url) postBody.mediaUrls = [item.image_url];
  //
  //     const res = await fetch("https://app.ayrshare.com/api/post", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${ayrshareKey}`,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(postBody),
  //     });
  //     const data = await res.json();
  //     if (res.ok && data.id) {
  //       await admin
  //         .from("social_advocacy")
  //         .update({ last_posted_at: now.toISOString(), updated_at: now.toISOString() })
  //         .eq("id", item.id);
  //     }
  //   } catch (err) {
  //     console.error(`[social-advocacy-post] Error posting ${item.id}:`, err);
  //   }
  // }
}
