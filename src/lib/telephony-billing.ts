import { createAdminClient } from "@/lib/supabase/admin";

const PROVIDER_RATE_PER_MINUTE: Record<string, number> = {
  twilio: 0.0085,
  chime: 0.002,
};

interface PhoneSessionRow {
  id: string;
  booking_id: string | null;
  diviner_id: string;
  phone_provider: string | null;
  duration_seconds: number | null;
  platform_cost: number | null;
  status: string;
  created_at: string;
}

export async function syncTelephonyUsageFromPhoneSession(
  phoneSessionId: string
) {
  const admin = createAdminClient();
  const { data: phoneSession, error } = await admin
    .from("phone_sessions")
    .select(
      "id, booking_id, diviner_id, phone_provider, duration_seconds, platform_cost, status, created_at"
    )
    .eq("id", phoneSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const session = phoneSession as PhoneSessionRow | null;
  if (!session || session.status !== "completed") {
    return null;
  }

  const durationSeconds = session.duration_seconds ?? 0;
  const platformCost = Number(session.platform_cost ?? 0);
  const provider = (session.phone_provider ?? "twilio").toLowerCase();
  const ratePerMinute =
    PROVIDER_RATE_PER_MINUTE[provider] ?? PROVIDER_RATE_PER_MINUTE.twilio;
  const amountCents = Math.round(platformCost * 100);

  const { data: existing } = await admin
    .from("telephony_usage_records")
    .select("id, billed_at, invoice_id")
    .eq("session_id", session.id)
    .maybeSingle();

  const payload = {
    diviner_id: session.diviner_id,
    session_id: session.id,
    duration_seconds: durationSeconds,
    participant_count: 1,
    rate_per_minute: ratePerMinute,
    amount_cents: amountCents,
    created_at: session.created_at,
  };

  if (existing) {
    await admin
      .from("telephony_usage_records")
      .update({
        ...payload,
        billed_at: existing.billed_at,
        invoice_id: existing.invoice_id,
      })
      .eq("id", existing.id);

    return existing.id;
  }

  const { data: inserted, error: insertError } = await admin
    .from("telephony_usage_records")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted.id;
}

export async function createTelephonyPassThroughInvoices() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: unbilled, error } = await admin
    .from("telephony_usage_records")
    .select("id, diviner_id, amount_cents, created_at")
    .is("billed_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const records = unbilled ?? [];
  const grouped = new Map<
    string,
    { ids: string[]; amountCents: number; periodStart: string; periodEnd: string }
  >();

  for (const row of records) {
    const divinerId = row.diviner_id as string;
    const createdAt = row.created_at as string;
    const amountCents = Number(row.amount_cents ?? 0);

    const existing =
      grouped.get(divinerId) ??
      {
        ids: [],
        amountCents: 0,
        periodStart: createdAt,
        periodEnd: createdAt,
      };

    existing.ids.push(row.id as string);
    existing.amountCents += amountCents;
    if (createdAt < existing.periodStart) existing.periodStart = createdAt;
    if (createdAt > existing.periodEnd) existing.periodEnd = createdAt;
    grouped.set(divinerId, existing);
  }

  let invoiceCount = 0;
  let billedRecordCount = 0;

  for (const [divinerId, group] of grouped.entries()) {
    if (group.amountCents <= 0 || group.ids.length === 0) {
      continue;
    }

    const { data: invoice, error: invoiceError } = await admin
      .from("diviner_invoices")
      .insert({
        diviner_id: divinerId,
        amount_cents: group.amountCents,
        currency: "usd",
        status: "open",
        invoice_type: "telephony",
        description: "Phone dial-in pass-through usage",
        period_start: group.periodStart,
        period_end: group.periodEnd,
      })
      .select("id")
      .single();

    if (invoiceError) {
      throw new Error(invoiceError.message);
    }

    const { error: updateError } = await admin
      .from("telephony_usage_records")
      .update({
        billed_at: now,
        invoice_id: invoice.id,
      })
      .in("id", group.ids);

    if (updateError) {
      throw new Error(updateError.message);
    }

    invoiceCount += 1;
    billedRecordCount += group.ids.length;
  }

  return {
    invoicesCreated: invoiceCount,
    recordsBilled: billedRecordCount,
  };
}
