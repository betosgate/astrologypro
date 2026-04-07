/**
 * ICS (iCalendar) file generator — no external package, pure string generation.
 * RFC 5545 compliant. Works with Apple Calendar, Google Calendar, Outlook, and
 * any standard calendar client.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ICSParams {
  uid: string;
  title: string;
  description: string;
  startISO: string;
  endISO: string;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  location?: string;
  timezone?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO 8601 UTC string to the ICS date-time format: YYYYMMDDTHHmmssZ
 * e.g. "2026-04-07T12:00:00.000Z" → "20260407T120000Z"
 */
export function formatICSDate(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special ICS characters in property values.
 * RFC 5545 §3.3.11: commas, semicolons, and backslashes must be escaped.
 * Newlines become the literal two-character sequence \n (as per spec).
 */
function escapeICSText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Fold long lines per RFC 5545 §3.1 — lines longer than 75 octets must be
 * folded with CRLF + single whitespace.
 */
function foldLine(line: string): string {
  const LIMIT = 75;
  if (line.length <= LIMIT) return line;

  let result = "";
  let remaining = line;
  let first = true;

  while (remaining.length > 0) {
    const max = first ? LIMIT : LIMIT - 1; // leading space takes 1 octet on continuation lines
    result += (first ? "" : "\r\n ") + remaining.slice(0, max);
    remaining = remaining.slice(max);
    first = false;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a complete .ics file string for a single booking event.
 *
 * Uses METHOD:REQUEST so most calendar clients treat it as an invite/event
 * rather than a plain memo.
 */
export function generateICS(params: ICSParams): string {
  const {
    uid,
    title,
    description,
    startISO,
    endISO,
    organizerName,
    organizerEmail,
    attendeeName,
    attendeeEmail,
    location = "Online",
  } = params;

  const dtstamp = formatICSDate(new Date().toISOString());
  const dtstart = formatICSDate(startISO);
  const dtend = formatICSDate(endISO);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstrologyPro//BookingSystem//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    foldLine(`UID:${uid}@astrologypro`),
    foldLine(`DTSTAMP:${dtstamp}`),
    foldLine(`DTSTART:${dtstart}`),
    foldLine(`DTEND:${dtend}`),
    foldLine(`SUMMARY:${escapeICSText(title)}`),
    foldLine(`DESCRIPTION:${escapeICSText(description)}`),
    foldLine(`ORGANIZER;CN=${escapeICSText(organizerName)}:mailto:${organizerEmail}`),
    foldLine(`ATTENDEE;CN=${escapeICSText(attendeeName)};RSVP=FALSE:mailto:${attendeeEmail}`),
    foldLine(`LOCATION:${escapeICSText(location)}`),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 requires CRLF line endings
  return lines.join("\r\n") + "\r\n";
}
