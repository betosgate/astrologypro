import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/testimonials/requests — list all
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("testimonial_requests")
    .select("*, diviners(display_name)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
}

// POST /api/admin/testimonials/requests — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    requested_to_name?: string;
    requested_to_email?: string;
    requested_to_phone_no?: string | null;
    testimonial_for?: string | null;
    notes?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    requested_to_name,
    requested_to_email,
    requested_to_phone_no,
    testimonial_for,
    notes,
  } = body;

  if (
    !requested_to_name ||
    typeof requested_to_name !== "string" ||
    !requested_to_name.trim()
  ) {
    return NextResponse.json(
      { error: "Customer name is required." },
      { status: 400 }
    );
  }
  if (
    !requested_to_email ||
    typeof requested_to_email !== "string" ||
    !requested_to_email.trim()
  ) {
    return NextResponse.json(
      { error: "Customer email is required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonial_requests")
    .insert({
      requested_to_name: requested_to_name.trim(),
      requested_to_email: requested_to_email.trim().toLowerCase(),
      requested_to_phone_no: requested_to_phone_no ?? null,
      testimonial_for: testimonial_for ?? null,
      notes: notes ?? null,
      created_by: user.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
}
