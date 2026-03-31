const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // Placeholder: log instead of sending in development
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_placeholder") {
    console.log("[Email] Would send email:", { to, subject, html });
    return { success: true, id: "dev-placeholder" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AstrologyPro <noreply@astrologypro.com>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[Email] Failed to send:", error);
    throw new Error(`Failed to send email: ${error}`);
  }

  const data = await res.json();
  return { success: true, id: data.id };
}

// --- Specific email types ---

interface BookingConfirmationParams {
  clientEmail: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  sessionLink: string;
}

export async function sendBookingConfirmation({
  clientEmail,
  divinerName,
  serviceName,
  dateTime,
  sessionLink,
}: BookingConfirmationParams) {
  return sendEmail({
    to: clientEmail,
    subject: `Booking Confirmed with ${divinerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Booking is Confirmed</h2>
        <p>Your session with <strong>${divinerName}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Service</td>
            <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date &amp; Time</td>
            <td style="padding: 8px 0; font-weight: bold;">${dateTime}</td>
          </tr>
        </table>
        <a href="${sessionLink}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Join Session
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          If you need to reschedule, please contact your diviner directly.
        </p>
      </div>
    `,
  });
}

interface SessionRecordingParams {
  clientEmail: string;
  divinerName: string;
  recordingUrl: string;
  shareUrl: string;
}

export async function sendSessionRecording({
  clientEmail,
  divinerName,
  recordingUrl,
  shareUrl,
}: SessionRecordingParams) {
  return sendEmail({
    to: clientEmail,
    subject: `Your Session Recording with ${divinerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Session Recording is Ready</h2>
        <p>Your session recording with <strong>${divinerName}</strong> is now available.</p>
        <a href="${recordingUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Watch Recording
        </a>
        <p style="margin-top: 16px;">You can also share this link with others:</p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all;">${shareUrl}</p>
      </div>
    `,
  });
}

interface TestimonialRequestParams {
  clientEmail: string;
  divinerName: string;
  bookingId: string;
}

export async function sendTestimonialRequest({
  clientEmail,
  divinerName,
  bookingId,
}: TestimonialRequestParams) {
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/portal/review/${bookingId}`;

  return sendEmail({
    to: clientEmail,
    subject: `How was your session with ${divinerName}?`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>We would love your feedback</h2>
        <p>How was your recent session with <strong>${divinerName}</strong>?</p>
        <p>Your review helps other seekers find the right diviner for them.</p>
        <a href="${reviewUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Leave a Review
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This email was sent because you recently had a session on AstrologyPro.
        </p>
      </div>
    `,
  });
}

interface EventReminderParams {
  clientEmail: string;
  divinerName: string;
  eventType: string;
  eventDate: string;
  bookingLink: string;
}

export async function sendEventReminder({
  clientEmail,
  divinerName,
  eventType,
  eventDate,
  bookingLink,
}: EventReminderParams) {
  const eventDescriptions: Record<string, string> = {
    solar_return:
      "Your Solar Return (birthday) is a powerful time for self-reflection and setting intentions for the year ahead.",
    saturn_return:
      "Your Saturn Return is a major life transit that happens roughly every 29.5 years. It often marks significant shifts in career, relationships, and personal growth.",
    jupiter_return:
      "Your Jupiter Return occurs roughly every 12 years and brings opportunities for expansion, growth, and good fortune.",
  };

  const eventNames: Record<string, string> = {
    solar_return: "Solar Return (Birthday)",
    saturn_return: "Saturn Return",
    jupiter_return: "Jupiter Return",
  };

  return sendEmail({
    to: clientEmail,
    subject: `Your ${eventNames[eventType] ?? eventType} is approaching`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>A Cosmic Event is Approaching</h2>
        <p><strong>${eventNames[eventType] ?? eventType}</strong> on ${eventDate}</p>
        <p>${eventDescriptions[eventType] ?? "An important astrological transit is coming up for you."}</p>
        <p><strong>${divinerName}</strong> can help you prepare for and navigate this transit.</p>
        <a href="${bookingLink}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Book a Session
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          You are receiving this because you are a client of ${divinerName} on AstrologyPro.
        </p>
      </div>
    `,
  });
}
