import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Body: { email: string }
// Always returns 200 — never reveals whether email exists.

export async function POST(req: NextRequest) {
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
