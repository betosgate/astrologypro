import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/format";
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
import { CreateDiscountSheet } from "@/components/dashboard/create-discount-sheet";
import { DiscountActions } from "@/components/dashboard/discount-actions";

export const metadata = {
  title: "Discounts",
};

interface UsageStat {
  discount_rule_id: string;
  discount_amount_saved: number | null;
}

interface RecentUse {
  id: string;
  scheduled_at: string;
  total_amount: number | null;
  discount_amount_saved: number | null;
  discount_rule_id: string | null;
  clients: { full_name: string } | { full_name: string }[];
  services: { name: string } | { name: string }[];
  discount_rules: { name: string; discount_percent: number } | { name: string; discount_percent: number }[];
}

export default async function DiscountsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  const [rulesResult, usageResult, recentResult] = await Promise.all([
    supabase
      .from("discount_rules")
      .select("id, name, type, min_sessions, discount_percent, is_active, created_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false }),

    admin
      .from("bookings")
      .select("discount_rule_id, discount_amount_saved")
      .eq("diviner_id", diviner.id)
      .not("discount_rule_id", "is", null),

    admin
      .from("bookings")
      .select(`
        id, scheduled_at, total_amount, discount_amount_saved, discount_rule_id,
        clients!inner(full_name),
        services!inner(name),
        discount_rules!inner(name, discount_percent)
      `)
      .eq("diviner_id", diviner.id)
      .not("discount_rule_id", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(15),
  ]);

  const all = rulesResult.data ?? [];
  const usageStats = (usageResult.data ?? []) as UsageStat[];
  const recentUses = (recentResult.data ?? []) as RecentUse[];

  // Build ruleId → { count, totalSaved } map
  const usageMap = new Map<string, { count: number; totalSaved: number }>();
  for (const row of usageStats) {
    if (!row.discount_rule_id) continue;
    const existing = usageMap.get(row.discount_rule_id) ?? { count: 0, totalSaved: 0 };
    usageMap.set(row.discount_rule_id, {
      count: existing.count + 1,
      totalSaved: existing.totalSaved + Number(row.discount_amount_saved ?? 0),
    });
  }

  const activeCount = all.filter((r) => r.is_active).length;
  const totalUses = usageStats.length;
  const totalSaved = usageStats.reduce(
    (sum, row) => sum + Number(row.discount_amount_saved ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discounts</h1>
          <p className="text-muted-foreground">
            Create loyalty and package discounts for your clients.
          </p>
        </div>
        <CreateDiscountSheet divinerId={diviner.id} />
      </div>

      {/* Summary stat bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Rules</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Discount Uses</p>
            <p className="text-2xl font-bold">{totalUses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Amount Saved by Clients</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Discount Rules table */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Rules</CardTitle>
          <CardDescription>
            {all.length} rule{all.length !== 1 ? "s" : ""} configured &mdash;{" "}
            {activeCount} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No discount rules yet. Create one to automatically reward loyal
              clients.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Total Saved</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((rule) => {
                  const usage = usageMap.get(rule.id);
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rule.type === "session_count"
                            ? "Session Count"
                            : "Package"}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(rule.discount_percent)}% off</TableCell>
                      <TableCell>
                        {rule.min_sessions != null ? (
                          `${rule.min_sessions} sessions`
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            rule.is_active
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                          }
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usage && usage.count > 0 ? (
                          usage.count
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {usage && usage.totalSaved > 0 ? (
                          formatCurrency(usage.totalSaved)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(rule.created_at)}</TableCell>
                      <TableCell>
                        <DiscountActions
                          ruleId={rule.id}
                          isActive={rule.is_active ?? true}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Discount Uses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Discount Uses</CardTitle>
          <CardDescription>
            Last 15 bookings where a discount rule was applied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No discount uses yet. Discounts will appear here when clients book
              with an active rule applied.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Rule Applied</TableHead>
                  <TableHead>Amount Saved</TableHead>
                  <TableHead>Booking Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUses.map((use) => {
                  const client = Array.isArray(use.clients)
                    ? use.clients[0]
                    : use.clients;
                  const service = Array.isArray(use.services)
                    ? use.services[0]
                    : use.services;
                  const rule = Array.isArray(use.discount_rules)
                    ? use.discount_rules[0]
                    : use.discount_rules;

                  return (
                    <TableRow key={use.id}>
                      <TableCell>
                        {use.scheduled_at ? formatDate(use.scheduled_at) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {client?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>{service?.name ?? "—"}</TableCell>
                      <TableCell>
                        {rule ? (
                          <div className="flex items-center gap-2">
                            <span>{rule.name}</span>
                            <Badge variant="secondary">
                              {Number(rule.discount_percent)}% off
                            </Badge>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {use.discount_amount_saved != null
                          ? formatCurrency(Number(use.discount_amount_saved))
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {use.total_amount != null
                          ? formatCurrency(Number(use.total_amount))
                          : "—"}
                      </TableCell>
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
