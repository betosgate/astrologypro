import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Stripe from "stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatProfessionalDivinationCourseTrack,
  inferProfessionalDivinationCourseTrack,
} from "@/lib/professional-divination-course";
import { finalizeInvitedDivinerFromSessionId } from "@/lib/invited-diviner-upgrade";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { finalizeTraineeDivinerUpgradeFromSessionId } from "@/lib/trainee-diviner-upgrade";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment Successful - AstrologyPro" };

function formatCheckoutAmount(amount: number | null, currency: string | null) {
  if (amount == null) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatText(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getCheckoutDetails(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "subscription"],
  });

  const expandedSession = session as Stripe.Checkout.Session & {
    line_items?: { data?: Array<{ description?: string | null }> };
  };
  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;
  const subscriptionWithPeriod = subscription as
    | (Stripe.Subscription & { current_period_end?: number | null })
    | null;
  const planName =
    session.metadata?.planName ??
    expandedSession.line_items?.data?.find((item) => item.description)?.description ??
    "Professional Divination Course";
  const track = inferProfessionalDivinationCourseTrack(planName);
  const subscriptionItem = subscriptionWithPeriod?.items.data[0];
  const interval = subscriptionItem?.price.recurring?.interval ?? null;
  const recurringAmount = subscriptionItem?.price.unit_amount ?? null;
  const recurringCurrency = subscriptionItem?.price.currency ?? session.currency;

  return {
    flowType: session.metadata?.type ?? null,
    headingPlan: planName,
    rows: [
      ["Amount paid", formatCheckoutAmount(session.amount_total, session.currency)],
      ["Course", planName],
      ["Course type", formatProfessionalDivinationCourseTrack(track)],
      [
        "Recurring amount",
        recurringAmount == null
          ? "No recurring amount"
          : `${formatCheckoutAmount(recurringAmount, recurringCurrency)} / ${interval ?? "period"}`,
      ],
      ["Payment status", formatText(session.payment_status)],
      ["Checkout status", formatText(session.status)],
      ["Customer email", session.customer_details?.email ?? session.customer_email ?? "Not available"],
    ],
  };
}

export default async function GetStartedSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionIdParam = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

  if (!sessionId) {
    redirect("/get-started?error=missing-session");
  }

  const checkoutDetails = await getCheckoutDetails(sessionId);
  const isInvitedDiviner = checkoutDetails.flowType === "invited_diviner";
  const result = isInvitedDiviner
    ? await finalizeInvitedDivinerFromSessionId({
        sessionId,
        userId: user.id,
      })
    : await finalizeTraineeDivinerUpgradeFromSessionId({
        sessionId,
        userId: user.id,
        markTraineePaid: false,
        ensureContracts: true,
      });

  if (!result?.divinerSaved) {
    redirect("/get-started?error=provision-failed");
  }

  const contractsHref = `/contracts/pending?source=${isInvitedDiviner ? "invited-diviner" : "get-started"}&session_id=${encodeURIComponent(sessionId)}&next=${encodeURIComponent("/dashboard")}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950 p-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.14),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

      <Card className="relative w-full max-w-3xl overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-950/85 via-slate-950/96 to-slate-950 text-white shadow-2xl shadow-amber-950/30">
        <CardContent className="p-0">
          <div className="relative border-b border-amber-500/15 px-6 py-6 sm:px-8">
            <div className="absolute right-6 top-5 hidden size-24 text-amber-300/15 sm:block">
              <Sparkles className="size-full" />
            </div>
            <Badge className="mb-4 border-amber-400/30 bg-amber-400/15 text-[10px] font-bold uppercase tracking-widest text-amber-200 hover:bg-amber-400/15">
              Payment Complete
            </Badge>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/15 shadow-lg shadow-amber-500/10">
                <CheckCircle2 className="size-9 text-amber-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-amber-50">
                  Payment successful
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                  Your {checkoutDetails.headingPlan} access is active. Review the payment
                  details, complete your agreement, then continue to the dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Account activated</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Your paid diviner profile has been provisioned for the selected course.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">
                  <ScrollText className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Next step</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Accept any required contracts before entering the professional dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-y border-white/10 px-6 py-5 sm:px-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              <CreditCard className="size-4" />
              Payment details
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {checkoutDetails.rows.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/35 px-6 py-5 sm:px-8">
            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-slate-950 hover:from-amber-400 hover:to-yellow-400"
            >
              <Link href={contractsHref}>
                Continue to Contract
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
