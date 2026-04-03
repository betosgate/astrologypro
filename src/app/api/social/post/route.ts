import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        { status: 400 }
      );
    }

    // Verify the user owns this diviner profile
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", divinerId)
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create scheduled_posts record
    const { data: post, error } = await supabase
      .from("scheduled_posts")
      .insert({
        diviner_id: divinerId,
        content_id: contentId ?? null,
        platforms,
        caption: caption ?? null,
        image_url: imageUrl ?? null,
        scheduled_at: scheduledAt ?? new Date().toISOString(),
        status: scheduledAt ? "scheduled" : "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[Social] Failed to create post:", error);
      return NextResponse.json(
        { error: "Failed to schedule post" },
        { status: 500 }
      );
    }

    // Call Ayrshare API if key is configured
    const ayrshareKey = process.env.AYRSHARE_API_KEY;
    if (ayrshareKey && caption) {
      try {
        const ayrshareBody: Record<string, unknown> = {
          post: caption,
          platforms,
        };
        if (scheduledAt) ayrshareBody.scheduleDate = scheduledAt;
        if (imageUrl) ayrshareBody.mediaUrls = [imageUrl];

        const ayrshareRes = await fetch("https://app.ayrshare.com/api/post", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ayrshareKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ayrshareBody),
        });

        const ayrshareData = await ayrshareRes.json();

        if (ayrshareRes.ok && ayrshareData.id) {
          // Update record with Ayrshare post ID and mark published
          await supabase
            .from("scheduled_posts")
            .update({
              ayrshare_post_id: ayrshareData.id,
              status: scheduledAt ? "scheduled" : "published",
            })
            .eq("id", post.id);
        } else {
          console.error("[Social] Ayrshare error:", ayrshareData);
          await supabase
            .from("scheduled_posts")
            .update({
              status: "failed",
              error_message: ayrshareData.message ?? "Ayrshare API error",
            })
            .eq("id", post.id);
        }
      } catch (ayrshareErr) {
        console.error("[Social] Ayrshare fetch error:", ayrshareErr);
      }
    }

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("[Social] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
