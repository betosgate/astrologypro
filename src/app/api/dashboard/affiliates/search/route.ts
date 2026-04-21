/**
 * GET /api/dashboard/affiliates/search?q=&limit=&exclude_scope=&exclude_destination_id=
 *
 * Search-as-you-type endpoint for the Create Assignment combobox.
 * Returns up to `limit` affiliates across both `social_advocates` and
 * `diviner_affiliates`, deduped by id.
 *
 * When `exclude_scope` + (optional) `exclude_destination_id` are passed,
 * rows that already have an active assignment at that scope for THIS
 * diviner are marked `already_assigned_to_scope = true` (NOT filtered
 * out — the UI renders them disabled).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getDiviner() {
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
  return diviner ? { user, diviner, admin } : null;
}

export async function GET(req: NextRequest) {
  const ctx = await getDiviner();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { diviner, admin } = ctx;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "", 10);
  const defaultLimit = q.length === 0 ? 5 : 20;
  const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : defaultLimit), 50);

  const excludeScope = url.searchParams.get("exclude_scope") as
    | "PROFILE"
    | "SERVICE"
    | null;
  const excludeDestinationId = url.searchParams.get("exclude_destination_id");

  // Fetch from both tables in parallel. Filter by name/email contains (q).
  // Supabase .ilike with OR: use .or() with comma-separated ilike clauses.
  const ilikeFilter = q
    ? `name.ilike.%${q}%,email.ilike.%${q}%`
    : null;

  async function loadTable(table: "social_advocates" | "diviner_affiliates") {
    let query = admin
      .from(table)
      .select("id, name, email")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (ilikeFilter) query = query.or(ilikeFilter);
    const { data } = await query;
    return (data ?? []).map((r: { id: string; name: string; email: string }) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      affiliate_type:
        table === "social_advocates"
          ? ("social_advocate" as const)
          : ("diviner_affiliate" as const),
    }));
  }

  const [advocates, divAffs] = await Promise.all([
    loadTable("social_advocates"),
    loadTable("diviner_affiliates"),
  ]);

  // Dedupe by id (preserving first occurrence; advocates listed first)
  const seen = new Set<string>();
  const merged: Array<{
    id: string;
    name: string;
    email: string;
    affiliate_type: "social_advocate" | "diviner_affiliate";
  }> = [];
  for (const row of [...advocates, ...divAffs]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }

  // Sort: alphabetic by name
  merged.sort((a, b) => a.name.localeCompare(b.name));
  const capped = merged.slice(0, limit);

  // Flag "already assigned to this scope" for UI disable
  let alreadyAssignedIds: Set<string> = new Set();
  if (excludeScope === "PROFILE" || excludeScope === "SERVICE") {
    let existingQ = admin
      .from("diviner_service_affiliates")
      .select("affiliate_id, affiliate_type")
      .eq("diviner_id", diviner.id)
      .eq("destination_type", excludeScope)
      .eq("is_active", true);
    if (excludeScope === "SERVICE" && excludeDestinationId) {
      existingQ = existingQ.eq("destination_id", excludeDestinationId);
    } else if (excludeScope === "PROFILE") {
      existingQ = existingQ.is("destination_id", null);
    }
    const { data: existingRows } = await existingQ;
    alreadyAssignedIds = new Set(
      ((existingRows ?? []) as Array<{ affiliate_id: string }>).map((r) => r.affiliate_id)
    );
  }

  return NextResponse.json({
    affiliates: capped.map((r) => ({
      ...r,
      already_assigned_to_scope: alreadyAssignedIds.has(r.id),
    })),
  });
}
