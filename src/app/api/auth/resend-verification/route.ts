import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/auth/resend-verification ──────────────────────────────────────
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

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  // Fire-and-forget — swallow error to never leak email existence
  await supabase.auth.resend({ type: "signup", email });

  return NextResponse.json({ ok: true });
}
