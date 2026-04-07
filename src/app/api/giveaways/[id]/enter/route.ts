import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  // Parse body
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { name, email, ...extraFields } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "name is required." },
      { status: 422 }
    );
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "A valid email is required." },
      { status: 422 }
    );
  }

  // Fetch giveaway
  const { data: giveaway, error: giveawayError } = await admin
    .from("giveaways")
    .select("id, status, is_public, max_entries, ends_at")
    .eq("id", id)
    .maybeSingle();

  if (giveawayError || !giveaway) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found." },
      { status: 404 }
    );
  }

  if (giveaway.status !== "active" || !giveaway.is_public) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404, detail: "Giveaway not found or not active." },
      { status: 404 }
    );
  }

  // Check ends_at
  if (giveaway.ends_at && new Date(giveaway.ends_at) < new Date()) {
    return NextResponse.json(
      { type: "about:blank", title: "Giveaway ended", status: 409, detail: "This giveaway has ended." },
      { status: 409 }
    );
  }

  // Check max_entries
  if (giveaway.max_entries !== null && giveaway.max_entries !== undefined) {
    const { count } = await admin
      .from("giveaway_entries")
      .select("id", { count: "exact", head: true })
      .eq("giveaway_id", id);

    if ((count ?? 0) >= giveaway.max_entries) {
      return NextResponse.json(
        { type: "about:blank", title: "Giveaway full", status: 409, detail: "All spots have been filled." },
        { status: 409 }
      );
    }
  }

  // Get IP
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Insert entry
  const { data: entry, error: insertError } = await admin
    .from("giveaway_entries")
    .insert({
      giveaway_id: id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      extra_fields: Object.keys(extraFields).length > 0 ? extraFields : {},
      ip_address: ipAddress,
    })
    .select("id")
    .single();

  if (insertError) {
    // PostgreSQL unique violation: code 23505
    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          type: "about:blank",
          title: "Already entered",
          status: 409,
          detail: "This email has already been entered.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { id: entry.id, message: "You've been entered!" },
    { status: 201 }
  );
}
