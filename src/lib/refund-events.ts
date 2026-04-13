import { createAdminClient } from "@/lib/supabase/admin";

type RecordRefundEventParams = {
  bookingId: string;
  divinerId: string | null;
  orderReference: string;
  paymentIntentId: string | null;
  providerRefundId: string | null;
  initiatedByUserId: string | null;
  initiatedByRole: "admin" | "diviner" | "system";
  amountCents: number;
  currency?: string | null;
  reason?: string | null;
  status?: "pending" | "processed" | "failed" | "reversed";
  providerResponse?: Record<string, unknown>;
};

export async function recordRefundEvent(params: RecordRefundEventParams) {
  const admin = createAdminClient();

  const { error } = await admin.from("refund_events").insert({
    booking_id: params.bookingId,
    diviner_id: params.divinerId,
    order_reference: params.orderReference,
    payment_intent_id: params.paymentIntentId,
    provider_refund_id: params.providerRefundId,
    initiated_by_user_id: params.initiatedByUserId,
    initiated_by_role: params.initiatedByRole,
    amount_cents: Math.max(1, Math.round(params.amountCents)),
    currency: (params.currency ?? "usd").toLowerCase(),
    reason: params.reason ?? null,
    status: params.status ?? "processed",
    provider_response: params.providerResponse ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
