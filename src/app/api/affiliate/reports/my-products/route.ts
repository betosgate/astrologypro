// GET /api/affiliate/reports/my-products
// Active assignments the caller currently has — one row per
// [diviner, product] pair, with the current rate.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.io/${status}`, title, status },
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

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      `id, diviner_id, destination_type, destination_id,
       commission_type, commission_value, is_active, assigned_at, notes,
       diviner:diviners ( id, username, display_name, avatar_url )`,
    )
    .in("affiliate_id", ctx.junctionIds)
    .eq("affiliate_type", "diviner_affiliate")
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  type Row = {
    id: string;
    diviner_id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_id: string | null;
    commission_type: "percent" | "flat";
    commission_value: string | number;
    assigned_at: string;
    notes: string | null;
    diviner:
      | { id: string; username: string | null; display_name: string | null; avatar_url: string | null }
      | { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]
      | null;
  };
  const rows = ((assignments ?? []) as unknown as Row[]);

  const serviceTemplateIds = rows
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

  const items = rows.map((r) => {
    const div = Array.isArray(r.diviner) ? r.diviner[0] : r.diviner;
    return {
      assignment_id: r.id,
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
        username: div?.username ?? null,
        display_name: div?.display_name ?? "Unknown diviner",
        avatar_url: div?.avatar_url ?? null,
      },
    };
  });

  return NextResponse.json({ data: items });
}
