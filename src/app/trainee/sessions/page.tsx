import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Video,
} from "lucide-react";
import Link from "next/link";

import { SessionExplorer } from "@/components/trainee/session-explorer";

export const metadata = { title: "Meeting Sessions - AstrologyPro" };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BookingSource = "bookings" | "admin_bookings";

type UnifiedBooking = {
  id: string;
  source: BookingSource;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  hostDisplayName: string | null;
  hostUsername: string | null;
  serviceName: string | null;
  serviceCategory: string | null;
  joinHref: string | null;
  actionBasePath: string | null;
  clientName: string;
  clientEmail: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TraineeSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, email, training_status, mentor_diviner_id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  const { data: clientRow } = await admin
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const clientId = (clientRow?.id as string | null) ?? null;
  const authEmail = user.email?.trim().toLowerCase() ?? "";
  const now = new Date().toISOString();

  // ── Parallel fetch: legacy diviner bookings + admin_bookings ──────────────
  const [
    legacyUpcomingResult,
    legacyPastResult,
    adminUpcomingResult,
    adminPastResult,
  ] = await Promise.all([
    clientId
      ? admin
          .from("bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, diviner_id, " +
              "diviners:diviner_id(id, username, display_name), " +
              "services(name, category)",
          )
          .eq("client_id", clientId)
          .gte("scheduled_at", now)
          .not("status", "in", '("canceled","no_show")')
          .order("scheduled_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    clientId
      ? admin
          .from("bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, diviner_id, " +
              "diviners:diviner_id(id, username, display_name), " +
              "services(name, category)",
          )
          .eq("client_id", clientId)
          .lt("scheduled_at", now)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    authEmail
      ? admin
          .from("admin_bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, client_name, client_email, admin_user_id",
          )
          .ilike("client_email", authEmail)
          .gte("scheduled_at", now)
          .neq("status", "canceled")
          .order("scheduled_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
    authEmail
      ? admin
          .from("admin_bookings")
          .select(
            "id, status, scheduled_at, duration_minutes, client_name, client_email, admin_user_id",
          )
          .ilike("client_email", authEmail)
          .lt("scheduled_at", now)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  // Resolve admin usernames
  const adminUserIds = new Set<string>();
  for (const row of [
    ...((adminUpcomingResult.data as Array<Record<string, unknown>>) ?? []),
    ...((adminPastResult.data as Array<Record<string, unknown>>) ?? []),
  ]) {
    const id = row.admin_user_id;
    if (typeof id === "string") adminUserIds.add(id);
  }

  const adminUserMap = new Map<string, { username: string | null; display: string | null }>();
  if (adminUserIds.size > 0) {
    const { data: adminUsers } = await admin
      .from("admin_users")
      .select("user_id, username, email")
      .in("user_id", [...adminUserIds]);
    for (const row of adminUsers ?? []) {
      adminUserMap.set(row.user_id as string, {
        username: (row.username as string | null) ?? null,
        display: ((row.username as string | null) || (row.email as string | null)) ?? null,
      });
    }
  }

  function shapeLegacy(row: Record<string, unknown>): UnifiedBooking {
    const diviner = (row.diviners as any) ?? null;
    const service = (row.services as any) ?? null;
    const username = diviner?.username ?? null;
    const id = row.id as string;
    return {
      id,
      source: "bookings",
      status: row.status as string,
      scheduledAt: row.scheduled_at as string,
      durationMinutes: Number(row.duration_minutes ?? 0),
      hostDisplayName: diviner?.display_name ?? null,
      hostUsername: username,
      serviceName: service?.name ?? "Meeting Session",
      serviceCategory: service?.category ?? null,
      joinHref: username ? `/${encodeURIComponent(username)}/session/${encodeURIComponent(id)}` : null,
      actionBasePath: null,
      clientName: trainee.name ?? "Trainee",
      clientEmail: trainee.email ?? authEmail,
    };
  }

  function shapeAdminBooking(row: Record<string, unknown>): UnifiedBooking {
    const id = row.id as string;
    const adminUserId = (row.admin_user_id as string | null) ?? null;
    const lookup = adminUserId ? adminUserMap.get(adminUserId) : null;
    return {
      id,
      source: "admin_bookings",
      status: row.status as string,
      scheduledAt: row.scheduled_at as string,
      durationMinutes: Number(row.duration_minutes ?? 0),
      hostDisplayName: lookup?.display ?? null,
      hostUsername: lookup?.username ?? null,
      serviceName: "Meeting Session",
      serviceCategory: null,
      joinHref: lookup?.username ? `/book/${encodeURIComponent(lookup.username)}/session/${encodeURIComponent(id)}` : null,
      actionBasePath: `/api/trainee/appointments/admin-bookings/${id}`,
      clientName: ((row.client_name as string | null) ?? trainee.name) ?? "Trainee",
      clientEmail: ((row.client_email as string | null) ?? trainee.email) ?? authEmail,
    };
  }

  const upcomingBookings: UnifiedBooking[] = [
    ...((legacyUpcomingResult.data as Array<Record<string, unknown>>) ?? []).map(shapeLegacy),
    ...((adminUpcomingResult.data as Array<Record<string, unknown>>) ?? []).map(shapeAdminBooking),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const pastBookings: UnifiedBooking[] = [
    ...((legacyPastResult.data as Array<Record<string, unknown>>) ?? []).map(shapeLegacy),
    ...((adminPastResult.data as Array<Record<string, unknown>>) ?? []).map(shapeAdminBooking),
  ].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Meeting Sessions</h1>
        <p className="text-muted-foreground text-sm">
          Select a session to view detailed information, recordings, and playback.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <SessionExplorer 
          upcoming={upcomingBookings} 
          past={pastBookings} 
        />
      </div>

      <div className="mt-auto pt-6 border-t">
        <Card className="bg-muted/20 border-none">
          <CardContent className="p-4 flex items-center gap-4 text-xs text-muted-foreground">
             <Info className="size-4 shrink-0" />
             <p>
               Meeting sessions are pre-arranged with your mentor. If a scheduled session does not appear, 
               please contact your mentor directly or check your specialized program requirements.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
