import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  buildEmailHtml,
  detailRow,
  infoCard,
  secondaryCta,
  sectionHeading,
  starRating,
} from "./email-base";
import { logEmail, isSequencePaused } from "./email-log";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

const FROM_ADDRESS =
  process.env.AWS_SES_FROM_ADDRESS ??
  "AstrologyPro <noreply@divineinfinitebeing.com>";

function getSESClient() {
  const region = process.env.AWS_SES_REGION ?? process.env.AWS_REGION ?? "us-east-1";

  // Support both AWS_SES_* prefixed vars and standard AWS_* vars
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  // Fallback to default credential chain (IAM role, instance profile, etc.)
  return new SESClient({ region });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const ses = getSESClient();

  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: { Html: { Data: html, Charset: "UTF-8" } },
    },
  });

  try {
    const result = await ses.send(command);
    console.log(`[sendEmail] SUCCESS — to: ${to}, subject: "${subject}", messageId: ${result.MessageId}`);
    return { success: true, id: result.MessageId ?? "" };
  } catch (err) {
    console.error(`[sendEmail] FAILED — to: ${to}, subject: "${subject}"`, err);
    throw err;
  }
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
// (sendMysterySchoolGraduation removed in commit fixing the graduation
// chain — Mystery School graduates now go through sendGraduationCongratulations
// via processGraduation in src/lib/mystery-school/graduation.ts.)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Community: Payment Failed
// ---------------------------------------------------------------------------

interface CommunityPaymentFailedParams {
  to: string;
  name: string;
  amount: string;
  currency: string;
  retryDate: string;
  billingPortalUrl: string;
}

export async function sendCommunityPaymentFailed({
  to,
  name,
  amount,
  currency,
  retryDate,
  billingPortalUrl,
}: CommunityPaymentFailedParams) {
  if (await isSequencePaused("community_payment_failed")) {
    console.log("[email] community_payment_failed sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const subject = `Action required: Community membership payment failed`;
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">We were unable to process your community membership payment. Your access remains active for now, but please update your payment method to avoid any interruption.</p>

    ${detailRow("Amount Due", `${currency} ${amount}`)}
    ${detailRow("Next Retry", retryDate)}

    ${infoCard(`Please update your payment method in the billing portal to ensure uninterrupted access to the community. If no action is taken, your membership may be paused after repeated failed attempts.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">Questions? Reply to this email or contact us at <a href="mailto:support@astrologypro.com" style="color:#8b5cf6;">support@astrologypro.com</a>.</p>
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: "Payment Unsuccessful",
      preheader: `Your community membership payment of ${currency} ${amount} could not be processed.`,
      content,
      ctaText: "Update Payment Method",
      ctaUrl: billingPortalUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });

  await logEmail({ emailTo: to, templateName: "community_payment_failed", subject });
  return result;
}

// ---------------------------------------------------------------------------
// Community: Subscription Renewal Reminder (7 days before)
// ---------------------------------------------------------------------------

interface CommunityRenewalReminderParams {
  to: string;
  name: string;
  renewalDate: string;
  amount: string;
  planName: string;
  billingPortalUrl: string;
}

export async function sendCommunityRenewalReminder({
  to,
  name,
  renewalDate,
  amount,
  planName,
  billingPortalUrl,
}: CommunityRenewalReminderParams) {
  if (await isSequencePaused("community_renewal_reminder")) {
    console.log("[email] community_renewal_reminder sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const subject = `Your community membership renews on ${renewalDate}`;
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your community membership is renewing soon. Here is a quick summary:</p>

    ${detailRow("Plan", planName)}
    ${detailRow("Renewal Date", renewalDate)}
    ${detailRow("Amount", amount)}

    ${infoCard(`No action is needed if you would like to continue your membership. Your saved payment method will be charged automatically on the renewal date.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">Need to make changes or cancel? Visit your billing portal before the renewal date.</p>
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: "Membership Renewal Reminder",
      preheader: `Your ${planName} membership renews on ${renewalDate}`,
      content,
      ctaText: "Manage Billing",
      ctaUrl: billingPortalUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });

  await logEmail({ emailTo: to, templateName: "community_renewal_reminder", subject });
  return result;
}

// ---------------------------------------------------------------------------
// Community: Membership Expiry Warning (3 days before expiry)
// ---------------------------------------------------------------------------

interface MembershipExpiryWarningParams {
  to: string;
  name: string;
  expiryDate: string;
  renewUrl: string;
}

export async function sendMembershipExpiryWarning({
  to,
  name,
  expiryDate,
  renewUrl,
}: MembershipExpiryWarningParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your community membership is expiring on <strong style="color:#f4f4f5;">${expiryDate}</strong>. After this date, your access to community content, decans, and other member benefits will be paused.</p>

    ${infoCard(`Renew now to keep your progress and maintain uninterrupted access to the community.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">If you have already renewed, you can safely ignore this message.</p>
  `;

  return sendEmail({
    to,
    subject: `Your membership expires on ${expiryDate} — renew now`,
    html: buildEmailHtml({
      title: "Membership Expiring Soon",
      preheader: `Your community membership expires on ${expiryDate}`,
      content,
      ctaText: "Renew Membership",
      ctaUrl: renewUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Community: Subscription Cancelled Confirmation
// ---------------------------------------------------------------------------

interface CommunitySubscriptionCancelledParams {
  to: string;
  name: string;
  accessUntil: string;
  rejoinUrl: string;
}

export async function sendCommunitySubscriptionCancelled({
  to,
  name,
  accessUntil,
  rejoinUrl,
}: CommunitySubscriptionCancelledParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your community membership has been cancelled. You will continue to have access to all member benefits until <strong style="color:#f4f4f5;">${accessUntil}</strong>, after which your account will revert to a free plan.</p>

    ${infoCard(`No further charges will be made. Your progress and history are saved — you can rejoin at any time.`)}

    <p style="margin:16px 0 0;color:#a1a1aa;">We are sorry to see you go. If you change your mind, you are always welcome back.</p>
  `;

  return sendEmail({
    to,
    subject: `Your community membership has been cancelled`,
    html: buildEmailHtml({
      title: "Membership Cancelled",
      preheader: `Your community membership is cancelled. Access continues until ${accessUntil}.`,
      content,
      ctaText: "Rejoin the Community",
      ctaUrl: rejoinUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Training: Quiz Passed
// ---------------------------------------------------------------------------

export async function sendQuizPassed(opts: {
  to: string;
  name: string;
  lessonTitle: string;
  score: number;
  total: number;
  pct: number;
}) {
  const { to, name, lessonTitle, score, total, pct } = opts;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Well done, <strong style="color:#f4f4f5;">${name}</strong>! You passed the quiz for <strong style="color:#f4f4f5;">${lessonTitle}</strong>.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#1e1b2e;border:1px solid #2e2548;border-radius:12px;">
      <tr>
        <td align="center" style="padding:28px 20px;">
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Your Score</p>
          <p style="margin:8px 0 4px;font-family:system-ui,-apple-system,sans-serif;font-size:40px;font-weight:700;color:#8b5cf6;">${pct}%</p>
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#a1a1aa;">${score} out of ${total} correct</p>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;color:#a1a1aa;">Keep up the great work. Every lesson brings you closer to mastery.</p>
  `;

  return sendEmail({
    to,
    subject: `Quiz passed: ${lessonTitle}`,
    html: buildEmailHtml({
      title: "Quiz Passed &#127775;",
      preheader: `You scored ${pct}% on the ${lessonTitle} quiz. Great work!`,
      content,
      ctaText: "Continue Training",
      ctaUrl: `${APP_URL}/trainee/training`,
      footer: `AstrologyPro &mdash; Training Center`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Training: Lesson Complete
// ---------------------------------------------------------------------------

export async function sendLessonComplete(opts: {
  to: string;
  name: string;
  lessonTitle: string;
  categoryName: string;
  nextLessonTitle?: string;
}) {
  const { to, name, lessonTitle, categoryName, nextLessonTitle } = opts;

  const nextLessonBlock = nextLessonTitle
    ? `${sectionHeading("Up Next")}
       ${infoCard(`<strong style="color:#e4e4e7;">Next lesson:</strong> ${nextLessonTitle}`)}`
    : `${infoCard(`You have completed all lessons in <strong style="color:#e4e4e7;">${categoryName}</strong>. Excellent work!`)}`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Great work, <strong style="color:#f4f4f5;">${name}</strong>! You have completed the lesson <strong style="color:#f4f4f5;">${lessonTitle}</strong> in <strong style="color:#f4f4f5;">${categoryName}</strong>.</p>

    ${detailRow("Lesson", lessonTitle)}
    ${detailRow("Category", categoryName)}

    ${nextLessonBlock}
  `;

  return sendEmail({
    to,
    subject: `Lesson complete: ${lessonTitle}`,
    html: buildEmailHtml({
      title: "Lesson Complete &#10003;",
      preheader: `You completed ${lessonTitle} in ${categoryName}. Keep going!`,
      content,
      ctaText: "Continue Training",
      ctaUrl: `${APP_URL}/trainee/training`,
      footer: `AstrologyPro &mdash; Training Center`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Training: Category Complete
// ---------------------------------------------------------------------------

export async function sendCategoryComplete(opts: {
  to: string;
  name: string;
  categoryName: string;
  programName: string;
  lessonsCompleted: number;
  nextCategoryName?: string;
}) {
  const { to, name, categoryName, programName, lessonsCompleted, nextCategoryName } = opts;

  const nextCategoryBlock = nextCategoryName
    ? `${sectionHeading("What's Next")}
       ${infoCard(`Your next section is <strong style="color:#e4e4e7;">${nextCategoryName}</strong>. Ready to keep going?`)}`
    : `${infoCard(`You have completed all sections so far in <strong style="color:#e4e4e7;">${programName}</strong>. Stay tuned for more.`)}`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Congratulations, <strong style="color:#f4f4f5;">${name}</strong>! You have finished all lessons in <strong style="color:#f4f4f5;">${categoryName}</strong>.</p>

    ${detailRow("Section Completed", categoryName)}
    ${detailRow("Program", programName)}
    ${detailRow("Lessons Completed", String(lessonsCompleted))}

    ${nextCategoryBlock}
  `;

  return sendEmail({
    to,
    subject: `Section complete: ${categoryName}`,
    html: buildEmailHtml({
      title: "Section Complete &#127775;",
      preheader: `You finished all lessons in ${categoryName} — ${programName}`,
      content,
      ctaText: "Continue Training",
      ctaUrl: `${APP_URL}/trainee/training`,
      footer: `AstrologyPro &mdash; Training Center`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Training: Program Complete + Certificate Ready
// ---------------------------------------------------------------------------

export async function sendProgramComplete(opts: {
  to: string;
  name: string;
  programName: string;
  certificateUrl: string;
}) {
  const { to, name, programName, certificateUrl } = opts;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Outstanding achievement, <strong style="color:#f4f4f5;">${name}</strong>! You have completed the full <strong style="color:#f4f4f5;">${programName}</strong> training program and officially graduated.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#1e1b2e;border:1px solid #2e2548;border-radius:12px;">
      <tr>
        <td align="center" style="padding:32px 20px;">
          <p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Program Completed</p>
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:22px;font-weight:700;color:#f4f4f5;">${programName}</p>
          <p style="margin:12px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#8b5cf6;font-weight:600;">Graduate &#127775;</p>
        </td>
      </tr>
    </table>

    ${infoCard("Your certificate of completion is ready. Download and share it to showcase your achievement.")}

    <p style="margin:16px 0 0;color:#a1a1aa;">This marks a major milestone in your journey. Your dedication and commitment have paid off. Thank you for your hard work.</p>
  `;

  return sendEmail({
    to,
    subject: `You graduated from ${programName}! Your certificate is ready`,
    html: buildEmailHtml({
      title: `Congratulations, ${name} &#127775;`,
      preheader: `You completed ${programName} and your certificate is ready to download`,
      content,
      ctaText: "Download Your Certificate",
      ctaUrl: certificateUrl,
      footer: `AstrologyPro &mdash; Training Center`,
    }),
  });
}

// ── Reschedule Confirmation ────────────────────────────────────────────────
export async function sendRescheduleConfirmation({
  to,
  name,
  divinerName,
  serviceName,
  newDate,
  manageUrl,
}: {
  to: string;
  name: string;
  divinerName: string;
  serviceName: string;
  newDate: string;
  manageUrl: string;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>
    <p style="margin:0 0 16px;color:#a1a1aa;">Your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> has been successfully rescheduled.</p>
    ${infoCard(`<strong style="color:#e4e4e7;">New Date &amp; Time</strong><br>${newDate}`)}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">If you did not request this reschedule, please contact us immediately.</p>
  `;

  return sendEmail({
    to,
    subject: `Rescheduled: Your ${serviceName} session`,
    html: buildEmailHtml({
      title: "Session Rescheduled",
      preheader: `Your session with ${divinerName} has been rescheduled.`,
      content,
      ctaText: "Manage Your Booking",
      ctaUrl: manageUrl,
      footer: `AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ── Cancellation Confirmation ────────────────────────────────────────────────
export async function sendCancellationConfirmation({
  to,
  name,
  divinerName,
  serviceName,
  cancelReason,
  rebookUrl,
}: {
  to: string;
  name: string;
  divinerName: string;
  serviceName: string;
  cancelReason?: string;
  rebookUrl: string;
}) {
  const reasonBlock = cancelReason
    ? infoCard(`<strong style="color:#e4e4e7;">Reason:</strong> ${cancelReason}`)
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>
    <p style="margin:0 0 16px;color:#a1a1aa;">Your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> has been cancelled.</p>
    ${reasonBlock}
    <p style="margin:16px 0 0;color:#a1a1aa;">We hope to see you again soon. You can book another session at any time.</p>
  `;

  return sendEmail({
    to,
    subject: `Cancelled: Your ${serviceName} session`,
    html: buildEmailHtml({
      title: "Session Cancelled",
      preheader: `Your session with ${divinerName} has been cancelled.`,
      content,
      ctaText: "Book Again",
      ctaUrl: rebookUrl,
      footer: `AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ── 24-Hour / 1-Hour Session Reminder ────────────────────────────────────────
export async function sendSessionReminder({
  to,
  name,
  divinerName,
  serviceName,
  scheduledAt,
  timezone,
  joinUrl,
  manageUrl,
}: {
  to: string;
  name: string;
  divinerName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  joinUrl?: string;
  manageUrl: string;
}) {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(scheduledAt));

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>
    <p style="margin:0 0 16px;color:#a1a1aa;">This is a friendly reminder that your <strong style="color:#f4f4f5;">${serviceName}</strong> session with <strong style="color:#f4f4f5;">${divinerName}</strong> is coming up.</p>
    ${infoCard(`<strong style="color:#e4e4e7;">&#128197; ${dateStr}</strong>`)}
    ${secondaryCta("Manage Booking", manageUrl)}
    <p style="margin-top:16px;font-size:13px;color:#9ca3af;">Need to reschedule or cancel? Use the Manage Booking link above.</p>
  `;

  return sendEmail({
    to,
    subject: `Reminder: ${serviceName} tomorrow with ${divinerName}`,
    html: buildEmailHtml({
      title: "Session Reminder",
      preheader: `Your session is coming up soon.`,
      content,
      ...(joinUrl ? { ctaText: "Join Session", ctaUrl: joinUrl } : {}),
      footer: `AstrologyPro &mdash; Run Your Divination Business`,
    }),
  });
}

// ── Community — Membership Welcome ───────────────────────────────────────────

export async function sendCommunityMembershipWelcome({
  to,
  name,
  membershipType,
  planType,
}: {
  to: string;
  name: string;
  membershipType: "perennial_mandalism" | "mystery_school" | string;
  planType?: string | null;
}) {
  const portalUrl = `${APP_URL}/community`;

  const isMysterySchool = membershipType === "mystery_school";
  const displayType = isMysterySchool
    ? "Mystery School"
    : "Perennial Mandalism";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Welcome, ${name}.</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">Your <strong style="color:#f4f4f5;">${displayType}</strong> membership is now active.${planType ? ` You are enrolled on the <strong style="color:#f4f4f5;">${planType}</strong> plan.` : ""} The community portal is ready for you.</p>

    ${sectionHeading("What You Have Access To")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Monthly planetary transit reports for your family members</li>
      <li style="margin-bottom:6px;">Community broadcasts, events, and live streams</li>
      <li style="margin-bottom:6px;">Astrological training library and Sunday Service recordings</li>
      ${isMysterySchool ? `<li style="margin-bottom:6px;">Mystery School curriculum — Foundation Weeks and all 36 Decans</li>` : ""}
    </ul>

    <p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;">Enter your community portal to get started.</p>
  `;

  if (await isSequencePaused("community_welcome")) {
    console.log("[email] community_welcome sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const subject = `Welcome to ${displayType} — Your membership is active`;
  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: `Welcome to ${displayType}`,
      badge: "Active",
      preheader: `Your ${displayType} membership is confirmed and active. Your portal is ready.`,
      content,
      ctaText: "Enter the Community Portal",
      ctaUrl: portalUrl,
      footer: "AstrologyPro &mdash; Divine Infinite Being",
    }),
  });

  await logEmail({ emailTo: to, templateName: "community_welcome", subject });
  return result;
}

// ── Community — Monthly Transit Ready ────────────────────────────────────────

export async function sendMonthlyTransitReady({
  to,
  name,
  month,
  familyMemberName,
}: {
  to: string;
  name: string;
  month: string; // YYYY-MM
  familyMemberName: string;
}) {
  const [year, monthNum] = month.split("-");
  const monthLabel = new Date(
    parseInt(year, 10),
    parseInt(monthNum, 10) - 1,
    1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const transitsUrl = `${APP_URL}/community/transits`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hello, ${name}.</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">The <strong style="color:#f4f4f5;">${monthLabel}</strong> planetary transit report for <strong style="color:#f4f4f5;">${familyMemberName}</strong> is ready in your community portal.</p>

    ${sectionHeading("What's in Your Transit Report")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Planetary transits to natal chart positions for the month</li>
      <li style="margin-bottom:6px;">Key dates and astrological windows to watch</li>
      <li style="margin-bottom:6px;">Aspect interpretations based on your natal chart</li>
    </ul>

    <p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;">New reports are generated at the start of each month for all family members with natal charts on file.</p>
  `;

  if (await isSequencePaused("monthly_transit_ready")) {
    console.log("[email] monthly_transit_ready sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const subject = `Your ${monthLabel} transit report is ready — ${familyMemberName}`;
  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: `${monthLabel} Transits Ready`,
      badge: familyMemberName,
      preheader: `The ${monthLabel} planetary transit report for ${familyMemberName} is now available in your portal.`,
      content,
      ctaText: "View Transit Report",
      ctaUrl: transitsUrl,
      footer: "AstrologyPro &mdash; Perennial Mandalism",
    }),
  });

  await logEmail({ emailTo: to, templateName: "monthly_transit_ready", subject });
  return result;
}

// ── Mystery School — Enrollment Confirmation ─────────────────────────────────

export async function sendMysterySchoolEnrollmentConfirmation({
  to,
  name,
  quarter,
  entryDate,
  startDate,
}: {
  to: string;
  name: string;
  quarter: string | null;
  entryDate: string;
  startDate?: string | null;
}) {
  const portalUrl = `${APP_URL}/mystery-school`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Welcome, ${name}.</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">You have been enrolled in the <strong style="color:#f4f4f5;">Mystery School</strong>. The path of the 36 Decans is now open to you.</p>

    ${detailRow("Entry Quarter", quarter ?? "Forthcoming")}
    ${detailRow("Enrollment Date", new Date(entryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}
    ${startDate ? detailRow("Foundation Begins", new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })) : ""}

    ${sectionHeading("What Happens Next")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Your Foundation Weeks become available in sequence — one per week</li>
      <li style="margin-bottom:6px;">Decan windows open according to the astrological calendar</li>
      <li style="margin-bottom:6px;">Each decan requires a ritual, scrying journal, and mundane impact journal</li>
      <li style="margin-bottom:6px;">You will receive email reminders as windows open and approach their close</li>
    </ul>

    <p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;">Enter your student portal to begin.</p>
  `;

  if (await isSequencePaused("mystery_school_enrollment")) {
    console.log("[email] mystery_school_enrollment sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const subject = "Welcome to the Mystery School — Your journey begins";
  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: "Mystery School",
      badge: "Enrolled",
      preheader: "Your enrollment is confirmed. The path of the 36 Decans is open.",
      content,
      ctaText: "Enter the Mystery School",
      ctaUrl: portalUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });

  await logEmail({ emailTo: to, templateName: "mystery_school_enrollment", subject });
  return result;
}

// ── Mystery School — Decan Lifecycle Emails ───────────────────────────────────

function formatDecanWindow(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendDecanOpened({
  to,
  name,
  decanTitle,
  decanNumber,
  sign,
  planet,
  tarotCard,
  windowClose,
  actionUrl,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  sign: string;
  planet: string;
  tarotCard: string | null;
  windowClose: string;
  actionUrl: string;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Greetings, ${name}.</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      Your next decan window is now <strong style="color:#f4f4f5;">open</strong>.
      The stars are aligned — enter the work before the window closes.
    </p>

    ${detailRow("Decan", `${decanNumber}. ${decanTitle}`)}
    ${detailRow("Sign", sign)}
    ${detailRow("Planet", planet)}
    ${tarotCard ? detailRow("Tarot Card", tarotCard) : ""}
    ${detailRow("Window Closes", formatDecanWindow(windowClose))}

    ${sectionHeading("Your Work This Decan")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Complete the guided ritual</li>
      <li style="margin-bottom:6px;">Submit your scrying journal${tarotCard ? ` (assigned card: ${tarotCard})` : ""}</li>
      <li style="margin-bottom:6px;">Submit your mundane impact journal</li>
    </ul>
  `;

  return sendEmail({
    to,
    subject: `Decan ${decanNumber} is open — ${decanTitle}`,
    html: buildEmailHtml({
      title: decanTitle,
      badge: `Decan ${decanNumber}`,
      preheader: `Your ${sign} decan window is now open. Complete your work by ${formatDecanWindow(windowClose)}.`,
      content,
      ctaText: "Begin This Decan",
      ctaUrl: actionUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

export async function sendDecanUrgency3Days({
  to,
  name,
  decanTitle,
  decanNumber,
  windowClose,
  incompleteItems,
  actionUrl,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  windowClose: string;
  incompleteItems: string[];
  actionUrl: string;
}) {
  const itemList = incompleteItems
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("");

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      The action window for <strong style="color:#f4f4f5;">Decan ${decanNumber}: ${decanTitle}</strong> closes in
      <strong style="color:#f59e0b;">3 days</strong>.
      Complete the remaining work before the window closes — a 2-day grace period follows, but the primary window is ending soon.
    </p>

    ${detailRow("Window Closes", formatDecanWindow(windowClose))}

    ${sectionHeading("Remaining Items")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      ${itemList}
    </ul>
  `;

  return sendEmail({
    to,
    subject: `3 days left — Decan ${decanNumber}: ${decanTitle}`,
    html: buildEmailHtml({
      title: "Window Closing Soon",
      badge: `Decan ${decanNumber}`,
      preheader: `3 days remain to complete Decan ${decanNumber}: ${decanTitle}.`,
      content,
      ctaText: "Continue My Work",
      ctaUrl: actionUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

export async function sendGracePeriodStarted({
  to,
  name,
  decanTitle,
  decanNumber,
  graceClose,
  incompleteItems,
  actionUrl,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  graceClose: string;
  incompleteItems: string[];
  actionUrl: string;
}) {
  const itemList = incompleteItems
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("");

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      The primary action window for <strong style="color:#f4f4f5;">Decan ${decanNumber}: ${decanTitle}</strong> has closed.
      You are now in a <strong style="color:#f59e0b;">2-day grace period</strong>. Complete all remaining items before the grace window ends.
    </p>

    ${detailRow("Grace Period Ends", formatDecanWindow(graceClose))}

    ${sectionHeading("Remaining Items")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      ${itemList}
    </ul>

    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">After the grace period ends this decan will be marked missed and cannot be completed until the next cycle.</p>
  `;

  return sendEmail({
    to,
    subject: `Grace period started — Decan ${decanNumber}: ${decanTitle}`,
    html: buildEmailHtml({
      title: "Grace Period Active",
      badge: `Decan ${decanNumber}`,
      preheader: `Grace period for Decan ${decanNumber} started. Ends ${formatDecanWindow(graceClose)}.`,
      content,
      ctaText: "Complete My Work Now",
      ctaUrl: actionUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

export async function sendGrace24HourWarning({
  to,
  name,
  decanTitle,
  decanNumber,
  graceClose,
  incompleteItems,
  actionUrl,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  graceClose: string;
  incompleteItems: string[];
  actionUrl: string;
}) {
  const itemList = incompleteItems
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("");

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      The grace period for <strong style="color:#f4f4f5;">Decan ${decanNumber}: ${decanTitle}</strong> ends in
      <strong style="color:#ef4444;">less than 24 hours</strong>. After this point the decan will be marked missed.
    </p>

    ${detailRow("Grace Ends", formatDecanWindow(graceClose))}

    ${sectionHeading("Still Needed")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      ${itemList}
    </ul>
  `;

  return sendEmail({
    to,
    subject: `Last 24 hours — Decan ${decanNumber} grace period ending`,
    html: buildEmailHtml({
      title: "Final Warning",
      badge: `Decan ${decanNumber}`,
      preheader: `Grace period for Decan ${decanNumber} ends in under 24 hours.`,
      content,
      ctaText: "Complete Now",
      ctaUrl: actionUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

export async function sendDecanMissed({
  to,
  name,
  decanTitle,
  decanNumber,
  retryWindowOpen,
  retryYear,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  retryWindowOpen: string | null;
  retryYear: number | null;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      The grace period for <strong style="color:#f4f4f5;">Decan ${decanNumber}: ${decanTitle}</strong> has passed without completion.
      This decan has been marked <strong style="color:#ef4444;">missed</strong>.
    </p>

    ${retryWindowOpen ? detailRow("Retry Window Opens", formatDecanWindow(retryWindowOpen)) : ""}
    ${retryYear ? detailRow("Retry Year", String(retryYear)) : ""}

    ${sectionHeading("What This Means")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Your progress toward completion is paused for this decan</li>
      <li style="margin-bottom:6px;">You can retry when the decan window reopens next cycle</li>
      <li style="margin-bottom:6px;">Contact your administrator if you believe an excusal applies</li>
    </ul>

    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">Your journey continues — missed decans can be retried in the next cycle.</p>
  `;

  return sendEmail({
    to,
    subject: `Decan ${decanNumber} missed — ${decanTitle}`,
    html: buildEmailHtml({
      title: "Decan Missed",
      badge: `Decan ${decanNumber}`,
      preheader: `Decan ${decanNumber}: ${decanTitle} has been marked missed. Retry window opens next cycle.`,
      content,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

export async function sendDecanReopened({
  to,
  name,
  decanTitle,
  decanNumber,
  retryWindowOpen,
  retryWindowClose,
  actionUrl,
}: {
  to: string;
  name: string;
  decanTitle: string;
  decanNumber: number;
  retryWindowOpen: string;
  retryWindowClose: string;
  actionUrl: string;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      <strong style="color:#f4f4f5;">Decan ${decanNumber}: ${decanTitle}</strong> that you missed in a previous cycle has reopened.
      This is your opportunity to complete it.
    </p>

    ${detailRow("Retry Window Opens", formatDecanWindow(retryWindowOpen))}
    ${detailRow("Retry Window Closes", formatDecanWindow(retryWindowClose))}

    <p style="margin:16px 0 0;color:#a1a1aa;">The same three tasks apply — ritual, scrying journal, and mundane impact journal.</p>
  `;

  return sendEmail({
    to,
    subject: `Retry window open — Decan ${decanNumber}: ${decanTitle}`,
    html: buildEmailHtml({
      title: "Decan Reopened",
      badge: `Decan ${decanNumber} · Retry`,
      preheader: `A second chance: Decan ${decanNumber} is open again. Window closes ${formatDecanWindow(retryWindowClose)}.`,
      content,
      ctaText: "Begin Retry",
      ctaUrl: actionUrl,
      footer: "AstrologyPro &mdash; Mystery School",
    }),
  });
}

// ── Family Member Login Invite ────────────────────────────────────────────────
export async function sendFamilyMemberInvite({
  to,
  inviterName,
  familyMemberName,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  familyMemberName: string;
  inviteUrl: string;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${familyMemberName},</p>
    <p style="margin:0 0 16px;color:#a1a1aa;"><strong style="color:#f4f4f5;">${inviterName}</strong> has added you to their AstrologyPro family and invited you to log in and view your personal natal chart.</p>
    ${infoCard(`<strong style="color:#e4e4e7;">&#11088; Your natal chart is ready to explore</strong><br/><span style="color:#a1a1aa;font-size:13px;">Planet positions, rising sign, midheaven, and more — all calculated for your birth details.</span>`)}
    <p style="margin:0 0 16px;color:#a1a1aa;">Click the button below to activate your account and view your chart. This invite link is unique to you.</p>
    <p style="margin-top:16px;font-size:13px;color:#9ca3af;">This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.</p>
  `;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to view your natal chart on AstrologyPro`,
    html: buildEmailHtml({
      title: "You've been invited to AstrologyPro",
      preheader: `${inviterName} has shared your natal chart with you.`,
      content,
      ctaText: "View My Natal Chart",
      ctaUrl: inviteUrl,
      footer: `AstrologyPro &mdash; Explore Your Cosmic Blueprint`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Mystery School: Graduation Congratulations (with Ritual Builder CTA)
// ---------------------------------------------------------------------------

interface GraduationCongratulationsParams {
  to: string;
  name: string;
  graduationDate: string;
  graduationUrl: string;
}

export async function sendGraduationCongratulations({
  to,
  name,
  graduationDate,
  graduationUrl,
}: GraduationCongratulationsParams) {
  const ritualBuilderUrl = `${APP_URL}/mystery-school/training/ritual-builder`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">
      Congratulations, <strong style="color:#f4f4f5;">${name}</strong>!
    </p>

    <p style="margin:0 0 16px;color:#a1a1aa;">
      You have completed all 36 decan rituals and your full Q1 foundation work.
      You are now a <strong style="color:#e4e4e7;">Priest / Priestess of the Mystery School</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#1e1b2e;border:1px solid #3b2f6e;border-radius:12px;">
      <tr>
        <td align="center" style="padding:24px 20px;">
          <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#a78bfa;text-transform:uppercase;letter-spacing:1px;">Graduated</p>
          <p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:18px;font-weight:700;color:#e9d5ff;">${graduationDate}</p>
          <p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#71717a;">36 Decans Complete &bull; All Foundation Work Complete</p>
        </td>
      </tr>
    </table>

    ${sectionHeading("Post-Graduation: Ritual Builder")}
    <p style="margin:0 0 16px;color:#a1a1aa;">
      As a graduate, you now have access to the personal ritual builder &mdash;
      design your own rituals using the full component library: planetary invocations,
      decan workings, seasonal rites, and custom steps.
    </p>

    ${secondaryCta("Open Ritual Builder", ritualBuilderUrl)}
  `;

  return sendEmail({
    to,
    subject: `You have graduated from the Mystery School`,
    html: buildEmailHtml({
      title: `Congratulations, ${name} &mdash; Mystery School Graduate`,
      preheader: "You completed all 36 decans and your full foundation. You have graduated.",
      content,
      ctaText: "View Your Graduation",
      ctaUrl: graduationUrl,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });
}


// ---------------------------------------------------------------------------
// Mystery School: Post-Graduation Consultation Reminder
// Sequence: day 0, day 3, day 7, then weekly until consultation is booked.
// Stop condition: mystery_school_students.post_grad_consultation_booked_at IS NOT NULL
// ---------------------------------------------------------------------------

interface PostGradConsultationReminderParams {
  to: string;
  name: string;
  graduationDate: string;
  dayOffset: number; // 0 | 3 | 7 | 14 | 21 | ...
  bookingUrl: string;
}

export async function sendPostGraduationConsultationReminder({
  to,
  name,
  graduationDate,
  dayOffset,
  bookingUrl,
}: PostGradConsultationReminderParams) {
  if (await isSequencePaused("post_grad_consultation")) {
    console.log("[email] post_grad_consultation sequence is paused — skipping send to", to);
    return { success: false, id: "" };
  }

  const isFirst = dayOffset === 0;
  const isUrgent = dayOffset >= 14;

  const subjectByDay: Record<number, string> = {
    0: `Congratulations, ${name} — book your post-graduation consultation`,
    3: `Your post-graduation consultation is still available, ${name}`,
    7: `One week since graduation — have you booked your consultation?`,
  };

  const subject =
    subjectByDay[dayOffset] ??
    `Reminder — post-graduation consultation available, ${name}`;

  const openingLine = isFirst
    ? `<p style="margin:0 0 16px;color:#d4d4d8;">You graduated from the Mystery School on <strong style="color:#e4e4e7;">${graduationDate}</strong>. Well done.</p>`
    : isUrgent
    ? `<p style="margin:0 0 16px;color:#d4d4d8;">It has been ${dayOffset} days since you graduated. Your post-graduation consultation is still waiting.</p>`
    : `<p style="margin:0 0 16px;color:#d4d4d8;">Your post-graduation consultation with Beto is part of your Mystery School journey — and it is still available.</p>`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    ${openingLine}

    ${infoCard(`<strong style="color:#e4e4e7;">Post-Graduation Consultation</strong><br/><span style="color:#a1a1aa;font-size:14px;">As a Priest or Priestess of the Mystery School, you are entitled to a private consultation to review your journey through the 36 Decans and discuss your path forward.</span>`)}

    <p style="margin:0 0 16px;color:#a1a1aa;">This session is designed to help you integrate what you have learned and set clear intentions for what comes next — including access to the personal ritual builder.</p>

    ${sectionHeading("How to Book")}
    <p style="margin:0 0 16px;color:#a1a1aa;">Click the button below to schedule your consultation. Once booked, this reminder sequence will stop automatically.</p>
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: "Post-Graduation Consultation",
      badge: "Graduate",
      preheader: `Book your post-graduation consultation, ${name}.`,
      content,
      ctaText: "Book My Consultation",
      ctaUrl: bookingUrl,
      footer: "AstrologyPro &mdash; Mystery School &mdash; <a href=\"" + APP_URL + "/community/settings\" style=\"color:#71717a;text-decoration:underline;\">Manage email preferences</a>",
    }),
  });

  await logEmail({ emailTo: to, templateName: "post_grad_consultation_reminder", subject, metadata: { dayOffset } });
  return result;
}

// ---------------------------------------------------------------------------
// Sunday Service — New Episode Notification
// Sent to all active community members when an episode is published live.
// ---------------------------------------------------------------------------

interface SundayServiceNewEpisodeParams {
  to: string;
  episodeTitle: string;
  episodeDescription: string | null;
  watchUrl: string;
}

export async function sendSundayServiceNewEpisode({
  to,
  episodeTitle,
  episodeDescription,
  watchUrl,
}: SundayServiceNewEpisodeParams) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">A new Sunday Service episode is now live and ready to watch.</p>

    ${infoCard(`<strong style="color:#e4e4e7;">${episodeTitle}</strong>${episodeDescription ? `<br/><span style="color:#a1a1aa;font-size:14px;">${episodeDescription}</span>` : ""}`)}

    <p style="margin:0;color:#a1a1aa;">Join the community every Sunday for guided teachings, ritual, and divine connection.</p>
  `;

  return sendEmail({
    to,
    subject: `New Sunday Service: ${episodeTitle}`,
    html: buildEmailHtml({
      title: "New Sunday Service Episode",
      preheader: `${episodeTitle} is now available to watch`,
      content,
      ctaText: "Watch Now",
      ctaUrl: watchUrl,
      footer: `You are receiving this because you are an active community member on AstrologyPro. <a href="${APP_URL}/community/settings" style="color:#71717a;text-decoration:underline;">Manage preferences</a><br/>AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Return Event Reminders — Saturn Return, Jupiter Return, Solar Return
// Triggered by the /api/cron/return-event-reminders daily cron.
// Each function builds subject + body based on how many days until the event.
// ---------------------------------------------------------------------------

function buildReturnReminderSubject(eventName: string, daysUntil: number): string {
  if (daysUntil >= 28) return `Your ${eventName} is in 30 days — prepare now`;
  if (daysUntil >= 5) return `7 days until your ${eventName} — don't miss this window`;
  if (daysUntil >= 1) return `Tomorrow is your ${eventName} — it's time`;
  return `Today is your ${eventName} — a powerful moment is here`;
}

// ---------------------------------------------------------------------------
// Saturn Return Reminder
// ---------------------------------------------------------------------------

interface SaturnReturnReminderParams {
  to: string;
  name: string;
  eventDate: string;       // pre-formatted display date, e.g. "April 18, 2026"
  daysUntil: number;
  occurrenceNumber: number;
  landingPageUrl: string;  // e.g. /readings/saturn-return
}

export async function sendSaturnReturnReminder({
  to,
  name,
  eventDate,
  daysUntil,
  occurrenceNumber,
  landingPageUrl,
}: SaturnReturnReminderParams) {
  if (await isSequencePaused("return_reminders")) {
    console.log("[email] return_reminders sequence is paused — skipping Saturn Return send to", to);
    return { success: false, id: "" };
  }

  const ordinal = occurrenceNumber === 1 ? "1st" : occurrenceNumber === 2 ? "2nd" : `${occurrenceNumber}th`;
  const subject = buildReturnReminderSubject("Saturn Return", daysUntil);

  const urgencyLine =
    daysUntil <= 0
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Today is your ${ordinal} Saturn Return — one of the most significant astrological thresholds of your life.</p>`
      : daysUntil === 1
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Tomorrow your ${ordinal} Saturn Return arrives. This is a threshold you have been building toward for ~29.5 years.</p>`
      : `<p style="margin:0 0 16px;color:#d4d4d8;">Your ${ordinal} Saturn Return arrives on <strong style="color:#e4e4e7;">${eventDate}</strong> — in <strong style="color:#e4e4e7;">${daysUntil} days</strong>.</p>`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    ${urgencyLine}

    ${infoCard(`<strong style="color:#e4e4e7;">What is a Saturn Return?</strong><br/><span style="color:#a1a1aa;">Saturn takes ~29.5 years to complete its orbit and return to the exact position it held at your birth. This is a moment of reckoning, maturation, and profound restructuring — one of the most significant transits in a lifetime. The themes of responsibility, identity, and purpose come sharply into focus.</span>`)}

    <p style="margin:0 0 16px;color:#a1a1aa;">Many people feel its effects in the months leading up to and following the exact date. Working with a skilled diviner during this window can help you navigate the transition consciously and with clarity.</p>

    ${secondaryCta("Book a Reading for Your Saturn Return", `${APP_URL}${landingPageUrl}`)}
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: `Your ${ordinal} Saturn Return`,
      preheader: `Saturn Return arrives on ${eventDate} — a pivotal threshold is approaching.`,
      content,
      ctaText: "Book a Saturn Return Reading",
      ctaUrl: `${APP_URL}${landingPageUrl}`,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });

  await logEmail({
    emailTo: to,
    templateName: "saturn_return_reminder",
    subject,
    metadata: { daysUntil, occurrenceNumber, eventDate },
  });

  return result;
}

// ---------------------------------------------------------------------------
// Jupiter Return Reminder
// ---------------------------------------------------------------------------

interface JupiterReturnReminderParams {
  to: string;
  name: string;
  eventDate: string;
  daysUntil: number;
  occurrenceNumber: number;
  landingPageUrl: string;
}

export async function sendJupiterReturnReminder({
  to,
  name,
  eventDate,
  daysUntil,
  occurrenceNumber,
  landingPageUrl,
}: JupiterReturnReminderParams) {
  if (await isSequencePaused("return_reminders")) {
    console.log("[email] return_reminders sequence is paused — skipping Jupiter Return send to", to);
    return { success: false, id: "" };
  }

  const ordinal = occurrenceNumber === 1 ? "1st" : occurrenceNumber === 2 ? "2nd" : occurrenceNumber === 3 ? "3rd" : `${occurrenceNumber}th`;
  const subject = buildReturnReminderSubject("Jupiter Return", daysUntil);

  const urgencyLine =
    daysUntil <= 0
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Today is your ${ordinal} Jupiter Return — a rare window of expansion and aligned opportunity opens now.</p>`
      : daysUntil === 1
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Tomorrow your ${ordinal} Jupiter Return arrives. This cycle of abundance and growth begins on <strong style="color:#e4e4e7;">${eventDate}</strong>.</p>`
      : `<p style="margin:0 0 16px;color:#d4d4d8;">Your ${ordinal} Jupiter Return arrives on <strong style="color:#e4e4e7;">${eventDate}</strong> — in <strong style="color:#e4e4e7;">${daysUntil} days</strong>.</p>`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    ${urgencyLine}

    ${infoCard(`<strong style="color:#e4e4e7;">What is a Jupiter Return?</strong><br/><span style="color:#a1a1aa;">Jupiter orbits the sun every ~12 years, returning to its exact birth position and initiating a new cycle of expansion, opportunity, and abundance. Each return brings a fresh chapter of growth — in finances, relationships, spirituality, or career depending on your chart. This is one of the most auspicious transits in the astrological calendar.</span>`)}

    <p style="margin:0 0 16px;color:#a1a1aa;">Knowing what Jupiter activates in your natal chart can help you lean into the right areas of life during this window. A Jupiter Return reading gives you a personalised roadmap for the 12-year cycle ahead.</p>

    ${secondaryCta("Book a Reading for Your Jupiter Return", `${APP_URL}${landingPageUrl}`)}
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: `Your ${ordinal} Jupiter Return`,
      preheader: `Jupiter Return arrives on ${eventDate} — a new cycle of expansion is beginning.`,
      content,
      ctaText: "Book a Jupiter Return Reading",
      ctaUrl: `${APP_URL}${landingPageUrl}`,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });

  await logEmail({
    emailTo: to,
    templateName: "jupiter_return_reminder",
    subject,
    metadata: { daysUntil, occurrenceNumber, eventDate },
  });

  return result;
}

// ---------------------------------------------------------------------------
// Solar Return Reminder
// ---------------------------------------------------------------------------

interface SolarReturnReminderParams {
  to: string;
  name: string;
  eventDate: string;
  daysUntil: number;
  landingPageUrl: string;
}

export async function sendSolarReturnReminder({
  to,
  name,
  eventDate,
  daysUntil,
  landingPageUrl,
}: SolarReturnReminderParams) {
  if (await isSequencePaused("return_reminders")) {
    console.log("[email] return_reminders sequence is paused — skipping Solar Return send to", to);
    return { success: false, id: "" };
  }

  const subject = buildReturnReminderSubject("Solar Return", daysUntil);

  const urgencyLine =
    daysUntil <= 0
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Today is your Solar Return — your personal new year begins now.</p>`
      : daysUntil === 1
      ? `<p style="margin:0 0 16px;color:#d4d4d8;">Tomorrow is your Solar Return — your personal new year arrives on <strong style="color:#e4e4e7;">${eventDate}</strong>.</p>`
      : `<p style="margin:0 0 16px;color:#d4d4d8;">Your Solar Return arrives on <strong style="color:#e4e4e7;">${eventDate}</strong> — in <strong style="color:#e4e4e7;">${daysUntil} days</strong>.</p>`;

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${name},</p>

    ${urgencyLine}

    ${infoCard(`<strong style="color:#e4e4e7;">What is a Solar Return?</strong><br/><span style="color:#a1a1aa;">Each year, the Sun returns to the exact degree it occupied at the moment of your birth. This Solar Return is your personal new year — a powerful reset point that sets the energetic tone for the 12 months ahead. The Solar Return chart reveals the themes, opportunities, and challenges that will define your coming year.</span>`)}

    <p style="margin:0 0 16px;color:#a1a1aa;">A Solar Return reading is one of the most practical astrological tools available — it gives you a precise, personalised preview of the year ahead so you can prepare, prioritise, and move with intention.</p>

    ${secondaryCta("Book a Reading for Your Solar Return", `${APP_URL}${landingPageUrl}`)}
  `;

  const result = await sendEmail({
    to,
    subject,
    html: buildEmailHtml({
      title: `Your Solar Return`,
      preheader: `Your Solar Return is on ${eventDate} — your personal new year is almost here.`,
      content,
      ctaText: "Book a Solar Return Reading",
      ctaUrl: `${APP_URL}${landingPageUrl}`,
      footer: `AstrologyPro &mdash; Divine Infinite Being`,
    }),
  });

  await logEmail({
    emailTo: to,
    templateName: "solar_return_reminder",
    subject,
    metadata: { daysUntil, eventDate },
  });

  return result;
}

// ---------------------------------------------------------------------------
// Payment Link (for manual bookings with a paid service)
// ---------------------------------------------------------------------------

export async function sendPaymentLinkEmail({
  clientEmail,
  clientName,
  divinerName,
  serviceName,
  dateTime,
  amount,
  paymentUrl,
}: {
  clientEmail: string;
  clientName: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  amount: number;
  paymentUrl: string;
}) {
  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">
      <strong style="color:#f4f4f5;">${divinerName}</strong> has scheduled a
      <strong style="color:#f4f4f5;">${serviceName}</strong> session for you
      on <strong style="color:#f4f4f5;">${dateTime}</strong>.
    </p>
    <p style="margin:0 0 20px;color:#d4d4d8;">
      To confirm your spot, please complete your payment of
      <strong style="color:#f4f4f5;">$${amount.toFixed(2)}</strong> using the button below.
      Your booking will be confirmed automatically once payment is received.
    </p>
    ${infoCard(`<strong style="color:#e4e4e7;">Booking Summary</strong><br/>
      Service: ${serviceName}<br/>
      Diviner: ${divinerName}<br/>
      Date &amp; Time: ${dateTime}<br/>
      Amount: $${amount.toFixed(2)}`)}
    <p style="margin:16px 0 0;color:#71717a;font-size:12px;">
      This payment link expires in 48 hours. If you have questions, reply to this email.
    </p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Payment required — ${serviceName} with ${divinerName}`,
    html: buildEmailHtml({
      title: "Complete Your Payment",
      preheader: `${serviceName} with ${divinerName} on ${dateTime} — $${amount.toFixed(2)} due`,
      content,
      ctaText: "Pay Now →",
      ctaUrl: paymentUrl,
      footer: "AstrologyPro &mdash; Secure payment powered by Stripe",
    }),
  });
}

// ---------------------------------------------------------------------------
// Booking Invoice — sent to client after successful payment
// ---------------------------------------------------------------------------

interface BookingInvoiceParams {
  clientEmail: string;
  clientName: string;
  divinerName: string;
  serviceName: string;
  dateTime: string;
  duration: number;
  amount: number;
  discount?: number;
  giftDeduction?: number;
  totalPaid: number;
  bookingId: string;
  portalUrl: string;
}

export async function sendBookingInvoice({
  clientEmail,
  clientName,
  divinerName,
  serviceName,
  dateTime,
  duration,
  amount,
  discount,
  giftDeduction,
  totalPaid,
  bookingId,
  portalUrl,
}: BookingInvoiceParams) {
  const discountRow = discount && discount > 0
    ? detailRow("Loyalty Discount", `-$${discount.toFixed(2)}`)
    : "";
  const giftRow = giftDeduction && giftDeduction > 0
    ? detailRow("Gift Certificate", `-$${giftDeduction.toFixed(2)}`)
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Hi ${clientName}, thank you for your purchase! Here is your invoice.</p>

    ${sectionHeading("Invoice Details")}
    ${detailRow("Invoice #", bookingId.slice(0, 8).toUpperCase())}
    ${detailRow("Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}

    ${sectionHeading("Session")}
    ${detailRow("Service", serviceName)}
    ${detailRow("Diviner", divinerName)}
    ${detailRow("Scheduled", dateTime)}
    ${detailRow("Duration", `${duration} minutes`)}

    ${sectionHeading("Payment Summary")}
    ${detailRow("Session Price", `$${amount.toFixed(2)}`)}
    ${discountRow}
    ${giftRow}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 0;">
      <tr>
        <td style="padding:12px 16px;border-top:2px solid #3f3f46;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;">Total Paid</td>
        <td style="padding:12px 16px;border-top:2px solid #3f3f46;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:700;color:#22c55e;text-align:right;">$${totalPaid.toFixed(2)}</td>
      </tr>
    </table>

    <p style="margin:16px 0 0;color:#71717a;font-size:12px;">Payment processed securely via Stripe. A charge from AstrologyPro will appear on your statement.</p>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Invoice — ${serviceName} with ${divinerName} — $${totalPaid.toFixed(2)}`,
    html: buildEmailHtml({
      title: "Your Invoice",
      preheader: `Invoice for ${serviceName} with ${divinerName} — $${totalPaid.toFixed(2)}`,
      content,
      ctaText: "View My Bookings",
      ctaUrl: portalUrl,
      footer: "AstrologyPro &mdash; Secure payment powered by Stripe",
    }),
  });
}

// ---------------------------------------------------------------------------
// New Booking Notification — sent to diviner when a client books
// ---------------------------------------------------------------------------

interface DivinerNewBookingParams {
  divinerEmail: string;
  divinerName: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  dateTime: string;
  duration: number;
  amount: number;
  bookingId: string;
  dashboardUrl: string;
  questionnaire?: {
    focusQuestion?: string;
    lifeArea?: string;
  };
  birthData?: string;
}

export async function sendDivinerNewBookingNotification({
  divinerEmail,
  divinerName,
  clientName,
  clientEmail,
  serviceName,
  dateTime,
  duration,
  amount,
  bookingId,
  dashboardUrl,
  questionnaire,
  birthData,
}: DivinerNewBookingParams) {
  const focusSection = questionnaire?.focusQuestion
    ? `${sectionHeading("Client's Focus Question")}
       ${infoCard(questionnaire.focusQuestion)}
       ${questionnaire.lifeArea ? `<p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">Life area: <strong style="color:#e4e4e7;">${questionnaire.lifeArea}</strong></p>` : ""}`
    : "";

  const birthSection = birthData
    ? `${sectionHeading("Client Birth Data")}
       ${infoCard(birthData)}`
    : "";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Great news, ${divinerName}! You have a new booking.</p>

    ${sectionHeading("Booking Details")}
    ${detailRow("Service", serviceName)}
    ${detailRow("Client", `${clientName} (${clientEmail})`)}
    ${detailRow("Date &amp; Time", dateTime)}
    ${detailRow("Duration", `${duration} minutes`)}
    ${detailRow("Amount", `$${amount.toFixed(2)}`)}
    ${detailRow("Booking ID", bookingId.slice(0, 8).toUpperCase())}

    ${focusSection}
    ${birthSection}

    ${sectionHeading("Next Steps")}
    <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
      <li style="margin-bottom:6px;">Review the client's details and prepare for the session</li>
      <li style="margin-bottom:6px;">The session room will be available at the scheduled time</li>
      <li>You can view all details from your dashboard</li>
    </ul>
  `;

  return sendEmail({
    to: divinerEmail,
    subject: `New booking! ${clientName} booked ${serviceName} — ${dateTime}`,
    html: buildEmailHtml({
      title: "New Booking Received",
      preheader: `${clientName} booked ${serviceName} for ${dateTime}`,
      content,
      ctaText: "View in Dashboard",
      ctaUrl: dashboardUrl,
      footer: "AstrologyPro &mdash; Run Your Divination Business",
    }),
  });
}
