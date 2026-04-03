import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { APP_URL } from "@/lib/constants";
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
import { Separator } from "@/components/ui/separator";
import {
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  MousePointerClick,
  Link as LinkIcon,
  Share2,
  MessageSquare,
} from "lucide-react";
import { CopyLinkButton } from "./copy-link-button";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function AffiliatePortalPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up the affiliate by referral code
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select(
      "id, name, email, referral_code, commission_percent, is_active, total_referrals, total_earned, total_paid, diviner_id"
    )
    .eq("referral_code", code)
    .single();

  if (!affiliate) {
    notFound();
  }

  // Get the diviner info for building the referral link
  const { data: diviner } = await supabase
    .from("diviners")
    .select("username, display_name")
    .eq("id", affiliate.diviner_id)
    .single();

  // Get referrals for this affiliate — join bookings to surface service + price
  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select(
      "id, commission_amount, status, created_at, bookings(scheduled_at, base_price, services(name))"
    )
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false });

  // Get tracking link clicks
  const { data: trackingLink } = await supabase
    .from("tracking_links")
    .select("clicks")
    .eq("code", affiliate.referral_code)
    .single();

  const clicks = trackingLink?.clicks ?? 0;
  const outstanding = affiliate.total_earned - affiliate.total_paid;
  const referralUrl = diviner
    ? `${APP_URL}/${diviner.username}?ref=${affiliate.referral_code}`
    : "";

  // Group referrals by month for earnings report
  const monthlyEarnings: Record<string, number> = {};
  (referrals ?? []).forEach((ref) => {
    const date = new Date(ref.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyEarnings[key] = (monthlyEarnings[key] ?? 0) + Number(ref.commission_amount ?? 0);
  });
  const monthlyEntries = Object.entries(monthlyEarnings).sort(
    (a, b) => b[0].localeCompare(a[0])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Affiliate Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {affiliate.name}
          {diviner && (
            <span>
              {" "}
              &mdash; affiliate for{" "}
              <span className="font-medium text-foreground">
                {diviner.display_name}
              </span>
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{affiliate.total_referrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Earned</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(affiliate.total_earned))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Paid / Outstanding
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(affiliate.total_paid))}
            </p>
            {outstanding > 0 && (
              <p className="text-xs text-amber-600">
                {formatCurrency(outstanding)} pending payout
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      {referralUrl && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="size-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link to earn {affiliate.commission_percent}% commission
              on every booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm break-all">
                {referralUrl}
              </code>
              <CopyLinkButton url={referralUrl} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketing Materials */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Marketing Materials
          </CardTitle>
          <CardDescription>
            Pre-made content you can share with your audience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="size-4" />
              Social Media Post
            </p>
            <div className="rounded-lg border bg-muted p-3 text-sm">
              {diviner
                ? `Looking for guidance? I highly recommend ${diviner.display_name} for astrology and tarot readings! Book your session here: ${referralUrl}`
                : "Share your referral link with friends and family!"}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="size-4" />
              Email Template
            </p>
            <div className="rounded-lg border bg-muted p-3 text-sm whitespace-pre-wrap">
              {diviner
                ? `Hi there!\n\nI wanted to share an amazing astrologer I've been working with - ${diviner.display_name}. They offer incredible readings that have truly helped me.\n\nYou can book a session here: ${referralUrl}\n\nI think you'll love it!`
                : "Share your referral link via email!"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Earnings */}
      {monthlyEntries.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Earnings by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyEntries.map(([month, earned]) => {
                  const [year, m] = month.split("-");
                  const label = new Date(
                    parseInt(year),
                    parseInt(m) - 1
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  });
                  return (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(earned)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            {(referrals ?? []).length} referral
            {(referrals ?? []).length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referrals yet. Share your link to start earning!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => {
                    const booking = referral.bookings as unknown as { scheduled_at: string; base_price: number; services: { name: string } | null } | null;
                    const svcName = booking?.services?.name ?? "--";
                    const bookingDate = booking?.scheduled_at ?? referral.created_at;
                    return (
                      <TableRow key={referral.id}>
                        <TableCell>{formatDate(bookingDate)}</TableCell>
                        <TableCell>{svcName}</TableCell>
                        <TableCell>
                          {booking?.base_price != null
                            ? formatCurrency(booking.base_price)
                            : "--"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(referral.commission_amount ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              referral.status === "paid"
                                ? "default"
                                : referral.status === "earned"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {referral.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Note */}
      <p className="text-center text-sm text-muted-foreground">
        Contact your diviner for payment questions or account updates.
      </p>
    </div>
  );
}
