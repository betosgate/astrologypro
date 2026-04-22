import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { AdminRescheduleView } from "@/components/admin/admin-reschedule-view";

export const metadata = { title: "Reschedule — Admin Booking" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMyBookingReschedulePage({ params }: PageProps) {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow?.username) {
    // An admin must have a username to use the public booking APIs. Without
    // it, the reschedule calendar can't resolve their availability.
    redirect("/admin/availability?missing=username");
  }

  const { data: booking } = await admin
    .from("admin_bookings")
    .select(
      "id, scheduled_at, duration_minutes, timezone, status, client_name, client_email",
    )
    .eq("id", id)
    .eq("admin_user_id", user.id)
    .maybeSingle();

  if (!booking) notFound();

  if (booking.status === "canceled") {
    redirect("/admin/my-bookings?error=canceled");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/admin/my-bookings">
          <ArrowLeft className="size-4" />
          Back to My Bookings
        </Link>
      </Button>

      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
          <CalendarClock className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reschedule Session</h1>
          <p className="text-muted-foreground text-sm">
            Pick a new time for <strong>{booking.client_name}</strong> (
            {booking.client_email}).
          </p>
        </div>
      </div>

      <AdminRescheduleView
        bookingId={booking.id}
        adminUsername={adminRow.username}
        defaultDurationMinutes={booking.duration_minutes}
        defaultTimezone={booking.timezone ?? "America/New_York"}
        currentScheduledAt={booking.scheduled_at}
        clientName={booking.client_name}
        clientEmail={booking.client_email}
      />
    </div>
  );
}
