// /affiliate/campaigns/new
//
// Form to create a new tracking campaign against one of the caller's
// active assignments. Server fetches the assignment list (so the
// dropdown is pre-populated and validated server-side); the form
// itself is a client component that POSTs to
// /api/affiliate/assignments/[id]/campaigns.
//
// Spec: docs/specs/affiliate-commission-system.md §5 Flow C

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { CampaignCreateForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
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

  if (junctionIds.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        </header>
        <p className="text-muted-foreground">
          You don&rsquo;t have any active assignments yet, so there&rsquo;s
          nothing to create a campaign against.
        </p>
      </div>
    );
  }

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

  const options = rows.map((r) => {
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

  if (options.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        </header>
        <p className="text-muted-foreground">
          You don&rsquo;t have any active assignments yet. Once a diviner
          assigns you a product you&rsquo;ll be able to create campaigns
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        <p className="text-muted-foreground">
          A campaign is a unique referral link tied to one of your
          assignments. The commission rate is fixed by the diviner.
        </p>
      </header>
      <CampaignCreateForm
        options={options}
        preselectedAssignmentId={preselectedAssignmentId}
      />
    </div>
  );
}
