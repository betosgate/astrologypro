import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Package,
  User,
  Star,
  Clock,
} from "lucide-react";

export const metadata = { title: "Order Detail — Admin" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  refunded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function fmtAmount(amountCents: number | null, currency?: string | null) {
  if (amountCents == null) return "—";
  return `$${(amountCents / 100).toFixed(2)} ${(currency ?? "usd").toUpperCase()}`;
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

async function getOrderDetail(id: string) {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) return null;

  // Fetch related data in parallel
  const [clientRes, divinerRes, serviceRes, intakeRes] = await Promise.all([
    order.client_id
      ? admin
          .from("clients")
          .select("id, user_id, full_name, email, phone")
          .eq("id", order.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    order.diviner_id
      ? admin
          .from("diviners")
          .select("id, user_id, display_name, username, avatar_url")
          .eq("id", order.diviner_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    order.service_id
      ? admin
          .from("services")
          .select("id, name, category, base_price, duration_minutes")
          .eq("id", order.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    admin
      .from("order_intake_submissions")
      .select("id, fields, completed_at")
      .eq("order_id", id)
      .maybeSingle(),
  ]);

  return {
    order,
    client: clientRes.data as Record<string, unknown> | null,
    diviner: divinerRes.data as Record<string, unknown> | null,
    service: serviceRes.data as Record<string, unknown> | null,
    intake: intakeRes.data as Record<string, unknown> | null,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderDetail(id);
  if (!result) notFound();

  const { order, client, diviner, service, intake } = result;

  // Determine display amount (prefer amount_cents, fall back to amount)
  const displayAmount =
    order.amount_cents != null && order.amount_cents > 0
      ? order.amount_cents
      : order.amount != null
        ? Math.round(Number(order.amount) * 100)
        : null;

  // Build timeline entries from available timestamps
  const timeline: Array<{ label: string; date: string | null }> = [
    { label: "Created", date: order.created_at },
    { label: "Paid", date: order.paid_at ?? null },
    { label: "Intake Submitted", date: order.intake_submitted_at ?? null },
    { label: "Delivered", date: order.delivered_at ?? null },
    { label: "Updated", date: order.updated_at },
  ];

  return (
    <div className="space-y-6">
      {/* ── Back + Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="mr-1.5 size-4" />
            Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Order
            <span className="font-mono text-base text-muted-foreground">
              {order.id.slice(0, 8)}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.product_title || order.service_type || "Order"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {order.invoice_email_sent && (
            <Badge variant="outline" className="text-xs">
              Invoice sent
            </Badge>
          )}
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {fmtAmount(displayAmount, order.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.product_type ?? "one_time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{order.status}</p>
            <p className="text-xs text-muted-foreground">
              Created {fmtDate(order.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payment</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {order.stripe_payment_intent_id ? (
              <>
                <p className="text-sm font-mono break-all">
                  {order.stripe_payment_intent_id}
                </p>
                {order.stripe_session_id && (
                  <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                    Session: {order.stripe_session_id}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No payment ID</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Customer Info ─────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client ? (
              <>
                <div>
                  <span className="font-medium">Name: </span>
                  {(client.full_name as string) || "—"}
                </div>
                <div>
                  <span className="font-medium">Email: </span>
                  {(client.email as string) || "—"}
                </div>
                <div>
                  <span className="font-medium">Phone: </span>
                  {(client.phone as string) || "—"}
                </div>
                {client.user_id && (
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link href={`/admin/users/${client.user_id}`}>
                      View user profile
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                Client ID: {order.client_id ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Diviner Info ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              Diviner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {diviner ? (
              <>
                <div>
                  <span className="font-medium">Name: </span>
                  {(diviner.display_name as string) || "—"}
                </div>
                <div>
                  <span className="font-medium">Username: </span>@
                  {(diviner.username as string) || "—"}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    asChild
                  >
                    <Link href={`/admin/diviners/${diviner.id}`}>
                      View diviner
                    </Link>
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    asChild
                  >
                    <Link href={`/${diviner.username}`}>Public page</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Diviner ID: {order.diviner_id ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Service / Product ─────────────────────────────────────────── */}
      {service && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-4" />
              Service
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Name: </span>
                {(service.name as string) || "—"}
              </div>
              <div>
                <span className="font-medium">Category: </span>
                <span className="capitalize">
                  {(service.category as string) || "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Base Price: </span>$
                {Number(service.base_price ?? 0).toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Duration: </span>
                {(service.duration_minutes as number) ?? "—"} min
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Intake Submission ─────────────────────────────────────────── */}
      {intake && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Intake Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Submitted: {fmtDate(intake.completed_at as string)}
            </p>
            {intake.fields &&
            typeof intake.fields === "object" &&
            Object.keys(intake.fields as Record<string, unknown>).length > 0 ? (
              <div className="grid gap-2">
                {Object.entries(
                  intake.fields as Record<string, unknown>
                ).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="font-medium text-xs text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span>{String(value ?? "—")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No intake data.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Timeline ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeline
              .filter((t) => t.date)
              .map((t) => (
                <div key={t.label} className="flex items-center gap-3 text-sm">
                  <div className="size-2 rounded-full bg-primary shrink-0" />
                  <span className="font-medium w-36">{t.label}</span>
                  <span className="text-muted-foreground">
                    {fmtDate(t.date)}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Notes ─────────────────────────────────────────────────────── */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
