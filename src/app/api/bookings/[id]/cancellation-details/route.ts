import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { resolveBookingViewer } from "@/lib/booking-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/[id]/cancellation-details
 *
 * Returns the full cancellation + refund audit for a booking so the
 * booking drawer can show: who cancelled, when, the reason, and the
 * matching Stripe refund (id + amount + who issued it + when).
 *
 * Authorized for anyone who can already view the booking via
 * `resolveBookingViewer` (diviner owner, assigned admin, or the
 * authenticated client). No token-auth path — the drawer is dashboard-only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const adminUser = await getAdminUser();
  const access = await resolveBookingViewer(admin, id, user, !!adminUser);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, status, canceled_at, cancellation_reason, canceled_by_user_id, canceled_by_role, refund_amount, refunded_at, refund_reason, stripe_refund_id, refunded_by_user_id, refunded_by_role, clients(full_name, email), diviners(display_name, user_id)"
    )
    .eq("id", id)
    .single();

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clientRecord = booking.clients as { full_name?: string | null; email?: string | null } | null;
  const divinerRecord = booking.diviners as { display_name?: string | null; user_id?: string | null } | null;

  async function resolveDisplayName(
    role: string | null,
    userId: string | null
  ): Promise<string | null> {
    if (!role) return null;

    // Role-first shortcuts: when we know the actor is the diviner/client
    // associated with this booking we can answer without hitting auth.
    if (role === "diviner") {
      if (divinerRecord?.display_name) return divinerRecord.display_name;
    }
    if (role === "client") {
      if (clientRecord?.full_name) return clientRecord.full_name;
      if (clientRecord?.email) return clientRecord.email;
    }

    // User-id-based resolution: check admin_users first, then auth.users
    // so an admin cancellation surfaces their admin username.
    if (userId) {
      const { data: adminRow } = await admin
        .from("admin_users")
        .select("username, display_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (adminRow) {
        return (
          (adminRow.display_name as string | null) ??
          (adminRow.username as string | null) ??
          "Admin"
        );
      }

      const { data: divinerRow } = await admin
        .from("diviners")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (divinerRow?.display_name) return divinerRow.display_name as string;

      try {
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        if (authUser?.user?.email) return authUser.user.email;
      } catch {
        // ignore — fall through to role label
      }
    }

    if (role === "admin") return "Admin";
    if (role === "system") return "System";
    return role;
  }

  const canceledByName = await resolveDisplayName(
    (booking.canceled_by_role as string | null) ?? null,
    (booking.canceled_by_user_id as string | null) ?? null
  );
  const refundedByName = booking.refunded_at
    ? await resolveDisplayName(
        (booking.refunded_by_role as string | null) ?? null,
        (booking.refunded_by_user_id as string | null) ?? null
      )
    : null;

  return NextResponse.json({
    status: booking.status as string,
    cancellation: booking.canceled_at
      ? {
          canceledAt: booking.canceled_at as string,
          reason: (booking.cancellation_reason as string | null) ?? null,
          canceledBy: {
            role: (booking.canceled_by_role as string | null) ?? null,
            name: canceledByName,
          },
        }
      : null,
    refund: booking.refunded_at
      ? {
          amount: (booking.refund_amount as number | null) ?? null,
          refundedAt: booking.refunded_at as string,
          reason: (booking.refund_reason as string | null) ?? null,
          stripeRefundId: (booking.stripe_refund_id as string | null) ?? null,
          refundedBy: {
            role: (booking.refunded_by_role as string | null) ?? null,
            name: refundedByName,
          },
        }
      : null,
  });
}
