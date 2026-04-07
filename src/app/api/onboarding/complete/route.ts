import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { welcomeDivinerEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

/**
 * POST /api/onboarding/complete
 *
 * Called when a diviner clicks "Go to Dashboard" at the end of onboarding.
 * Marks the diviner as onboarding_complete and sends the welcome email.
 * Idempotent — safe to call more than once (email is only sent if not already sent).
 *
 * If the diviner record doesn't exist yet (e.g. Stripe webhook hasn't fired in
 * local dev), we upsert one so the user can reach their dashboard.
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

    // Use the admin client for all DB work here — the user is authenticated
    // (verified above) but RLS may block UPDATE on diviners if the policy is
    // not set up for service-role writes. Admin client bypasses RLS entirely.
    const admin = createAdminClient();

    // Fetch the diviner record
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, display_name, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    const isFirstTime = !diviner?.onboarding_completed;

    if (!diviner) {
      // Diviner record missing (Stripe webhook hasn't fired or local dev).
      // Upsert a minimal record so the user can proceed to their dashboard.
      const username =
        (user.user_metadata?.username as string | undefined) ??
        user.email!.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "");
      const displayName =
        (user.user_metadata?.name as string | undefined) ?? username;

      const { error: upsertError } = await admin.from("diviners").upsert(
        {
          user_id: user.id,
          username,
          display_name: displayName,
          onboarding_completed: true,
          onboarding_step: 5,
        },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        console.error("[onboarding/complete] Failed to upsert diviner:", upsertError);
        return NextResponse.json({ error: "Failed to create diviner record" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Mark onboarding complete (admin client — bypasses RLS)
    const { error: updateError } = await admin
      .from("diviners")
      .update({ onboarding_completed: true })
      .eq("id", diviner.id);

    if (updateError) {
      console.error("[onboarding/complete] Failed to update:", updateError);
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
    }

    // Only send the welcome email once
    if (isFirstTime) {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
