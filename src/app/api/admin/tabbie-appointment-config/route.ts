import { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAdminTabbieConfig,
  upsertTabbieConfig,
  validateTabbieConfigPayload,
  type TabbieAppointmentConfigPayload,
  FEATURE_KEY,
} from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/tabbie-appointment-config ─────────────────────────────────
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const config = await getAdminTabbieConfig();
  return Response.json({ ok: true, data: config });
}

// ─── PUT /api/admin/tabbie-appointment-config ─────────────────────────────────
export async function PUT(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  let body: Partial<TabbieAppointmentConfigPayload>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { type: "https://httpstatuses.com/400", title: "Invalid JSON", status: 400 },
      { status: 400 }
    );
  }

  const payload: TabbieAppointmentConfigPayload = {
    is_enabled: body.is_enabled ?? false,
    block_title: body.block_title ?? "",
    block_body: body.block_body ?? "",
    button_label: body.button_label ?? "Book Appointment",
    booking_link: body.booking_link ?? "",
    open_mode: body.open_mode ?? "same_tab",
    highlight_variant: body.highlight_variant ?? "info",
    helper_text: body.helper_text ?? null,
    success_message: body.success_message ?? null,
    cancelled_message: body.cancelled_message ?? null,
    post_booking_message: body.post_booking_message ?? null,
    display_priority: body.display_priority ?? 0,
  };

  const validation = validateTabbieConfigPayload(payload);
  if (!validation.ok) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation failed",
        status: 422,
        detail: (validation as { ok: false; error: string }).error,
      },
      { status: 422 }
    );
  }

  // Read old values for audit
  const oldConfig = await getAdminTabbieConfig();

  try {
    const updated = await upsertTabbieConfig(payload, user.email ?? "admin");

    // Audit the change
    const admin = createAdminClient();
    await admin.from("admin_activity_log").insert({
      admin_user_id: user.email ?? user.id,
      target_user_id: null,
      action_type: "tabbie_config_update",
      details: {
        feature_key: FEATURE_KEY,
        old: oldConfig ?? null,
        new: payload,
        version: updated.version,
      },
    }).maybeSingle();

    return Response.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[api/admin/tabbie-appointment-config] PUT error:", err);
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Internal error", status: 500 },
      { status: 500 }
    );
  }
}
