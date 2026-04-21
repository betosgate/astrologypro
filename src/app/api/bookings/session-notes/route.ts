import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/bookings/session-notes
 * Save session notes during or after a live session.
 *
 * - Diviner → writes to `session_notes`
 * - Client  → writes to `client_session_notes`
 *
 * Both roles are verified against the booking before writing.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { bookingId, sessionNotes, role, clientToken } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── Token-based client access (unauthenticated guest) ─────────────────
    if (clientToken && role === "client") {
      const { data: booking, error } = await admin
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .eq("booking_token", clientToken)
        .single();

      if (error || !booking) {
        return NextResponse.json({ error: "Invalid session token" }, { status: 403 });
      }

      const { error: updateError } = await admin
        .from("bookings")
        .update({ client_session_notes: sessionNotes ?? null })
        .eq("id", bookingId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ── Authenticated access ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine role and column
    if (role === "diviner") {
      const adminUser = await getAdminUser();
      if (adminUser) {
        const { error } = await admin
          .from("bookings")
          .update({ session_notes: sessionNotes ?? null })
          .eq("id", bookingId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      const { data: diviner } = await supabase
        .from("diviners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!diviner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { error } = await admin
        .from("bookings")
        .update({ session_notes: sessionNotes ?? null })
        .eq("id", bookingId)
        .eq("diviner_id", diviner.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Client (authenticated)
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { error } = await admin
        .from("bookings")
        .update({ client_session_notes: sessionNotes ?? null })
        .eq("id", bookingId)
        .eq("client_id", client.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[session-notes] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
