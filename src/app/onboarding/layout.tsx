import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";

/**
 * Onboarding layout — diviner-only guard.
 *
 * /onboarding is exclusively for diviners completing their practice setup.
 * Any authenticated user who does NOT have a diviners row is redirected to
 * their correct portal via resolveLoginDestination so they never get stuck here.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  // Check if the user has a diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    // Not a diviner — resolve where they should actually be and send them there
    const adminUser = await requireAdmin().catch(() => null);
    const destination = await resolveLoginDestination({
      userId: user.id,
      isAdmin: !!adminUser,
      isInvited: user.user_metadata?.invited_by_admin === true,
      adminClient: admin,
    });
    if (destination === "/onboarding") {
      return <>{children}</>;
    }
    redirect(destination);
  }

  return <>{children}</>;
}
