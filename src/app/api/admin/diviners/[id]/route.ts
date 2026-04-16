import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_ANSWER_MODES = ["browser", "mobile", "both"] as const;
type PhoneAnswerMode = (typeof VALID_ANSWER_MODES)[number];

/**
 * PATCH /api/admin/diviners/[id]
 * Admin-only: update phone answer settings for a diviner.
 * Accepted body: { phone_answer_mode, phone_mobile, phone_dialin_enabled }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing diviner id" }, { status: 400 });
    }

    const body = await request.json();

    // ── Validate phone_answer_mode ──────────────────────────────────────────
    const rawMode = body.phone_answer_mode;
    if (rawMode !== undefined) {
      if (!VALID_ANSWER_MODES.includes(rawMode as PhoneAnswerMode)) {
        return NextResponse.json(
          {
            error: `Invalid phone_answer_mode. Must be one of: ${VALID_ANSWER_MODES.join(", ")}`,
          },
          { status: 422 }
        );
      }
    }

    // ── Validate phone_mobile ───────────────────────────────────────────────
    const rawMobile: string | null = body.phone_mobile ?? null;
    if (rawMobile !== null && typeof rawMobile !== "string") {
      return NextResponse.json(
        { error: "phone_mobile must be a string or null" },
        { status: 422 }
      );
    }

    // ── Validate phone_dialin_enabled ─────────────────────────────────────────
    const rawDialin = body.phone_dialin_enabled;
    if (rawDialin !== undefined && typeof rawDialin !== "boolean") {
      return NextResponse.json(
        { error: "phone_dialin_enabled must be a boolean" },
        { status: 422 }
      );
    }

    // ── Build update payload (only allowed fields) ──────────────────────────
    const updates: Record<string, string | boolean | null> = {};
    if (rawMode !== undefined) updates.phone_answer_mode = rawMode as string;
    if ("phone_mobile" in body) updates.phone_mobile = rawMobile;
    if (rawDialin !== undefined) updates.phone_dialin_enabled = rawDialin;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // Verify diviner exists first (object-level authorization)
    const { data: existing } = await admin
      .from("diviners")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    const { error } = await admin
      .from("diviners")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Failed to update diviner phone settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("PATCH /api/admin/diviners/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
