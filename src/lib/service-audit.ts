/**
 * Shared helper for writing service_access_audit_log entries.
 * Used by admin API routes for service enable/disable/publish actions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogInsert } from "@/types/diviner-service";

export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogInsert
): Promise<void> {
  const { error } = await supabase.from("service_access_audit_log").insert({
    diviner_id:          entry.diviner_id,
    service_template_id: entry.service_template_id ?? null,
    diviner_service_id:  entry.diviner_service_id ?? null,
    action:              entry.action,
    performed_by:        entry.performed_by,
    performed_by_role:   entry.performed_by_role,
    old_value:           entry.old_value ?? null,
    new_value:           entry.new_value ?? null,
    reason:              entry.reason ?? null,
    ip_address:          entry.ip_address ?? null,
  });

  if (error) {
    // Non-fatal — log but don't fail the main operation
    console.error("[service-audit] Failed to write audit log:", error.message);
  }
}
