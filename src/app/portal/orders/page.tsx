import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { ShoppingBag, User } from "lucide-react";

export const metadata = {
  title: "My Orders & Readings",
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Awaiting Intake", value: "awaiting_intake" },
  { label: "In Progress", value: "in_progress" },
  { label: "Delivered", value: "delivered" },
] as const;

const statusBadgeClass: Record<string, string> = {
  pending_payment: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  pending:         "bg-gray-500/10 text-gray-400 border-gray-500/20",
  paid:            "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_intake: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  intake_submitted:"bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  scheduled:       "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  delivered:       "bg-green-500/10 text-green-400 border-green-500/20",
  completed:       "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled:       "bg-red-500/10 text-red-400 border-red-500/20",
  refunded:        "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusLabel: Record<string, string> = {
  pending_payment:  "Pending Payment",
  pending:          "Pending",
  paid:             "Paid",
  awaiting_intake:  "Action Required",
  intake_submitted: "Intake Submitted",
  in_progress:      "In Progress",
  scheduled:        "Scheduled",
  delivered:        "Delivered",
  completed:        "Completed",
  cancelled:        "Cancelled",
  refunded:         "Refunded",
};

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function getCtaLabel(status: string): string {
  if (status === "awaiting_intake") return "Complete Intake";
  if (status === "delivered" || status === "completed") return "View Reading";
  return "View Details";
}

interface OrderRow {
  id: string;
  product_title: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  diviners: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const resolvedParams = await searchParams;
  const activeStatus = resolvedParams.status ?? "";

  let query = supabase
    .from("orders")
    .select(
      `id, product_title, amount_cents, currency, status, paid_at, created_at,
       diviners(display_name, username, avatar_url)`
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (activeStatus) {
    query = query.eq("status", activeStatus);
  }

  const { data } = await query;
  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Orders &amp; Readings</h1>
        <p className="text-sm text-muted-foreground">
          Track your purchases and session deliverables.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href = tab.value ? `/portal/orders?status=${tab.value}` : "/portal/orders";
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ` +
                (isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-6 py-12 text-center">
          <ShoppingBag className="mx-auto mb-4 size-10 text-muted-foreground/40" />
          <p className="font-medium">No orders yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready to book your first reading?
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/discover">Find a Diviner</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const diviner = order.diviners;
            const badgeClass = statusBadgeClass[order.status] ?? statusBadgeClass.pending;
            const label = statusLabel[order.status] ?? order.status;
            const ctaLabel = getCtaLabel(order.status);
            const showActionIndicator = order.status === "awaiting_intake";

            return (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {/* Diviner avatar */}
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
                    {diviner?.avatar_url ? (
                      <img
                        src={diviner.avatar_url}
                        alt={diviner.display_name}
                        className="size-10 object-cover"
                      />
                    ) : (
                      <User className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Order info */}
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium leading-tight">{order.product_title || "Reading"}</p>
                    <p className="text-xs text-muted-foreground">
                      {diviner?.display_name ?? "Diviner"} &middot;{" "}
                      {formatDateTime(order.created_at)}
                    </p>
                    <p className="text-sm font-medium text-foreground/80">
                      {formatCents(order.amount_cents, order.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <Badge
                    variant="outline"
                    className={`${badgeClass} whitespace-nowrap text-xs`}
                  >
                    {showActionIndicator && <span className="mr-1">📝</span>}
                    {label}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/portal/orders/${order.id}`}>{ctaLabel}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
