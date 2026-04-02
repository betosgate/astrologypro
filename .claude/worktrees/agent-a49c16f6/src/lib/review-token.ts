import { createHmac } from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";

export function generateReviewToken(bookingId: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", SECRET)
    .update(`${bookingId}:${timestamp}`)
    .digest("hex");
  return `${bookingId}:${timestamp}:${signature}`;
}

export function verifyReviewToken(token: string): { valid: boolean; bookingId: string | null } {
  const parts = token.split(":");
  if (parts.length !== 3) {
    return { valid: false, bookingId: null };
  }

  const [bookingId, timestamp, signature] = parts;

  // Token expires after 30 days
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(tokenAge) || tokenAge > 30 * 24 * 60 * 60 * 1000) {
    return { valid: false, bookingId: null };
  }

  const expected = createHmac("sha256", SECRET)
    .update(`${bookingId}:${timestamp}`)
    .digest("hex");

  if (signature !== expected) {
    return { valid: false, bookingId: null };
  }

  return { valid: true, bookingId };
}
