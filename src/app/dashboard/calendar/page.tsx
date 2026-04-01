import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/dashboard/calendar-view";

export const metadata = {
  title: "Calendar - Dashboard",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, timezone")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  // Fetch availability, overrides, and bookings for the next 2 weeks
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [slotsResult, overridesResult, bookingsResult] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("*")
      .eq("diviner_id", diviner.id)
      .eq("is_active", true),
    supabase
      .from("availability_overrides")
      .select("*")
      .eq("diviner_id", diviner.id)
      .gte("date", now.toISOString().split("T")[0])
      .lte("date", twoWeeksLater.toISOString().split("T")[0]),
    supabase
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, status, services(name), clients(full_name, display_name)")
      .eq("diviner_id", diviner.id)
      .in("status", ["pending", "confirmed", "in_progress"])
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", twoWeeksLater.toISOString())
      .order("scheduled_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage your availability and view upcoming bookings
        </p>
      </div>
      <CalendarView
        divinerId={diviner.id}
        timezone={diviner.timezone ?? "America/New_York"}
        availabilitySlots={slotsResult.data ?? []}
        overrides={overridesResult.data ?? []}
        bookings={(bookingsResult.data ?? []) as any[]}
      />
    </div>
  );
}
