import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createFinanceOperationNote,
  FINANCE_NOTE_TYPES,
  FINANCE_SETTLEMENT_STATUSES,
  logFinanceAdminAction,
} from "@/lib/finance-ops";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const settlementStatus =
    typeof body.settlementStatus === "string" ? body.settlementStatus : null;
  const settlementNote =
    typeof body.settlementNote === "string" ? body.settlementNote.trim() : "";
  const noteType =
    typeof body.noteType === "string" ? body.noteType : "general";

  if (settlementStatus && !FINANCE_SETTLEMENT_STATUSES.includes(settlementStatus as never)) {
    return NextResponse.json({ error: "Invalid settlement status" }, { status: 422 });
  }

  if (!FINANCE_NOTE_TYPES.includes(noteType as never)) {
    return NextResponse.json({ error: "Invalid note type" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("revenue_ledger_entries")
    .select("id, diviner_id, source_reference, settlement_status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Ledger entry not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (settlementStatus) {
    updatePayload.settlement_status = settlementStatus;
    updatePayload.settled_at =
      settlementStatus === "paid" || settlementStatus === "reversed"
        ? new Date().toISOString()
        : null;
    updatePayload.settled_by_user_id =
      settlementStatus === "paid" || settlementStatus === "reversed"
        ? adminUser.id
        : null;
  }
  if (settlementNote) {
    updatePayload.settlement_note = settlementNote;
  }

  const { data, error } = await admin
    .from("revenue_ledger_entries")
    .update(updatePayload)
    .eq("id", id)
    .select("id, diviner_id, source_reference, settlement_status, settlement_note")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  if (settlementNote) {
    await createFinanceOperationNote({
      createdByUserId: adminUser.id,
      revenueLedgerEntryId: id,
      divinerId: data.diviner_id,
      orderReference: data.source_reference,
      noteType: noteType as (typeof FINANCE_NOTE_TYPES)[number],
      note: settlementNote,
      status: settlementStatus === "paid" || settlementStatus === "reversed" ? "resolved" : "open",
    });
  }

  await logFinanceAdminAction({
    adminUserId: adminUser.id,
    targetUserId: data.diviner_id,
    actionType: "finance_ledger_status_updated",
    details: {
      revenueLedgerEntryId: id,
      previousStatus: existing.settlement_status,
      nextStatus: data.settlement_status,
      noteType,
      settlementNote: settlementNote || null,
    },
  });

  return NextResponse.json({ data });
}
