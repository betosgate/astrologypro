import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up tracking link by code
  const { data: link } = await supabase
    .from("tracking_links")
    .select("id, destination_url, clicks")
    .eq("code", code)
    .single();

  if (!link) {
    // If not found, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Increment clicks count
  await supabase
    .from("tracking_links")
    .update({ clicks: (link.clicks ?? 0) + 1 })
    .eq("id", link.id);

  // Redirect to destination
  return NextResponse.redirect(link.destination_url);
}
