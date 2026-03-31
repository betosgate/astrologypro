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

// --- Follow-up email types ---

interface RecordingReadyParams {
  clientEmail: string;
  divinerName: string;
  recordingUrl: string;
  testimonialLink: string;
}

export async function sendRecordingReady({
  clientEmail,
  divinerName,
  recordingUrl,
  testimonialLink,
}: RecordingReadyParams) {
  return sendEmail({
    to: clientEmail,
    subject: `Your session recording with ${divinerName} is ready!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Session Recording is Ready</h2>
        <p>Thank you for your session with <strong>${divinerName}</strong>! Your recording is now available to revisit anytime.</p>
        <a href="${recordingUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Watch Recording
        </a>
        <p style="margin-top: 24px;">We would love to hear about your experience. Your feedback helps others find the guidance they need.</p>
        <a href="${testimonialLink}" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
          Leave a Testimonial
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This email was sent because you recently had a session on AstrologyPro.
        </p>
      </div>
    `,
  });
}

interface ReflectionEmailParams {
  clientEmail: string;
  divinerName: string;
  serviceName: string;
  bookingDate: string;
  rebookUrl: string;
}

export async function sendReflectionEmail({
  clientEmail,
  divinerName,
  serviceName,
  bookingDate,
  rebookUrl,
}: ReflectionEmailParams) {
  return sendEmail({
    to: clientEmail,
    subject: `Reflecting on your reading with ${divinerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Time to Reflect</h2>
        <p>A few days have passed since your <strong>${serviceName}</strong> session with <strong>${divinerName}</strong> on ${bookingDate}.</p>
        <p>This is a wonderful time to revisit the insights from your reading. Have any of the themes started to manifest in your life? Journaling about your experience can deepen your understanding.</p>
        <p>If you have new questions or would like to explore further, <strong>${divinerName}</strong> is available for follow-up sessions.</p>
        <a href="${rebookUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Book a Follow-Up
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This email was sent because you recently had a session on AstrologyPro.
        </p>
      </div>
    `,
  });
}

interface RebookingNudgeParams {
  clientEmail: string;
  divinerName: string;
  rebookUrl: string;
}

export async function sendRebookingNudge({
  clientEmail,
  divinerName,
  rebookUrl,
}: RebookingNudgeParams) {
  return sendEmail({
    to: clientEmail,
    subject: `It's been a month! ${divinerName} has openings this week`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>The Stars Keep Moving</h2>
        <p>It has been about a month since your last session with <strong>${divinerName}</strong>. A lot can shift in the cosmos in that time!</p>
        <p><strong>${divinerName}</strong> has openings this week and would love to check in on how the energies have been unfolding for you.</p>
        <a href="${rebookUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Book a Session
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This email was sent because you are a client of ${divinerName} on AstrologyPro. You can manage your notification preferences in your client portal.
        </p>
      </div>
    `,
  });
}

// --- Gift certificate email types ---

interface GiftRecipientEmailParams {
  recipientEmail: string;
  purchaserName: string;
  divinerName: string;
  amount: number;
  code: string;
  message?: string;
  redeemUrl: string;
}

export async function sendGiftCertificateToRecipient({
  recipientEmail,
  purchaserName,
  divinerName,
  amount,
  code,
  message,
  redeemUrl,
}: GiftRecipientEmailParams) {
  return sendEmail({
    to: recipientEmail,
    subject: `You've been gifted a reading with ${divinerName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">You Have Received a Gift!</h2>
        <p><strong>${purchaserName}</strong> has gifted you a reading with <strong>${divinerName}</strong> on AstrologyPro.</p>
        <div style="background: linear-gradient(135deg, #7c3aed15, #a855f715); border: 1px solid #7c3aed30; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">Gift Certificate Value</p>
          <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 8px 0;">$${amount.toFixed(2)}</p>
          <p style="font-size: 14px; color: #666; margin: 0;">Your code: <strong>${code}</strong></p>
        </div>
        ${message ? `<div style="background: #f9fafb; border-left: 3px solid #7c3aed; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;"><p style="margin: 0; font-style: italic;">"${message}"</p><p style="margin: 8px 0 0; color: #666; font-size: 14px;">- ${purchaserName}</p></div>` : ""}
        <a href="${redeemUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Redeem Your Gift
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This gift certificate is valid for one year from the date of purchase.
        </p>
      </div>
    `,
  });
}

interface GiftPurchaserConfirmationParams {
  purchaserEmail: string;
  recipientName?: string;
  divinerName: string;
  amount: number;
  code: string;
}

export async function sendGiftCertificateConfirmation({
  purchaserEmail,
  recipientName,
  divinerName,
  amount,
  code,
}: GiftPurchaserConfirmationParams) {
  return sendEmail({
    to: purchaserEmail,
    subject: `Gift certificate purchase confirmed - ${divinerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Gift Certificate Confirmed</h2>
        <p>Your gift certificate for a reading with <strong>${divinerName}</strong> has been purchased successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount</td>
            <td style="padding: 8px 0; font-weight: bold;">$${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Code</td>
            <td style="padding: 8px 0; font-weight: bold;">${code}</td>
          </tr>
          ${recipientName ? `<tr><td style="padding: 8px 0; color: #666;">Recipient</td><td style="padding: 8px 0; font-weight: bold;">${recipientName}</td></tr>` : ""}
        </table>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          The recipient will receive an email with instructions to redeem the gift certificate.
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
  const eventContent: Record<
    string,
    { name: string; subject: string; headline: string; body: string; cta: string }
  > = {
    solar_return: {
      name: "Solar Return",
      subject: `The stars are aligning for your Solar Return on ${eventDate}!`,
      headline: "Your Solar Return is Approaching",
      body: `This is a powerful time for reflection and setting intentions for your year ahead. Your Solar Return on <strong>${eventDate}</strong> marks the moment the Sun returns to its exact position at your birth — a cosmic birthday that sets the tone for your entire year.`,
      cta: "Book Your Solar Return Reading",
    },
    saturn_return: {
      name: "Saturn Return",
      subject: `Your Saturn Return is approaching — a pivotal life transit`,
      headline: "A Major Life Transit Awaits",
      body: `Your Saturn Return is one of the most significant astrological events you will experience. Happening roughly every 29.5 years, this transit around <strong>${eventDate}</strong> often catalyzes profound shifts in career, relationships, and personal identity. This is your invitation to step into a more authentic version of yourself.`,
      cta: "Book Your Saturn Return Reading",
    },
    jupiter_return: {
      name: "Jupiter Return",
      subject: `Your Jupiter Return is near — expansion and fortune await`,
      headline: "A Window of Expansion Opens",
      body: `Your Jupiter Return around <strong>${eventDate}</strong> heralds a period of growth, opportunity, and good fortune. Occurring roughly every 12 years, this transit amplifies your potential and opens doors you may not have imagined. Understanding this energy can help you make the most of this abundant cycle.`,
      cta: "Book Your Jupiter Return Reading",
    },
  };

  const content = eventContent[eventType] ?? {
    name: eventType,
    subject: `An important astrological event is approaching on ${eventDate}`,
    headline: "A Cosmic Event is Approaching",
    body: `An important astrological transit is coming up for you on <strong>${eventDate}</strong>.`,
    cta: "Book a Session",
  };

  return sendEmail({
    to: clientEmail,
    subject: content.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <h2 style="color: #7c3aed; margin-bottom: 4px;">${content.headline}</h2>
          <p style="color: #a78bfa; font-size: 14px; margin-top: 0;">${content.name} &mdash; ${eventDate}</p>
        </div>
        <p style="line-height: 1.7;">${content.body}</p>
        <p style="line-height: 1.7;"><strong>${divinerName}</strong> specializes in this transit and can help you prepare for and navigate the energies ahead with clarity and confidence.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${bookingLink}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            ${content.cta}
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
          You are receiving this because you are a client of ${divinerName} on AstrologyPro.
        </p>
      </div>
    `,
  });
}
