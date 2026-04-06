import { createAdminClient } from "@/lib/supabase/admin";

type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "training"
  | "ritual"
  | "billing"
  | "system";

/**
 * createNotification
 * Server-side helper to insert a notification for any user.
 * Uses the service-role admin client — call from Route Handlers / server actions only.
 * Never throws — failures are logged and silently swallowed so callers can use .catch(()=>{}).
 */
export async function createNotification(opts: {
  userId: string;
  title: string;
  body?: string;
  type?: NotificationType;
  actionUrl?: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("notifications").insert({
    user_id: opts.userId,
    title: opts.title,
    body: opts.body ?? null,
    type: opts.type ?? "info",
    action_url: opts.actionUrl ?? null,
  });

  if (error) {
    console.error("[createNotification] insert failed:", error.message);
  }
}
