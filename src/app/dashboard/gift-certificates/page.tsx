import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Gift } from "lucide-react";

export const metadata = {
  title: "Gift Certificates",
};

type GiftCertStatus = "redeemed" | "expired" | "active";

function getStatus(cert: {
  redeemed_at: string | null;
  remaining_amount: number;
  expires_at: string | null;
}): GiftCertStatus {
  if (cert.redeemed_at && Number(cert.remaining_amount) === 0) return "redeemed";
  if (cert.expires_at && new Date(cert.expires_at) < new Date()) return "expired";
  return "active";
}

const statusStyles: Record<GiftCertStatus, string> = {
  redeemed: "bg-green-500/10 text-green-500 border-green-500/20",
  active: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default async function GiftCertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  const { data: certs } = await supabase
    .from("gift_certificates")
    .select(
      "id, code, amount, remaining_amount, redeemed_at, expires_at, purchaser_name, purchaser_email, recipient_name, recipient_email, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  const all = certs ?? [];

  const totalSold = all.length;
  const totalRevenue = all.reduce((sum, c) => sum + Number(c.amount), 0);
  const redeemedCount = all.filter(
    (c) => c.redeemed_at && Number(c.remaining_amount) === 0
  ).length;
  const outstandingValue = all
    .filter((c) => getStatus(c) === "active")
    .reduce((sum, c) => sum + Number(c.remaining_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gift Certificates</h1>
          <p className="text-muted-foreground">
            Track gift certificates sold for your services.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sold</CardDescription>
            <CardTitle className="text-3xl">{totalSold}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Redeemed</CardDescription>
            <CardTitle className="text-3xl">{redeemedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Value</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(outstandingValue)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Gift Certificates</CardTitle>
          <CardDescription>
            {totalSold} certificate{totalSold !== 1 ? "s" : ""} issued
          </CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No gift certificates yet. They appear here automatically when
                clients purchase them.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Purchaser</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((cert) => {
                  const status = getStatus(cert);
                  return (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          {cert.code}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(cert.amount))}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(cert.remaining_amount))}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.purchaser_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cert.purchaser_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cert.recipient_name ? (
                          <div>
                            <p className="font-medium">{cert.recipient_name}</p>
                            {cert.recipient_email && (
                              <p className="text-xs text-muted-foreground">
                                {cert.recipient_email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyles[status]}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cert.expires_at
                          ? formatDate(cert.expires_at)
                          : <span className="text-muted-foreground">--</span>}
                      </TableCell>
                      <TableCell>{formatDate(cert.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
