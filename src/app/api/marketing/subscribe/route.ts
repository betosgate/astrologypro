import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: unknown;
      diviner_username?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const divinerUsername =
      typeof body.diviner_username === "string" && body.diviner_username.trim()
        ? body.diviner_username.trim().toLowerCase()
        : undefined;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Resolve diviner_id from username if provided for attribution
    let divinerId: string | null = null;
    if (divinerUsername) {
      const { data: diviner } = await admin
        .from("diviners")
        .select("id")
        .eq("username", divinerUsername)
        .maybeSingle();
      divinerId = diviner?.id ?? null;
    }

    const { error } = await admin
      .from("blog_subscribers")
      .upsert(
        {
          email,
          subscribed_at: new Date().toISOString(),
          source: divinerUsername ? "diviner_profile" : "marketing",
          ...(divinerId ? { diviner_id: divinerId } : {}),
          ...(divinerUsername ? { attributed_username: divinerUsername } : {}),
        },
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
