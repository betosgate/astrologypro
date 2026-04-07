import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Keep all authenticated portals behind the same session-refresh proxy.
// Community was missing here, which caused valid members to lose access on SSR.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/portal",
  "/community",
  "/mystery-school",
  "/trainee",
  "/advocate",
  "/affiliate",
  "/admin",
  "/onboarding",
];

// Social media crawlers that need OG metadata with public Cache-Control.
// These bots can't execute JavaScript and require pre-rendered OG HTML.
const SOCIAL_BOT_UA = /facebookexternalhit|Facebot|LinkedInBot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Applebot|pinterest|tumblr|redditbot/i;

// Share page token pattern: /share/<token>
const SHARE_TOKEN_RE = /^\/share\/([^/]+)$/;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite social media crawler requests on /share/[token] to the OG handler.
  // The OG handler returns a lightweight HTML page with OG meta tags and
  // Cache-Control: public, which Facebook/LinkedIn require to display previews.
  const shareMatch = SHARE_TOKEN_RE.exec(pathname);
  if (shareMatch) {
    const ua = request.headers.get("user-agent") ?? "";
    if (SOCIAL_BOT_UA.test(ua)) {
      const ogUrl = new URL("/api/share-og", request.nextUrl.origin);
      ogUrl.searchParams.set("t", shareMatch[1]);
      return NextResponse.rewrite(ogUrl);
    }
  }

  // Skip non-protected routes entirely
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — important for keeping the session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Build a clean login URL — do NOT clone request.nextUrl because that
    // carries the original query params (e.g. ?step=5) into the login URL.
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  // Match every protected portal so Supabase auth cookies are refreshed before
  // server components read the session.
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
    "/community/:path*",
    "/mystery-school/:path*",
    "/trainee/:path*",
    "/advocate/:path*",
    "/affiliate/:path*",
    "/admin/:path*",
    "/onboarding",
    "/share/:path*",
  ],
};
