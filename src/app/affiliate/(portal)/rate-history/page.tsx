// /affiliate/rate-history
// Read-only audit of every rate change on the caller's assignments.
// Newest first, grouped by assignment.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRate(type: string, value: number): string {
  if (type === "flat") return `$${value.toFixed(2)}`;
  return `${value}%`;
}

export default async function RateHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/rate-history");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  if (ctx.junctionIds.length === 0) {
    return <EmptyState />;
  }

  // Resolve assignment ids first.
  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, diviner:diviners(display_name)",
    )
    .in("affiliate_id", ctx.junctionIds)
    .eq("affiliate_type", "diviner_affiliate");
  const assignmentIds = (assignments ?? []).map((a) => a.id as string);
  if (assignmentIds.length === 0) return <EmptyState />;

  type AsgnRow = {
    id: string;
    diviner_id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_id: string | null;
    diviner: { display_name: string | null } | { display_name: string | null }[] | null;
  };
  const asgnRows = (assignments ?? []) as unknown as AsgnRow[];

  // Service template names for any SERVICE-scoped assignments.
  const serviceTemplateIds = asgnRows
    .filter((a) => a.destination_type === "SERVICE" && a.destination_id)
    .map((a) => a.destination_id as string);
  const serviceNameById = new Map<string, string>();
  if (serviceTemplateIds.length > 0) {
    const { data: templates } = await admin
      .from("service_templates")
      .select("id, name")
      .in("id", serviceTemplateIds);
    for (const t of templates ?? []) {
      serviceNameById.set(t.id as string, (t.name as string) ?? "Service");
    }
  }
  const productByAssignment = new Map<string, { product: string; diviner: string }>();
  for (const a of asgnRows) {
    const div = Array.isArray(a.diviner) ? a.diviner[0] : a.diviner;
    const divName = div?.display_name ?? "Diviner";
    const product =
      a.destination_type === "PROFILE"
        ? `${divName}'s profile`
        : serviceNameById.get(a.destination_id ?? "") ?? "Service";
    productByAssignment.set(a.id, { product, diviner: divName });
  }

  // Fetch history (limited — affiliates rarely have many rate changes).
  const { data: history } = await admin
    .from("diviner_service_affiliate_rate_history")
    .select(
      "id, assignment_id, old_commission_type, old_commission_value, new_commission_type, new_commission_value, changed_at, reason",
    )
    .in("assignment_id", assignmentIds)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (!history || history.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Rate history</h1>
          <p className="text-muted-foreground">
            Every commission rate change a diviner has made on your assignments.
          </p>
        </header>
        <Card>
          <CardContent className="py-12 text-center">
            <History
              className="mx-auto mb-3 size-10 text-muted-foreground"
              aria-hidden
            />
            <h2 className="text-base font-medium">No rate changes yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              When a diviner edits the commission rate on one of your products,
              the change will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rate history</h1>
        <p className="text-muted-foreground">
          Each row represents a rate change made by a diviner on one of your
          assignments. New rates apply to bookings made AFTER the change —
          bookings already in checkout keep the prior rate.
        </p>
      </header>

      <Card>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => {
                  const meta = productByAssignment.get(
                    h.assignment_id as string,
                  );
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(h.changed_at as string)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {meta?.product ?? "Product"}
                        </div>
                        {meta?.diviner && (
                          <div className="text-xs text-muted-foreground">
                            with {meta.diviner}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRate(
                          h.old_commission_type as string,
                          Number(h.old_commission_value ?? 0),
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatRate(
                          h.new_commission_type as string,
                          Number(h.new_commission_value ?? 0),
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(h.reason as string | null) ?? "—"}
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

function EmptyState() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rate history</h1>
      </header>
      <Card>
        <CardContent className="py-12 text-center">
          <History
            className="mx-auto mb-3 size-10 text-muted-foreground"
            aria-hidden
          />
          <h2 className="text-base font-medium">No partnerships yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Once you have an assignment, any rate changes will be logged here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
