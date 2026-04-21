import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBookingWizard } from "./admin-booking-wizard";

export const dynamic = "force-dynamic";

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

  const { data: template } = await admin
    .from("availability_templates")
    .select("timezone, duration_minutes")
    .eq("created_by", adminRow.user_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <section className="min-h-screen py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-2 font-display text-3xl font-semibold text-cream md:text-4xl">
          Next Available
        </h2>
        <p className="mx-auto mb-10 max-w-md text-sm text-silver/60">
          Reserve your spot on {adminRow.username}&rsquo;s calendar
        </p>
        <AdminBookingWizard
          username={adminRow.username}
          defaultTimezone={template?.timezone ?? "America/New_York"}
          defaultDurationMinutes={Number(template?.duration_minutes) || 60}
        />
      </div>
    </section>
  );
}
