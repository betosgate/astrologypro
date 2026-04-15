import { Suspense } from "react";
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
