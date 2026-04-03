import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("blog_subscribers")
      .upsert(
        { email, subscribed_at: new Date().toISOString(), source: "marketing" },
        { onConflict: "email" }
      );

    if (error) {
      console.error("[marketing/subscribe] DB error:", error.message);
      return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
