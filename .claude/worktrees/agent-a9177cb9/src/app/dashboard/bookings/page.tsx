import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingsFilter } from "@/components/dashboard/bookings-filter";
import { BookingDetailSheet } from "@/components/dashboard/booking-detail-sheet";
import { SessionPrepSheet } from "@/components/dashboard/session-prep";

export const metadata = {
  title: "Bookings",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  let query = supabase
    .from("bookings")
    .select(
      "id, scheduled_at, status, duration, amount, notes, questionnaire_responses, client_id, refund_amount, refunded_at, refund_reason, services(name), clients(display_name, email, birth_date, birth_time, birth_city)"
    )
    .eq("diviner_id", diviner.id)
    .order("scheduled_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: bookings } = await query;

  // For upcoming bookings, fetch previous session counts per client
  const upcomingBookings = (bookings ?? []).filter((b: any) => {
    const isUpcoming =
      (b.status === "pending" || b.status === "confirmed") &&
      new Date(b.scheduled_at) > new Date();
    return isUpcoming;
  });

  // Build a map of client_id -> previous session data for upcoming bookings
  const clientPrevSessions: Record<
    string,
    { count: number; lastDate: string | null; lastNotes: string | null }
  > = {};

  const uniqueClientIds = [
    ...new Set(upcomingBookings.map((b: any) => b.client_id).filter(Boolean)),
  ];

  if (uniqueClientIds.length > 0) {
    const { data: prevSessions } = await supabase
      .from("bookings")
      .select("client_id, scheduled_at, notes")
      .eq("diviner_id", diviner.id)
      .eq("status", "completed")
      .in("client_id", uniqueClientIds)
      .order("scheduled_at", { ascending: false });

    if (prevSessions) {
      for (const session of prevSessions) {
        if (!session.client_id) continue;
        if (!clientPrevSessions[session.client_id]) {
          clientPrevSessions[session.client_id] = {
            count: 0,
            lastDate: session.scheduled_at,
            lastNotes: session.notes,
          };
        }
        clientPrevSessions[session.client_id].count++;
      }
    }
  }

  function isUpcoming(booking: any) {
    return (
      (booking.status === "pending" || booking.status === "confirmed") &&
      new Date(booking.scheduled_at) > new Date()
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage your client sessions and appointments.
          </p>
        </div>
        <Suspense>
          <BookingsFilter />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            {bookings?.length ?? 0} booking{(bookings?.length ?? 0) !== 1 ? "s" : ""}{" "}
            {status && status !== "all" ? `with status "${status}"` : "total"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No bookings found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => {
                  const prev = booking.client_id
                    ? clientPrevSessions[booking.client_id]
                    : null;

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {formatDateTime(booking.scheduled_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {booking.clients?.display_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.clients?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.services?.name ?? "--"}</TableCell>
                      <TableCell>{booking.duration} min</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[booking.status] ?? ""}
                          variant="outline"
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency((booking.amount ?? 0) / 100)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookingDetailSheet
                            booking={{
                              id: booking.id,
                              scheduled_at: booking.scheduled_at,
                              status: booking.status,
                              duration: booking.duration,
                              amount: booking.amount ?? 0,
                              notes: booking.notes,
                              client_name:
                                booking.clients?.display_name ?? "Unknown",
                              client_email: booking.clients?.email ?? "",
                              service_name: booking.services?.name ?? "Unknown",
                              refund_amount: booking.refund_amount ?? null,
                              refunded_at: booking.refunded_at ?? null,
                              refund_reason: booking.refund_reason ?? null,
                            }}
                          />
                          {isUpcoming(booking) && (
                            <SessionPrepSheet
                              booking={{
                                id: booking.id,
                                scheduled_at: booking.scheduled_at,
                                status: booking.status,
                                service_name:
                                  booking.services?.name ?? "Unknown",
                                client_name:
                                  booking.clients?.display_name ?? "Unknown",
                                client_email: booking.clients?.email ?? "",
                                birth_date:
                                  booking.clients?.birth_date ?? null,
                                birth_time:
                                  booking.clients?.birth_time ?? null,
                                birth_city:
                                  booking.clients?.birth_city ?? null,
                                questionnaire_responses:
                                  booking.questionnaire_responses ?? null,
                                previous_session_count: prev?.count ?? 0,
                                last_session_date: prev?.lastDate ?? null,
                                session_notes: prev?.lastNotes ?? null,
                                username: diviner.username,
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
