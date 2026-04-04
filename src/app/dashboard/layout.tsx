import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PhoneWidgetLoader } from "@/components/dashboard/phone-widget-loader";
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

  // Admins (ADMIN_EMAILS) are never gated by diviner onboarding.
  // They may or may not have a diviners row — let them through regardless.
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes((user.email ?? "").toLowerCase());

  // Use admin client for the data fetch — auth is already verified above.
  // This bypasses any RLS/session-cookie timing issue that could cause
  // a false-negative and loop the user back to /onboarding.
  const admin = createAdminClient();
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id, display_name, username, avatar_url, bio, tagline, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (divinerError) {
    console.error("[dashboard/layout] diviner fetch error:", divinerError);
  }

  // Gate non-admin users until they complete the diviner onboarding wizard.
  if (!isAdmin) {
    if (!diviner) redirect("/onboarding");
    if (!diviner.onboarding_completed) redirect("/onboarding");
  }

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
        <div className="container mx-auto max-w-6xl p-4 pb-20 py-6 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <PhoneWidgetLoader />
    </div>
  );
}
