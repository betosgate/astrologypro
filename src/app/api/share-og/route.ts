import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// This route serves OG metadata HTML for social media crawlers (Facebook, LinkedIn, etc.)
// It is a dynamic route handler but we explicitly set Cache-Control: public so Vercel
// and social media scrapers can cache and process the OG tags.
//
// The middleware (proxy.ts / middleware.ts) rewrites /share/[token] requests from
// known bot user-agents to this handler, preserving the original URL for og:url.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: batch, error } = await admin
    .from("share_batches")
    .select("*, diviners(id, username, display_name, avatar_url)")
    .eq("token", token)
    .single();

  if (error || !batch) {
    return new NextResponse("Not found", { status: 404 });
  }

  const diviner = batch.diviners as {
    display_name: string;
    username: string;
  } | null;

  const batchRecord = batch as Record<string, unknown>;
  const isMundane = !!(batchRecord.is_mundane);
  const imageUrl = typeof batchRecord.image_url === "string" ? batchRecord.image_url : null;
  const caption = typeof batch.caption === "string" ? batch.caption : "";

  const captionLines = caption.split("\n\n");
  const eventLabel = captionLines[0]?.trim() ?? "";
  const eventDescription = captionLines[1]?.trim() ?? "";

  const title = isMundane && eventLabel
    ? `${eventLabel} — ${diviner?.display_name ?? "AstrologyPro"}`
    : `Share Content - ${diviner?.display_name ?? "AstrologyPro"}`;

  const description = eventDescription || "Daily mundane astrology insights for your social media.";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const sharePageUrl = `${appUrl}/share/${token}`;

  const imageTag = imageUrl
    ? `<meta property="og:image" content="${escHtml(imageUrl)}" />
    <meta property="og:image:width" content="1080" />
    <meta property="og:image:height" content="1080" />
    <meta property="og:image:alt" content="${escHtml(eventLabel || title)}" />
    <meta name="twitter:image" content="${escHtml(imageUrl)}" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="AstrologyPro" />
  <meta property="og:url" content="${escHtml(sharePageUrl)}" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  ${imageTag}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(description)}" />
  <meta http-equiv="refresh" content="0; url=${escHtml(sharePageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escHtml(sharePageUrl)}">${escHtml(title)}</a>…</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Public — Vercel CDN and Facebook/LinkedIn/Twitter will cache this for 1 hour.
      // stale-while-revalidate keeps it fresh without blocking scrapers.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
