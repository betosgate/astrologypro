import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { buildEmailHtml, detailRow, infoCard, sectionHeading } from "@/lib/email-base";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// ─── Dummy data for each template ─────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

function buildPreviewHtml(templateName: string): string | null {
  switch (templateName) {
    case "community_welcome":
      return buildEmailHtml({
        title: "Welcome to Perennial Mandalism",
        badge: "Active",
        preheader:
          "Your Perennial Mandalism membership is confirmed and active. Your portal is ready.",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Welcome, Jane Doe.</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">Your <strong style="color:#f4f4f5;">Perennial Mandalism</strong> membership is now active. The community portal is ready for you.</p>
          ${sectionHeading("What You Have Access To")}
          <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
            <li style="margin-bottom:6px;">Monthly planetary transit reports for your family members</li>
            <li style="margin-bottom:6px;">Community broadcasts, events, and live streams</li>
            <li style="margin-bottom:6px;">Astrological training library and Sunday Service recordings</li>
          </ul>
        `,
        ctaText: "Enter the Community Portal",
        ctaUrl: `${APP_URL}/community`,
        footer: "AstrologyPro &mdash; Divine Infinite Being",
      });

    case "monthly_transit_ready":
      return buildEmailHtml({
        title: "April 2026 Transits Ready",
        badge: "Jane Doe",
        preheader:
          "The April 2026 planetary transit report for Jane Doe is now available in your portal.",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Hello, Member.</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">The <strong style="color:#f4f4f5;">April 2026</strong> planetary transit report for <strong style="color:#f4f4f5;">Jane Doe</strong> is ready in your community portal.</p>
          ${sectionHeading("What's in Your Transit Report")}
          <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
            <li style="margin-bottom:6px;">Planetary transits to natal chart positions for the month</li>
            <li style="margin-bottom:6px;">Key dates and astrological windows to watch</li>
            <li style="margin-bottom:6px;">Aspect interpretations based on your natal chart</li>
          </ul>
        `,
        ctaText: "View Transit Report",
        ctaUrl: `${APP_URL}/community/transits`,
        footer: "AstrologyPro &mdash; Perennial Mandalism",
      });

    case "community_renewal_reminder":
      return buildEmailHtml({
        title: "Membership Renewal Reminder",
        preheader: "Your Perennial Mandalism membership renews on May 1, 2026",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Hi Jane,</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">Your community membership is renewing soon. Here is a quick summary:</p>
          ${detailRow("Plan", "Perennial Mandalism — Monthly")}
          ${detailRow("Renewal Date", "May 1, 2026")}
          ${detailRow("Amount", "$29.00")}
          ${infoCard("No action is needed if you would like to continue your membership. Your saved payment method will be charged automatically on the renewal date.")}
          <p style="margin:16px 0 0;color:#a1a1aa;">Need to make changes or cancel? Visit your billing portal before the renewal date.</p>
        `,
        ctaText: "Manage Billing",
        ctaUrl: `${APP_URL}/community/billing`,
        footer: "AstrologyPro &mdash; Divine Infinite Being",
      });

    case "community_payment_failed":
      return buildEmailHtml({
        title: "Payment Unsuccessful",
        preheader: "Your community membership payment of USD 29.00 could not be processed.",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Hi Jane,</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">We were unable to process your community membership payment. Your access remains active for now, but please update your payment method to avoid any interruption.</p>
          ${detailRow("Amount Due", "USD 29.00")}
          ${detailRow("Next Retry", "April 10, 2026")}
          ${infoCard("Please update your payment method in the billing portal to ensure uninterrupted access to the community.")}
        `,
        ctaText: "Update Payment Method",
        ctaUrl: `${APP_URL}/community/billing`,
        footer: "AstrologyPro &mdash; Divine Infinite Being",
      });

    case "membership_expiry_warning":
      return buildEmailHtml({
        title: "Membership Expiring Soon",
        preheader: "Your community membership expires on April 30, 2026",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Hi Jane,</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">Your community membership is expiring on <strong style="color:#f4f4f5;">April 30, 2026</strong>. After this date, your access to community content, decans, and other member benefits will be paused.</p>
          ${infoCard("Renew now to keep your progress and maintain uninterrupted access to the community.")}
          <p style="margin:16px 0 0;color:#a1a1aa;">If you have already renewed, you can safely ignore this message.</p>
        `,
        ctaText: "Renew Membership",
        ctaUrl: `${APP_URL}/community/billing`,
        footer: "AstrologyPro &mdash; Divine Infinite Being",
      });

    case "mystery_school_enrollment":
      return buildEmailHtml({
        title: "Mystery School",
        badge: "Enrolled",
        preheader: "Your enrollment is confirmed. The path of the 36 Decans is open.",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Welcome, Jane.</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">You have been enrolled in the <strong style="color:#f4f4f5;">Mystery School</strong>. The path of the 36 Decans is now open to you.</p>
          ${detailRow("Entry Quarter", "Q2 2026")}
          ${detailRow("Enrollment Date", "April 6, 2026")}
          ${detailRow("Foundation Begins", "April 13, 2026")}
          ${sectionHeading("What Happens Next")}
          <ul style="margin:0;padding-left:20px;color:#a1a1aa;">
            <li style="margin-bottom:6px;">Your Foundation Weeks become available in sequence — one per week</li>
            <li style="margin-bottom:6px;">Decan windows open according to the astrological calendar</li>
            <li style="margin-bottom:6px;">Each decan requires a ritual, scrying journal, and mundane impact journal</li>
            <li style="margin-bottom:6px;">You will receive email reminders as windows open and approach their close</li>
          </ul>
        `,
        ctaText: "Enter the Mystery School",
        ctaUrl: `${APP_URL}/community/mystery-school`,
        footer: "AstrologyPro &mdash; Mystery School",
      });

    case "sunday_service_new_episode":
      return buildEmailHtml({
        title: "New Sunday Service Episode",
        preheader: "A new Sunday Service episode is now available in your portal.",
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">Hi Jane,</p>
          <p style="margin:0 0 16px;color:#a1a1aa;">A new <strong style="color:#f4f4f5;">Sunday Service</strong> episode is now available for you in the community portal.</p>
          ${detailRow("Episode", "April 6, 2026 — Spring Equinox Reflections")}
          ${infoCard("Watch at your own pace. All Sunday Service recordings are stored in your portal and available anytime.")}
        `,
        ctaText: "Watch Sunday Service",
        ctaUrl: `${APP_URL}/community/sunday-service`,
        footer: "AstrologyPro &mdash; Divine Infinite Being",
      });

    default:
      return null;
  }
}

// ─── GET /api/admin/email-preview?template=xxx ────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templateName = req.nextUrl.searchParams.get("template") ?? "";
  if (!templateName) {
    return NextResponse.json({ error: "template param required" }, { status: 422 });
  }

  const html = buildPreviewHtml(templateName);
  if (!html) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  return NextResponse.json({ html });
}

// ─── POST /api/admin/email-preview ────────────────────────────────────────────
// Body: { template: string; sendTestTo?: string }

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { template: string; sendTestTo?: string };
  const { template, sendTestTo } = body;

  if (!template) {
    return NextResponse.json({ error: "template required" }, { status: 422 });
  }

  const html = buildPreviewHtml(template);
  if (!html) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const recipient = sendTestTo ?? user.email;
  if (!recipient) {
    return NextResponse.json({ error: "No recipient email available" }, { status: 422 });
  }

  await sendEmail({
    to: recipient,
    subject: `[TEST PREVIEW] ${template}`,
    html,
  });

  return NextResponse.json({ sent: true, to: recipient });
}
