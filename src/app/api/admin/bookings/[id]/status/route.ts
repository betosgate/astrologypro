import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["completed", "no_show", "canceled", "confirmed"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

// POST /api/admin/bookings/[id]/status
// Body: { status: "completed" | "no_show" | "canceled" | "confirmed", reason?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: { status?: string; reason?: string };
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Support form POST from the admin detail page actions
      const form = await req.formData();
      body = {
        status: form.get("status")?.toString(),
        reason: form.get("reason")?.toString(),
      };
    }
  } catch {
    return Response.json(
      { type: "https://httpstatuses.com/422", title: "Invalid body", status: 422, detail: "Could not parse request body" },
      { status: 422 }
    );
  }

  const newStatus = body.status as AllowedStatus | undefined;
  if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Invalid status",
        status: 422,
        detail: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, status")
    .eq("id", id)
    .single();

  if (bErr || !booking) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "Booking not found" },
      { status: 404 }
    );
  }

  // Guard: cannot un-cancel, cannot re-complete
  if (booking.status === "canceled" && newStatus !== "confirmed") {
    return Response.json(
      { type: "https://httpstatuses.com/422", title: "Invalid transition", status: 422, detail: "Canceled bookings can only be re-confirmed by admin" },
      { status: 422 }
    );
  }

  const update: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "canceled") {
    update.canceled_at = new Date().toISOString();
    if (body.reason) update.cancellation_reason = body.reason;
  }

  const { error: updateError } = await admin
    .from("bookings")
    .update(update)
    .eq("id", id);

  if (updateError) {
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Update failed", status: 500, detail: updateError.message },
      { status: 500 }
    );
  }

  // If request came from a form POST, redirect back to the detail page
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    return Response.redirect(new URL(`/admin/bookings/${id}`, req.url), 303);
  }

  return Response.json({ success: true, id, status: newStatus });
}
