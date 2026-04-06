import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { CalendarConnections } from "@/components/dashboard/calendar-connections";

export default async function CalendarConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("google_calendar_connected, outlook_calendar_connected")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Connections</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your calendar to sync availability and send native calendar invites to clients.
        </p>
      </div>
      <CalendarConnections
        googleConnected={diviner?.google_calendar_connected ?? false}
        outlookConnected={diviner?.outlook_calendar_connected ?? false}
      />
    </div>
  );
}
