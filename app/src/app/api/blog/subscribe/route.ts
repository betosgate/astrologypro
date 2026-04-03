import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 422 });
  }

  // Log to console so it's captured in Vercel Function logs even if table doesn't exist yet
  console.log("[blog-subscribe] New subscriber:", email);

  try {
    const admin = createAdminClient();
    // Upsert so re-subscribing the same email is idempotent
    const { error } = await admin
      .from("blog_subscribers")
      .upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: "email" });

    if (error) {
      // Table may not exist yet — treat as soft success so UX isn't broken
      console.warn("[blog-subscribe] DB write skipped:", error.message);
    }
  } catch (err) {
    console.warn("[blog-subscribe] DB unavailable, logged only:", err);
  }

  return NextResponse.json({ ok: true });
}
