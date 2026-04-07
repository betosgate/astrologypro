import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_PREFS = {
  email_marketing: true,
  email_product_updates: true,
  email_booking_reminders: true,
  email_session_summaries: true,
  email_payment_receipts: true,
  sms_booking_reminders: false,
  sms_marketing: false,
  push_enabled: false,
  unsubscribed_all: false,
};

// ─── GET /api/admin/users/:id/communication-preferences ───────────────────────
// Returns the communication_preferences row for this user (or defaults if not set).
// Admin or self (user_id = auth.uid()).

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Allow admin OR self
  const isAdmin = !!(await getAdminUser());

  if (!isAdmin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("communication_preferences")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return defaults if no row exists yet
  return NextResponse.json(data ?? { user_id: id, ...DEFAULT_PREFS });
}

// ─── PUT /api/admin/users/:id/communication-preferences ───────────────────────
// Upserts the communication_preferences row.
// Admin or self (user_id = auth.uid()).

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Allow admin OR self
  const isAdmin = !!(await getAdminUser());

  if (!isAdmin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json();

  // Allowlist the fields that can be updated — never allow user_id to be overridden
  const allowedFields = [
    "email_marketing",
    "email_product_updates",
    "email_booking_reminders",
    "email_session_summaries",
    "email_payment_receipts",
    "sms_booking_reminders",
    "sms_marketing",
    "push_enabled",
    "unsubscribed_all",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { user_id: id, updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = !!body[field]; // coerce to boolean
    }
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("communication_preferences")
    .upsert(updates, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
