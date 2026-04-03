"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Loader2,
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commission_percent: number;
  referral_code: string;
  is_active: boolean;
  total_referrals: number;
  total_earned: number;
  total_paid: number;
}

interface Referral {
  id: string;
  commission_amount: number;
  status: string; // pending | earned | paid
  created_at: string;
  bookings: {
    scheduled_at: string;
    base_price: number;
    services: { name: string } | null;
    clients: { full_name: string } | null;
  } | null;
}

export default function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const { affiliateId } = use(params);
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [markingAllPaid, setMarkingAllPaid] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: aff } = await supabase
      .from("affiliates")
      .select(
        "id, name, email, phone, commission_percent, referral_code, is_active, total_referrals, total_earned, total_paid"
      )
      .eq("id", affiliateId)
      .single();

    if (aff) {
      setAffiliate(aff);

      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select(
          "id, commission_amount, status, created_at, bookings(scheduled_at, base_price, services(name), clients(full_name))"
        )
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      if (refs) setReferrals(refs as unknown as Referral[]);
    }
    setLoading(false);
  }, [affiliateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMarkAllPaid() {
    if (!affiliate) return;
    setMarkingAllPaid(true);
    const supabase = createClient();

    const { error: refError } = await supabase
      .from("affiliate_referrals")
      .update({ status: "paid" })
      .eq("affiliate_id", affiliate.id)
      .in("status", ["earned", "pending"]);

    const { error: affError } = await supabase
      .from("affiliates")
      .update({ total_paid: affiliate.total_earned })
      .eq("id", affiliate.id);

    if (refError || affError) {
      toast.error("Failed to mark all as paid");
    } else {
      toast.success("All referrals marked as paid");
      await loadData();
    }
    setMarkingAllPaid(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Affiliate not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/dashboard/affiliates">Back to Affiliates</Link>
        </Button>
      </div>
    );
  }

  const outstanding = affiliate.total_earned - affiliate.total_paid;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliates">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {affiliate.name}
          </h1>
          <p className="text-muted-foreground">
            {affiliate.email}
            {affiliate.phone && ` \u00b7 ${affiliate.phone}`} \u00b7 Code:{" "}
            <span className="font-mono">{affiliate.referral_code}</span>
          </p>
        </div>
        {outstanding > 0 && (
          <Button onClick={handleMarkAllPaid} disabled={markingAllPaid}>
            {markingAllPaid ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 size-4" />
                Mark All as Paid
              </>
            )}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{affiliate.total_referrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(affiliate.total_earned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(affiliate.total_paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            {referrals.length} referral{referrals.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referrals yet for this affiliate.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => {
                    const booking = referral.bookings;
                    return (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {booking?.clients?.full_name ?? "Unknown"}
                      </TableCell>
                      <TableCell>
                        {booking?.scheduled_at
                          ? formatDate(booking.scheduled_at)
                          : formatDate(referral.created_at)}
                      </TableCell>
                      <TableCell>
                        {booking?.services?.name ?? "--"}
                      </TableCell>
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
    </div>
  );
}
