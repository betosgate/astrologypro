/**
 * email-base.ts — Single source of truth for all transactional HTML emails.
 *
 * Every email in the system is built from:
 *   1. buildEmailHtml(params)   — the outer wrapper (header, card, footer)
 *   2. Content helper functions — compose the inner body HTML
 *
 * Usage:
 *   import { buildEmailHtml, detailRow, infoCard, sectionHeading } from "@/lib/email-base";
 *
 *   const html = buildEmailHtml({
 *     title: "Your reading is confirmed!",
 *     preheader: "Session with Luna Star on Friday at 3 PM",
 *     content: detailRow("Service", "Natal Chart") + detailRow("Date", "Friday 3 PM"),
 *     ctaText: "Join Session",
 *     ctaUrl: "https://...",
 *   });
 */

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com").trim();

// ─── Design tokens ────────────────────────────────────────────────────────────

export const EMAIL_COLORS = {
  pageBg:          "#0a0a0a",
  cardBg:          "#18181b",
  cardBorder:      "#27272a",
  innerBg:         "#1e1b2e",
  innerBorder:     "#2e2548",
  accent:          "#8b5cf6",  // violet
  accentMid:       "#a78bfa",
  textHeading:     "#f4f4f5",
  textBody:        "#d4d4d8",
  textMuted:       "#a1a1aa",
  textLabel:       "#71717a",
  textFooter:      "#52525b",
  success:         "#22c55e",
  danger:          "#ef4444",
  warning:         "#f59e0b",
  info:            "#38bdf8",
} as const;

// ─── Outer template ───────────────────────────────────────────────────────────

export interface BuildEmailParams {
  /** Large heading inside the card */
  title: string;
  /** Hidden preview text shown in inbox — keep under 140 chars */
  preheader: string;
  /** HTML to inject into the card body — use the helpers below */
  content: string;
  /** Optional small badge rendered above the title (e.g. "Reading Confirmed") */
  badge?: string;
  /** Optional subtitle rendered below the title in muted text */
  subtitle?: string;
  /** Primary CTA button */
  ctaText?: string;
  ctaUrl?: string;
  /** Override footer text (can contain HTML) */
  footer?: string;
  /** Override the default violet accent color */
  accentColor?: string;
}

export function buildEmailHtml({
  title,
  preheader,
  content,
  badge,
  subtitle,
  ctaText,
  ctaUrl,
  footer,
  accentColor = EMAIL_COLORS.accent,
}: BuildEmailParams): string {
  const badgeBlock = badge
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
  <tr>
    <td>
      <span style="display:inline-block;padding:3px 12px;background-color:${accentColor}22;border:1px solid ${accentColor}55;border-radius:100px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;color:${accentColor};text-transform:uppercase;letter-spacing:0.8px;">
        ${badge}
      </span>
    </td>
  </tr>
</table>`
    : "";

  const subtitleBlock = subtitle
    ? `<p style="margin:6px 0 20px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textMuted};line-height:1.5;">${subtitle}</p>`
    : "";

  const ctaBlock = ctaText && ctaUrl
    ? `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
  href="${ctaUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="16%"
  strokecolor="${accentColor}" fillcolor="${accentColor}">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${ctaText}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${accentColor};">
      <a href="${ctaUrl}" target="_blank"
        style="display:inline-block;padding:14px 36px;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
        ${ctaText}
      </a>
    </td>
  </tr>
</table>
<!--<![endif]-->`
    : "";

  const footerHtml = footer
    ?? `AstrologyPro &mdash; Your Divination Platform`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${title}</title>
  <!--[if !mso]><!-->
  <style>
    @media only screen and (max-width:620px) {
      .email-wrap  { width:100% !important; padding:0 12px !important; }
      .email-card  { padding:28px 20px !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.pageBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader (hidden inbox preview) -->
  <div style="display:none;font-size:1px;color:${EMAIL_COLORS.pageBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background-color:${EMAIL_COLORS.pageBg};">
    <tr>
      <td align="center" style="padding:40px 16px 32px;">

        <!-- ── Container ─────────────────────────────────────────────── -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
          width="600" class="email-wrap" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <span style="font-family:system-ui,-apple-system,sans-serif;font-size:26px;font-weight:700;color:${accentColor};letter-spacing:-0.5px;">
                &#10024; AstrologyPro
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${EMAIL_COLORS.cardBg};border-radius:12px;border:1px solid ${EMAIL_COLORS.cardBorder};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="email-card" style="padding:40px 36px;">

                    <!-- Badge (optional) -->
                    ${badgeBlock}

                    <!-- Title -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;color:${EMAIL_COLORS.textHeading};line-height:1.3;padding-bottom:${subtitle ? "0" : "20px"};">
                          ${title}
                        </td>
                      </tr>
                    </table>

                    <!-- Subtitle (optional) -->
                    ${subtitleBlock}

                    <!-- Body content -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.7;color:${EMAIL_COLORS.textMuted};">
                          ${content}
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    ${ctaBlock}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:${EMAIL_COLORS.textFooter};line-height:1.7;">
                    ${footerHtml}
                    <br />
                    <a href="${APP_URL}/unsubscribe" style="color:${EMAIL_COLORS.textLabel};text-decoration:underline;">Unsubscribe</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${APP_URL}/privacy" style="color:${EMAIL_COLORS.textLabel};text-decoration:underline;">Privacy Policy</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Container -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Content helpers ──────────────────────────────────────────────────────────
// Each helper returns an HTML string to concatenate inside `content`.

/**
 * A two-column label / value row.
 *   detailRow("Service", "Natal Chart Reading")
 */
export function detailRow(label: string, value: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:4px;">
  <tr>
    <td width="140" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textLabel};padding:6px 0;vertical-align:top;">${label}</td>
    <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textHeading};font-weight:600;padding:6px 0;">${value}</td>
  </tr>
</table>`;
}

/**
 * Multiple detailRows wrapped in a single bordered card.
 *   detailTable([{ label: "Service", value: "Natal Chart" }, ...])
 */
export function detailTable(rows: { label: string; value: string }[]): string {
  const inner = rows.map(({ label, value }) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      <tr>
        <td width="140" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textLabel};padding:4px 0;vertical-align:top;">${label}</td>
        <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textHeading};font-weight:600;padding:4px 0;">${value}</td>
      </tr>
    </table>`).join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;background-color:${EMAIL_COLORS.innerBg};border:1px solid ${EMAIL_COLORS.innerBorder};border-radius:8px;">
  <tr><td style="padding:20px;">${inner}</td></tr>
</table>`;
}

/**
 * Highlighted box for important context, tips, or code.
 *   infoCard("Your session link: <a href='...'>...</a>")
 */
export function infoCard(inner: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;background-color:${EMAIL_COLORS.innerBg};border:1px solid ${EMAIL_COLORS.innerBorder};border-radius:8px;">
  <tr>
    <td style="padding:20px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.accentMid};line-height:1.6;">
      ${inner}
    </td>
  </tr>
</table>`;
}

/**
 * Colour-coded alert banner for warnings, errors, success notices.
 *   alertBox("success", "Payment received — $97.00")
 *   alertBox("warning", "Your subscription renews in 3 days")
 *   alertBox("error", "Payment of $25.00 could not be processed")
 */
export function alertBox(
  type: "info" | "success" | "warning" | "error",
  message: string
): string {
  const map = {
    info:    { bg: "#0c2a42", border: "#1d5d8a", text: EMAIL_COLORS.info,    icon: "&#9432;" },
    success: { bg: "#0d2d1e", border: "#166534", text: EMAIL_COLORS.success, icon: "&#10003;" },
    warning: { bg: "#2d1f03", border: "#854d0e", text: EMAIL_COLORS.warning, icon: "&#9888;" },
    error:   { bg: "#2d0b0b", border: "#991b1b", text: EMAIL_COLORS.danger,  icon: "&#9888;" },
  };
  const { bg, border, text, icon } = map[type];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;background-color:${bg};border:1px solid ${border};border-radius:8px;">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="28" valign="top" style="font-size:16px;color:${text};padding-top:1px;">${icon}</td>
          <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${text};line-height:1.6;padding-left:8px;">${message}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Outline (secondary) CTA button.
 *   secondaryCta("Manage Preferences", "https://...")
 */
export function secondaryCta(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0;">
  <tr>
    <td align="center" style="border-radius:8px;border:1px solid ${EMAIL_COLORS.accent};">
      <a href="${url}" target="_blank"
        style="display:inline-block;padding:12px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:${EMAIL_COLORS.accent};text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Bold section heading inside the card body.
 *   sectionHeading("What to Expect")
 */
export function sectionHeading(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin-top:24px;margin-bottom:10px;">
  <tr>
    <td style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:700;color:${EMAIL_COLORS.textHeading};">${text}</td>
  </tr>
</table>`;
}

/**
 * Horizontal divider line.
 */
export function divider(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:24px 0;">
  <tr>
    <td style="border-top:1px solid ${EMAIL_COLORS.cardBorder};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

/**
 * Numbered step-by-step list.
 *   numberedSteps([
 *     { title: "Set your availability", body: "..." },
 *     { title: "Create a service", body: "..." },
 *   ])
 */
export function numberedSteps(
  steps: { title: string; body?: string }[]
): string {
  const rows = steps
    .map(
      ({ title, body }, i) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="margin-bottom:${i < steps.length - 1 ? "14px" : "0"};">
      <tr>
        <td width="36" valign="top" style="padding-top:2px;">
          <span style="display:inline-block;width:26px;height:26px;background-color:${EMAIL_COLORS.accent};border-radius:50%;text-align:center;line-height:26px;font-size:12px;font-weight:700;color:#fff;">${i + 1}</span>
        </td>
        <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textMuted};padding-left:8px;line-height:1.6;">
          <strong style="color:${EMAIL_COLORS.textHeading};">${title}</strong>
          ${body ? `<br/>${body}` : ""}
        </td>
      </tr>
    </table>`
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;">${rows}</table>`;
}

/**
 * Bullet list with optional check or dot style.
 *   bulletList(["Quiet space", "Questions ready", "Camera tested"])
 */
export function bulletList(
  items: string[],
  style: "check" | "dot" = "dot"
): string {
  const bullet = style === "check"
    ? `<span style="color:${EMAIL_COLORS.success};font-weight:600;margin-right:8px;">&#10003;</span>`
    : `<span style="color:${EMAIL_COLORS.accent};margin-right:8px;">&bull;</span>`;

  const rows = items.map(
    (item) =>
      `<tr>
    <td style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:${EMAIL_COLORS.textMuted};padding:4px 0;line-height:1.6;">
      ${bullet}${item}
    </td>
  </tr>`
  ).join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:12px 0;">${rows}</table>`;
}

/**
 * Italic quote with optional attribution.
 *   quoteBlock("Just had an amazing reading!", "— Sarah K.")
 */
export function quoteBlock(quote: string, attribution?: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;border-left:3px solid ${EMAIL_COLORS.accent};background-color:${EMAIL_COLORS.innerBg};border-radius:0 8px 8px 0;">
  <tr>
    <td style="padding:16px 20px;font-family:system-ui,-apple-system,sans-serif;">
      <p style="margin:0 0 ${attribution ? "8px" : "0"};font-style:italic;color:${EMAIL_COLORS.textBody};font-size:15px;line-height:1.6;">&ldquo;${quote}&rdquo;</p>
      ${attribution ? `<p style="margin:0;color:${EMAIL_COLORS.textLabel};font-size:13px;">${attribution}</p>` : ""}
    </td>
  </tr>
</table>`;
}

/**
 * Large centered number display — for amounts, durations, codes.
 *   bigNumber("$97.00", "Refund Amount", EMAIL_COLORS.success)
 *   bigNumber("GIFT-XY9Z", "Your Gift Code")
 */
export function bigNumber(
  value: string,
  label: string,
  color: string = EMAIL_COLORS.accent
): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;background-color:${EMAIL_COLORS.innerBg};border:1px solid ${EMAIL_COLORS.innerBorder};border-radius:12px;">
  <tr>
    <td align="center" style="padding:28px 20px;">
      <p style="margin:0 0 6px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:${EMAIL_COLORS.textLabel};text-transform:uppercase;letter-spacing:1px;">${label}</p>
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:36px;font-weight:700;color:${color};letter-spacing:-0.5px;">${value}</p>
    </td>
  </tr>
</table>`;
}

/**
 * Star rating row (5 stars) — used in testimonial/review request emails.
 */
export function starRating(count = 5): string {
  const stars = Array.from(
    { length: count },
    () => `<td style="font-size:28px;padding:0 3px;color:${EMAIL_COLORS.accent};">&#9733;</td>`
  ).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
  style="margin:16px auto;">
  <tr>${stars}</tr>
</table>`;
}

/**
 * Stat grid — three equal-width metric columns.
 *   statGrid([
 *     { label: "Revenue", value: "$420", trend: "up" },
 *     { label: "Bookings", value: "7", trend: "flat" },
 *     { label: "New Clients", value: "2", trend: "up" },
 *   ])
 */
export function statGrid(
  stats: { label: string; value: string; trend?: "up" | "down" | "flat" }[]
): string {
  const trendIcon = (t?: "up" | "down" | "flat") => {
    if (t === "up")   return `<span style="color:${EMAIL_COLORS.success};">&#9650;</span>`;
    if (t === "down") return `<span style="color:${EMAIL_COLORS.danger};">&#9660;</span>`;
    return `<span style="color:${EMAIL_COLORS.textLabel};">&mdash;</span>`;
  };

  const cells = stats.map(({ label, value, trend }) =>
    `<td align="center" style="padding:16px 8px;width:${Math.floor(100 / stats.length)}%;">
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:${EMAIL_COLORS.textLabel};text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <p style="margin:6px 0 4px;font-family:system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:${EMAIL_COLORS.textHeading};">${value}</p>
      <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;">${trendIcon(trend)}</p>
    </td>`
  ).join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="margin:16px 0;background-color:${EMAIL_COLORS.innerBg};border:1px solid ${EMAIL_COLORS.innerBorder};border-radius:8px;">
  <tr>${cells}</tr>
</table>`;
}
