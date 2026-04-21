import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPost } from "@/lib/social/dispatcher";
import { isPlatform, type Platform } from "@/lib/social/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/social/post
 *
 * Diviner-facing post endpoint. Creates a `scheduled_posts` row and, if the
 * diviner has an active connection for each requested platform, dispatches
 * to our native adapters (lib/social/platforms/*). Platforms without a
 * connection are recorded as failed in the results — the diviner must
 * connect the account first.
 *
 * Body:
 *   {
 *     divinerId:   string (must match a diviners row owned by the caller)
 *     platforms:   Platform[] ("twitter" is the only one enabled at launch)
 *     caption:     string
 *     imageUrl?:   string
 *     scheduledAt?: ISO-8601 string (if in the future, we DO NOT post now —
 *                   the dispatcher will be invoked by a cron when the time arrives)
 *     contentId?:  UUID (marketing_content ref, optional)
 *   }
 *
 * Response:
 *   { success, post, dispatch: DispatchResult[] | null }
 *   dispatch is null when scheduledAt is in the future (deferred) and
 *   populated when we posted immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { divinerId, contentId, platforms, scheduledAt, caption, imageUrl } =
      await request.json();

    if (!divinerId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: "Missing required fields: divinerId, platforms" },
        { status: 400 },
      );
    }

    // Caller must own the diviner profile.
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", divinerId)
      .eq("user_id", user.id)
      .single();
    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate platforms against our registry.
    const validPlatforms: Platform[] = [];
    const invalidPlatforms: string[] = [];
    for (const p of platforms) {
      if (typeof p === "string" && isPlatform(p)) validPlatforms.push(p);
      else invalidPlatforms.push(String(p));
    }
    if (validPlatforms.length === 0) {
      return NextResponse.json(
        { error: "No valid platforms", invalid: invalidPlatforms },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Record the intent in scheduled_posts first (so a failure-to-dispatch
    // still leaves a row we can retry later).
    const { data: post, error: insertErr } = await admin
      .from("scheduled_posts")
      .insert({
        diviner_id: divinerId,
        content_id: contentId ?? null,
        platforms: validPlatforms,
        caption: caption ?? null,
        image_url: imageUrl ?? null,
        scheduled_at: scheduledAt ?? new Date().toISOString(),
        status: scheduledAt ? "scheduled" : "pending",
      })
      .select()
      .single();

    if (insertErr || !post) {
      console.error("[Social] Failed to create scheduled_posts row:", insertErr);
      return NextResponse.json(
        { error: "Failed to schedule post" },
        { status: 500 },
      );
    }

    // If the user asked to schedule for later, we don't dispatch now.
    // A future cron (future task) scans `scheduled_posts` where
    // scheduled_at <= now() AND status = 'scheduled' and calls dispatchPost.
    const shouldDispatchNow =
      !scheduledAt || new Date(scheduledAt).getTime() <= Date.now() + 30_000;

    if (!shouldDispatchNow) {
      return NextResponse.json({ success: true, post, dispatch: null });
    }

    if (!caption) {
      // Mark as failed immediately — nothing to post.
      await admin
        .from("scheduled_posts")
        .update({ status: "failed", error_message: "Missing caption" })
        .eq("id", post.id);
      return NextResponse.json({ success: false, post, dispatch: null }, { status: 400 });
    }

    // Native dispatch (replaces the old Ayrshare call below).
    const dispatch = await dispatchPost({
      owner: { type: "diviner", id: divinerId },
      platforms: validPlatforms,
      content: { text: caption, imageUrl: imageUrl ?? null },
    });

    const anySuccess = dispatch.some((d) => d.ok);
    const anyFailure = dispatch.some((d) => !d.ok);

    // Reuse the existing `ayrshare_post_id` column as a generic platform
    // post id — we store the first successful id. Multi-platform tracking
    // can be extended in a follow-up migration.
    const firstOk = dispatch.find((d) => d.ok);
    const errorMsgs = dispatch
      .filter((d) => !d.ok)
      .map((d) => `${d.platform}: ${d.error}`)
      .join("; ");

    await admin
      .from("scheduled_posts")
      .update({
        ayrshare_post_id: firstOk?.platformPostId ?? null,
        status: anySuccess && !anyFailure
          ? "published"
          : anySuccess
            ? "published"
            : "failed",
        error_message: errorMsgs ? errorMsgs.slice(0, 1000) : null,
      })
      .eq("id", post.id);

    return NextResponse.json({ success: anySuccess, post, dispatch });

    // ─────────────────────────────────────────────────────────────────────
    // LEGACY Ayrshare code path (commented out — replaced by dispatchPost).
    // Kept for reference only. If dispatchPost ever needs to be rolled back,
    // uncomment the block below and remove the native call above.
    // ─────────────────────────────────────────────────────────────────────
    //
    // const ayrshareKey = process.env.AYRSHARE_API_KEY;
    // if (ayrshareKey && caption) {
    //   try {
    //     const ayrshareBody: Record<string, unknown> = {
    //       post: caption,
    //       platforms: validPlatforms,
    //     };
    //     if (scheduledAt) ayrshareBody.scheduleDate = scheduledAt;
    //     if (imageUrl) ayrshareBody.mediaUrls = [imageUrl];
    //
    //     const ayrshareRes = await fetch("https://app.ayrshare.com/api/post", {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${ayrshareKey}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(ayrshareBody),
    //     });
    //
    //     const ayrshareData = await ayrshareRes.json();
    //
    //     if (ayrshareRes.ok && ayrshareData.id) {
    //       await admin
    //         .from("scheduled_posts")
    //         .update({
    //           ayrshare_post_id: ayrshareData.id,
    //           status: scheduledAt ? "scheduled" : "published",
    //         })
    //         .eq("id", post.id);
    //     } else {
    //       console.error("[Social] Ayrshare error:", ayrshareData);
    //       await admin
    //         .from("scheduled_posts")
    //         .update({
    //           status: "failed",
    //           error_message: ayrshareData.message ?? "Ayrshare API error",
    //         })
    //         .eq("id", post.id);
    //     }
    //   } catch (ayrshareErr) {
    //     console.error("[Social] Ayrshare fetch error:", ayrshareErr);
    //   }
    // }
  } catch (err) {
    console.error("[Social] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
