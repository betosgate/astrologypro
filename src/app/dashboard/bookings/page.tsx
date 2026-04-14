import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { BookingsClient } from "@/components/dashboard/bookings-client";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
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

  const ownerId = diviner?.id || user.id;

  // Fetch ALL bookings (no server-side pagination — client handles it)
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, status, duration_minutes, base_price, stripe_payment_intent_id, session_notes, booking_notes, metadata, questionnaire_responses, client_id, refund_amount, refunded_at, refund_reason, services(name), clients(full_name, email, birth_date, birth_time, birth_city)"
    )
    .eq("owner_id", ownerId)
    .order("scheduled_at", { ascending: false });

  // Previous session data per client
  const clientPrevSessions: Record<
    string,
    { count: number; lastDate: string | null; lastNotes: string | null }
  > = {};

  const upcomingClientIds = [
    ...new Set(
      (bookings ?? [])
        .filter(
          (b: Record<string, unknown>) =>
            (b.status === "pending" || b.status === "confirmed") &&
            new Date(b.scheduled_at as string) > new Date()
        )
        .map((b: Record<string, unknown>) => b.client_id as string)
        .filter(Boolean)
    ),
  ];

  if (upcomingClientIds.length > 0) {
    const { data: prevSessions } = await supabase
      .from("bookings")
      .select("client_id, scheduled_at, notes")
      .eq("owner_id", ownerId)
      .eq("status", "completed")
      .in("client_id", upcomingClientIds)
      .order("scheduled_at", { ascending: false });

    if (prevSessions) {
      for (const session of prevSessions) {
        if (!session.client_id) continue;
        if (!clientPrevSessions[session.client_id]) {
          clientPrevSessions[session.client_id] = {
            count: 0,
            lastDate: session.scheduled_at,
            lastNotes: session.notes,
          };
        }
        clientPrevSessions[session.client_id].count++;
      }
    }
  }

  return (
    <BookingsClient
      bookings={(bookings as Record<string, unknown>[]) ?? []}
      clientPrevSessions={clientPrevSessions}
      divinerUsername={diviner?.username ?? ""}
    />
  );
}
