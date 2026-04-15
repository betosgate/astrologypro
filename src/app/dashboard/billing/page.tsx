import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Zap } from "lucide-react";
import { ManageBillingButton, SubscribeButton } from "./billing-actions";

export const metadata = {
  title: "Billing — Dashboard",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DivinerPlan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  features: string[];
}

interface PlanSubscription {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  diviner_plans: DivinerPlan | null;
}

interface AddonDef {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: string;
  feature_key: string;
}

interface ActiveAddon {
  id: string;
  status: string;
  activated_at: string;
  diviner_plan_addons: AddonDef | null;
}

interface Invoice {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_type: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

interface TelephonyRecord {
  id: string;
  duration_seconds: number;
  participant_count: number;
  rate_per_minute: number;
  amount_cents: number;
  billed_at: string | null;
  invoice_id: string | null;
  diviner_invoices: {
    invoice_url: string | null;
    status: string;
    created_at: string;
  }[] | null;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCents(cents: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    paid: "default",
    active: "default",
    trialing: "secondary",
    open: "secondary",
    past_due: "destructive",
    cancelled: "outline",
    suspended: "destructive",
    void: "outline",
    uncollectible: "destructive",
    draft: "outline",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Resolve diviner id
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/onboarding");

  const divinerId = diviner.id;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Fetch billing data in parallel
  const [subResult, addonsResult, invoicesResult, telephonyResult, allAddonsResult] =
    await Promise.all([
      admin
        .from("diviner_plan_subscriptions")
        .select("id, status, current_period_start, current_period_end, trial_ends_at, diviner_plans(id, name, slug, price_cents, currency, billing_interval, features)")
        .eq("diviner_id", divinerId)
        .maybeSingle(),
      admin
        .from("diviner_active_addons")
        .select("id, status, activated_at, diviner_plan_addons(id, name, slug, description, price_cents, currency, billing_interval, feature_key)")
        .eq("diviner_id", divinerId)
        .eq("status", "active"),
      admin
        .from("diviner_invoices")
        .select("id, amount_cents, currency, status, invoice_type, description, period_start, period_end, paid_at, invoice_url, pdf_url, created_at")
        .eq("diviner_id", divinerId)
        .order("created_at", { ascending: false })
        .limit(12),
      admin
        .from("telephony_usage_records")
        .select("id, duration_seconds, participant_count, rate_per_minute, amount_cents, billed_at, invoice_id, created_at, diviner_invoices(invoice_url, status, created_at)")
        .eq("diviner_id", divinerId)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: false }),
      admin
        .from("diviner_plan_addons")
        .select("id, name, slug, description, price_cents, currency, billing_interval, feature_key")
        .eq("is_active", true),
    ]);

  const subscription = subResult.data as unknown as PlanSubscription | null;
  const activeAddons = (addonsResult.data ?? []) as unknown as ActiveAddon[];
  const invoices = (invoicesResult.data ?? []) as Invoice[];
  const telephonyRecords = ((telephonyResult.data ?? []) as unknown as TelephonyRecord[]).map((record) => ({
    ...record,
    diviner_invoices: Array.isArray(record.diviner_invoices)
      ? record.diviner_invoices
      : record.diviner_invoices
        ? [record.diviner_invoices]
        : null,
  }));
  const allAddons = (allAddonsResult.data ?? []) as AddonDef[];

  // Determine active addon IDs for promo display
  const activeAddonFeatureKeys = new Set(
    activeAddons.map((a) => a.diviner_plan_addons?.feature_key).filter(Boolean)
  );

  // Calculate telephony total this period
  const telephonyTotal = telephonyRecords.reduce((sum, r) => sum + r.amount_cents, 0);
  const pendingTelephonyTotal = telephonyRecords
    .filter((r) => !r.billed_at)
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const billedTelephonyTotal = telephonyTotal - pendingTelephonyTotal;
  const pendingTelephonyCount = telephonyRecords.filter((r) => !r.billed_at).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your plan, add-ons, and view invoices.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active SaaS subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          {!subscription ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No active plan. Subscribe to unlock your professional diviner dashboard.
              </p>
              {/* Get Started — Professional plan */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" />
                  <span className="text-lg font-bold">Professional Plan</span>
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Everything you need to run your diviner practice — bookings, client portal, live sessions, and more.
                </p>
                <p className="text-2xl font-bold">
                  $99<span className="text-base font-normal text-muted-foreground"> / month</span>
                </p>
                <SubscribeButton
                  planSlug="professional"
                  label="Get Started — $99/month"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">
                    {subscription.diviner_plans?.name ?? "Unknown Plan"}
                  </span>
                  {statusBadge(subscription.status)}
                </div>
                {subscription.diviner_plans && (
                  <p className="text-sm text-muted-foreground">
                    {formatCents(
                      subscription.diviner_plans.price_cents,
                      subscription.diviner_plans.currency
                    )}{" "}
                    / {subscription.diviner_plans.billing_interval}
                  </p>
                )}
                {subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    Next renewal:{" "}
                    <span className="text-foreground font-medium">
                      {formatDate(subscription.current_period_end)}
                    </span>
                  </p>
                )}
                {subscription.trial_ends_at && subscription.status === "trialing" && (
                  <p className="text-xs text-amber-500">
                    Trial ends: {formatDate(subscription.trial_ends_at)}
                  </p>
                )}
              </div>
              <ManageBillingButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add-Ons */}
      <Card>
        <CardHeader>
          <CardTitle>Add-Ons</CardTitle>
          <CardDescription>Optional features to extend your plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeAddons.length === 0 && (
            <p className="text-sm text-muted-foreground">No active add-ons.</p>
          )}
          {activeAddons.map((addon) => {
            const def = addon.diviner_plan_addons;
            if (!def) return null;
            return (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">{def.name}</p>
                  {def.description && (
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formatCents(def.price_cents, def.currency)} / {def.billing_interval}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(addon.status)}
                  <Button variant="outline" size="sm" disabled>
                    Contact us to cancel
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Promo: show inactive add-ons */}
          {allAddons
            .filter((a) => !activeAddonFeatureKeys.has(a.feature_key))
            .map((addon) => {
              const hasActivePlan =
                !!subscription && subscription.status === "active";
              const planSlug = subscription?.diviner_plans?.slug ?? "professional";
              return (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" />
                      <p className="font-medium">{addon.name}</p>
                      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                        Available
                      </Badge>
                    </div>
                    {addon.description && (
                      <p className="text-xs text-muted-foreground">{addon.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatCents(addon.price_cents, addon.currency)} / {addon.billing_interval}
                    </p>
                  </div>
                  {hasActivePlan ? (
                    <SubscribeButton
                      planSlug={planSlug}
                      addonSlugs={[addon.slug ?? addon.feature_key]}
                      label={`Add to Plan — ${formatCents(addon.price_cents, addon.currency)}/month`}
                      variant="outline"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Subscribe to a plan first
                    </span>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Your recent billing history (last 12 invoices).</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">{formatDate(inv.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {inv.invoice_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {inv.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCents(inv.amount_cents, inv.currency)}
                      </TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        {inv.pdf_url ? (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-500 hover:underline"
                          >
                            <FileText className="size-3" />
                            PDF
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telephony Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Telephony Usage</CardTitle>
          <CardDescription>
            Pass-through call costs for the last 6 months.{" "}
            {telephonyTotal > 0 && (
              <span className="font-medium text-foreground">
                Total this period: {formatCents(telephonyTotal)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pending Charges
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCents(pendingTelephonyTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingTelephonyCount} usage record{pendingTelephonyCount === 1 ? "" : "s"} not yet invoiced
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Already Invoiced
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCents(billedTelephonyTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Charges already attached to generated billing records
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Billing Policy
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Phone usage is billed as pass-through cost only. Pending charges move into your invoice when the telephony billing job runs.
              </p>
            </div>
          </div>

          {telephonyRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No telephony usage recorded.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Rate / min</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead>Billed</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telephonyRecords.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-sm">{formatDate(rec.created_at)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatDuration(rec.duration_seconds)}
                      </TableCell>
                      <TableCell className="text-sm">{rec.participant_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ${Number(rec.rate_per_minute).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCents(rec.amount_cents)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.billed_at ? (
                          <Badge variant="default" className="text-xs">
                            Billed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {rec.diviner_invoices?.[0]?.invoice_url ? (
                          <a
                            href={rec.diviner_invoices[0].invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-500 hover:underline"
                          >
                            Open
                            <ExternalLink className="size-3" />
                          </a>
                        ) : rec.invoice_id ? (
                          <span className="text-xs text-muted-foreground">
                            {rec.diviner_invoices?.[0]?.status ?? "Invoiced"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
