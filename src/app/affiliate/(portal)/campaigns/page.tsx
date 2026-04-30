// /affiliate/campaigns
//
// Lists campaigns the caller OWNS (affiliate_campaigns where
// owner_affiliate_id IN caller.junction_ids). This is the v2 model —
// affiliates self-create their tracking campaigns.
//
// Replaces the prior legacy view that listed `campaign_affiliates`
// (campaigns the affiliate had been "joined" to). That table is now
// largely vestigial in v2 — diviners no longer enroll affiliates into
// shared campaigns; each affiliate creates their own.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import Link from "next/link";
import { redirect } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Megaphone, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "archived" || status === "expired") return "outline";
  return "secondary";
}

export default async function AffiliateCampaignsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/campaigns");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { account, junctionIds } = ctx;

  // Phase 1.5: pull both per-diviner campaigns (matched via junctionIds)
  // and general campaigns (matched via owner_affiliate_account_id). Two
  // SELECTs since PostgREST can't OR cross-column constraints; merged
  // client-side. Cost is negligible (single account, 0–N junctions).
  const [perDivinerRes, generalRes] = await Promise.all([
    junctionIds.length > 0
      ? admin
          .from("affiliate_campaigns")
          .select(
            "id, campaign_code, name, status, share_url, channel, diviner_id, owner_affiliate_type, destination_type, destination_service_template_id, created_at",
          )
          .in("owner_affiliate_id", junctionIds)
          .eq("owner_affiliate_type", "diviner_affiliate")
      : Promise.resolve({ data: [] }),
    admin
      .from("affiliate_campaigns")
      .select(
        "id, campaign_code, name, status, share_url, channel, diviner_id, owner_affiliate_type, destination_type, destination_service_template_id, created_at",
      )
      .eq("owner_affiliate_account_id", account.id)
      .eq("owner_affiliate_type", "general"),
  ]);

  const merged = [
    ...((perDivinerRes.data ?? []) as Array<Record<string, unknown>>),
    ...((generalRes.data ?? []) as Array<Record<string, unknown>>),
  ].sort((a, b) => {
    const at = (a.created_at as string) ?? "";
    const bt = (b.created_at as string) ?? "";
    return bt.localeCompare(at);
  });
  const campaigns = merged;

  const rows = campaigns ?? [];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <ListHeader />
        <EmptyState
          title="No campaigns yet"
          body="Pick one of your products and create a tracking campaign to share."
          cta={
            <Button asChild>
              <Link href="/affiliate/products">
                <Plus className="size-3.5" aria-hidden /> See my products
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Aggregate per-campaign KPIs in one round-trip rather than N+1. Also
  // pull display names for diviners (per-diviner campaigns) and general
  // templates (Phase 1.5 campaigns) so the Diviner / Source column can
  // render the right label per row.
  const campaignIds = rows.map((c) => c.id as string);
  const divinerIdsToFetch = Array.from(
    new Set(
      rows
        .map((c) => c.diviner_id as string | null)
        .filter((v): v is string => !!v),
    ),
  );
  const generalTemplateIds = Array.from(
    new Set(
      rows
        .filter((c) => c.owner_affiliate_type === "general")
        .map(
          (c) => c.destination_service_template_id as string | null,
        )
        .filter((v): v is string => !!v),
    ),
  );
  const [
    { data: conversions },
    { data: clicks },
    { data: diviners },
    { data: generalTemplates },
  ] = await Promise.all([
    admin
      .from("campaign_conversions")
      .select("campaign_id, commission_amount_cents, reversed_at")
      .in("campaign_id", campaignIds),
    admin
      .from("campaign_clicks")
      .select("campaign_id")
      .in("campaign_id", campaignIds),
    divinerIdsToFetch.length > 0
      ? admin
          .from("diviners")
          .select("id, display_name")
          .in("id", divinerIdsToFetch)
      : Promise.resolve({ data: [] }),
    generalTemplateIds.length > 0
      ? admin
          .from("service_templates")
          .select("id, name")
          .in("id", generalTemplateIds)
      : Promise.resolve({ data: [] }),
  ]);

  const totals = new Map<
    string,
    { clicks: number; conversions: number; earned_cents: number }
  >();
  for (const c of conversions ?? []) {
    const cid = c.campaign_id as string;
    const cur = totals.get(cid) ?? { clicks: 0, conversions: 0, earned_cents: 0 };
    if (!c.reversed_at) {
      cur.conversions += 1;
      cur.earned_cents += Number(c.commission_amount_cents ?? 0);
    }
    totals.set(cid, cur);
  }
  for (const k of clicks ?? []) {
    const cid = k.campaign_id as string;
    const cur = totals.get(cid) ?? { clicks: 0, conversions: 0, earned_cents: 0 };
    cur.clicks += 1;
    totals.set(cid, cur);
  }

  const divinerNameById = new Map<string, string>();
  for (const d of diviners ?? []) {
    divinerNameById.set(d.id as string, (d.display_name as string) ?? "Diviner");
  }
  const templateNameById = new Map<string, string>();
  for (const t of generalTemplates ?? []) {
    templateNameById.set(t.id as string, (t.name as string) ?? "General product");
  }
  function sourceLabel(row: Record<string, unknown>): string {
    if (row.owner_affiliate_type === "general") {
      const tid = row.destination_service_template_id as string | null;
      const tn = tid ? templateNameById.get(tid) : null;
      return tn ? `General: ${tn}` : "General product";
    }
    const did = row.diviner_id as string | null;
    return (did && divinerNameById.get(did)) ?? "—";
  }

  const activeCount = rows.filter((r) => r.status === "active").length;
  const totalEarned = Array.from(totals.values()).reduce(
    (sum, t) => sum + t.earned_cents,
    0,
  );

  return (
    <div className="space-y-6">
      <ListHeader />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rows.length}</p>
            <p className="text-xs text-muted-foreground">
              {activeCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Array.from(totals.values())
                .reduce((sum, t) => sum + t.clicks, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalEarned)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Diviner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const id = r.id as string;
                  const t = totals.get(id) ?? {
                    clicks: 0,
                    conversions: 0,
                    earned_cents: 0,
                  };
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <div className="font-medium">
                          <Link
                            href={`/affiliate/campaigns/${id}`}
                            className="hover:underline"
                          >
                            {(r.name as string) ?? "Untitled"}
                          </Link>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {r.campaign_code as string}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sourceLabel(r)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status as string)}>
                          {r.status as string}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {t.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.conversions}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(t.earned_cents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.created_at as string)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ListHeader() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My campaigns</h1>
        <p className="text-muted-foreground">
          Tracking campaigns you&rsquo;ve created. Click any row for KPIs +
          recent conversions.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/affiliate/products">
            <ExternalLink className="mr-2 size-3.5" aria-hidden />
            My products
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/affiliate/campaigns/new">
            <Plus className="mr-2 size-3.5" aria-hidden />
            New campaign
          </Link>
        </Button>
      </div>
    </header>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Megaphone
          className="mx-auto mb-3 size-10 text-muted-foreground"
          aria-hidden
        />
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {body}
        </p>
        {cta && <div className="mt-4">{cta}</div>}
      </CardContent>
    </Card>
  );
}
