import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { BookingLinkBanner } from "@/components/dashboard/booking-link-banner";
import { Info, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Calendar - Dashboard",
};

export const dynamic = "force-dynamic";

interface CalendarBooking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_notes: string | null;
  booking_notes: string | null;
  base_price: number | null;
  stripe_payment_intent_id: string | null;
  questionnaire_responses: Record<string, unknown> | null;
  refund_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  metadata?: {
    is_reminder?: boolean;
    is_manual?: boolean;
    timezone?: string;
    availability_title?: string;
  } | null;
  services: { name: string } | null;
  clients: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    birth_date: string | null;
    birth_time: string | null;
    birth_city: string | null;
  } | null;
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();

  // ownerId is either ownerId or user.id
  const ownerId = diviner?.id || user.id;

  const { data: calendarConnections } = diviner
    ? await admin
        .from("calendar_connections")
        .select("id")
        .eq("owner_id", diviner.id)
        .limit(1)
    : { data: [] as Array<Record<string, unknown>> };

  const now = new Date();
  const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Fetch all relevant data in parallel
  const [slotsResult, overridesResult, bookingsResult] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("owner_id", ownerId),
    supabase
      .from("availability_overrides")
      .select("id, date, is_available, start_time, end_time")
      .eq("owner_id", ownerId)
      .gte("date", recentDate.toISOString().split("T")[0])
      .lte("date", futureDate.toISOString().split("T")[0]),
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, duration_minutes, status, session_notes, booking_notes, base_price, stripe_payment_intent_id, questionnaire_responses, refund_amount, refunded_at, refund_reason, metadata, services(name), clients(full_name, email, phone, birth_date, birth_time, birth_city)"
      )
      .eq("owner_id", ownerId)
      .in("status", ["pending", "pending_payment", "confirmed", "in_progress"])
      .gte("scheduled_at", recentDate.toISOString())
      .order("scheduled_at", { ascending: true }),
  ]);

  const hasExternalCalendar = (calendarConnections?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground">
            Set your weekly schedule, block days off, and add special hours.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/calendar-connections">
            <Button variant="outline" size="sm">
              <LinkIcon className="mr-1 size-3" />
              Calendar Connections
            </Button>
          </Link>
          <Link href="/dashboard/availability">
            <Button variant="outline" size="sm">
              Manage Weekly Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* No-calendar info banner — shown when neither Google nor Outlook is connected */}
      {!hasExternalCalendar && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-400">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Your schedule is managed entirely within AstrologyPro — no external
            calendar required.{" "}
            <Link
              href="/dashboard/calendar-connections"
              className="underline underline-offset-2 hover:text-blue-300"
            >
              Optional: sync with Google or Outlook Calendar
            </Link>
          </span>
        </div>
      )}

      {diviner?.username && (
        <BookingLinkBanner
          bookingUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/${diviner.username}`}
        />
      )}

      <CalendarView
        divinerId={ownerId}
        divinerUsername={diviner?.username ?? ""}
        availabilitySlots={slotsResult.data ?? []}
        overrides={overridesResult.data ?? []}
        bookings={(bookingsResult.data as unknown as CalendarBooking[] | null) ?? []}
      />
    </div>
  );
}
