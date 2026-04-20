import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MousePointerClick,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AffiliateMarketingKit } from "@/components/affiliate/marketing-kit";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface LinkRow {
  id: string;
  slug: string;
  url: string | null;
  product_type: string | null;
  clicks: number;
  conversions: number;
  is_active: boolean;
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Look up affiliate by user_id
  const { data: affiliate } = await admin
    .from("diviner_affiliates")
    .select("id, name, email, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <RefreshCw className="mb-4 size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Not registered as an affiliate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact your diviner to get set up as an affiliate.
        </p>
      </div>
    );
  }

  // Aggregate commissions
  const { data: commissionRows } = await admin
    .from("affiliate_commissions")
    .select("commission_amount_cents, status")
    .eq("affiliate_id", affiliate.id);

  let pendingCents = 0;
  let approvedCents = 0;
  let paidCents = 0;
  let totalConversions = 0;

  (commissionRows ?? []).forEach((row) => {
    const amount = Number(row.commission_amount_cents);
    totalConversions++;
    const s = row.status as string;
    if (s === "pending" || s === "on_hold") pendingCents += amount;
    else if (s === "approved") approvedCents += amount;
    else if (s === "paid") paidCents += amount;
  });

  // Aggregate total clicks from links
  const { data: linkRows } = await admin
    .from("affiliate_referral_links")
    .select("id, slug, url, product_type, clicks, conversions, is_active")
    .eq("affiliate_id", affiliate.id)
    .order("clicks", { ascending: false })
    .limit(3);

  const totalClicks = (linkRows ?? []).reduce(
    (sum, l) => sum + Number(l.clicks ?? 0),
    0
  );

  const topLinks: LinkRow[] = (linkRows ?? []) as LinkRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {affiliate.name} &mdash; your affiliate overview.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCents(pendingCents)}
            </p>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">
              {formatCents(paidCents)}
            </p>
            {approvedCents > 0 && (
              <p className="text-xs text-green-600">
                +{formatCents(approvedCents)} approved
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Marketing kit — reading landing pages */}
      <AffiliateMarketingKit affiliateId={affiliate.id} />

      {/* Top performing links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Performing Links</CardTitle>
          <Link
            href="/affiliate/links"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {topLinks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No links yet.{" "}
              <Link href="/affiliate/links" className="underline">
                Create your first link.
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs">{link.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {link.product_type ?? "general"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(link.clicks).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(link.conversions).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            link.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {link.is_active ? "active" : "inactive"}
                        </span>
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
