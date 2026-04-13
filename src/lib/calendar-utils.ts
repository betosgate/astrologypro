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
 * Build a Google Calendar event description.
 *
 * - Body  : availability template description (HTML stripped to plain text).
 *           This is what the diviner wrote — meeting link, instructions, etc.
 * - Footer: cancel / reschedule link pointing at the public booking page (no login required).
 */
export function buildCalendarDescription(
  templateDescription: string | null | undefined,
  appUrl: string,
  bookingToken?: string
): string {
  const body = templateDescription ? stripHtml(templateDescription) : "";
  const manageUrl = bookingToken
    ? `${appUrl}/booking/${bookingToken}`
    : `${appUrl}/portal/bookings`;
  const footer = `To cancel or reschedule, <a href="${manageUrl}">click here</a>.`;
  return body ? `${body}\n\n${footer}` : footer;
}
