import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, type, ctaBlockId, sessionId } = body as {
      postId: string;
      type: "view" | "cta_click";
      ctaBlockId?: string;
      sessionId?: string;
    };

    if (!postId || !type) {
      return NextResponse.json({}, { status: 200 });
    }
    if (type !== "view" && type !== "cta_click") {
      return NextResponse.json({}, { status: 200 });
    }

    const admin = createAdminClient();

    if (type === "view") {
      // Dedup: skip if same session already viewed this post in the last 30 minutes
      if (sessionId) {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: existing } = await admin
          .from("blog_post_views")
          .select("id")
          .eq("post_id", postId)
          .eq("session_id", sessionId)
          .gte("viewed_at", cutoff)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({}, { status: 200 });
        }
      }

      // Insert view
      admin
        .from("blog_post_views")
        .insert({ post_id: postId, session_id: sessionId ?? null })
        .then(() => {}, () => {});

      // Increment view_count on blog_posts (fire-and-forget)
      admin
        .rpc("increment_blog_view_count", { p_post_id: postId })
        .then(() => {}, () => {});

    } else if (type === "cta_click") {
      admin
        .from("blog_cta_clicks")
        .insert({
          post_id: postId,
          cta_block_id: ctaBlockId ?? null,
          session_id: sessionId ?? null,
        })
        .then(() => {}, () => {});
    }
  } catch {
    // Never surface errors to client
  }

  return NextResponse.json({}, { status: 200 });
}
