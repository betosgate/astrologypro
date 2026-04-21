/** Strip HTML tags and decode basic entities for use in plain-text calendar descriptions. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Build a Google Calendar event description using HTML.
 *
 * Google Calendar supports HTML in event descriptions, so we use
 * styled anchor tags that render as button-like links.
 *
 * - Session link   : clickable button to join the reading session.
 * - Body           : availability template description (HTML stripped to plain text).
 * - Phone dial-in  : if `centralPhoneNumber` + `callPin` are provided, render
 *                    the shared-number + PIN instructions (takes precedence).
 *                    Otherwise, if `phoneNumber` is provided, fall back to
 *                    the legacy per-diviner Chime dial-in card.
 * - Footer         : cancel / reschedule button link.
 */
export function buildCalendarDescription(
  templateDescription: string | null | undefined,
  appUrl: string,
  bookingToken?: string,
  options?: {
    sessionLink?: string;
    phoneNumber?: string | null;
    /** Shared-central-number PIN-routing mode — pass both together. */
    centralPhoneNumber?: string | null;
    callPin?: string | null;
  }
): string {
  const parts: string[] = [];

  // Session join link — styled as a button
  if (options?.sessionLink) {
    parts.push(
      `<b>📹 Join Your Session</b><br>` +
      `<a href="${options.sessionLink}" style="display:inline-block;padding:10px 24px;background-color:#d4a017;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px 0;">Join Session</a>`
    );
  }

  // Template description (diviner's notes, instructions, etc.)
  const body = templateDescription ? stripHtml(templateDescription) : "";
  if (body) parts.push(body.replace(/\n/g, "<br>"));

  // Phone dial-in.
  // Preference order:
  //   1. Central shared number + PIN  (new, shared-architecture)
  //   2. Per-diviner Chime number     (legacy)
  if (options?.centralPhoneNumber && options?.callPin) {
    parts.push(
      `<b>📞 Join by Phone</b><br>` +
      `Dial <a href="tel:${options.centralPhoneNumber}" style="color:#d4a017;font-weight:bold;">${options.centralPhoneNumber}</a> at your scheduled time and enter your 6-digit PIN when prompted.<br>` +
      `<br>Your PIN: <b style="font-size:18px;letter-spacing:3px;">${options.callPin}</b>`
    );
  } else if (options?.phoneNumber) {
    parts.push(
      `<b>📞 Phone Dial-in</b><br>` +
      `<a href="tel:${options.phoneNumber}" style="display:inline-block;padding:8px 20px;background-color:#374151;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px 0;">${options.phoneNumber}</a><br>` +
      `<i>Can't use video? Call this number at your session time to join by phone.</i>`
    );
  }

  // Manage booking link — styled as a button
  const manageUrl = bookingToken
    ? `${appUrl}/booking/${bookingToken}`
    : `${appUrl}/portal/bookings`;
  parts.push(
    `<a href="${manageUrl}" style="display:inline-block;padding:8px 20px;background-color:#374151;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px 0;">Cancel or Reschedule</a>`
  );

  return parts.join("<br><br>");
}
