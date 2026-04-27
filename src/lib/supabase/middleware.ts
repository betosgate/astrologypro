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
 *
 * Public exceptions (sub-paths underneath a protected prefix) are listed in
 * PUBLIC_PREFIXES and bypass the gate — used for invite-acceptance pages
 * where the visitor cannot have a session yet.
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

// Public sub-paths that sit underneath a protected prefix and must not be
// gated. /affiliate/accept/* is the invitation-acceptance flow — first-time
// invitees have no session yet, so the redirect to /login leaves them
// stranded with no credentials.
const PUBLIC_PREFIXES = ["/affiliate/accept", "/api/affiliate/accept"];

function matchProtectedRoute(pathname: string) {
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return undefined;
  }
  return PROTECTED_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  // Forward the active pathname to downstream server components via a request
  // header. Next.js does not expose the pathname directly inside layout.tsx
  // server components (params only include dynamic segment values, not the
  // full path), so we inject `x-pathname` here and read it back from
  // `headers()` in the admin layout to branch auth behavior for diviner-
  // accessible session subroutes. Keep this header name stable — other
  // server components may start relying on it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
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
