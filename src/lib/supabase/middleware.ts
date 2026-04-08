import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and applies route-level
 * protection. This helper is consumed by the root `src/proxy.ts`.
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

type ProtectedRoute = {
  prefix: string;
  reason: string;
  apiOnly?: boolean;
};

const PROTECTED_ROUTES: ProtectedRoute[] = [
  { prefix: "/api/admin", reason: "admin", apiOnly: true },
  { prefix: "/api/trainee", reason: "trainee", apiOnly: true },
  { prefix: "/admin", reason: "admin" },
  { prefix: "/dashboard", reason: "dashboard" },
  { prefix: "/portal", reason: "portal" },
  { prefix: "/community", reason: "community" },
  { prefix: "/mystery-school", reason: "mystery-school" },
  { prefix: "/trainee", reason: "trainee" },
  { prefix: "/advocate", reason: "advocate" },
  { prefix: "/affiliate", reason: "affiliate" },
  { prefix: "/onboarding", reason: "onboarding" },
] as const;

function matchProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

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

  const matchedRoute = matchProtectedRoute(pathname);
  const isApiRequest = pathname.startsWith("/api/");

  if (matchedRoute && !user) {
    // API routes get a JSON 401 instead of a redirect.
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Browser routes redirect to login with the reason query param.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", matchedRoute.reason);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
