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

  if (!diviner) redirect("/onboarding");
  if (!diviner.onboarding_completed) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/dashboard" />
      <Sidebar
        diviner={{
          display_name: diviner.display_name,
          username: diviner.username,
          avatar_url: diviner.avatar_url,
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
