import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, diviner: null };

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, diviner };
}

// PATCH /api/dashboard/giveaways/[id]
// Update title, description, prize_description, ends_at, status
// Soft-delete via status = 'cancelled'
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, diviner } = await getAuthenticatedDiviner();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");
  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const admin = createAdminClient();

  // Object-level auth: ensure this giveaway belongs to this diviner
  const { data: existing } = await admin
    .from("giveaways")
    .select("id, status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!existing) return problem(404, "Not Found", "Giveaway not found.");

  const allowedStatuses = ["draft", "active", "ended", "cancelled"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || (body.title as string).trim() === "") {
      return problem(422, "Validation Error", "title must be a non-empty string.");
    }
    updates.title = (body.title as string).trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() : null;
  }
  if (body.prize_description !== undefined) {
    if (typeof body.prize_description !== "string" || (body.prize_description as string).trim() === "") {
      return problem(422, "Validation Error", "prize_description must be a non-empty string.");
    }
    updates.prize_description = (body.prize_description as string).trim();
  }
  if (body.ends_at !== undefined) {
    updates.ends_at = body.ends_at ?? null;
  }
  if (body.starts_at !== undefined) {
    updates.starts_at = body.starts_at ?? null;
  }
  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status as string)) {
      return problem(422, "Validation Error", `status must be one of: ${allowedStatuses.join(", ")}.`);
    }
    updates.status = body.status;
  }
  if (body.is_public !== undefined) {
    updates.is_public = Boolean(body.is_public);
  }

  const { data: updated, error } = await admin
    .from("giveaways")
    .update(updates)
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .select()
    .single();

  if (error) {
    console.error("[dashboard/giveaways/[id]] update error", error);
    return problem(500, "Internal Server Error", "Failed to update giveaway.");
  }

  return NextResponse.json(updated);
}

// DELETE /api/dashboard/giveaways/[id]
// Soft delete — sets status to 'cancelled'
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, diviner } = await getAuthenticatedDiviner();
  if (!user) return problem(401, "Unauthorized", "Authentication required.");
  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("giveaways")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!existing) return problem(404, "Not Found", "Giveaway not found.");

  const { error } = await admin
    .from("giveaways")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("diviner_id", diviner.id);

  if (error) {
    console.error("[dashboard/giveaways/[id]] delete error", error);
    return problem(500, "Internal Server Error", "Failed to archive giveaway.");
  }

  return new NextResponse(null, { status: 204 });
}
