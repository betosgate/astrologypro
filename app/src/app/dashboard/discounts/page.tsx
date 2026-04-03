import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/format";
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

export default async function DiscountsPage() {
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

  const { data: rules } = await supabase
    .from("discount_rules")
    .select("id, name, type, min_sessions, discount_percent, is_active, created_at")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  const all = rules ?? [];
  const activeCount = all.filter((r) => r.is_active).length;

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
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((rule) => (
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
                    <TableCell>{formatDate(rule.created_at)}</TableCell>
                    <TableCell>
                      <DiscountActions
                        ruleId={rule.id}
                        isActive={rule.is_active ?? true}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
