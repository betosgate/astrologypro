import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { BookingsClient } from "@/components/dashboard/bookings-client";
import { getSessionLinkForBooking } from "@/lib/service-toolkit-mapping";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

// Columns guaranteed to be in the initial schema
const SAFE_SELECT =
  "id, scheduled_at, status, duration_minutes, base_price, stripe_payment_intent_id, session_notes, questionnaire_responses, client_id, service_id";

// Full select including columns added by later migrations
const FULL_SELECT =
  "id, scheduled_at, status, duration_minutes, base_price, stripe_payment_intent_id, session_notes, client_session_notes, booking_notes, metadata, questionnaire_responses, client_id, service_id, refund_amount, refunded_at, refund_reason";

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

  // Try full select first; fall back to safe minimal columns if any column is missing
  let bookingRows: Record<string, unknown>[] = [];

  const { data: fullData, error: fullError } = await admin
    .from("bookings")
    .select(FULL_SELECT)
    .eq("owner_id", ownerId)
    .order("scheduled_at", { ascending: false });

  if (fullError) {
    console.warn("[bookings/page] full select failed, falling back:", fullError.message);
    const { data: safeData, error: safeError } = await admin
      .from("bookings")
      .select(SAFE_SELECT)
      .eq("owner_id", ownerId)
      .order("scheduled_at", { ascending: false });

    if (safeError) {
      console.error("[bookings/page] safe select also failed:", safeError.message);
    }
    bookingRows = (safeData as Record<string, unknown>[]) ?? [];
  } else {
    bookingRows = (fullData as Record<string, unknown>[]) ?? [];
  }

  console.log(`[bookings/page] ${bookingRows.length} bookings for owner ${ownerId}`);

  // Fetch client and service data separately (avoids join failures)
  const clientIds = [...new Set(bookingRows.map((b) => b.client_id as string).filter(Boolean))];
  const serviceIds = [...new Set(bookingRows.map((b) => b.service_id as string).filter(Boolean))];

  const [clientsResult, servicesResult] = await Promise.all([
    clientIds.length > 0
      ? admin.from("clients").select("id, full_name, email, birth_date, birth_time, birth_city").in("id", clientIds)
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length > 0
      ? admin.from("services").select("id, name, template_id").in("id", serviceIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const clientMap: Record<string, Record<string, unknown>> = {};
  for (const c of (clientsResult.data ?? [])) {
    clientMap[c.id] = c;
  }
  const serviceMap: Record<string, Record<string, unknown>> = {};
  for (const s of (servicesResult.data ?? [])) {
    serviceMap[s.id] = s;
  }

  // Resolve service_templates for the services on this page — needed to
  // decide, per booking, whether the "Open Service" link should appear.
  const templateIds = [
    ...new Set(
      (servicesResult.data ?? [])
        .map((s: any) => s.template_id as string | null | undefined)
        .filter((v: unknown): v is string => typeof v === "string" && v.length > 0),
    ),
  ];
  const templateMap: Record<string, { slug: string; category: string }> = {};
  if (templateIds.length > 0) {
    const { data: templates } = await admin
      .from("service_templates")
      .select("id, slug, category")
      .in("id", templateIds);
    for (const t of templates ?? []) {
      templateMap[t.id as string] = {
        slug: t.slug as string,
        category: t.category as string,
      };
    }
  }

  // Merge into shape BookingsClient expects
  const bookings = bookingRows.map((b) => ({
    ...b,
    clients: clientMap[b.client_id as string] ?? null,
    services: serviceMap[b.service_id as string] ?? null,
  })) as Array<Record<string, unknown>>;

  // Linked orders
  const bookingIds = bookings.map((b) => b.id as string).filter(Boolean);
  let ordersByBookingId: Record<string, { id: string; amount: number; currency: string; status: string }> = {};

  if (bookingIds.length > 0) {
    const { data: linkedOrders } = await admin
      .from("orders")
      .select("id, booking_id, amount, currency, status")
      .in("booking_id", bookingIds);

    for (const order of (linkedOrders ?? [])) {
      if (order.booking_id) {
        ordersByBookingId[order.booking_id] = {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
        };
      }
    }
  }

  // Previous session data per upcoming client
  const clientPrevSessions: Record<string, { count: number; lastDate: string | null; lastNotes: string | null }> = {};
  const upcomingClientIds = [
    ...new Set(
      bookings
        .filter((b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.scheduled_at as string) > new Date())
        .map((b) => b.client_id as string)
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

    for (const session of (prevSessions ?? [])) {
      if (!session.client_id) continue;
      if (!clientPrevSessions[session.client_id]) {
        clientPrevSessions[session.client_id] = { count: 0, lastDate: session.scheduled_at, lastNotes: session.notes };
      }
      clientPrevSessions[session.client_id].count++;
    }
  }

  // Per-booking toolkit session links. NULL for unmapped services — the
  // client UI uses that to decide whether to render "Open Service".
  const sessionLinksByBookingId: Record<string, string | null> = {};
  for (const b of bookings) {
    const bookingId = b.id as string;
    const service = b.services as { template_id?: string | null } | null;
    const templateId = service?.template_id ?? null;
    const template = templateId ? templateMap[templateId] : null;
    sessionLinksByBookingId[bookingId] = getSessionLinkForBooking({
      bookingId,
      templateSlug: template?.slug ?? null,
      category: template?.category ?? null,
    });
  }

  return (
    <BookingsClient
      bookings={bookings}
      clientPrevSessions={clientPrevSessions}
      divinerUsername={diviner?.username ?? ""}
      ordersByBookingId={ordersByBookingId}
      sessionLinksByBookingId={sessionLinksByBookingId}
    />
  );
}
