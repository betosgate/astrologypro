// Task 05 — /affiliate/partnerships
// List of diviner partnerships for the authenticated affiliate. Reads the
// /api/affiliate/partnerships endpoint; renders one card per partnership
// with status, commission, and per-partnership earnings-to-date.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  suspended: "secondary",
  blocked: "destructive",
};

export default async function AffiliatePartnershipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/partnerships");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { data: junctions } = await admin
    .from("diviner_affiliates")
    .select(
      `id, diviner_id, status, default_commission_type, default_commission_value,
       invited_at, accepted_at, created_at,
       diviner:diviners ( id, username, display_name, avatar_url )`,
    )
    .eq("affiliate_account_id", ctx.account.id)
    .order("created_at", { ascending: false });

  // Commission totals per junction
  const { data: commAgg } = await admin
    .from("affiliate_commissions")
    .select("affiliate_id, commission_amount_cents, status")
    .in("affiliate_id", ctx.junctionIds.length > 0 ? ctx.junctionIds : ["_none_"]);

  const totalsByJunction = new Map<
    string,
    { total_cents: number; paid_cents: number; pending_cents: number }
  >();
  for (const row of commAgg ?? []) {
    const key = row.affiliate_id as string;
    const cur = totalsByJunction.get(key) ?? {
      total_cents: 0,
      paid_cents: 0,
      pending_cents: 0,
    };
    const amount = Number(row.commission_amount_cents ?? 0);
    cur.total_cents += amount;
    if (row.status === "paid") cur.paid_cents += amount;
    else if (row.status === "pending" || row.status === "on_hold") cur.pending_cents += amount;
    totalsByJunction.set(key, cur);
  }

  type Row = {
    id: string;
    diviner_id: string;
    status: string;
    default_commission_type: string | null;
    default_commission_value: number | null;
    invited_at: string | null;
    accepted_at: string | null;
    created_at: string;
    diviner: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  const rows = (junctions ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Partnerships</h1>
        <p className="text-muted-foreground">
          You partner with {rows.length} diviner{rows.length === 1 ? "" : "s"}.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No partnerships yet. Once a diviner invites you and you accept,
              they&rsquo;ll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => {
            const totals = totalsByJunction.get(r.id) ?? {
              total_cents: 0,
              paid_cents: 0,
              pending_cents: 0,
            };
            const commissionText =
              r.default_commission_type === "percentage"
                ? `${r.default_commission_value ?? 0}% per conversion`
                : r.default_commission_type === "fixed"
                  ? `${formatCents(Number(r.default_commission_value ?? 0))} per conversion`
                  : "See dashboard";
            return (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start gap-4">
                  <Avatar className="size-10">
                    {r.diviner?.avatar_url && (
                      <AvatarImage src={r.diviner.avatar_url} alt="" />
                    )}
                    <AvatarFallback>
                      {initials(r.diviner?.display_name ?? "??")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">
                      {r.diviner?.display_name ?? "Unknown Diviner"}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Badge variant={STATUS_BADGE[r.status] ?? "outline"}>
                        {r.status}
                      </Badge>
                      <span>{commissionText}</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{formatDate(r.accepted_at ?? r.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total earned</span>
                    <span className="font-medium">
                      {formatCents(totals.total_cents)}
                    </span>
                  </div>
                  {totals.pending_cents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="text-amber-600">
                        {formatCents(totals.pending_cents)}
                      </span>
                    </div>
                  )}
                  {r.diviner?.username && (
                    <div className="pt-2">
                      <Link
                        href={`/u/${r.diviner.username}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View diviner profile
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
