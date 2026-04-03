import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendRecordingReady,
  sendReflectionEmail,
  sendRebookingNudge,
} from "@/lib/email";
import { generateReviewToken } from "@/lib/review-token";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const results: Array<{ id: string; email_type: string; status: string }> = [];

  try {
    // Query pending follow-ups that are due
    const { data: pendingFollowUps, error } = await admin
      .from("follow_up_sequences")
      .select(
        "id, booking_id, diviner_id, client_id, step, email_type, bookings(id, service_id, scheduled_at, services(name, slug)), clients(email, full_name), diviners(display_name, username)"
      )
      .is("sent_at", null)
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[Cron] Failed to fetch follow-ups:", error);
      return NextResponse.json(
        { error: "Failed to fetch follow-ups" },
        { status: 500 }
      );
    }

    if (!pendingFollowUps || pendingFollowUps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending follow-ups",
        sent: 0,
      });
    }

    for (const followUp of pendingFollowUps) {
      const client = followUp.clients as any;
      const diviner = followUp.diviners as any;
      const booking = followUp.bookings as any;

      if (!client?.email || !diviner) {
        results.push({
          id: followUp.id,
          email_type: followUp.email_type,
          status: "skipped_missing_data",
        });
        continue;
      }

      const clientEmail = client.email;
      const divinerName = diviner.display_name;
      const divinerUsername = diviner.username;

      try {
        switch (followUp.email_type) {
          case "recording_ready": {
            const recordingUrl = `${appUrl}/portal/recordings/${followUp.booking_id}`;
            const reviewToken = generateReviewToken(followUp.booking_id);
            const testimonialLink = `${appUrl}/portal/review/${followUp.booking_id}?token=${reviewToken}`;
            await sendRecordingReady({
              clientEmail,
              divinerName,
              recordingUrl,
              testimonialLink,
            });
            break;
          }
          case "reflection": {
            const serviceName = booking?.services?.name ?? "your reading";
            const bookingDate = booking?.scheduled_at
              ? new Date(booking.scheduled_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "your recent session";
            const rebookUrl = `${appUrl}/${divinerUsername}`;

            // Fetch session_notes and questionnaire_responses for personalization
            let focusQuestion: string | undefined;
            let sessionSummary: string | undefined;

            const { data: bookingDetails } = await admin
              .from("bookings")
              .select("session_notes, questionnaire_responses")
              .eq("id", followUp.booking_id)
              .single();

            if (bookingDetails) {
              // Extract focus question from questionnaire responses
              const questionnaire = bookingDetails.questionnaire_responses as Record<string, string | undefined> | null;
              if (questionnaire?.focusQuestion) {
                focusQuestion = questionnaire.focusQuestion;
              }

              // Extract key themes from session notes (first 200 chars)
              if (bookingDetails.session_notes) {
                const notes = bookingDetails.session_notes as string;
                sessionSummary =
                  notes.length > 200
                    ? notes.slice(0, 200).replace(/\s+\S*$/, "...") // trim at word boundary
                    : notes;
              }
            }

            await sendReflectionEmail({
              clientEmail,
              divinerName,
              serviceName,
              bookingDate,
              rebookUrl,
              focusQuestion,
              sessionSummary,
            });
            break;
          }
          case "rebooking": {
            const rebookUrl = `${appUrl}/${divinerUsername}`;
            await sendRebookingNudge({
              clientEmail,
              divinerName,
              rebookUrl,
            });
            break;
          }
          default:
            console.warn(
              `[Cron] Unknown follow-up email type: ${followUp.email_type}`
            );
            results.push({
              id: followUp.id,
              email_type: followUp.email_type,
              status: "unknown_type",
            });
            continue;
        }

        // Mark as sent
        await admin
          .from("follow_up_sequences")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", followUp.id);

        results.push({
          id: followUp.id,
          email_type: followUp.email_type,
          status: "sent",
        });
      } catch (emailError) {
        console.error(
          `[Cron] Failed to send follow-up ${followUp.id}:`,
          emailError
        );
        results.push({
          id: followUp.id,
          email_type: followUp.email_type,
          status: "error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === "sent").length,
      results,
    });
  } catch (err) {
    console.error("[Cron] Follow-up emails error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
