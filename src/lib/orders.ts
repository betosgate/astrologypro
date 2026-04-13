import { getServicePurchaseConfig, type ServicePurchaseShape } from "@/lib/service-purchase";

interface OrderForBookingInput {
  bookingId: string;
  clientId: string;
  divinerId: string;
  serviceId: string;
  service: ServicePurchaseShape;
  amountCents: number;
  currency?: string;
  stripePaymentIntentId?: string | null;
  status?: string;
  paidAt?: string | null;
  notes?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminLikeClient = any;

export function getOrderStatusForService(
  service: ServicePurchaseShape,
  hasPaid: boolean
): string {
  if (!hasPaid) return "pending_payment";

  const purchaseConfig = getServicePurchaseConfig(service);
  return purchaseConfig.requiresPostPaymentIntake ? "awaiting_intake" : "paid";
}

export async function ensureOrderForBooking(
  admin: AdminLikeClient,
  input: OrderForBookingInput
): Promise<string> {
  const {
    bookingId,
    clientId,
    divinerId,
    serviceId,
    service,
    amountCents,
    currency = "usd",
    stripePaymentIntentId = null,
    status = getOrderStatusForService(service, amountCents >= 0 && !!stripePaymentIntentId),
    paidAt = null,
    notes = null,
  } = input;

  const payload: Record<string, unknown> = {
    booking_id: bookingId,
    client_id: clientId,
    diviner_id: divinerId,
    service_id: serviceId,
    service_type: service.category ?? null,
    product_title: service.name ?? "Reading",
    product_type: service.is_subscription ? "subscription" : "one_time",
    amount: amountCents / 100,
    amount_cents: amountCents,
    currency,
    status,
    stripe_payment_intent_id: stripePaymentIntentId,
    paid_at: paidAt,
    notes,
  };

  const { data: existingOrder, error: existingOrderError } = await admin
    .from("orders")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingOrderError) {
    throw new Error(existingOrderError.message ?? "Failed to look up order");
  }

  if (existingOrder?.id) {
    const { error: updateError } = await admin
      .from("orders")
      .update(payload)
      .eq("id", existingOrder.id);

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to update order");
    }

    return existingOrder.id;
  }

  const { data: createdOrder, error: insertError } = await admin
    .from("orders")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !createdOrder?.id) {
    throw new Error(insertError?.message ?? "Failed to create order");
  }

  return createdOrder.id;
}
