import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: diviner } = await supabase
    .from("diviners")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    username: diviner.username,
    displayName: diviner.display_name,
    avatarUrl: diviner.avatar_url,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com",
  });
}
