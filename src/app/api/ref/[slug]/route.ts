import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/ref/[slug]
// Public endpoint: records the click, increments counter, redirects to homepage (or product page)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Look up the referral link
  const { data: link, error } = await admin
    .from("affiliate_referral_links")
    .select("id, affiliate_id, diviner_id, product_id, product_type, is_active, clicks")
    .eq("slug", slug)
    .single();

  if (error || !link) {
    // Unknown slug — redirect to homepage silently
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!link.is_active) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Record click asynchronously (fire-and-forget pattern — don't block the redirect)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const referrer = request.headers.get("referer") ?? null;

  // Increment click counter
  await admin
    .from("affiliate_referral_links")
    .update({ clicks: (link.clicks ?? 0) + 1 })
    .eq("id", link.id);

  // Insert click record
  await admin.from("affiliate_clicks").insert({
    link_id: link.id,
    affiliate_id: link.affiliate_id,
    ip_address: ip,
    user_agent: userAgent,
    referrer,
    converted: false,
  });

  // Determine redirect target
  let destination = "/";
  if (link.product_id && link.product_type === "package") {
    destination = `/packages/${link.product_id}?ref=${slug}`;
  } else {
    destination = `/?ref=${slug}`;
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
