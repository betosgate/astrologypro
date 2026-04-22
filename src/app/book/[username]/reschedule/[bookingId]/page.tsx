import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { AdminRescheduleView } from "@/components/admin/admin-reschedule-view";

export const metadata = { title: "Reschedule — Appointment" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; bookingId: string }>;
}

/**
 * Calendar-driven reschedule page for admin-hosted bookings
 * (`admin_bookings` rows). Shared by two callers:
 *   - The admin themselves (from `/admin/my-bookings`)
 *   - The client whose email matches the booking (trainee dashboard)
 * The submit target, `/api/admin/my-bookings/{id}/reschedule`, accepts
 * either auth pathway via the broadened auth check.
 */
/**
 * If the caller landed here with a legacy diviner booking (row lives in
 * `bookings`, not `admin_bookings`) or with the wrong username prefix,
 * redirect to the canonical legacy reschedule URL instead of 404ing.
 * Returns the target pathname when a redirect is warranted, else null.
 */
async function resolveLegacyRedirect(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
): Promise<string | null> {
  const { data: legacy } = await admin
    .from("bookings")
    .select("id, diviners:diviner_id ( username )")
    .eq("id", bookingId)
    .maybeSingle();
  if (!legacy) return null;
  const divinerField = legacy.diviners as
    | { username?: string | null }
    | Array<{ username?: string | null }>
    | null;
  const divinerRow = Array.isArray(divinerField)
    ? divinerField[0] ?? null
    : divinerField;
  const divinerUsername = divinerRow?.username ?? null;
  if (!divinerUsername) return null;
  return `/${encodeURIComponent(divinerUsername)}/reschedule/${bookingId}`;
}

export default async function PublicAdminBookingReschedulePage({ params }: PageProps) {
  const { username, bookingId } = await params;
  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id, username, display_name")
    .ilike("username", username)
    .maybeSingle();

  if (!adminRow?.user_id) {
    // `username` isn't an admin at all. If the booking id belongs to a
    // legacy diviner booking, point the caller at the correct route
    // instead of showing a blunt 404.
    const legacyTarget = await resolveLegacyRedirect(admin, bookingId);
    if (legacyTarget) redirect(legacyTarget);
    notFound();
  }

  const { data: booking } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, timezone, status",
    )
    .eq("id", bookingId)
    .eq("admin_user_id", adminRow.user_id)
    .maybeSingle();

  if (!booking) {
    // Admin username resolves, but the booking id doesn't match a row in
    // `admin_bookings` for this admin. The id may actually be a legacy
    // diviner booking — redirect if so.
    const legacyTarget = await resolveLegacyRedirect(admin, bookingId);
    if (legacyTarget) redirect(legacyTarget);
    notFound();
  }

  if (booking.status === "canceled") {
    redirect(`/book/${encodeURIComponent(username)}?error=canceled`);
  }

  // Auth — same rule as the reschedule API: admin-owner OR client-of-booking.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminUser = await getAdminUser();

  const authEmail = user?.email?.trim().toLowerCase() ?? null;
  const bookingEmail = (booking.client_email ?? "").trim().toLowerCase();
  const isOwnerAdmin = !!adminUser && adminUser.id === booking.admin_user_id;
  const isClient = !!authEmail && !!bookingEmail && authEmail === bookingEmail;

  if (!isOwnerAdmin && !isClient) {
    redirect(`/login?reason=reschedule&next=${encodeURIComponent(
      `/book/${username}/reschedule/${bookingId}`,
    )}`);
  }

  const backHref = isOwnerAdmin ? "/admin/my-bookings" : "/trainee/sessions";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
          <CalendarClock className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reschedule Session</h1>
          <p className="text-sm text-muted-foreground">
            Pick a new time for your appointment with{" "}
            <strong>{adminRow.display_name ?? adminRow.username}</strong>.
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
        backHref={backHref}
        backLabel={isOwnerAdmin ? "Back to My Bookings" : "Back to Sessions"}
      />
    </div>
  );
}
