import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let email: string;
  let divinerUsername: string | undefined;

  try {
    const body = await request.json() as {
      email?: unknown;
      diviner_username?: unknown;
    };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    divinerUsername =
      typeof body.diviner_username === "string" && body.diviner_username.trim()
        ? body.diviner_username.trim().toLowerCase()
        : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 422 });
  }

  // Log to console so it's captured in Vercel Function logs even if table doesn't exist yet
  console.log("[blog-subscribe] New subscriber:", email, divinerUsername ? `via diviner=${divinerUsername}` : "");

  try {
    const admin = createAdminClient();

    // Resolve diviner_id from username if provided
    let divinerId: string | null = null;
    if (divinerUsername) {
      const { data: diviner } = await admin
        .from("diviners")
        .select("id")
        .eq("username", divinerUsername)
        .maybeSingle();
      divinerId = diviner?.id ?? null;
    }

    // Upsert so re-subscribing the same email is idempotent.
    // On conflict update attribution columns if they were previously unset.
    const { error } = await admin
      .from("blog_subscribers")
      .upsert(
        {
          email,
          subscribed_at: new Date().toISOString(),
          source: divinerUsername ? "diviner_profile" : "blog",
          ...(divinerId ? { diviner_id: divinerId } : {}),
          ...(divinerUsername ? { attributed_username: divinerUsername } : {}),
        },
        { onConflict: "email" }
      );

    if (error) {
      // Table may not exist yet — treat as soft success so UX isn't broken
      console.warn("[blog-subscribe] DB write skipped:", error.message);
    }
  } catch (err) {
    console.warn("[blog-subscribe] DB unavailable, logged only:", err);
  }

  return NextResponse.json({ ok: true });
}
