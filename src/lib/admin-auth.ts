import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the trimmed, lowercase list of bootstrap admin emails from env.
 * Used ONLY as fallback when admin_users table is empty (fresh deploys).
 */
function getBootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks if user_id exists in the admin_users table.
 */
async function isAdminInDb(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Master admin check — DB first, ADMIN_EMAILS as bootstrap fallback.
 * Returns the authenticated User if admin, null otherwise.
 */
export async function requireAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // Primary: database check
  if (await isAdminInDb(user.id)) return user;

  // Bootstrap fallback: ADMIN_EMAILS env var (for initial setup only)
  const bootstrapEmails = getBootstrapEmails();
  if (bootstrapEmails.includes(user.email.toLowerCase())) return user;

  return null;
}

/**
 * Lightweight version for API routes — same logic, exported for convenience.
 */
export async function getAdminUser(): Promise<User | null> {
  return requireAdmin();
}
