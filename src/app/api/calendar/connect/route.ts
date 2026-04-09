import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuthUrl } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  // First, check if they are a Diviner
  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let ownerId = diviner?.id;

  // If not a Diviner, use their User ID (for Admins)
  if (!ownerId) {
    ownerId = user.id;
  }

  const oauthUrl = getOAuthUrl(ownerId);
  return NextResponse.redirect(oauthUrl);
}
