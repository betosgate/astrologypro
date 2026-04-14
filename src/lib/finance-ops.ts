import { createAdminClient } from "@/lib/supabase/admin";
import type { RevenueLedgerSettlementStatus } from "@/lib/revenue-ledger";

export const FINANCE_SETTLEMENT_STATUSES: RevenueLedgerSettlementStatus[] = [
  "pending",
  "approved",
  "held",
  "paid",
  "reversed",
  "disputed",
];

export const FINANCE_NOTE_TYPES = [
  "payout_hold",
  "refund_investigation",
  "manual_adjustment",
  "affiliate_dispute",
  "general",
] as const;

export type FinanceNoteType = (typeof FINANCE_NOTE_TYPES)[number];

export async function logFinanceAdminAction(params: {
  adminUserId: string;
  targetUserId?: string | null;
  actionType: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_activity_log").insert({
    admin_user_id: params.adminUserId,
    target_user_id: params.targetUserId ?? null,
    action_type: params.actionType,
    details: params.details ?? {},
    ip_address: params.ipAddress ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createFinanceOperationNote(params: {
  createdByUserId: string;
  revenueLedgerEntryId?: string | null;
  divinerId?: string | null;
  orderReference?: string | null;
  noteType: FinanceNoteType;
  note: string;
  status?: "open" | "resolved";
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("finance_operation_notes")
    .insert({
      revenue_ledger_entry_id: params.revenueLedgerEntryId ?? null,
      diviner_id: params.divinerId ?? null,
      order_reference: params.orderReference ?? null,
      note_type: params.noteType,
      note: params.note,
      status: params.status ?? "open",
      created_by_user_id: params.createdByUserId,
    })
    .select("id, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
