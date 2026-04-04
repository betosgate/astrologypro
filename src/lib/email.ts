import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  buildEmailHtml,
  detailRow,
  infoCard,
  secondaryCta,
  sectionHeading,
  starRating,
} from "./email-base";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

const FROM_ADDRESS =
  process.env.AWS_SES_FROM_ADDRESS ??
  "AstrologyPro <noreply@divineinfinitebeing.com>";

function getSESClient() {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  const region = process.env.AWS_SES_REGION ?? "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const ses = getSESClient();

  if (!ses) {
    console.log("[Email] AWS SES not configured — logging instead:", { to, subject });
    return { success: true, id: "dev-placeholder" };
  }

  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: { Html: { Data: html, Charset: "UTF-8" } },
    },
  });

  const result = await ses.send(command);
  return { success: true, id: result.MessageId ?? "" };
}


// ---------------------------------------------------------------------------
// 0. Welcome + Session Booked (for new auto-created users)
// ---------------------------------------------------------------------------

interface WelcomeAndBookedParams {
  clientEmail: string;
  clientName: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  portalUrl: string;
}

export async function sendWelcomeAndBooked({
  clientEmail,
  clientName,
  divinerName,
  serviceName,
  dateTime,
  portalUrl,
}: WelcomeAndBookedParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Welcome to AstrologyPro, ${clientName}!</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your session has been booked and an account has been created for you automatically. Here are your details:</p>

    ${detailRow("Service", serviceName)}
    ${detailRow("Diviner", divinerName)}
    ${detailRow("Date &amp; Time", dateTime)}

    ${sectionHeading("Access Your Portal")}
    <p style="margin:0 0 8px;color:#a1a1aa;">You can manage your bookings, view session recordings, and more from your personal portal. No password needed &mdash; just sign in with a magic link sent to this email address.</p>

    ${sectionHeading("What to Expect")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">You will receive a session confirmation email with join details</li>
      <li style="margin-bottom:6px;">Your diviner will guide you through a private reading</li>
      <li style="margin-bottom:6px;">After the session, you can access recordings from your portal</li>
    </ul>
  `;

  const html = buildEmailHtml({
    title: `Welcome to AstrologyPro!`,
    preheader: `Your ${serviceName} with ${divinerName} is booked. Welcome aboard!`,
    content,
    ctaText: "Go to My Portal",
    ctaUrl: portalUrl,
  });

  return sendEmail({
    to: clientEmail,
    subject: `Welcome to AstrologyPro — Your ${serviceName} is Booked!`,
    html,
  });
}

// ---------------------------------------------------------------------------
// 1. Booking Confirmation
// ---------------------------------------------------------------------------

interface BookingConfirmationParams {
  clientEmail: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  duration?: number;
  sessionLink: string;
  birthData?: string;
  phoneNumber?: string;
}

export async function sendBookingConfirmation({
  clientEmail,
  divinerName,
  serviceName,
  dateTime,
  duration,
  sessionLink,
  birthData,
  phoneNumber,
}: BookingConfirmationParams) {
  const durationText = duration ? `${duration} minutes` : "See details";

  const birthSection = birthData
    ? `${sectionHeading("Birth Data on File")}
       ${infoCard(birthData)}`
    : "";

  const phoneSection = phoneNumber
    ? `${sectionHeading("Phone Dial-in")}
       ${infoCard(`Can&#39;t use video? Dial in by phone: <strong style="color:#e4e4e7;">${phoneNumber}</strong>`)}`
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Your reading is confirmed! We are looking forward to your session.</p>

    ${detailRow("Service", serviceName)}
    ${detailRow("Diviner", divinerName)}
    ${detailRow("Date &amp; Time", dateTime)}
    ${detailRow("Duration", durationText)}

    ${birthSection}

    ${phoneSection}

    ${sectionHeading("What to Expect")}
    <p style="margin:0 0 8px;color:#a1a1aa;">Your diviner will guide you through your reading in a private, one-on-one video session. Feel free to ask questions throughout.</p>

    ${sectionHeading("How to Prepare")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Find a quiet, comfortable space</li>
      <li style="margin-bottom:6px;">Have your questions or intentions ready</li>
      <li style="margin-bottom:6px;">Keep a journal nearby for notes</li>
      <li>Test your camera and microphone beforehand</li>
    </ul>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Your reading is confirmed! ✨ ${serviceName} with ${divinerName}`,
    html: buildEmailHtml({
      title: "Your reading is confirmed! &#10024;",
      preheader: `${serviceName} with ${divinerName} on ${dateTime}`,
      content,
      ctaText: "Join Session",
      ctaUrl: sessionLink,
      footer:
        "Need to reschedule? Contact your diviner directly.<br/>AstrologyPro &mdash; Run Your Divination Business",
    }),
  });
}

// ---------------------------------------------------------------------------
// 2. Session Recording
// ---------------------------------------------------------------------------

interface SessionRecordingParams {
  clientEmail: string;
  divinerName: string;
  serviceName?: string;
  sessionDate?: string;
  recordingUrl: string;
  shareUrl: string;
  rebookUrl?: string;
}

export async function sendSessionRecording({
  clientEmail,
  divinerName,
  serviceName,
  sessionDate,
  recordingUrl,
  shareUrl,
  rebookUrl,
}: SessionRecordingParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Your session recording is ready to watch! Revisit the insights anytime.</p>

    ${serviceName ? detailRow("Service", serviceName) : ""}
    ${detailRow("Diviner", divinerName)}
    ${sessionDate ? detailRow("Session Date", sessionDate) : ""}

    ${sectionHeading("Share Your Experience")}
    <p style="margin:0 0 8px;color:#a1a1aa;">Loved your reading? Share it with friends who might benefit from guidance.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">
      <tr>
        <td style="padding-right:8px;">
          <a href="https://twitter.com/intent/tweet?text=Just%20had%20an%20amazing%20reading%20with%20${encodeURIComponent(divinerName)}%20on%20AstrologyPro!&url=${encodeURIComponent(shareUrl)}" style="color:#8b5cf6;font-family:system-ui,-apple-system,sans-serif;font-size:13px;text-decoration:underline;">Twitter</a>
        </td>
        <td style="padding-right:8px;">
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" style="color:#8b5cf6;font-family:system-ui,-apple-system,sans-serif;font-size:13px;text-decoration:underline;">Facebook</a>
        </td>
      </tr>
    </table>

    ${rebookUrl ? secondaryCta("Book Another Reading", rebookUrl) : ""}
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Your session recording is ready 🎬`,
    html: buildEmailHtml({
      title: "Your session recording is ready &#127916;",
      preheader: `Watch your session with ${divinerName}`,
      content,
      ctaText: "Watch Recording",
      ctaUrl: recordingUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// 3. Testimonial Request
// ---------------------------------------------------------------------------

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
  const reviewUrl = `${APP_URL}/portal/review/${bookingId}`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">We hope you enjoyed your reading with <strong style="color:#f4f4f5;">${divinerName}</strong>. Your feedback means the world!</p>

    ${starRating()}

    <p style="margin:16px 0 0;color:#a1a1aa;text-align:center;">Tap to rate your experience</p>

    ${infoCard(`Your feedback helps <strong style="color:#e4e4e7;">${divinerName}</strong> grow their practice and helps other seekers find the right diviner for them.`)}
  `;

  return sendEmail({
    to: clientEmail,
    subject: `How was your reading with ${divinerName}? ⭐`,
    html: buildEmailHtml({
      title: `How was your reading with ${divinerName}? &#11088;`,
      preheader: `Share your experience with ${divinerName}`,
      content,
      ctaText: "Leave a Review",
      ctaUrl: reviewUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// 4. Event Reminder
// ---------------------------------------------------------------------------

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
    { name: string; subject: string; headline: string; body: string; cta: string; why: string }
  > = {
    solar_return: {
      name: "Solar Return",
      subject: `Your Solar Return is approaching! 🌟 ${eventDate}`,
      headline: "Your Solar Return is approaching! &#127775;",
      body: `This is a powerful time for reflection and setting intentions for your year ahead. Your Solar Return on <strong style="color:#f4f4f5;">${eventDate}</strong> marks the moment the Sun returns to its exact position at your birth &mdash; a cosmic birthday that sets the tone for your entire year.`,
      cta: "Book Your Solar Return Reading",
      why: "A Solar Return reading reveals the themes, challenges, and opportunities that will define your next year. It is your personal cosmic forecast.",
    },
    saturn_return: {
      name: "Saturn Return",
      subject: `Your Saturn Return is approaching &mdash; a pivotal life transit`,
      headline: "A Major Life Transit Awaits &#127775;",
      body: `Your Saturn Return is one of the most significant astrological events you will experience. Happening roughly every 29.5 years, this transit around <strong style="color:#f4f4f5;">${eventDate}</strong> often catalyzes profound shifts in career, relationships, and personal identity.`,
      cta: "Book Your Saturn Return Reading",
      why: "Saturn Return is a call to maturity and authenticity. A reading helps you understand the lessons Saturn is asking you to learn and how to navigate them with grace.",
    },
    jupiter_return: {
      name: "Jupiter Return",
      subject: `Your Jupiter Return is near &mdash; expansion and fortune await 🌟`,
      headline: "A Window of Expansion Opens &#127775;",
      body: `Your Jupiter Return around <strong style="color:#f4f4f5;">${eventDate}</strong> heralds a period of growth, opportunity, and good fortune. Occurring roughly every 12 years, this transit amplifies your potential and opens doors you may not have imagined.`,
      cta: "Book Your Jupiter Return Reading",
      why: "Understanding Jupiter's gift can help you direct this abundant energy toward the areas of life where you need it most.",
    },
  };

  const ec = eventContent[eventType] ?? {
    name: eventType,
    subject: `Your ${eventType} is approaching! 🌟`,
    headline: `Your ${eventType} is approaching! &#127775;`,
    body: `An important astrological transit is coming up for you on <strong style="color:#f4f4f5;">${eventDate}</strong>.`,
    cta: "Book a Session",
    why: "A personalized reading will help you understand and prepare for this transit.",
  };

  const content = `
    <p style="margin:0 0 4px;color:#8b5cf6;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${ec.name} &mdash; ${eventDate}</p>
    <p style="margin:0 0 16px;color:#d4d4d8;line-height:1.7;">${ec.body}</p>

    ${sectionHeading("Why This Matters")}
    <p style="margin:0 0 16px;color:#a1a1aa;">${ec.why}</p>

    <p style="margin:0;color:#a1a1aa;"><strong style="color:#f4f4f5;">${divinerName}</strong> specializes in this transit and can help you prepare for and navigate the energies ahead with clarity and confidence.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: ec.subject,
    html: buildEmailHtml({
      title: ec.headline,
      preheader: `${ec.name} on ${eventDate} — book a reading with ${divinerName}`,
      content,
      ctaText: ec.cta,
      ctaUrl: bookingLink,
      footer: `You are receiving this because you are a client of ${divinerName} on AstrologyPro.<br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 5. Recording Ready (immediate post-session)
// ---------------------------------------------------------------------------

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
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Thank you for your session with <strong style="color:#f4f4f5;">${divinerName}</strong>! Your recording is now available to revisit anytime.</p>

    ${sectionHeading("Share Your Experience")}
    <p style="margin:0 0 8px;color:#a1a1aa;">We would love to hear about your experience. Your feedback helps others find the guidance they need.</p>

    ${secondaryCta("Leave a Testimonial", testimonialLink)}
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Your session recording with ${divinerName} is ready!`,
    html: buildEmailHtml({
      title: "Your recording is ready!",
      preheader: `Watch your session with ${divinerName}`,
      content,
      ctaText: "Watch Recording",
      ctaUrl: recordingUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// 6. Reflection Email (3 days after session)
// ---------------------------------------------------------------------------

interface ReflectionEmailParams {
  clientEmail: string;
  divinerName: string;
  serviceName: string;
  bookingDate: string;
  rebookUrl: string;
  focusQuestion?: string;
  sessionSummary?: string;
}

export async function sendReflectionEmail({
  clientEmail,
  divinerName,
  serviceName,
  bookingDate,
  rebookUrl,
  focusQuestion,
  sessionSummary,
}: ReflectionEmailParams) {
  const focusQuestionBlock = focusQuestion
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
  <tr>
    <td style="border-left:4px solid #8b5cf6;padding:12px 16px;background-color:#1e1b2e;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#a78bfa;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">You asked about</p>
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:15px;color:#e4e4e7;font-style:italic;line-height:1.5;">&ldquo;${focusQuestion}&rdquo;</p>
    </td>
  </tr>
</table>`
    : "";

  const sessionSummaryBlock = sessionSummary
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
  <tr>
    <td style="padding:16px;background-color:#1a1a2e;border:1px solid #2e2548;border-radius:8px;">
      <p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#a78bfa;font-weight:600;">Key themes from your reading</p>
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#c4b5fd;line-height:1.6;font-style:italic;">${sessionSummary}</p>
    </td>
  </tr>
</table>`
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">A few days have passed since your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> on ${bookingDate}.</p>

    ${focusQuestionBlock}

    ${sessionSummaryBlock}

    ${infoCard("Take some time to journal about the insights from your session. Have any of the themes started to manifest in your life? Reflecting on your experience can deepen your understanding.")}

    <p style="margin:0;color:#a1a1aa;">Want to go deeper? <strong style="color:#f4f4f5;">${divinerName}</strong> is available for follow-up readings.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Reflecting on Your ${serviceName} Reading with ${divinerName} ✨`,
    html: buildEmailHtml({
      title: `Reflecting on Your ${serviceName} Reading &#10024;`,
      preheader: `How are the insights from your ${serviceName} session unfolding?`,
      content,
      ctaText: "Book a Follow-Up Reading",
      ctaUrl: rebookUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// 7. Rebooking Nudge (30 days after session)
// ---------------------------------------------------------------------------

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
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">It has been about a month since your last session with <strong style="color:#f4f4f5;">${divinerName}</strong>. A lot can shift in the cosmos in that time!</p>

    ${infoCard(`<strong style="color:#e4e4e7;">${divinerName}</strong> has openings this week and would love to check in on how the energies have been unfolding for you.`)}

    <p style="margin:0;color:#a1a1aa;">The stars keep moving &mdash; keep moving with them.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `It's been a month since your reading 🌙`,
    html: buildEmailHtml({
      title: "It's been a month since your reading &#127769;",
      preheader: `${divinerName} has openings this week`,
      content,
      ctaText: "Rebook a Session",
      ctaUrl: rebookUrl,
      footer: `You are receiving this because you are a client of ${divinerName} on AstrologyPro. <a href="${APP_URL}/portal/settings" style="color:#71717a;text-decoration:underline;">Manage preferences</a><br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 8. Gift Certificate — Recipient
// ---------------------------------------------------------------------------

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
  const messageBlock = message
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;border-left:3px solid #8b5cf6;background-color:#1e1b2e;border-radius:0 8px 8px 0;">
  <tr>
    <td style="padding:16px;font-family:system-ui,-apple-system,sans-serif;">
      <p style="margin:0;font-style:italic;color:#d4d4d8;font-size:15px;">&ldquo;${message}&rdquo;</p>
      <p style="margin:8px 0 0;color:#71717a;font-size:13px;">&mdash; ${purchaserName}</p>
    </td>
  </tr>
</table>`
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;"><strong style="color:#f4f4f5;">${purchaserName}</strong> has gifted you a reading with <strong style="color:#f4f4f5;">${divinerName}</strong> on AstrologyPro.</p>

    <!-- Gift card display -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#1e1b2e;border:1px solid #2e2548;border-radius:12px;">
      <tr>
        <td align="center" style="padding:28px 20px;">
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Gift Certificate Value</p>
          <p style="margin:8px 0;font-family:system-ui,-apple-system,sans-serif;font-size:36px;font-weight:700;color:#8b5cf6;">$${amount.toFixed(2)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#27272a;border-radius:6px;">
            <tr>
              <td style="padding:8px 16px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#e4e4e7;letter-spacing:2px;font-weight:600;">${code}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${messageBlock}
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `You've been gifted a reading! 🎁`,
    html: buildEmailHtml({
      title: "You've been gifted a reading! &#127873;",
      preheader: `${purchaserName} sent you a $${amount.toFixed(2)} gift for a reading with ${divinerName}`,
      content,
      ctaText: "Redeem Your Gift",
      ctaUrl: redeemUrl,
      footer: "This gift certificate is valid for one year from the date of purchase.<br/>AstrologyPro &mdash; Run Your Divination Business",
    }),
  });
}

// ---------------------------------------------------------------------------
// 9. Gift Certificate — Purchaser Confirmation
// ---------------------------------------------------------------------------

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
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Your gift certificate for a reading with <strong style="color:#f4f4f5;">${divinerName}</strong> has been purchased successfully.</p>

    ${detailRow("Amount", `$${amount.toFixed(2)}`)}
    ${detailRow("Gift Code", code)}
    ${recipientName ? detailRow("Recipient", recipientName) : ""}

    ${infoCard("The recipient will receive an email with instructions to redeem the gift certificate. Save the code above for your records.")}
  `;

  return sendEmail({
    to: purchaserEmail,
    subject: `Your gift has been sent! 🎁`,
    html: buildEmailHtml({
      title: "Your gift has been sent! &#127873;",
      preheader: `Gift certificate confirmed — $${amount.toFixed(2)} for ${divinerName}`,
      content,
    }),
  });
}

// ---------------------------------------------------------------------------
// 10. Booking Access Instructions (NEW)
// ---------------------------------------------------------------------------

interface BookingAccessInstructionsParams {
  clientEmail: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  sessionLink: string;
  calendarLink?: string;
  phoneNumber?: string;
}

export async function sendBookingAccessInstructions({
  clientEmail,
  divinerName,
  serviceName,
  dateTime,
  sessionLink,
  calendarLink,
  phoneNumber,
}: BookingAccessInstructionsParams) {
  const calendarSection = calendarLink
    ? `${sectionHeading("Add to Calendar")}
       ${secondaryCta("Add to Google Calendar", calendarLink)}`
    : "";

  const phoneSection = phoneNumber
    ? `${sectionHeading("Or Dial In by Phone")}
       ${infoCard(`Can&#39;t use video? Call your diviner directly at: <strong style="color:#e4e4e7;font-size:18px;">${phoneNumber}</strong><br/><span style="font-size:12px;">Standard phone reading rates apply for standalone calls.</span>`)}`
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Here is everything you need to join your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> on <strong style="color:#f4f4f5;">${dateTime}</strong>.</p>

    <!-- Session link prominently displayed -->
    ${infoCard(`<strong style="color:#e4e4e7;">Your session link:</strong><br/><a href="${sessionLink}" style="color:#8b5cf6;word-break:break-all;">${sessionLink}</a>`)}

    ${sectionHeading("How to Join Your Session")}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;">1.</td>
              <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">Click the session link above at your appointment time</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;">2.</td>
              <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">Allow camera and microphone access when prompted</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;">3.</td>
              <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">Accept the recording consent notice</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;">4.</td>
              <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">Your diviner will guide you through the reading</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;">5.</td>
              <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">After the session, you will receive your recording via email</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${calendarSection}

    ${phoneSection}
  `;

  return sendEmail({
    to: clientEmail,
    subject: `How to Join Your Session 📹`,
    html: buildEmailHtml({
      title: "How to Join Your Session &#128249;",
      preheader: `Step-by-step instructions for your ${serviceName} with ${divinerName}`,
      content,
      ctaText: "Open Session Link",
      ctaUrl: sessionLink,
      footer: `Need to reschedule? Contact ${divinerName} directly.<br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 11. Diviner Weekly Digest (NEW)
// ---------------------------------------------------------------------------

interface WeeklyDigestParams {
  divinerEmail: string;
  divinerName: string;
  weekLabel: string;
  revenue: number;
  revenueTrend: "up" | "down" | "flat";
  bookings: number;
  bookingsTrend: "up" | "down" | "flat";
  newClients: number;
  newClientsTrend: "up" | "down" | "flat";
  totalEarnings: number;
  topService?: string;
  suggestedAction?: string;
  dashboardUrl: string;
}

export async function sendDivinerWeeklyDigest({
  divinerEmail,
  divinerName,
  weekLabel,
  revenue,
  revenueTrend,
  bookings,
  bookingsTrend,
  newClients,
  newClientsTrend,
  totalEarnings,
  topService,
  suggestedAction,
  dashboardUrl,
}: WeeklyDigestParams) {
  const trendArrow = (trend: "up" | "down" | "flat") => {
    if (trend === "up") return '<span style="color:#22c55e;">&#9650;</span>';
    if (trend === "down") return '<span style="color:#ef4444;">&#9660;</span>';
    return '<span style="color:#71717a;">&mdash;</span>';
  };

  const statCell = (label: string, value: string, trend: "up" | "down" | "flat") =>
    `<td align="center" style="padding:16px 8px;width:33%;">
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <p style="margin:6px 0 4px;font-family:system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:#f4f4f5;">${value}</p>
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;">${trendArrow(trend)}</p>
    </td>`;

  const topServiceBlock = topService
    ? `${sectionHeading("Top Performing Service")}
       ${infoCard(`<strong style="color:#e4e4e7;">${topService}</strong>`)}`
    : "";

  const suggestedBlock = suggestedAction
    ? `${sectionHeading("Suggested Action")}
       <p style="margin:0;color:#a1a1aa;">${suggestedAction}</p>`
    : "";

  const content = `
    <p style="margin:0 0 4px;color:#8b5cf6;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${weekLabel}</p>
    <p style="margin:0 0 20px;color:#d4d4d8;">Here is how your practice performed this week, ${divinerName}.</p>

    <!-- Stats grid -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#1e1b2e;border:1px solid #2e2548;border-radius:8px;margin:0 0 16px;">
      <tr>
        ${statCell("Revenue", `$${revenue.toFixed(0)}`, revenueTrend)}
        ${statCell("Bookings", String(bookings), bookingsTrend)}
        ${statCell("New Clients", String(newClients), newClientsTrend)}
      </tr>
    </table>

    ${infoCard(`You have earned <strong style="color:#8b5cf6;">$${totalEarnings.toFixed(2)}</strong> total on AstrologyPro.`)}

    ${topServiceBlock}
    ${suggestedBlock}
  `;

  return sendEmail({
    to: divinerEmail,
    subject: `Your Week in Review 📊 ${weekLabel}`,
    html: buildEmailHtml({
      title: "Your Week in Review &#128202;",
      preheader: `${weekLabel} — $${revenue.toFixed(0)} revenue, ${bookings} bookings`,
      content,
      ctaText: "View Dashboard",
      ctaUrl: dashboardUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// 12. Refund Processed
// ---------------------------------------------------------------------------

interface RefundProcessedParams {
  clientEmail: string;
  divinerName: string;
  amount: number;
  reason: string;
}

export async function sendRefundProcessed({
  clientEmail,
  divinerName,
  amount,
  reason,
}: RefundProcessedParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">A refund has been issued for your session with <strong style="color:#f4f4f5;">${divinerName}</strong>.</p>

    <!-- Refund amount display -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#1e1b2e;border:1px solid #2e2548;border-radius:12px;">
      <tr>
        <td align="center" style="padding:28px 20px;">
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Refund Amount</p>
          <p style="margin:8px 0;font-family:system-ui,-apple-system,sans-serif;font-size:36px;font-weight:700;color:#22c55e;">$${amount.toFixed(2)}</p>
        </td>
      </tr>
    </table>

    ${detailRow("Diviner", divinerName)}
    ${detailRow("Reason", reason)}

    ${infoCard("Your refund has been submitted and will be processed within <strong style=\"color:#e4e4e7;\">5-10 business days</strong>. Depending on your bank or card issuer, it may take additional time to appear on your statement.")}

    <p style="margin:16px 0 0;color:#a1a1aa;">If you have questions about this refund, please contact your diviner or reach out to us at <a href="mailto:support@astrologypro.com" style="color:#8b5cf6;">support@astrologypro.com</a>.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Your refund of $${amount.toFixed(2)} has been processed`,
    html: buildEmailHtml({
      title: "Refund Processed",
      preheader: `Your refund of $${amount.toFixed(2)} from ${divinerName} has been submitted`,
      content,
      footer: `<a href="${APP_URL}/refund-policy" style="color:#71717a;text-decoration:underline;">Refund Policy</a><br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 13. Phone Session Receipt
// ---------------------------------------------------------------------------

interface PhoneSessionReceiptParams {
  clientEmail: string;
  divinerName: string;
  duration: number;
  amount: number;
}

export async function sendPhoneSessionReceipt({
  clientEmail,
  divinerName,
  duration,
  amount,
}: PhoneSessionReceiptParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Thank you for your phone reading with <strong style="color:#f4f4f5;">${divinerName}</strong>. Here is your receipt.</p>

    ${detailRow("Diviner", divinerName)}
    ${detailRow("Duration", `${duration} minutes`)}
    ${detailRow("Amount Charged", `$${amount.toFixed(2)}`)}

    ${infoCard(`Your saved payment method has been charged <strong style="color:#e4e4e7;">$${amount.toFixed(2)}</strong> for this phone reading session. The base rate covers the first 20 minutes, with $0.50 per additional minute.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">Want to book another session? Visit your diviner&#39;s page or call their dedicated number again.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Phone reading receipt - $${amount.toFixed(2)}`,
    html: buildEmailHtml({
      title: "Phone Reading Receipt",
      preheader: `$${amount.toFixed(2)} charged for ${duration}-minute reading with ${divinerName}`,
      content,
      footer: `<a href="${APP_URL}/refund-policy" style="color:#71717a;text-decoration:underline;">Refund Policy</a><br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 14. Phone Payment Failed — sent when card-on-file charge fails after call
// ---------------------------------------------------------------------------

interface PhonePaymentFailedParams {
  clientEmail: string;
  divinerName: string;
  duration: number;
  amount: number;
  divinerPageUrl: string;
}

export async function sendPhonePaymentFailed({
  clientEmail,
  divinerName,
  duration,
  amount,
  divinerPageUrl,
}: PhonePaymentFailedParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">We were unable to charge your saved payment method for your recent phone reading with <strong style="color:#f4f4f5;">${divinerName}</strong>.</p>

    ${detailRow("Diviner", divinerName)}
    ${detailRow("Duration", `${duration} minutes`)}
    ${detailRow("Amount Due", `$${amount.toFixed(2)}`)}

    ${infoCard(`Please book a new session and complete payment, or contact <strong style="color:#e4e4e7;">${divinerName}</strong> directly to arrange payment for this reading.`)}

    <div style="text-align:center;margin:28px 0;">
      <a href="${divinerPageUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;font-weight:600;border-radius:8px;text-decoration:none;">Visit ${divinerName}'s Page</a>
    </div>

    <p style="margin:16px 0 0;color:#a1a1aa;">If you believe this is an error, please contact us at <a href="mailto:support@astrologypro.com" style="color:#8b5cf6;">support@astrologypro.com</a>.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Action required: payment of $${amount.toFixed(2)} could not be processed`,
    html: buildEmailHtml({
      title: "Payment Unsuccessful",
      preheader: `Payment of $${amount.toFixed(2)} for your ${duration}-minute reading with ${divinerName} could not be processed.`,
      content,
      footer: `AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 15. Guest Booking Invite — sent when booking confirmed and guest has email
// ---------------------------------------------------------------------------

interface GuestBookingInviteParams {
  guestEmail: string;
  guestName: string;
  clientName: string;
  divinerName: string;
  serviceName: string;
  sessionDate: string;
  divinerLandingUrl: string;
}

export async function sendGuestBookingInvite({
  guestEmail,
  guestName,
  clientName,
  divinerName,
  serviceName,
  sessionDate,
  divinerLandingUrl,
}: GuestBookingInviteParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hello ${guestName},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;"><strong style="color:#f4f4f5;">${clientName}</strong> has invited you to join their <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> on <strong style="color:#f4f4f5;">${sessionDate}</strong>.</p>

    ${infoCard(`We will send you the video room link shortly before the session starts. No account needed &mdash; just click the link when you receive it.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">Curious about <strong style="color:#f4f4f5;">${divinerName}</strong>? You can learn more at <a href="${divinerLandingUrl}" style="color:#8b5cf6;text-decoration:underline;">${divinerLandingUrl}</a>.</p>
  `;

  return sendEmail({
    to: guestEmail,
    subject: `You've been invited to a reading with ${divinerName}`,
    html: buildEmailHtml({
      title: `You've been invited to a reading &#10024;`,
      preheader: `${clientName} has invited you to join a ${serviceName} session with ${divinerName}`,
      content,
      footer: `If you weren&rsquo;t expecting this invitation, you can safely ignore this email.<br/>AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// 15. Guest Room Link — sent when diviner creates the video room
// ---------------------------------------------------------------------------

interface GuestRoomLinkParams {
  guestEmail: string;
  guestName: string;
  divinerName: string;
  serviceName: string;
  sessionDate: string;
  roomUrl: string;
}

export async function sendGuestRoomLink({
  guestEmail,
  guestName,
  divinerName,
  serviceName,
  sessionDate,
  roomUrl,
}: GuestRoomLinkParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hello ${guestName},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> is ready.</p>

    ${detailRow("Session", serviceName)}
    ${detailRow("Diviner", divinerName)}
    ${detailRow("Date &amp; Time", sessionDate)}

    <p style="margin:16px 0 8px;color:#a1a1aa;">Click below to join the video call. You may be asked to enable your camera and microphone.</p>
  `;

  return sendEmail({
    to: guestEmail,
    subject: `Your reading is starting — here's your join link`,
    html: buildEmailHtml({
      title: "Your reading is starting &#10024;",
      preheader: `Join your ${serviceName} session with ${divinerName} now`,
      content,
      ctaText: "Join Session Now",
      ctaUrl: roomUrl,
      footer: `AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Mystery School graduation congratulations
// ---------------------------------------------------------------------------

export async function sendMysterySchoolGraduation({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const decansUrl = `${APP_URL}/community/decans`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">
      Congratulations, ${name}! You have completed all 36 decan rituals of the Mystery School
      and officially graduated.
    </p>
    <p style="margin:0 0 24px;color:#a1a1aa;">
      This is a significant milestone. You have walked the full wheel of the year, worked with
      every decan energy, and committed to the practice week after week. The work you've done
      here is yours to carry forward.
    </p>
    <p style="margin:0 0 24px;color:#a1a1aa;">
      Your graduation is now recorded. Watch for announcements about what comes next in your
      journey as a Mystery School graduate.
    </p>
  `;

  return sendEmail({
    to,
    subject: "You have graduated from the Mystery School 🌟",
    html: buildEmailHtml({
      title: `Congratulations, ${name} — Mystery School Graduate`,
      preheader: "You completed all 36 decan rituals. You have graduated.",
      content,
      ctaText: "View Your Decan Journey",
      ctaUrl: decansUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });
}
