import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and applies route-level
 * protection.  This helper is consumed by the root `src/middleware.ts`.
 *
 * Protected route groups:
 *  - /admin/**  and /api/admin/**
 *  - /dashboard/**
 *  - /portal/**
 *  - /community/**
 *  - /mystery-school/**
 *  - /trainee/**
 *
 * Browser requests to protected routes redirect to /login?reason=<group>.
 * API requests return a 401 JSON response.
 */

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/portal",
  "/community",
  "/mystery-school",
  "/trainee",
] as const;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Always call getUser() so the session cookie is refreshed automatically.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check if the current path falls under a protected prefix.
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (matchedPrefix && !user) {
    // API routes get a JSON 401 instead of a redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Browser routes redirect to login with the reason query param.
    const reason = matchedPrefix.replace(/^\//, ""); // e.g. "admin"
    const loginUrl = new URL(`/login?reason=${reason}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
