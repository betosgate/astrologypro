/**
 * email-log.ts — helpers for email send logging and sequence pause checks.
 *
 * logEmail()          — insert a row into email_send_log after sending
 * isSequencePaused()  — check email_sequence_controls before sending
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── logEmail ─────────────────────────────────────────────────────────────────

export interface LogEmailParams {
  userId?: string;
  emailTo: string;
  templateName: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}

export async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("email_send_log").insert({
      user_id: params.userId ?? null,
      email_to: params.emailTo,
      template_name: params.templateName,
      subject: params.subject ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    // Never throw — logging failures must not block the send path
    console.error("[email-log] Failed to log email send:", err);
  }
}

// ─── isSequencePaused ─────────────────────────────────────────────────────────

export async function isSequencePaused(sequenceName: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("email_sequence_controls")
      .select("is_paused")
      .eq("sequence_name", sequenceName)
      .maybeSingle();
    return data?.is_paused === true;
  } catch (err) {
    // On error, allow send to proceed (fail open — avoids silently blocking)
    console.error("[email-log] isSequencePaused check failed:", err);
    return false;
  }
}
