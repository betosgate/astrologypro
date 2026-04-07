import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { BookingLinkBanner } from "@/components/dashboard/booking-link-banner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Calendar - Dashboard",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username, google_calendar_connected, outlook_calendar_connected")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Fetch all relevant data in parallel
  const [slotsResult, overridesResult, bookingsResult] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("diviner_id", diviner.id),
    supabase
      .from("availability_overrides")
      .select("id, date, is_available, start_time, end_time")
      .eq("diviner_id", diviner.id)
      .gte(
        "date",
        new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]
      )
      .lte(
        "date",
        new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]
      ),
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, duration_minutes, status, services(name), clients(full_name)"
      )
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed", "in_progress"])
      .gte(
        "scheduled_at",
        new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      )
      .order("scheduled_at", { ascending: true }),
  ]);

  const hasExternalCalendar =
    diviner.google_calendar_connected || diviner.outlook_calendar_connected;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground">
            Set your weekly schedule, block days off, and add special hours.
          </p>
        </div>
        <Link href="/dashboard/availability">
          <Button variant="outline" size="sm">
            Manage Weekly Schedule
          </Button>
        </Link>
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

      {diviner.username && (
        <BookingLinkBanner
          bookingUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/${diviner.username}`}
        />
      )}

      <CalendarView
        divinerId={diviner.id}
        availabilitySlots={slotsResult.data ?? []}
        overrides={overridesResult.data ?? []}
        bookings={(bookingsResult.data as any[]) ?? []}
      />
    </div>
  );
}
