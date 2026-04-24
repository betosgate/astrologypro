// GET /api/affiliate/assignments
//
// Lists the caller's active assignments (`diviner_service_affiliates`)
// scoped to diviner-affiliate partnerships the caller currently has.
// Each row includes the diviner's display info so the affiliate UI can
// pick an assignment to create a campaign against (see Task 03 POST
// /api/affiliate/assignments/[id]/campaigns).
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/03-affiliate-campaign-selfserve.md
// Spec: docs/specs/affiliate-commission-system.md §5 Flow C

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { junctionIds } = ctx;

  if (junctionIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Fetch all active assignments for the caller's junctions, joined to
  // the assigning diviner's display fields. `diviner_service_affiliates`
  // stores rate in the ('percent','flat') enum.
  const { data, error } = await admin
    .from("diviner_service_affiliates")
    .select(
      `id, diviner_id, destination_type, destination_id,
       commission_type, commission_value, is_active, assigned_at, notes,
       diviner:diviners ( id, username, display_name, avatar_url )`,
    )
    .in("affiliate_id", junctionIds)
    .eq("affiliate_type", "diviner_affiliate")
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  if (error) return problem(500, "Database error", error.message);

  type Row = {
    id: string;
    diviner_id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_id: string | null;
    commission_type: "percent" | "flat";
    commission_value: string | number;
    is_active: boolean;
    assigned_at: string;
    notes: string | null;
    diviner: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  // For SERVICE-scoped assignments, optionally resolve the service template
  // name so the UI can show what product the assignment covers.
  const serviceTemplateIds = ((data ?? []) as unknown as Row[])
    .filter((r) => r.destination_type === "SERVICE" && r.destination_id)
    .map((r) => r.destination_id as string);

  const serviceNameById = new Map<string, string>();
  if (serviceTemplateIds.length > 0) {
    const { data: templates } = await admin
      .from("service_templates")
      .select("id, name")
      .in("id", serviceTemplateIds);
    for (const t of templates ?? []) {
      serviceNameById.set(t.id as string, (t.name as string) ?? "Service");
    }
  }

  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    destination_type: r.destination_type,
    destination_id: r.destination_id,
    destination_name:
      r.destination_type === "PROFILE"
        ? "Entire profile"
        : serviceNameById.get(r.destination_id ?? "") ?? "Service",
    commission_type: r.commission_type,
    commission_value: Number(r.commission_value),
    assigned_at: r.assigned_at,
    notes: r.notes,
    diviner: {
      id: r.diviner_id,
      username: r.diviner?.username ?? null,
      display_name: r.diviner?.display_name ?? "Unknown diviner",
      avatar_url: r.diviner?.avatar_url ?? null,
    },
  }));

  return NextResponse.json({ data: rows });
}
