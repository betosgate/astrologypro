import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim().toLowerCase();

  const admin = createAdminClient();

  let ledgerQuery = admin
    .from("revenue_ledger_entries")
    .select(
      "id, source_type, source_reference, diviner_id, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, refunded_gross_amount_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents, settlement_status, settlement_note, recognized_at, updated_at, diviners(id, user_id, display_name, username)",
    )
    .order("recognized_at", { ascending: false })
    .limit(150);

  if (status && status !== "all") {
    ledgerQuery = ledgerQuery.eq("settlement_status", status);
  }

  const { data: ledgerRows, error: ledgerError } = await ledgerQuery;
  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  const filteredRows = (ledgerRows ?? []).filter((row) => {
    if (!search) return true;
    const diviner = row.diviners as { display_name?: string | null; username?: string | null } | null;
    return [row.source_reference, diviner?.display_name, diviner?.username]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  const ledgerIds = filteredRows.map((row) => row.id as string);

  const { data: noteRows, error: notesError } = ledgerIds.length
    ? await admin
        .from("finance_operation_notes")
        .select("id, revenue_ledger_entry_id, note_type, note, status, created_at")
        .in("revenue_ledger_entry_id", ledgerIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 });
  }

  const notesByLedgerId = new Map<
    string,
    Array<{
      id: string;
      noteType: string;
      note: string;
      status: string;
      createdAt: string;
    }>
  >();

  for (const row of noteRows ?? []) {
    const key = String(row.revenue_ledger_entry_id);
    const existing = notesByLedgerId.get(key) ?? [];
    existing.push({
      id: String(row.id),
      noteType: String(row.note_type),
      note: String(row.note),
      status: String(row.status),
      createdAt: String(row.created_at),
    });
    notesByLedgerId.set(key, existing);
  }

  return NextResponse.json({
    rows: filteredRows.map((row) => {
      const diviner = row.diviners as
        | { id?: string | null; user_id?: string | null; display_name?: string | null; username?: string | null }
        | null;
      const notes = notesByLedgerId.get(String(row.id)) ?? [];
      return {
        id: row.id,
        sourceType: row.source_type,
        sourceReference: row.source_reference,
        divinerId: row.diviner_id,
        divinerUserId: diviner?.user_id ?? null,
        divinerName: diviner?.display_name ?? "Unknown",
        divinerUsername: diviner?.username ?? null,
        grossAmount: Number(row.gross_amount_cents ?? 0) / 100,
        platformFee: Number(row.platform_fee_cents ?? 0) / 100,
        affiliateCommission: Number(row.affiliate_commission_cents ?? 0) / 100,
        divinerNet: Number(row.diviner_net_amount_cents ?? 0) / 100,
        refundedGrossAmount: Number(row.refunded_gross_amount_cents ?? 0) / 100,
        refundedAffiliateCommission:
          Number(row.refunded_affiliate_commission_cents ?? 0) / 100,
        refundedDivinerNet:
          Number(row.refunded_diviner_net_amount_cents ?? 0) / 100,
        settlementStatus: row.settlement_status,
        settlementNote: row.settlement_note,
        recognizedAt: row.recognized_at,
        updatedAt: row.updated_at,
        latestNote: notes[0] ?? null,
        notesCount: notes.length,
      };
    }),
  });
}
