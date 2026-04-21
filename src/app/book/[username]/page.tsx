import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBookingWizard } from "./admin-booking-wizard";

export const dynamic = "force-dynamic";

/**
 * Public booking page for an admin's calendar.
 *
 * URL: /book/<username>  (distinct from diviner /<username>/book)
 *
 * Renders a calendar-only booking wizard — no service selection, no payment.
 * The admin must have set a username via /admin/availability.
 */
export default async function AdminBookingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id, email, username")
    .ilike("username", username)
    .maybeSingle();

  if (!adminRow?.user_id || !adminRow.username) {
    notFound();
  }

  // Pull the default timezone + duration from the first active template.
  const { data: template } = await admin
    .from("availability_templates")
    .select("timezone, duration_minutes")
    .eq("created_by", adminRow.user_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Book a time</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Pick a slot on {adminRow.username}&rsquo;s calendar.
          </p>
        </div>
        <AdminBookingWizard
          username={adminRow.username}
          defaultTimezone={template?.timezone ?? "America/New_York"}
          defaultDurationMinutes={Number(template?.duration_minutes) || 60}
        />
      </div>
    </div>
  );
}
