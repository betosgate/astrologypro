import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { RouteTracker } from "@/components/shared/route-tracker";
import { TraineeSidebar } from "@/components/trainee/sidebar";
import { SectionContainer } from "@/components/shared/section-container";
import { getPendingContractDestination } from "@/lib/contract-orchestration";

export const metadata = { title: "Trainee Portal - AstrologyPro" };

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, username, avatar_url, training_status, onboarding_completed, mentor_diviner_id, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.onboarding_completed) redirect("/join/trainee/profile");

  // Contract check
  const contractDest = await getPendingContractDestination(user.id, "/trainee");
  if (contractDest) redirect(contractDest);

  const portals = await getUserPortals(supabase, user.id);

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/trainee" />
      <TraineeSidebar 
        trainee={{
          name: trainee.name ?? "",
          username: trainee.username,
          graduated_at: trainee.graduated_at,
          avatar_url: trainee.avatar_url,
        }} 
      />
      
      <main className="lg:pl-64">
        {/* Top utility bar — visible when user has multiple portals or to show notifications */}
        <div className="hidden lg:flex items-center justify-end gap-3 border-b px-6 h-12 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          {portals.length > 1 && (
            <PortalSwitcher portals={portals} currentBase="/trainee" />
          )}
          <NotificationBell userId={user.id} />
        </div>

        <div className="container mx-auto max-w-6xl p-4 pb-20 py-6 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
