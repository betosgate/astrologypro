import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  CalendarConnections,
  type CalendarConnectionSummary,
} from "@/components/dashboard/calendar-connections";

export default async function CalendarConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: connections } = diviner
    ? await admin
        .from("calendar_connections")
        .select("id, provider, email, account_identifier, created_at, updated_at")
        .eq("owner_id", diviner.id)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] as Array<Record<string, unknown>> };

  const googleConnections: CalendarConnectionSummary[] = (connections ?? [])
    .filter((connection) => connection.provider === "google")
    .map((connection) => ({
      id: String(connection.id),
      provider: "google",
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  const microsoftConnections: CalendarConnectionSummary[] = (connections ?? [])
    .filter((connection) => connection.provider === "microsoft")
    .map((connection) => ({
      id: String(connection.id),
      provider: "microsoft",
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Connections</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your calendar to sync availability and send native calendar invites to clients.
        </p>
      </div>
      <CalendarConnections
        googleConnections={googleConnections}
        microsoftConnections={microsoftConnections}
      />
    </div>
  );
}
