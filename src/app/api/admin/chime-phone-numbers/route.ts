import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_STATUSES = ["available", "assigned", "all"] as const;
type StatusFilter = (typeof ALLOWED_STATUSES)[number];

const PHONE_REGEX = /^\+?[0-9\s\-().]{6,20}$/;

/**
 * GET /api/admin/chime-phone-numbers
 *
 * Query: status = available | assigned | all   (default: all)
 *
 * Returns pool rows joined with the assigned diviner's display_name so the
 * admin pool view can show "AVAILABLE" vs "assigned to <diviner>".
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusRaw = req.nextUrl.searchParams.get("status") ?? "all";
  if (!ALLOWED_STATUSES.includes(statusRaw as StatusFilter)) {
    return NextResponse.json(
      { error: "Invalid status filter", allowed: ALLOWED_STATUSES },
      { status: 422 },
    );
  }
  const status = statusRaw as StatusFilter;

  const admin = createAdminClient();

  let query = admin
    .from("chime_phone_numbers")
    .select(
      `
      id,
      phone_number,
      phone_arn,
      status,
      assigned_diviner_id,
      assigned_at,
      notes,
      created_at,
      updated_at,
      assigned_diviner:diviners (
        id,
        display_name,
        username
      )
      `,
    )
    .order("status", { ascending: true })
    .order("phone_number", { ascending: true })
    .order("id", { ascending: true });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/chime-phone-numbers GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ numbers: data ?? [] });
}

/**
 * POST /api/admin/chime-phone-numbers
 *
 * Add a new unassigned Chime number to the pool. Admin uses this to seed
 * numbers from the AWS Chime console.
 *
 * Body: { phone_number: string (E.164 recommended), phone_arn?: string, notes?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneRaw = String(body.phone_number ?? "").trim();
  if (!phoneRaw || !PHONE_REGEX.test(phoneRaw)) {
    return NextResponse.json(
      { error: "phone_number is required and must look like a phone number" },
      { status: 422 },
    );
  }
  const phoneArn =
    typeof body.phone_arn === "string" ? body.phone_arn.trim() || null : null;
  const notes =
    typeof body.notes === "string" ? body.notes.trim() || null : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chime_phone_numbers")
    .insert({
      phone_number: phoneRaw,
      phone_arn: phoneArn,
      status: "available",
      notes,
    })
    .select("id, phone_number, phone_arn, status, notes, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That phone number is already in the pool" },
        { status: 409 },
      );
    }
    console.error("[admin/chime-phone-numbers POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ number: data }, { status: 201 });
}
