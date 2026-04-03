import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, ExternalLink, Star, XCircle, RotateCcw } from "lucide-react";
import { TestimonialDialog } from "@/components/portal/testimonial-dialog";
import { CancelBookingButton } from "@/components/portal/cancel-booking-button";
import { RescheduleSheet } from "@/components/portal/reschedule-sheet";

export const metadata = {
  title: "My Bookings",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default async function PortalBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, status, base_price, recording_share_id, recording_url, services(name, slug), diviners(id, display_name, username)"
    )
    .eq("client_id", client.id)
    .order("scheduled_at", { ascending: false });

  // Fetch existing testimonials so we know which bookings already have reviews
  const { data: existingTestimonials } = await supabase
    .from("testimonials")
    .select("booking_id")
    .eq("client_id", client.id);

  const reviewedBookingIds = new Set(
    existingTestimonials?.map((t: any) => t.booking_id) ?? []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage all your sessions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            {bookings?.length ?? 0} booking{(bookings?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No bookings yet. Find a diviner to book your first session.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/">Browse Diviners</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Diviner</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {formatDateTime(booking.scheduled_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.diviners?.display_name ?? "Unknown"}
                        </TableCell>
                        <TableCell>
                          {booking.services?.name ?? "--"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusColors[booking.status] ?? ""}
                            variant="outline"
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(booking.base_price ?? 0)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(booking.status === "confirmed" ||
                              booking.status === "pending") &&
                              booking.diviners?.username && (
                                <>
                                  {booking.status === "confirmed" && (
                                    <Button size="sm" variant="outline" asChild>
                                      <Link
                                        href={`/${booking.diviners.username}/session/${booking.id}`}
                                      >
                                        <ExternalLink className="mr-1 size-3" />
                                        Join
                                      </Link>
                                    </Button>
                                  )}
                                  <RescheduleSheet
                                    bookingId={booking.id}
                                    serviceName={booking.services?.name ?? "Session"}
                                    divinerName={booking.diviners?.display_name ?? "Diviner"}
                                  />
                                  <CancelBookingButton bookingId={booking.id} />
                                </>
                              )}
                            {booking.status === "completed" &&
                              booking.recording_url &&
                              booking.recording_share_id && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link
                                    href={`/session/${booking.recording_share_id}/recording`}
                                  >
                                    <Play className="mr-1 size-3" />
                                    Watch
                                  </Link>
                                </Button>
                              )}
                            {booking.status === "completed" &&
                              !reviewedBookingIds.has(booking.id) &&
                              booking.diviners?.id && (
                                <TestimonialDialog
                                  divinerId={booking.diviners.id}
                                  divinerName={
                                    booking.diviners.display_name ?? "Diviner"
                                  }
                                  serviceType={booking.services?.name ?? "Session"}
                                  bookingId={booking.id}
                                />
                              )}
                            {booking.status === "completed" &&
                              booking.diviners?.username &&
                              booking.services?.slug && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link
                                    href={`/${booking.diviners.username}/book/${booking.services.slug}?prefill=true`}
                                  >
                                    <RotateCcw className="mr-1 size-3" />
                                    Book Again
                                  </Link>
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {booking.services?.name ?? "Session"}
                      </p>
                      <Badge
                        className={statusColors[booking.status] ?? ""}
                        variant="outline"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        with {booking.diviners?.display_name ?? "Unknown"}
                      </p>
                      <p>{formatDateTime(booking.scheduled_at)}</p>
                      <p>{formatCurrency(booking.base_price ?? 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === "confirmed" &&
                        booking.diviners?.username && (
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/${booking.diviners.username}/session/${booking.id}`}
                            >
                              <ExternalLink className="mr-1 size-3" />
                              Join Session
                            </Link>
                          </Button>
                        )}
                      {(booking.status === "confirmed" ||
                        booking.status === "pending") && (
                        <RescheduleSheet
                          bookingId={booking.id}
                          serviceName={booking.services?.name ?? "Session"}
                          divinerName={booking.diviners?.display_name ?? "Diviner"}
                        />
                      )}
                      {booking.status === "pending" && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                      {booking.status === "completed" &&
                        booking.recording_url &&
                        booking.recording_share_id && (
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/session/${booking.recording_share_id}/recording`}
                            >
                              <Play className="mr-1 size-3" />
                              Watch
                            </Link>
                          </Button>
                        )}
                      {booking.status === "completed" &&
                        !reviewedBookingIds.has(booking.id) &&
                        booking.diviners?.id && (
                          <TestimonialDialog
                            divinerId={booking.diviners.id}
                            divinerName={
                              booking.diviners.display_name ?? "Diviner"
                            }
                            serviceType={booking.services?.name ?? "Session"}
                            bookingId={booking.id}
                          />
                        )}
                      {booking.status === "completed" &&
                        booking.diviners?.username &&
                        booking.services?.slug && (
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/${booking.diviners.username}/book/${booking.services.slug}?prefill=true`}
                            >
                              <RotateCcw className="mr-1 size-3" />
                              Book Again
                            </Link>
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
