import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_global_settings")
    .select("*")
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
  
  // If no settings exist yet, return defaults
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

export async function PATCH(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  // Get the singleton ID
  const { data: existing } = await admin
    .from("ritual_global_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let result;
  if (existing) {
    result = await admin
      .from("ritual_global_settings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await admin
      .from("ritual_global_settings")
      .insert({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
