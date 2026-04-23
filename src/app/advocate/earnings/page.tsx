import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = { title: "Earnings - AstrologyPro" };

type AffiliateType = "social_advocate" | "diviner_affiliate";

async function resolveAffiliate(userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: advocate } = await admin
    .from("social_advocates")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (advocate) {
    return { affiliateId: advocate.id as string, affiliateType: "social_advocate" as AffiliateType };
  }
  const { data: divAff } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (divAff) {
    return { affiliateId: divAff.id as string, affiliateType: "diviner_affiliate" as AffiliateType };
  }
  return null;
}

export default async function AdvocateEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const ctx = await resolveAffiliate(user.id, admin);
  if (!ctx) redirect("/join/advocate");
  const { affiliateId, affiliateType } = ctx;

  // Pull assignments + owner-campaigns + conversions in parallel. The
  // assignment view is what lets this page show "Test Diviner 1" even
  // before any conversions have been credited.
  const [assignmentsRes, ownerCampaignsRes, conversionsRes] = await Promise.all([
    admin
      .from("diviner_service_affiliates")
      .select("id, diviner_id, destination_type, destination_id, is_active")
      .eq("affiliate_id", affiliateId)
      .eq("affiliate_type", affiliateType),
    admin
      .from("affiliate_campaigns")
      .select(
        "id, diviner_id, name, status, campaign_code, destination_type, destination_service_template_id, source_assignment_id"
      )
      .eq("owner_type", "affiliate")
      .eq("owner_affiliate_id", affiliateId)
      .eq("owner_affiliate_type", affiliateType),
    admin
      .from("campaign_conversions")
      .select(
        "id, campaign_id, converted_at, order_amount_cents, commission_amount_cents, reversed_at, booking_id"
      )
      .eq("affiliate_id", affiliateId)
      .eq("affiliate_type", affiliateType)
      .order("converted_at", { ascending: false })
      .limit(200),
  ]);
  const conversionsData = conversionsRes.data ?? [];
  const assignmentsData = (assignmentsRes.data ?? []) as Array<{
    id: string;
    diviner_id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_id: string | null;
    is_active: boolean;
  }>;
  const ownerCampaigns = (ownerCampaignsRes.data ?? []) as Array<{
    id: string;
    diviner_id: string | null;
    name: string;
    status: string;
    campaign_code: string | null;
    destination_type: string | null;
    destination_service_template_id: string | null;
    source_assignment_id: string | null;
  }>;

  const conversions = conversionsData;
  const liveConversions = conversions.filter((c) => !c.reversed_at);

  const totalEarnedCents = liveConversions.reduce(
    (sum, c) => sum + Number(c.commission_amount_cents ?? 0),
    0,
  );
  const totalReversedCents = conversions
    .filter((c) => c.reversed_at)
    .reduce((sum, c) => sum + Number(c.commission_amount_cents ?? 0), 0);
  // Treat all live (non-reversed) commission as pending until a payout
  // system exists. This keeps the surface honest rather than invented.
  const pendingCents = totalEarnedCents;

  // Build a campaign map that spans both: campaigns I own (so the
  // assignment panel has data even at zero conversions) AND campaigns
  // that appear in historic conversions (so labels still resolve if a
  // campaign was reassigned / hidden).
  const campaignById = new Map<string, {
    name: string;
    diviner_id: string | null;
    destination_type: string | null;
    destination_service_template_id: string | null;
  }>();
  for (const c of ownerCampaigns) {
    campaignById.set(c.id, {
      name: c.name ?? "Campaign",
      diviner_id: c.diviner_id,
      destination_type: c.destination_type,
      destination_service_template_id: c.destination_service_template_id,
    });
  }
  const legacyCampaignIds = Array.from(
    new Set(liveConversions.map((c) => c.campaign_id as string)),
  ).filter((id) => !campaignById.has(id));
  if (legacyCampaignIds.length > 0) {
    const { data: camps } = await admin
      .from("affiliate_campaigns")
      .select("id, name, diviner_id, destination_type, destination_service_template_id")
      .in("id", legacyCampaignIds);
    for (const c of camps ?? []) {
      campaignById.set(c.id as string, {
        name: (c.name as string) ?? "Campaign",
        diviner_id: (c.diviner_id as string | null) ?? null,
        destination_type: (c.destination_type as string | null) ?? null,
        destination_service_template_id:
          (c.destination_service_template_id as string | null) ?? null,
      });
    }
  }

  // Assignment destinations aren't part of affiliate_campaigns so we
  // collect their diviners / service-template ids directly.
  const divinerIdsFromAssignments = assignmentsData.map((a) => a.diviner_id);
  const serviceIdsFromAssignments = assignmentsData
    .filter((a) => a.destination_type === "SERVICE")
    .map((a) => a.destination_id)
    .filter(Boolean) as string[];

  const divinerIds = Array.from(new Set([
    ...(Array.from(campaignById.values()).map((c) => c.diviner_id).filter(Boolean) as string[]),
    ...divinerIdsFromAssignments,
  ]));
  const divinerNameById = new Map<string, string>();
  const divinerUsernameById = new Map<string, string>();
  if (divinerIds.length > 0) {
    const { data: divs } = await admin
      .from("diviners")
      .select("id, display_name, username")
      .in("id", divinerIds);
    for (const d of divs ?? []) {
      divinerNameById.set(
        d.id as string,
        (d.display_name as string | null) ?? (d.username as string | null) ?? "Diviner",
      );
      if (d.username) divinerUsernameById.set(d.id as string, d.username as string);
    }
  }

  const templateIds = Array.from(new Set([
    ...(Array.from(campaignById.values())
      .map((c) => c.destination_service_template_id)
      .filter(Boolean) as string[]),
    ...serviceIdsFromAssignments,
  ]));
  const templateNameById = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: tpls } = await admin
      .from("service_templates")
      .select("id, name")
      .in("id", templateIds);
    for (const t of tpls ?? []) {
      templateNameById.set(t.id as string, (t.name as string) ?? "Service");
    }
  }

  // Per-diviner assignment summary: all assignments with a given diviner,
  // their scoped campaigns, and the commission accrued from those
  // campaigns so far.
  const commissionByCampaign = new Map<string, number>();
  const conversionsByCampaign = new Map<string, number>();
  for (const c of liveConversions) {
    const cid = c.campaign_id as string;
    commissionByCampaign.set(
      cid,
      (commissionByCampaign.get(cid) ?? 0) + Number(c.commission_amount_cents ?? 0),
    );
    conversionsByCampaign.set(cid, (conversionsByCampaign.get(cid) ?? 0) + 1);
  }

  type DivinerRow = {
    diviner_id: string;
    diviner_name: string;
    diviner_username: string | null;
    campaigns: number;
    active_assignments: number;
    conversions: number;
    commission_cents: number;
  };
  const divinerRowMap = new Map<string, DivinerRow>();
  for (const a of assignmentsData) {
    const entry =
      divinerRowMap.get(a.diviner_id) ?? {
        diviner_id: a.diviner_id,
        diviner_name: divinerNameById.get(a.diviner_id) ?? "Diviner",
        diviner_username: divinerUsernameById.get(a.diviner_id) ?? null,
        campaigns: 0,
        active_assignments: 0,
        conversions: 0,
        commission_cents: 0,
      };
    if (a.is_active) entry.active_assignments++;
    divinerRowMap.set(a.diviner_id, entry);
  }
  for (const camp of ownerCampaigns) {
    if (!camp.diviner_id) continue;
    const entry =
      divinerRowMap.get(camp.diviner_id) ?? {
        diviner_id: camp.diviner_id,
        diviner_name: divinerNameById.get(camp.diviner_id) ?? "Diviner",
        diviner_username: divinerUsernameById.get(camp.diviner_id) ?? null,
        campaigns: 0,
        active_assignments: 0,
        conversions: 0,
        commission_cents: 0,
      };
    entry.campaigns++;
    entry.conversions += conversionsByCampaign.get(camp.id) ?? 0;
    entry.commission_cents += commissionByCampaign.get(camp.id) ?? 0;
    divinerRowMap.set(camp.diviner_id, entry);
  }
  const divinerRows = Array.from(divinerRowMap.values()).sort(
    (a, b) => b.commission_cents - a.commission_cents || a.diviner_name.localeCompare(b.diviner_name),
  );

  const recent = liveConversions.slice(0, 8).map((c) => {
    const camp = campaignById.get(c.campaign_id as string);
    const divinerName = camp?.diviner_id
      ? divinerNameById.get(camp.diviner_id) ?? "Diviner"
      : "Diviner";
    const serviceLabel =
      camp?.destination_type === "SERVICE" && camp.destination_service_template_id
        ? templateNameById.get(camp.destination_service_template_id) ?? camp.name
        : camp?.name ?? "Campaign";
    return {
      id: c.id as string,
      divinerName,
      serviceLabel,
      converted_at: c.converted_at as string,
      commission_amount_cents: Number(c.commission_amount_cents ?? 0),
    };
  });

  const stats = [
    { icon: DollarSign, label: "Total Earned (30d live)", value: fmt(totalEarnedCents) },
    { icon: TrendingUp, label: "Reversed", value: fmt(totalReversedCents) },
    { icon: Clock, label: "Pending Payout", value: fmt(pendingCents) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">Your commission history and payout status</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="size-4" /> {s.label}
                </CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Diviners</CardTitle>
          <CardDescription>
            Diviners who have given you active assignments. Commission accrues from
            any campaigns you create under each assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {divinerRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignments yet. Ask a diviner to add you on their assignments page.
            </p>
          ) : (
            <div className="space-y-3">
              {divinerRows.map((row) => (
                <div
                  key={row.diviner_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{row.diviner_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.active_assignments} active assignment
                      {row.active_assignments === 1 ? "" : "s"} · {row.campaigns} campaign
                      {row.campaigns === 1 ? "" : "s"} · {row.conversions} conversion
                      {row.conversions === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(row.commission_cents)}</p>
                    <p className="text-[10px] text-muted-foreground">earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Commissions</CardTitle>
          <CardDescription>
            Latest conversions credited via your affiliate-owned campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4 text-amber-500" />
                Pending
              </div>
              <p className="mt-2 text-2xl font-bold">{fmt(pendingCents)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 text-blue-500" />
                Conversions
              </div>
              <p className="mt-2 text-2xl font-bold">{liveConversions.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                Reversed
              </div>
              <p className="mt-2 text-2xl font-bold">{conversions.length - liveConversions.length}</p>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No commission activity yet. Share a campaign link from your assignments page to start earning.
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{row.divinerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.serviceLabel} · {new Date(row.converted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{fmt(row.commission_amount_cents)}</span>
                    <Badge variant="secondary" className="capitalize">earned</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Payouts are processed monthly. Contact support for payout requests or discrepancies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
