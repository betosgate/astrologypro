import {
  buildEmailHtml,
  detailRow,
  numberedSteps,
} from "./email-base";

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com").trim();

// ---------------------------------------------------------------------------
// Welcome email for new diviners completing onboarding
// ---------------------------------------------------------------------------

export function welcomeDivinerEmail(
  name: string,
  dashboardUrl: string
): { subject: string; html: string } {
  const subject = "Welcome to AstrologyPro — Your Business is Ready 🌟";

  const content = `
    <p style="margin:0 0 16px;color:#d4d4d8;">Welcome, ${name}! Your business is live.</p>
    <p style="margin:0 0 24px;color:#a1a1aa;">You have completed onboarding and your AstrologyPro profile is ready. Here are 5 quick steps to hit the ground running:</p>
    ${numberedSteps([
      { title: "Complete your profile", body: "Add your bio, upload a photo, and list your specialties so clients know what to expect." },
      { title: "Set your availability", body: "Open your dashboard calendar and block out the hours you want to take bookings." },
      { title: "Create your first service offering", body: "Define what readings you offer, set your prices, and publish them to your profile." },
      { title: "Connect Stripe to receive payments", body: "Link your Stripe account so earnings are paid out directly to your bank." },
      { title: "Share your profile link with clients", body: "Copy your unique booking link from the dashboard and share it on social media or with existing clients." },
    ])}
  `;

  const html = buildEmailHtml({
    title: `Welcome, ${name}! Your business is live.`,
    preheader: "Your AstrologyPro profile is ready — here's how to get started.",
    content,
    ctaText: "Go to My Dashboard",
    ctaUrl: dashboardUrl,
    footer: `AstrologyPro &mdash; Run Your Divination Business<br />Questions? Visit <a href="${APP_URL}/support" style="color:#71717a;text-decoration:underline;">${APP_URL}/support</a>`,
  });

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Reschedule request email for diviners
// ---------------------------------------------------------------------------

export function rescheduleRequestEmail(params: {
  divinerName: string;
  clientName: string;
  serviceName: string;
  preferredDate: string;
  timePreference: string;
  notes: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const {
    divinerName,
    clientName,
    serviceName,
    preferredDate,
    timePreference,
    notes,
    dashboardUrl,
  } = params;

  const subject = `Reschedule Request — ${clientName} wants a new time`;

  const content = `
    <p style="margin:0 0 16px;color:#a1a1aa;">
      Hi ${divinerName}, <strong style="color:#d4d4d8;">${clientName}</strong> has requested to reschedule their
      <strong style="color:#d4d4d8;">${serviceName}</strong> session.
    </p>
    ${detailRow("Client", clientName)}
    ${detailRow("Service", serviceName)}
    ${detailRow("Preferred Date", preferredDate)}
    ${detailRow("Time Preference", timePreference)}
    ${notes ? detailRow("Notes", notes) : ""}
    <p style="margin:24px 0 0;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Please contact ${clientName} to confirm a new time, or manage the booking from your dashboard.
    </p>
  `;

  const html = buildEmailHtml({
    title: "Reschedule Request",
    preheader: `${clientName} wants to reschedule their ${serviceName} session.`,
    content,
    ctaText: "View in Dashboard",
    ctaUrl: dashboardUrl,
  });

  return { subject, html };
}
