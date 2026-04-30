// /affiliate/campaigns/new
//
// Two-mode form:
//   ?assignment=<id> → per-diviner mode (existing v2 path)
//   ?template=<id>   → general-program mode (Phase 1.5)
//   neither          → the user picks a mode (defaults to whichever has
//                       options available)
//
// Spec: docs/specs/affiliate-commission-system.md §5 Flow C, §10 Phase 1.5
// Task: docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/05-affiliate-ui.md

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { CampaignCreateForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; template?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/campaigns/new");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { junctionIds } = ctx;
  const params = await searchParams;
  const preselectedAssignmentId = params.assignment ?? null;
  const preselectedTemplateId = params.template ?? null;

  // Per-diviner assignment options (existing path).
  let assignmentOptions: { id: string; label: string }[] = [];
  if (junctionIds.length > 0) {
    const { data: assignments } = await admin
      .from("diviner_service_affiliates")
      .select(
        `id, destination_type, destination_id,
         commission_type, commission_value,
         diviner:diviners ( display_name )`,
      )
      .in("affiliate_id", junctionIds)
      .eq("affiliate_type", "diviner_affiliate")
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    type Row = {
      id: string;
      destination_type: "PROFILE" | "SERVICE";
      destination_id: string | null;
      commission_type: "percent" | "flat";
      commission_value: string | number;
      diviner:
        | { display_name: string | null }
        | { display_name: string | null }[]
        | null;
    };

    const rows = (assignments ?? []) as unknown as Row[];

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

    assignmentOptions = rows.map((r) => {
      const div = Array.isArray(r.diviner) ? r.diviner[0] : r.diviner;
      const product =
        r.destination_type === "PROFILE"
          ? `${div?.display_name ?? "Diviner"} (entire profile)`
          : `${serviceNameById.get(r.destination_id ?? "") ?? "Service"} — ${div?.display_name ?? "Diviner"}`;
      const rate =
        r.commission_type === "flat"
          ? `$${Number(r.commission_value).toFixed(2)} flat`
          : `${r.commission_value}%`;
      return {
        id: r.id,
        label: `${product} (${rate})`,
      };
    });
  }

  // General product options (Phase 1.5). Available to every active
  // affiliate regardless of partnerships.
  const { data: generalTemplates } = await admin
    .from("service_templates")
    .select("id, name, commission_type, commission_value")
    .eq("is_general", true)
    .eq("affiliate_program_enabled", true)
    .order("name");

  const templateOptions = (generalTemplates ?? []).map((t) => {
    const value =
      t.commission_value === null || t.commission_value === undefined
        ? 10
        : Number(t.commission_value);
    const isDefault =
      t.commission_value === null || t.commission_value === undefined;
    const rate =
      t.commission_type === "flat"
        ? `$${value.toFixed(2)} flat`
        : `${value}%${isDefault ? " (default)" : ""}`;
    return {
      id: t.id as string,
      label: `${t.name as string} (${rate})`,
    };
  });

  if (assignmentOptions.length === 0 && templateOptions.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        </header>
        <p className="text-muted-foreground">
          You don&rsquo;t have any active assignments yet, and no general
          products are currently enabled. Once a diviner assigns you a
          product or the platform turns on a general program, you&rsquo;ll
          be able to create campaigns here.
        </p>
      </div>
    );
  }

  // Resolve initial mode. Explicit query param wins; otherwise pick
  // whichever pool has options (per-diviner first when both exist).
  const initialMode: "per-diviner" | "general" = preselectedTemplateId
    ? "general"
    : preselectedAssignmentId
      ? "per-diviner"
      : assignmentOptions.length > 0
        ? "per-diviner"
        : "general";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        <p className="text-muted-foreground">
          A campaign is a unique referral link tied to one of your products.
          The commission rate is fixed by the diviner (per-product) or the
          platform (general).
        </p>
      </header>
      <CampaignCreateForm
        assignmentOptions={assignmentOptions}
        templateOptions={templateOptions}
        preselectedAssignmentId={preselectedAssignmentId}
        preselectedTemplateId={preselectedTemplateId}
        initialMode={initialMode}
      />
    </div>
  );
}
