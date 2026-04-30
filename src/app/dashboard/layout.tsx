import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { getUserPortals } from "@/lib/user-roles";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PhoneWidgetLoader } from "@/components/dashboard/phone-widget-loader";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { RouteTracker } from "@/components/shared/route-tracker";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Admins are never gated by diviner onboarding.
  // They may or may not have a diviners row — let them through regardless.
  const adminUser = await requireAdmin();
  const isAdmin = !!adminUser;

  // Use admin client for the data fetch — auth is already verified above.
  // This bypasses any RLS/session-cookie timing issue that could cause
  // a false-negative and loop the user back to /onboarding.
  const admin = createAdminClient();
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select(
      "id, display_name, username, avatar_url, bio, tagline, onboarding_completed, subscription_status"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (divinerError) {
    console.error("[dashboard/layout] diviner fetch error:", divinerError);
  }

  // Gate non-admin users.
  //
  // The invited-diviner flow (docs/tasks/2026-04-30/diviner-invite-
  // registration-plan-gating.md) requires the dashboard to stay locked
  // for invited diviners who haven't paid yet, while NOT regressing
  // existing diviners whose onboarding wizard already set
  // onboarding_completed=true regardless of Stripe subscription state.
  //
  // The discriminator is the combination:
  //   onboarding_completed=false  ⇢  account is fresh
  //   subscription_status!='active' ⇢  payment has not landed yet
  // …because /api/join/diviner/register inserts the diviner row with
  // onboarding_completed=false and the column default
  // subscription_status='trialing'. The Stripe webhook + success-page
  // finalize flips both fields together, so post-payment users skip
  // both gates cleanly.
  if (!isAdmin) {
    if (!diviner) redirect("/onboarding");
    if (
      !diviner.onboarding_completed &&
      diviner.subscription_status !== "active"
    ) {
      redirect("/join/diviner/plan");
    }
    if (!diviner.onboarding_completed) redirect("/onboarding");
  }

  const portals = await getUserPortals(supabase, user.id, { isAdmin });

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/dashboard" />
      <Sidebar
        diviner={{
          display_name: diviner?.display_name ?? user.email?.split("@")[0] ?? "Admin",
          username: diviner?.username ?? "",
          avatar_url: diviner?.avatar_url ?? null,
        }}
      />
      <main className="lg:pl-64">
        {/* Top utility bar — only visible on desktop when user has multiple roles */}
        {portals.length > 1 && (
          <div className="hidden lg:flex items-center justify-end gap-2 border-b px-6 h-10 bg-background">
            <PortalSwitcher portals={portals} currentBase="/dashboard" />
          </div>
        )}
        <div className="container p-4 pb-20 py-6 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <PhoneWidgetLoader />
    </div>
  );
}
