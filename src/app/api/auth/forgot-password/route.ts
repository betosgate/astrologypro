import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, getIpIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Body: { email: string }
// Always returns 200 — never reveals whether email exists.

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per minute per IP (auth endpoints are high-value abuse targets)
  const rl = await rateLimit(getIpIdentifier(req), 5, 60 * 1_000);
  if (!rl.success) {
    // Return 200 to avoid leaking the existence of the rate limit to scrapers.
    // The Retry-After header is still set so legitimate clients can back off.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1_000)),
      },
    });
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();

  // Basic format check — return 200 without hitting Supabase for invalid format
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const redirectTo =
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com") +
    "/update-password";

  const supabase = await createClient();
  // Fire-and-forget — swallow error to never leak email existence
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return NextResponse.json({ ok: true });
}
