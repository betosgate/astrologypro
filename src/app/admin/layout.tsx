import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MundaneAlertBell } from "@/components/admin/mundane-alert-bell";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { RouteTracker } from "@/components/shared/route-tracker";
import { SectionContainer } from "@/components/shared/section-container";

export const metadata = {
  title: "Admin — AstrologyPro",
};

// ─── Diviner-accessible session subroutes ────────────────────────────────────
//
// These `/admin/*` subroutes are reachable by non-admin diviners from the
// "Open Service" button on their /dashboard/bookings page. The pages
// themselves enforce per-booking ownership via
// requireDivinerOrAdminForBooking() — see:
//   - src/app/admin/session/[bookingId]/page.tsx          (smart router)
//   - src/app/admin/horoscope/session/[bookingId]/page.tsx (single horoscope)
//   - src/app/admin/tarot/session/[bookingId]/page.tsx    (redirects to reading)
//   - src/app/admin/tarot/readings/[spreadId]/page.tsx    (tarot reading target)
//
// Historically this layout gated ALL `/admin/*` behind requireAdmin(), which
// bounced non-admin diviners to /login before their own page's permissive
// guard could run. The carve-out below permits any authenticated user
// through for these subroutes; strict authorization still happens at the
// page level (layer 2 / defense in depth per CLAUDE.md §3).
//
// The chrome is reduced for true session routes — a non-admin diviner should
// never see the admin sidebar. Tarot reading pages are a mixed case: admins
// should keep the normal admin shell, while non-admin diviners still need the
// lightweight session chrome after being redirected from their booking page.
// ────────────────────────────────────────────────────────────────────────────
const DIVINER_SESSION_PREFIXES = [
  "/admin/session/",
  "/admin/horoscope/session/",
  "/admin/tarot/session/",
];

const DIVINER_TAROT_READING_PREFIX = "/admin/tarot/readings/";
const ADMIN_CREATE_ROUTE_SUFFIXES = ["/new", "/create", "/add"];

function isDivinerSessionRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return DIVINER_SESSION_PREFIXES.some((p) => pathname.startsWith(p));
}

function isDivinerTarotReadingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith(DIVINER_TAROT_READING_PREFIX);
}

function isAdminCreateRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return ADMIN_CREATE_ROUTE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

function SessionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/admin" />
      <main>
        <SectionContainer size="wide" verticalPadding="md">
          {children}
        </SectionContainer>
      </main>
    </div>
  );
}

async function AdminShell({
  children,
  userId,
  isCreateRoute,
}: {
  children: React.ReactNode;
  userId: string;
  isCreateRoute?: boolean;
}) {
  const supabase = await createClient();
  const portals = await getUserPortals(supabase, userId, { isAdmin: true });

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/admin" />
      <AdminSidebar />
      <main className="lg:pl-60">
        <div className="hidden lg:flex items-center justify-end gap-2 border-b px-6 h-10 bg-background">
          <PortalSwitcher portals={portals} currentBase="/admin" />
          <Suspense fallback={null}>
            <MundaneAlertBell />
          </Suspense>
        </div>
        <SectionContainer
          size={isCreateRoute ? "default" : "wide"}
          verticalPadding="md"
        >
          {children}
        </SectionContainer>
      </main>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `x-pathname` is injected by src/lib/supabase/middleware.ts (consumed via
  // src/proxy.ts). Layouts don't receive the active pathname as a prop in
  // App Router, so we smuggle it through a request header.
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname");
  const sessionRoute = isDivinerSessionRoute(pathname);
  const tarotReadingRoute = isDivinerTarotReadingRoute(pathname);
  const createRoute = isAdminCreateRoute(pathname);

  if (sessionRoute) {
    // Layer 1: authenticated users only. Layer 2 (page-level
    // requireDivinerOrAdminForBooking) enforces booking ownership.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const qs = new URLSearchParams({
        reason: "admin",
        ...(pathname ? { redirect: pathname } : {}),
      });
      redirect(`/login?${qs.toString()}`);
    }

    return <SessionShell>{children}</SessionShell>;
  }

  if (tarotReadingRoute) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const qs = new URLSearchParams({
        reason: "admin",
        ...(pathname ? { redirect: pathname } : {}),
      });
      redirect(`/login?${qs.toString()}`);
    }

    const adminUser = await requireAdmin();
    if (adminUser && adminUser.id === user.id) {
      return <AdminShell userId={user.id} isCreateRoute={createRoute}>{children}</AdminShell>;
    }

    return <SessionShell>{children}</SessionShell>;
  }

  // Non-session admin route → strict admin gate (historical behavior).
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");
  return <AdminShell userId={user.id} isCreateRoute={createRoute}>{children}</AdminShell>;
}
