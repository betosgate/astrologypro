import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminBookingWizard } from "./admin-booking-wizard";

export const dynamic = "force-dynamic";

/**
 * Admin calendar booking page.
 *
 * Trainee prefill flow (21.04.2026 sprint):
 *   /book/[username]?prefill=trainee → we resolve the authenticated
 *   user's email via supabase.auth.getUser() SERVER-SIDE and pass it
 *   to the wizard as `lockedEmail`. The email input is then read-only.
 *   The query param itself is just a hint — the email is never taken
 *   from the URL, so a forged `?prefill=` can't spoof a foreign email.
 */
export default async function AdminBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ prefill?: string }>;
}) {
  const { username } = await params;
  const sp = (await searchParams) ?? {};
  const wantsTraineePrefill = sp.prefill === "trainee";

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

  // Resolve the prefilled email from Supabase auth — source of truth.
  // Never from the cookie value directly, never from the query param.
  let lockedEmail: string | null = null;
  if (wantsTraineePrefill) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    lockedEmail = user?.email?.trim() || null;
  }

  return (
    <section className="min-h-screen py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-2 font-display text-3xl font-semibold text-cream md:text-4xl">
          Next Available
        </h2>
        <p className="mx-auto mb-10 max-w-md text-sm text-silver/60">
          Reserve your spot on {adminRow.username}&rsquo;s calendar
        </p>
        {wantsTraineePrefill && !lockedEmail && (
          <div className="mx-auto mb-6 max-w-md rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-left text-sm text-amber-200">
            We couldn&apos;t verify your account. Please sign in and try again
            to book this appointment.
          </div>
        )}
        <AdminBookingWizard
          username={adminRow.username}
          defaultTimezone={template?.timezone ?? "America/New_York"}
          defaultDurationMinutes={Number(template?.duration_minutes) || 60}
          lockedEmail={lockedEmail}
        />
      </div>
    </section>
  );
}
