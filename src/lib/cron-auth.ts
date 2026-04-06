import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the trimmed CRON_SECRET. Never embed the raw env var in headers.
 */
export function getCronSecret(): string {
  return (process.env.CRON_SECRET ?? "").trim();
}

/**
 * Verifies the Authorization: Bearer <secret> header on a cron request.
 * Returns a 401 NextResponse if invalid, or null if valid.
 */
export function verifyCronAuth(req: NextRequest): NextResponse | null {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }
  const authHeader = (req.headers.get("authorization") ?? "").trim();
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
