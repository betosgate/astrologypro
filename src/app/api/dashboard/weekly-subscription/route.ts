import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPublicSectionBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";

function problemDetail(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// GET /api/dashboard/weekly-subscription
// Returns: { product, subscriber_count, active_subscribers, deliveries_sent, last_delivery_at }
export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();

  const [productResult, subscriberResult, deliveryResult] = await Promise.all([
    admin
      .from("weekly_subscription_products")
      .select("*")
      .eq("diviner_id", diviner.id)
      .maybeSingle(),

    admin
      .from("weekly_subscription_subscribers")
      .select("status", { count: "exact", head: false })
      .eq("diviner_id", diviner.id),

    admin
      .from("weekly_subscription_deliveries")
      .select("status, sent_at")
      .eq("diviner_id", diviner.id)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1),
  ]);

  if (productResult.error && productResult.error.code !== "PGRST116") {
    console.error("[GET /api/dashboard/weekly-subscription]", productResult.error);
    return problemDetail(500, "Internal Server Error", productResult.error.message);
  }

  const subscribers = subscriberResult.data ?? [];
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;

  const deliveries = deliveryResult.data ?? [];
  const lastDeliveryAt = deliveries[0]?.sent_at ?? null;

  // Count total sent deliveries
  const { count: deliveriesSent } = await admin
    .from("weekly_subscription_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("diviner_id", diviner.id)
    .eq("status", "sent");

  return NextResponse.json({
    product: productResult.data ?? null,
    subscriber_count: totalSubscribers,
    active_subscribers: activeSubscribers,
    deliveries_sent: deliveriesSent ?? 0,
    last_delivery_at: lastDeliveryAt,
  });
}

// POST /api/dashboard/weekly-subscription
// Body: { title, description?, price_cents, is_active }
// Creates or updates (upsert) the subscription product for this diviner
export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (isPublicSectionBlocked(publishPolicy, "weekly_subscription")) {
    return problemDetail(
      403,
      "Publishing blocked",
      publishBlockMessage(
        publishPolicy,
        "Weekly subscription publishing has been blocked by an administrator."
      )
    );
  }

  let body: {
    title?: unknown;
    description?: unknown;
    price_cents?: unknown;
    is_active?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const { title, description, price_cents, is_active } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return problemDetail(422, "Validation Error", "Field 'title' is required.");
  }
  if (price_cents === undefined || typeof price_cents !== "number" || price_cents < 0) {
    return problemDetail(422, "Validation Error", "Field 'price_cents' must be a non-negative number.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Check if product already exists
  const { data: existing } = await admin
    .from("weekly_subscription_products")
    .select("id")
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  let result;
  if (existing) {
    // Update
    result = await admin
      .from("weekly_subscription_products")
      .update({
        title: (title as string).trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        price_cents: price_cents as number,
        is_active: is_active === true,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    // Insert
    result = await admin
      .from("weekly_subscription_products")
      .insert({
        diviner_id: diviner.id,
        title: (title as string).trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        price_cents: price_cents as number,
        is_active: is_active === true,
      })
      .select()
      .single();
  }

  if (result.error) {
    console.error("[POST /api/dashboard/weekly-subscription]", result.error);
    return problemDetail(500, "Internal Server Error", result.error.message);
  }

  return NextResponse.json(result.data, { status: existing ? 200 : 201 });
}
