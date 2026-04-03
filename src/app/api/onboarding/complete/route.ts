import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { welcomeDivinerEmail } from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

/**
 * POST /api/onboarding/complete
 *
 * Called when a diviner clicks "Go to Dashboard" at the end of onboarding.
 * Marks the diviner as onboarding_complete and sends the welcome email.
 * Idempotent — safe to call more than once (email is only sent if not already sent).
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the diviner record
    const { data: diviner, error: divinerError } = await supabase
      .from("diviners")
      .select("id, display_name, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (divinerError || !diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    // Mark onboarding complete (best-effort — column may not exist in all envs)
    await supabase
      .from("diviners")
      .update({ onboarding_completed: true })
      .eq("id", diviner.id);

    // Only send the welcome email once
    if (!diviner.onboarding_completed) {
      const recipientEmail: string = user.email ?? "";
      const recipientName: string = diviner.display_name ?? "there";

      if (recipientEmail) {
        const { subject, html } = welcomeDivinerEmail(
          recipientName,
          `${APP_URL}/dashboard`
        );

        await sendEmail({ to: recipientEmail, subject, html });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding/complete] Error:", err);
    // Don't block navigation — return success so the user can proceed
    return NextResponse.json({ success: true });
  }
}
