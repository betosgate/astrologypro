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
//   - src/app/admin/tarot/readings/[spreadId]/page.tsx    (tarot redirect target)
//
// Historically this layout gated ALL `/admin/*` behind requireAdmin(), which
// bounced non-admin diviners to /login before their own page's permissive
// guard could run. The carve-out below permits any authenticated user
// through for these subroutes; strict authorization still happens at the
// page level (layer 2 / defense in depth per CLAUDE.md §3).
//
// The chrome is also reduced for these routes — a non-admin diviner should
// never see the admin sidebar.
// ────────────────────────────────────────────────────────────────────────────
const DIVINER_SESSION_PREFIXES = [
  "/admin/session/",
  "/admin/horoscope/session/",
  "/admin/tarot/session/",
  "/admin/tarot/readings/",
];

function isDivinerSessionRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return DIVINER_SESSION_PREFIXES.some((p) => pathname.startsWith(p));
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

  // Non-session admin route → strict admin gate (historical behavior).
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const supabase = await createClient();
  const portals = await getUserPortals(supabase, user.id, { isAdmin: true });

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/admin" />
      <AdminSidebar />
      <main className="lg:pl-60">
        {/* Top utility bar — desktop only, sits above page content */}
        <div className="hidden lg:flex items-center justify-end gap-2 border-b px-6 h-10 bg-background">
          <PortalSwitcher portals={portals} currentBase="/admin" />
          <Suspense fallback={null}>
            <MundaneAlertBell />
          </Suspense>
        </div>
        <SectionContainer size="wide" verticalPadding="md">
          {children}
        </SectionContainer>
      </main>
    </div>
  );
}
