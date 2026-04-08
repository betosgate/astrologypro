import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SOCIAL_BOT_UA =
  /facebookexternalhit|Facebot|LinkedInBot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Applebot|pinterest|tumblr|redditbot/i;
const SHARE_TOKEN_RE = /^\/share\/([^/]+)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/community/upgrade") {
    return NextResponse.redirect(new URL("/mystery-school/enroll", request.url), 307);
  }

  if (pathname === "/mystery-school/enroll") {
    return NextResponse.rewrite(new URL("/join/mystery-school", request.url));
  }

  const shareMatch = SHARE_TOKEN_RE.exec(pathname);
  if (shareMatch) {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (SOCIAL_BOT_UA.test(userAgent)) {
      const ogUrl = new URL("/api/share-og", request.nextUrl.origin);
      ogUrl.searchParams.set("t", shareMatch[1]);
      return NextResponse.rewrite(ogUrl);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
