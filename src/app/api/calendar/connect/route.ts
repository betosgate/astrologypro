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
    .maybeSingle();

  const role: "admin" | "diviner" = diviner?.id ? "diviner" : "admin";
  const ownerId = diviner?.id ?? user.id;

  // State carries role so the callback knows where to redirect and how to
  // persist the token. Format: "<role>:<ownerId>".
  const state = `${role}:${ownerId}`;
  const oauthUrl = await getOAuthUrl(state);
  return NextResponse.redirect(oauthUrl);
}
