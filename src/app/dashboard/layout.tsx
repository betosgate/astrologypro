import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPortals } from "@/lib/user-roles";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PhoneWidgetLoader } from "@/components/dashboard/phone-widget-loader";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { RouteTracker } from "@/components/shared/route-tracker";
import { SupportWidget } from "@/components/dashboard/support-widget";

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
  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = adminRow?.role === "admin";
  const isSupportStaff = adminRow?.role === "support_staff";
  const isAnyAdmin = !!adminRow;

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

  // Check for affiliate account
  const { data: affiliateAccount } = await admin
    .from("affiliate_accounts")
    .select("id, name, email, avatar_url, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAffiliate = affiliateAccount?.status === "active";

  // Gate non-admin users.
  if (!isAnyAdmin) {
    if (!diviner && !isAffiliate) redirect("/onboarding");
    
    if (diviner) {
      if (
        !diviner.onboarding_completed &&
        diviner.subscription_status !== "active"
      ) {
        redirect("/join/diviner/plan");
      }
      if (!diviner.onboarding_completed) redirect("/onboarding");
    }
  }

  const portals = await getUserPortals(supabase, user.id, { isAdmin });

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/dashboard" />
      <Sidebar
        isAdmin={isAdmin}
        isSupportStaff={isSupportStaff}
        isAffiliate={isAffiliate}
        diviner={diviner ? {
          display_name: diviner.display_name,
          username: diviner.username,
          avatar_url: diviner.avatar_url,
        } : undefined}
        affiliate={affiliateAccount ? {
          name: affiliateAccount.name,
          email: affiliateAccount.email,
          avatar_url: affiliateAccount.avatar_url,
        } : undefined}
      />
      <main className="lg:pl-64">
        {/* Top utility bar — only visible on desktop when user has multiple roles */}
        {portals.length > 1 && (
          <div className="hidden lg:flex items-center justify-end gap-2 border-b px-6 h-10 bg-background">
            <PortalSwitcher portals={portals} currentBase="/dashboard" />
          </div>
        )}
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] py-6 lg:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <PhoneWidgetLoader />
      <SupportWidget />
    </div>
  );
}
