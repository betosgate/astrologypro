import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendImmediateWeeklyDelivery } from "@/lib/weekly-deliveries";

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// GET /api/dashboard/weekly-subscription/deliveries
// Returns past and scheduled deliveries ordered by scheduled_for DESC, id DESC
export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("weekly_subscription_deliveries")
    .select("id, subject, content, scheduled_for, sent_at, recipient_count, status, created_at")
    .eq("diviner_id", diviner.id)
    .order("scheduled_for", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[GET /api/dashboard/weekly-subscription/deliveries]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json({ deliveries: data ?? [] });
}

// POST /api/dashboard/weekly-subscription/deliveries
// Body: { subject, content, scheduled_at? }
// If scheduled_at is null/absent → send immediately (status='sent', sent_at=now, recipient_count from active subscribers)
// If scheduled_at is set → status='scheduled'
export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  let body: {
    subject?: unknown;
    content?: unknown;
    scheduled_at?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const { subject, content, scheduled_at } = body;

  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return problemDetail(422, "Validation Error", "Field 'subject' is required.");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return problemDetail(422, "Validation Error", "Field 'content' is required.");
  }

  const admin = createAdminClient();

  // Verify the diviner has a subscription product
  const { data: product, error: prodErr } = await admin
    .from("weekly_subscription_products")
    .select("id")
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (prodErr || !product) {
    return problemDetail(422, "Validation Error", "You must set up a subscription product before sending deliveries.");
  }

  const now = new Date().toISOString();
  const isSendNow = !scheduled_at;

  let status: "sent" | "scheduled" = "scheduled";
  let sentAt: string | null = null;
  let scheduledFor: string = now;
  let recipientCount = 0;

  if (isSendNow) {
    status = "sent";
    sentAt = now;
    scheduledFor = now;

    recipientCount = await sendImmediateWeeklyDelivery({
      divinerId: diviner.id,
      subject: (subject as string).trim(),
      content: (content as string).trim(),
    });
  } else {
    if (typeof scheduled_at !== "string") {
      return problemDetail(422, "Validation Error", "Field 'scheduled_at' must be an ISO 8601 date string.");
    }
    const parsedDate = new Date(scheduled_at);
    if (isNaN(parsedDate.getTime())) {
      return problemDetail(422, "Validation Error", "Field 'scheduled_at' must be a valid ISO 8601 date.");
    }
    if (parsedDate <= new Date()) {
      return problemDetail(422, "Validation Error", "Field 'scheduled_at' must be a future date.");
    }
    scheduledFor = parsedDate.toISOString();
  }

  const { data: delivery, error } = await admin
    .from("weekly_subscription_deliveries")
    .insert({
      product_id: product.id,
      diviner_id: diviner.id,
      subject: (subject as string).trim(),
      content: (content as string).trim(),
      scheduled_for: scheduledFor,
      sent_at: sentAt,
      recipient_count: recipientCount,
      status,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/dashboard/weekly-subscription/deliveries]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json(delivery, { status: 201 });
}
