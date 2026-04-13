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

export function getOrderStatusForService(
  service: ServicePurchaseShape,
  hasPaid: boolean
): string {
  if (!hasPaid) return "pending_payment";

  const purchaseConfig = getServicePurchaseConfig(service);
  return purchaseConfig.requiresPostPaymentIntake ? "awaiting_intake" : "paid";
}

export async function ensureOrderForBooking(
  admin: { from: (table: string) => unknown },
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

  const ordersTable = admin.from("orders") as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            client_id?: string | null;
            diviner_id?: string | null;
            service_id?: string | null;
            stripe_payment_intent_id?: string | null;
          } | null;
          error: { message?: string } | null;
        }>;
      };
    };
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message?: string } | null;
        }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message?: string } | null }>;
    };
  };

  const { data: existingOrder, error: existingOrderError } = await ordersTable
    .select("id, client_id, diviner_id, service_id, stripe_payment_intent_id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingOrderError) {
    throw new Error(existingOrderError.message ?? "Failed to look up order");
  }

  if (existingOrder?.id) {
    if (
      existingOrder.client_id &&
      existingOrder.client_id !== clientId
    ) {
      throw new Error("Existing order client does not match booking client");
    }

    if (
      existingOrder.diviner_id &&
      existingOrder.diviner_id !== divinerId
    ) {
      throw new Error("Existing order diviner does not match booking diviner");
    }

    if (
      existingOrder.service_id &&
      existingOrder.service_id !== serviceId
    ) {
      throw new Error("Existing order service does not match booking service");
    }

    if (
      stripePaymentIntentId &&
      existingOrder.stripe_payment_intent_id &&
      existingOrder.stripe_payment_intent_id !== stripePaymentIntentId
    ) {
      throw new Error("Existing order payment intent does not match booking payment");
    }

    const { error: updateError } = await ordersTable
      .update(payload)
      .eq("id", existingOrder.id);

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to update order");
    }

    return existingOrder.id;
  }

  const { data: createdOrder, error: insertError } = await ordersTable
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !createdOrder?.id) {
    throw new Error(insertError?.message ?? "Failed to create order");
  }

  return createdOrder.id;
}
