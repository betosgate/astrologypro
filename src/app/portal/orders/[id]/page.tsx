import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicIntakeForm } from "@/components/portal/dynamic-intake-form";
import { formatDateTime } from "@/lib/format";
import { buildFallbackIntakeTemplate } from "@/lib/service-purchase";
import { ArrowLeft, CheckCircle2, Circle, FileText, BookOpen } from "lucide-react";
import type { IntakeTemplate } from "@/lib/intake-fields";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";

export const metadata = {
  title: "Order Details",
};

const statusLabel: Record<string, string> = {
  pending_payment:  "Pending Payment",
  pending:          "Pending",
  paid:             "Paid",
  awaiting_intake:  "Awaiting Intake",
  intake_submitted: "Intake Submitted",
  in_progress:      "In Progress",
  scheduled:        "Scheduled",
  delivered:        "Delivered",
  completed:        "Delivered",
  cancelled:        "Cancelled",
  refunded:         "Refunded",
};

const statusBadgeClass: Record<string, string> = {
  pending_payment:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
  pending:          "bg-gray-500/10 text-gray-400 border-gray-500/20",
  paid:             "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_intake:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  intake_submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress:      "bg-purple-500/10 text-purple-400 border-purple-500/20",
  scheduled:        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  delivered:        "bg-green-500/10 text-green-400 border-green-500/20",
  completed:        "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled:        "bg-red-500/10 text-red-400 border-red-500/20",
  refunded:         "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const TIMELINE_STEPS = [
  { key: "paid",             label: "Paid" },
  { key: "awaiting_intake",  label: "Intake" },
  { key: "in_progress",      label: "In Progress" },
  { key: "delivered",        label: "Delivered" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  pending_payment:  0,
  pending:          0,
  paid:             1,
  awaiting_intake:  2,
  intake_submitted: 2,
  in_progress:      3,
  scheduled:        3,
  delivered:        4,
  completed:        4,
};

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

interface OrderDetail {
  id: string;
  product_title: string;
  product_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  notes: string | null;
  paid_at: string | null;
  intake_submitted_at: string | null;
  delivered_at: string | null;
  created_at: string;
  service_id: string | null;
  booking_id: string | null;
  diviners: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  services: {
    name: string;
    slug: string | null;
    category: string | null;
    requires_birth_data: boolean | null;
    intake_template_id: string | null;
    product_kind?: string | null;
    is_subscription?: boolean | null;
    requires_birth_time?: boolean | null;
    requires_birth_city?: boolean | null;
    requires_partner_data?: boolean | null;
    pre_checkout_fields?: unknown;
    post_checkout_fields?: unknown;
  } | null;
}

interface AstroReading {
  id: string;
  reading_type: string;
  result_data: Record<string, unknown>;
  created_at: string;
}

interface TarotReading {
  id: string;
  spread_type: string;
  cards: unknown;
  interpretation: string | null;
  created_at: string;
}

interface IntakeSubmission {
  id: string;
  fields: Record<string, string>;
  completed_at: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function PortalOrderDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data: orderRaw, error } = await supabase
    .from("orders")
    .select(
      `id, product_title, product_type, amount_cents, currency, status, notes,
       paid_at, intake_submitted_at, delivered_at, created_at, service_id, booking_id,
       diviners(display_name, username, avatar_url),
       services(name, slug, category, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields)`
    )
    .eq("id", id)
    .eq("client_id", client.id)
    .single();

  if (error || !orderRaw) notFound();

  const order = orderRaw as unknown as OrderDetail;

  // Fetch intake submission, template, and linked readings in parallel
  const isDelivered = order.status === "delivered" || order.status === "completed";
  const [intakeResult, templateResult, astroReadingsResult, tarotReadingsResult] = await Promise.all([
    supabase
      .from("order_intake_submissions")
      .select("id, fields, completed_at")
      .eq("order_id", id)
      .maybeSingle(),
    (async (): Promise<IntakeTemplate | null> => {
      const templateId = order.services?.intake_template_id ?? null;
      if (!templateId) {
        return buildFallbackIntakeTemplate(order.services);
      }
      const { data } = await admin
        .from("intake_templates")
        .select("id, diviner_id, name, description, is_default, fields, created_at, updated_at")
        .eq("id", templateId)
        .maybeSingle();
      return (data as IntakeTemplate | null) ?? buildFallbackIntakeTemplate(order.services);
    })(),
    (async (): Promise<AstroReading[]> => {
      if (!isDelivered || !order.booking_id) return [];
      const { data } = await admin
        .from("astro_toolkit_readings")
        .select("id, reading_type, result_data, created_at")
        .eq("booking_id", order.booking_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      return (data as AstroReading[] | null) ?? [];
    })(),
    (async (): Promise<TarotReading[]> => {
      if (!isDelivered || !order.booking_id) return [];
      const { data } = await admin
        .from("tarot_readings")
        .select("id, spread_type, cards, interpretation, created_at")
        .eq("booking_id", order.booking_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      return (data as TarotReading[] | null) ?? [];
    })(),
  ]);

  const intake = intakeResult.data as IntakeSubmission | null;
  const intakeTemplate = templateResult;
  const astroReadings = astroReadingsResult;
  const tarotReadings = tarotReadingsResult;

  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const diviner = order.diviners;

  const showIntakeSection =
    order.status === "awaiting_intake" ||
    order.status === "intake_submitted" ||
    order.status === "in_progress" ||
    order.status === "scheduled" ||
    order.status === "delivered" ||
    order.status === "completed";

  const hasDeliverableContent =
    !!order.notes || astroReadings.length > 0 || tarotReadings.length > 0;
  const showDeliverable = isDelivered && hasDeliverableContent;
  const divinerAvatarUrl = getDivinerAvatarUrl(diviner?.avatar_url);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/portal/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Orders
      </Link>

      {/* Order Summary Card */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              <Image
                src={divinerAvatarUrl}
                alt={diviner?.display_name ?? "Diviner"}
                width={44}
                height={44}
                className="size-11 object-cover"
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold leading-tight">
                {order.product_title || order.services?.name || "Reading"}
              </h1>
              <p className="text-sm text-muted-foreground">
                with {diviner?.display_name ?? "Diviner"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
            <Badge
              variant="outline"
              className={`${statusBadgeClass[order.status] ?? ""} text-xs`}
            >
              {statusLabel[order.status] ?? order.status}
            </Badge>
            <p className="text-sm font-semibold">
              {formatCents(order.amount_cents, order.currency)}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Ordered</p>
            <p>{formatDateTime(order.created_at)}</p>
          </div>
          {order.paid_at && (
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p>{formatDateTime(order.paid_at)}</p>
            </div>
          )}
          {order.delivered_at && (
            <div>
              <p className="text-xs text-muted-foreground">Delivered</p>
              <p>{formatDateTime(order.delivered_at)}</p>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="pt-1">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Progress
          </p>
          <div className="flex items-center gap-0">
            {TIMELINE_STEPS.map((step, idx) => {
              const stepOrder = STATUS_ORDER[step.key] ?? 0;
              const isCompleted = currentStep > stepOrder;
              const isActive = currentStep === stepOrder;

              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle2 className="size-5 text-green-500" />
                    ) : isActive ? (
                      <div className="size-5 rounded-full border-2 border-primary bg-primary/20 ring-2 ring-primary/30" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground/30" />
                    )}
                    <span
                      className={`text-[10px] font-medium ${
                        isCompleted
                          ? "text-green-500"
                          : isActive
                          ? "text-primary"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`mx-1 mb-4 h-0.5 w-8 sm:w-12 ${
                        currentStep > stepOrder ? "bg-green-500/50" : "bg-white/[0.07]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Intake section */}
      {showIntakeSection && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
          <h2 className="font-semibold">
            {intakeTemplate?.name ?? "Reading Intake"}
          </h2>

          {intake ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="size-4" />
                Intake submitted on {formatDateTime(intake.completed_at)}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(intake.fields).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : order.status === "awaiting_intake" ? (
            <DynamicIntakeForm
              orderId={order.id}
              template={intakeTemplate}
              productTitle={order.product_title || order.services?.name || "Reading"}
              clientName={client.full_name}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Intake information will be collected once payment is confirmed.
            </p>
          )}
        </div>
      )}

      {/* Deliverable section */}
      {showDeliverable && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-green-400" />
            <h2 className="font-semibold text-green-400">Your Reading</h2>
          </div>

          {/* Diviner notes */}
          {order.notes && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-green-300/70">
                Notes from Your Diviner
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {/* Astro toolkit readings */}
          {astroReadings.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-green-300/70">
                Astrology Readings
              </p>
              {astroReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="rounded-lg border border-green-500/10 bg-green-500/5 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-green-400" />
                      <span className="text-sm font-medium capitalize">
                        {reading.reading_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(reading.created_at)}
                    </span>
                  </div>
                  {reading.result_data && typeof reading.result_data === "object" && (
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {(reading.result_data as Record<string, unknown>).summary
                        ? String((reading.result_data as Record<string, unknown>).summary)
                        : (reading.result_data as Record<string, unknown>).interpretation
                        ? String((reading.result_data as Record<string, unknown>).interpretation)
                        : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tarot readings */}
          {tarotReadings.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-green-300/70">
                Tarot Readings
              </p>
              {tarotReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="rounded-lg border border-green-500/10 bg-green-500/5 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-green-400" />
                      <span className="text-sm font-medium capitalize">
                        {reading.spread_type?.replace(/_/g, " ") ?? "Tarot Spread"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(reading.created_at)}
                    </span>
                  </div>
                  {reading.interpretation && (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {reading.interpretation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No deliverables yet message for delivered orders */}
      {isDelivered && !hasDeliverableContent && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-sm text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <span>Your reading has been delivered. Content will appear here once your diviner adds notes.</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {order.status === "awaiting_intake" && !intake && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
          <strong>Action Required:</strong> Please complete the intake form above so your
          diviner can prepare your reading.
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href="/portal/orders">
          <ArrowLeft className="mr-2 size-4" />
          Back to All Orders
        </Link>
      </Button>
    </div>
  );
}
