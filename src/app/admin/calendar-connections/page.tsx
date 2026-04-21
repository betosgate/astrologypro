import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CalendarConnections,
  type CalendarConnectionSummary,
} from "@/components/dashboard/calendar-connections";
import { getGoogleCalendarEmail } from "@/lib/google-calendar";

export const metadata = {
  title: "Calendar Connections - Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCalendarConnectionsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, google_calendar_token, outlook_calendar_token")
    .eq("user_id", user.id)
    .maybeSingle();

  // Look up by user_id so admins without a diviner row still see their own
  // connections (admin-owned rows are written with user_id = admin auth.uid).
  // This also covers admins who happen to have a diviner row — user_id is the
  // canonical identity on calendar_connections.
  let connections: Array<Record<string, unknown>> = [];
  const result = await admin
    .from("calendar_connections")
    .select("id, provider, email, account_identifier, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.warn("[admin/calendar-connections] Query error:", result.error.message);
  } else {
    connections = result.data ?? [];
  }

  const googleConnections: CalendarConnectionSummary[] = connections
    .filter((connection) => connection.provider === "google")
    .map((connection) => ({
      id: String(connection.id),
      provider: "google",
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  if (googleConnections.length === 0 && diviner) {
    try {
      const gcalInfo = await getGoogleCalendarEmail(diviner.id);
      if (gcalInfo) {
        const { data: refreshedRows } = await admin
          .from("calendar_connections")
          .select("id, provider, email, account_identifier, created_at, updated_at")
          .eq("owner_id", diviner.id)
          .eq("provider", "google")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (refreshedRows && refreshedRows.length > 0) {
          const row = refreshedRows[0];
          googleConnections.push({
            id: String(row.id),
            provider: "google",
            email: typeof row.email === "string" ? row.email : gcalInfo.email,
            accountIdentifier:
              typeof row.account_identifier === "string"
                ? row.account_identifier
                : gcalInfo.accountIdentifier,
            createdAt: typeof row.created_at === "string" ? row.created_at : null,
            updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
          });
        } else {
          googleConnections.push({
            id: "legacy-google",
            provider: "google",
            email: gcalInfo.email,
            accountIdentifier: gcalInfo.email ?? gcalInfo.accountIdentifier,
            createdAt: null,
            updatedAt: null,
          });
        }
      }
    } catch {
      // Best-effort fallback only.
    }
  }

  const microsoftConnections: CalendarConnectionSummary[] = connections
    .filter((connection) => connection.provider === "microsoft")
    .map((connection) => ({
      id: String(connection.id),
      provider: "microsoft",
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  if (microsoftConnections.length === 0 && diviner?.outlook_calendar_token) {
    const rawMs = diviner.outlook_calendar_token;
    let hasMsToken = false;
    let msEmail: string | null = null;

    if (typeof rawMs === "string" && rawMs.length > 0) {
      hasMsToken = true;
    } else if (rawMs && typeof rawMs === "object") {
      const obj = rawMs as Record<string, unknown>;
      if (obj.refresh_token || obj.access_token) {
        hasMsToken = true;
        if (typeof obj.email === "string") msEmail = obj.email;
      }
    }

    if (hasMsToken) {
      microsoftConnections.push({
        id: "legacy-microsoft",
        provider: "microsoft",
        email: msEmail,
        accountIdentifier: msEmail ?? "Outlook Account (legacy)",
        createdAt: null,
        updatedAt: null,
      });
    }
  }

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
