import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { rescheduleRequestEmail } from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, preferredDate, timePreference, notes } = body as {
      bookingId: string;
      preferredDate: string;
      timePreference: string;
      notes?: string;
    };

    if (!bookingId || !preferredDate || !timePreference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the client record for this user
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the booking belongs to this client and fetch diviner details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, status, notes, services(name), diviners(id, display_name, email)"
      )
      .eq("id", bookingId)
      .eq("client_id", client.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    // Only allow reschedule for pending or confirmed bookings
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "Only pending or confirmed bookings can be rescheduled" },
        { status: 400 }
      );
    }

    // Build the reschedule note to append
    const rescheduleNote = [
      `--- Reschedule Request ---`,
      `Requested on: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
      `Preferred date: ${preferredDate}`,
      `Time preference: ${timePreference}`,
      notes ? `Notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const existingNotes = (booking as any).notes ?? "";
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${rescheduleNote}`
      : rescheduleNote;

    // Update the booking notes (status stays as-is)
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ notes: updatedNotes })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    // Send email to the diviner
    const diviner = (booking as any).diviners;
    const divinerEmail: string | undefined = diviner?.email;
    const divinerName: string = diviner?.display_name ?? "Diviner";
    const serviceName: string = (booking as any).services?.name ?? "Session";
    const clientName: string = client.name ?? user.email ?? "Your client";

    if (divinerEmail) {
      const { subject, html } = rescheduleRequestEmail({
        divinerName,
        clientName,
        serviceName,
        preferredDate,
        timePreference,
        notes: notes ?? "",
        dashboardUrl: `${APP_URL}/dashboard/bookings`,
      });

      await sendEmail({ to: divinerEmail, subject, html });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portal/reschedule] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
