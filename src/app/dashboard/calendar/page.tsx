import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/dashboard/calendar-view";

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
    .select("id")
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your availability, bookings, and time off.
        </p>
      </div>

      <CalendarView
        divinerId={diviner.id}
        availabilitySlots={slotsResult.data ?? []}
        overrides={overridesResult.data ?? []}
        bookings={(bookingsResult.data as any[]) ?? []}
      />
    </div>
  );
}
