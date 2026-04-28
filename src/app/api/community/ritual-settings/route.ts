import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_global_settings")
    .select("video_loop, video_autoplay, video_controls, video_muted")
    .limit(1)
    .maybeSingle();

  if (error) {
    // Graceful fallback if table doesn't exist yet
    if (error.code === "42P01" || error.message?.includes("ritual_global_settings")) {
      return NextResponse.json({
        video_loop: false,
        video_autoplay: true,
        video_controls: true,
        video_muted: false,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data) {
    return NextResponse.json({
      video_loop: false,
      video_autoplay: true,
      video_controls: true,
      video_muted: false,
    });
  }

  return NextResponse.json(data);
}
