import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ScrollText, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { finalizePerennialCommunityCheckoutFromSessionId } from "@/lib/community/finalize-checkout";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizing Perennial Mandalism - AstrologyPro" };

function formatCheckoutAmount(amount: number | null, currency: string | null) {
  if (amount == null) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatCheckoutDate(timestamp: number | null) {
  if (!timestamp) return "No recurring payment scheduled";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatIsoCheckoutDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type PmSubscriptionResponse = {
  subscription?: {
    current_period_end?: string | null;
    plan_name?: string | null;
    status?: string | null;
    amount?: number | null;
    currency?: string | null;
    interval?: string | null;
    tier_name?: string | null;
  } | null;
};

async function getPmSubscriptionDetails() {
  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const protocol =
      hdrs.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") ? "http" : "https");
    const origin = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;
    const cookie = hdrs.get("cookie");

    if (!origin) return null;

    const response = await fetch(`${origin}/api/pm/subscription`, {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    });

    if (!response.ok) return null;

    const body = (await response.json()) as PmSubscriptionResponse;
    return body.subscription ?? null;
  } catch (error) {
    console.error("[join/community/checkout/success] subscription fetch failed:", error);
    return null;
  }
}

async function getCheckoutDetails(sessionId: string, fallbackPlan: string | null) {
  const [session, pmSubscription] = await Promise.all([
    stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "subscription"],
    }),
    getPmSubscriptionDetails(),
  ]);
  const sessionWithLines = session as unknown as {
    line_items?: { data?: Array<{ description?: string | null }> };
  };
  const subscription =
    typeof session.subscription === "object" && session.subscription
      ? (session.subscription as unknown as { current_period_end?: number | null })
      : null;
  const planName =
    pmSubscription?.plan_name ??
    sessionWithLines.line_items?.data?.find((item) => item.description)?.description ??
    fallbackPlan ??
    "Perennial Mandalism";
  const nextPaymentDate =
    formatIsoCheckoutDate(pmSubscription?.current_period_end) ??
    formatCheckoutDate(subscription?.current_period_end ?? null);

  return [
    ["Amount paid", formatCheckoutAmount(session.amount_total, session.currency)],
    ["Recent plan", planName],
    ["Next payment date", nextPaymentDate],
    ["Payment status", titleCase(pmSubscription?.status ?? session.payment_status)],
  ];
}

export default async function CommunityCheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionIdParam = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
  const sourceParam = resolvedSearchParams.source;
  const source = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam;
  const loginRedirect = `/join/community/checkout/success${
    sessionId
      ? `?session_id=${encodeURIComponent(sessionId)}${source ? `&source=${encodeURIComponent(source)}` : ""}`
      : ""
  }`;

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  }

  if (!sessionId) {
    if (source === "trainee") {
      redirect("/join/community/checkout/error?source=trainee&reason=missing-session");
    }
    if (source === "invite") {
      redirect("/join/community/checkout/error?source=invite&reason=missing-session");
    }
    redirect("/switch?pm=missing-session");
  }

  const result = await finalizePerennialCommunityCheckoutFromSessionId({
    sessionId,
    userId: user.id,
    ensureContracts: true,
  });

  if (!result?.communityMemberSaved) {
    if (source === "trainee") {
      redirect("/join/community/checkout/error?source=trainee&reason=provision-failed");
    }
    if (source === "invite") {
      redirect("/join/community/checkout/error?source=invite&reason=provision-failed");
    }
    redirect("/switch?subscribed=true&pm=provision-failed");
  }

  const contractsSource = source === "trainee" ? "trainee-pm-upgrade" : "community-checkout";
  const contractsHref = `/contracts/pending?source=${contractsSource}&session_id=${encodeURIComponent(sessionId)}&next=${encodeURIComponent("/community")}`;
  const checkoutDetails = await getCheckoutDetails(
    sessionId,
    result.planId ?? titleCase(result.planType),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />

      <Card className="relative w-full max-w-3xl overflow-hidden border-violet-500/25 bg-gradient-to-br from-violet-950/85 via-slate-950/96 to-slate-950 text-white shadow-2xl shadow-violet-950/30">
        <CardContent className="p-0">
          <div className="relative border-b border-violet-500/15 px-6 py-6 sm:px-8">
            <div className="absolute right-6 top-5 hidden size-24 text-violet-300/15 sm:block">
              <Sparkles className="size-full" />
            </div>
            <Badge className="mb-4 border-violet-400/30 bg-violet-400/15 text-[10px] font-bold uppercase tracking-widest text-violet-200 hover:bg-violet-400/15">
              Perennial Mandalism
            </Badge>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-400/15 shadow-lg shadow-violet-500/10">
                <CheckCircle2 className="size-9 text-violet-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-violet-50">
                  Payment successful
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                  Your Perennial Mandalism membership is active. Complete the
                  required agreement step, then continue into the community.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Membership active</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Stripe returned a successful checkout and your community
                    access has been provisioned.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
                  <ScrollText className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Next step</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Review and accept any pending contracts before entering
                    Perennial Mandalism.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-200/80">
              Payment details
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {checkoutDetails.map(([label, value]) => (
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

          <div className="border-t border-white/10 bg-slate-950/35 px-6 py-5 sm:px-8">
            <Button asChild size="lg" className="w-full bg-gradient-to-r from-violet-500 to-purple-500 font-bold text-white hover:from-violet-400 hover:to-purple-400">
              <Link href={contractsHref}>
                Go to Next Step
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
