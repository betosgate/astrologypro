import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CalendarConnections,
  type CalendarConnectionSummary,
} from "@/components/dashboard/calendar-connections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";

export const metadata = { title: "My Schedule — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminMySchedulePage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const admin = createAdminClient();

  // Look up whether this admin also has a diviner record (needed for availability and calendar sync)
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

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
      provider: "google" as const,
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  const microsoftConnections: CalendarConnectionSummary[] = (connections ?? [])
    .filter((connection) => connection.provider === "microsoft")
    .map((connection) => ({
      id: String(connection.id),
      provider: "microsoft" as const,
      email: typeof connection.email === "string" ? connection.email : null,
      accountIdentifier: String(connection.account_identifier ?? ""),
      createdAt: typeof connection.created_at === "string" ? connection.created_at : null,
      updatedAt: typeof connection.updated_at === "string" ? connection.updated_at : null,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal calendar connections and availability slots.
        </p>
      </div>

      {/* No diviner record banner */}
      {!diviner && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              No diviner profile found for your account.
            </p>
            <p className="text-xs text-muted-foreground">
              Calendar connections and availability management require a linked diviner profile.
              Ask another admin to create a diviner record for{" "}
              <span className="font-medium">{user.email}</span> via the{" "}
              <Link href="/admin/diviners" className="underline underline-offset-2 hover:text-foreground">
                Diviners
              </Link>{" "}
              page, then return here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Calendar Connections section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="size-5 text-amber-500" />
            Calendar Connections
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect Google or Microsoft Calendar to sync your availability and send native invites.
          </p>
        </div>

        {diviner ? (
          <CalendarConnections
            googleConnections={googleConnections}
            microsoftConnections={microsoftConnections}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Calendar connections are unavailable until a diviner profile is linked to your account.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Availability section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Availability
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define the windows when clients can book sessions with you.
          </p>
        </div>

        {diviner ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Availability Schedules</CardTitle>
              <CardDescription>
                Manage your own availability templates via the Availability Management page. Use
                the diviner selector to choose your profile: &ldquo;{diviner.display_name}&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href="/admin/availability">
                  Manage My Availability
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/availability/manage">
                  All Diviner Availability
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Availability management requires a linked diviner profile.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
