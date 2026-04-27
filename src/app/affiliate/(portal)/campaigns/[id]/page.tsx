// /affiliate/campaigns/[id]
// Per-campaign detail for an affiliate-owned campaign. Shows campaign
// metadata, KPIs, recent conversions, and an "Archive" button.
//
// 404s on cross-junction access — same as the GET endpoint.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ExternalLink,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { ArchiveCampaignButton } from "./archive-button";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "archived" || status === "expired") return "outline";
  return "secondary";
}

export default async function AffiliateCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/affiliate/campaigns/${id}`);

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, campaign_code, name, description, status, owner_affiliate_id, owner_affiliate_type, diviner_id, share_url, channel, utm_source, utm_medium, utm_campaign, destination_type, destination_service_template_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (
    !campaign ||
    campaign.owner_affiliate_type !== "diviner_affiliate" ||
    !ctx.junctionIds.includes(campaign.owner_affiliate_id as string)
  ) {
    notFound();
  }

  // Resolve diviner display + service name for the destination.
  const [{ data: diviner }, { data: template }] = await Promise.all([
    admin
      .from("diviners")
      .select("id, username, display_name")
      .eq("id", campaign.diviner_id as string)
      .maybeSingle(),
    campaign.destination_service_template_id
      ? admin
          .from("service_templates")
          .select("name")
          .eq("id", campaign.destination_service_template_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const destinationName =
    campaign.destination_type === "PROFILE"
      ? `${diviner?.display_name ?? "Diviner"}'s profile`
      : (template?.name as string | null) ?? "Service";

  // KPIs: clicks count + conversions (with rate audit).
  const [{ count: totalClicks }, { data: conversions }] = await Promise.all([
    admin
      .from("campaign_clicks")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", id),
    admin
      .from("campaign_conversions")
      .select(
        "id, booking_id, order_amount_cents, commission_amount_cents, rate_type_used, rate_value_used, reversed_at, created_at",
      )
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  let earnedCents = 0;
  let reversedCents = 0;
  let conversionsCount = 0;
  for (const c of conversions ?? []) {
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) reversedCents += cents;
    else {
      conversionsCount += 1;
      earnedCents += cents;
    }
  }

  const archivable = campaign.status === "active" || campaign.status === "paused";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/affiliate/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> All campaigns
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {campaign.name ?? "Untitled campaign"}
          </h1>
          <p className="text-muted-foreground">
            Campaign on{" "}
            <span className="font-medium text-foreground">{destinationName}</span>
            {" · "}
            <Badge variant={statusVariant(campaign.status as string)}>
              {campaign.status as string}
            </Badge>
          </p>
        </div>
        {archivable && (
          <ArchiveCampaignButton campaignId={campaign.id as string} />
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Share URL</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <code className="flex-1 break-all rounded border bg-muted px-3 py-2 text-sm">
            {campaign.share_url}
          </code>
          {campaign.share_url && (
            <a
              href={campaign.share_url as string}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Open <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total clicks" value={(totalClicks ?? 0).toLocaleString()} icon={MousePointerClick} />
        <Kpi label="Conversions" value={String(conversionsCount)} icon={TrendingUp} />
        <Kpi label="Earned" value={formatCents(earnedCents)} icon={DollarSign} />
        <Kpi label="Reversed" value={formatCents(reversedCents)} icon={RotateCcw} muted />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversions</CardTitle>
        </CardHeader>
        <CardContent>
          {conversions && conversions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {(c.booking_id as string | null)?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(Number(c.order_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {c.rate_type_used === "percent"
                          ? `${Number(c.rate_value_used ?? 0)}%`
                          : c.rate_type_used === "flat"
                            ? `$${Number(c.rate_value_used ?? 0).toFixed(2)}`
                            : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(Number(c.commission_amount_cents ?? 0))}
                      </TableCell>
                      <TableCell>
                        {c.reversed_at ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            reversed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">earned</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No conversions yet. Share your link to start tracking.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  muted,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  muted?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon
          className={`size-4 ${muted ? "text-muted-foreground" : "text-muted-foreground"}`}
          aria-hidden
        />
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold ${
            muted ? "text-muted-foreground" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
