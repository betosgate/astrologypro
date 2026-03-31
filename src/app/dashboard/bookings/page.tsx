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
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  let query = supabase
    .from("bookings")
    .select(
      "id, scheduled_at, status, duration, amount, notes, services(name), clients(display_name, email)"
    )
    .eq("diviner_id", diviner.id)
    .order("scheduled_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: bookings } = await query;

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
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => (
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
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
