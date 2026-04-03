const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

// ---------------------------------------------------------------------------
// Welcome email for new diviners completing onboarding
// ---------------------------------------------------------------------------

export function welcomeDivinerEmail(
  name: string,
  dashboardUrl: string
): { subject: string; html: string } {
  const subject = "Welcome to AstrologyPro — Your Business is Ready 🌟";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to AstrologyPro</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <span style="font-family:system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:#8b5cf6;letter-spacing:-0.5px;">
              &#10024; AstrologyPro
            </span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#18181b;border-radius:12px;border:1px solid #27272a;padding:40px 32px;">

            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;color:#f4f4f5;margin:0 0 16px;">
              Welcome, ${name}! Your business is live.
            </p>

            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 24px;">
              You have completed onboarding and your AstrologyPro profile is ready. Here are 5 quick steps to hit the ground running:
            </p>

            <!-- Steps -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.7;color:#a1a1aa;">

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="32" valign="top" style="padding-top:2px;">
                        <span style="display:inline-block;width:24px;height:24px;background-color:#8b5cf6;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">1</span>
                      </td>
                      <td style="padding-left:8px;">
                        <strong style="color:#e4e4e7;">Complete your profile</strong><br />
                        Add your bio, upload a photo, and list your specialties so clients know what to expect.
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="32" valign="top" style="padding-top:2px;">
                        <span style="display:inline-block;width:24px;height:24px;background-color:#8b5cf6;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">2</span>
                      </td>
                      <td style="padding-left:8px;">
                        <strong style="color:#e4e4e7;">Set your availability</strong><br />
                        Open your dashboard calendar and block out the hours you want to take bookings.
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="32" valign="top" style="padding-top:2px;">
                        <span style="display:inline-block;width:24px;height:24px;background-color:#8b5cf6;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">3</span>
                      </td>
                      <td style="padding-left:8px;">
                        <strong style="color:#e4e4e7;">Create your first service offering</strong><br />
                        Define what readings you offer, set your prices, and publish them to your profile.
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="32" valign="top" style="padding-top:2px;">
                        <span style="display:inline-block;width:24px;height:24px;background-color:#8b5cf6;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">4</span>
                      </td>
                      <td style="padding-left:8px;">
                        <strong style="color:#e4e4e7;">Connect Stripe to receive payments</strong><br />
                        Link your Stripe account so earnings are paid out directly to your bank.
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:0;">
                    <tr>
                      <td width="32" valign="top" style="padding-top:2px;">
                        <span style="display:inline-block;width:24px;height:24px;background-color:#8b5cf6;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">5</span>
                      </td>
                      <td style="padding-left:8px;">
                        <strong style="color:#e4e4e7;">Share your profile link with clients</strong><br />
                        Copy your unique booking link from the dashboard and share it on social media or with existing clients.
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 0;">
              <tr>
                <td align="center" style="border-radius:8px;background-color:#8b5cf6;">
                  <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                    Go to My Dashboard
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#52525b;line-height:1.6;">
                  AstrologyPro &mdash; Run Your Divination Business<br />
                  Questions? Reply to this email or visit
                  <a href="${APP_URL}/support" style="color:#71717a;text-decoration:underline;">${APP_URL}/support</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

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
  const { divinerName, clientName, serviceName, preferredDate, timePreference, notes, dashboardUrl } = params;
  const subject = `Reschedule Request — ${clientName} wants a new time`;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reschedule Request</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0a;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <span style="font-family:system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:#8b5cf6;letter-spacing:-0.5px;">
              &#10024; AstrologyPro
            </span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#18181b;border-radius:12px;border:1px solid #27272a;padding:40px 32px;">

            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;color:#f4f4f5;margin:0 0 16px;">
              Reschedule Request
            </p>

            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 24px;">
              Hi ${divinerName}, <strong style="color:#d4d4d8;">${clientName}</strong> has requested to reschedule their <strong style="color:#d4d4d8;">${serviceName}</strong> session.
            </p>

            <!-- Details -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#1e1b2e;border:1px solid #2e2548;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
                    <tr>
                      <td width="160" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#71717a;padding:4px 0;">Client</td>
                      <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#f4f4f5;font-weight:600;padding:4px 0;">${clientName}</td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
                    <tr>
                      <td width="160" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#71717a;padding:4px 0;">Service</td>
                      <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#f4f4f5;font-weight:600;padding:4px 0;">${serviceName}</td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
                    <tr>
                      <td width="160" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#71717a;padding:4px 0;">Preferred Date</td>
                      <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#f4f4f5;font-weight:600;padding:4px 0;">${preferredDate}</td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:${notes ? "8px" : "0"};">
                    <tr>
                      <td width="160" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#71717a;padding:4px 0;">Time Preference</td>
                      <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#f4f4f5;font-weight:600;padding:4px 0;">${timePreference}</td>
                    </tr>
                  </table>

                  ${notes ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td width="160" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#71717a;padding:4px 0;vertical-align:top;">Notes</td>
                      <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#f4f4f5;padding:4px 0;">${notes}</td>
                    </tr>
                  </table>` : ""}

                </td>
              </tr>
            </table>

            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 24px;">
              Please contact ${clientName} to confirm a new time, or manage the booking from your dashboard.
            </p>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td align="center" style="border-radius:8px;background-color:#8b5cf6;">
                  <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                    View in Dashboard
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#52525b;line-height:1.6;">
                  AstrologyPro &mdash; Run Your Divination Business
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, html };
}
