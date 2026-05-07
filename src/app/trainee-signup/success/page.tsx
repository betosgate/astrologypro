import type Stripe from "stripe";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, ScrollText, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Trainee Program - Payment Successful - AstrologyPro",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatCheckoutAmount(amount: number | null, currency: string | null) {
  if (amount == null) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getCheckoutDetails(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });
  const sessionWithLines = session as unknown as {
    line_items?: { data?: Array<{ description?: string | null }> };
  };
  const planName =
    session.metadata?.planName ??
    sessionWithLines.line_items?.data?.find((item) => item.description)?.description ??
    "Trainee Program";

  return [
    ["Amount paid", formatCheckoutAmount(session.amount_total, session.currency)],
    ["Recent plan", planName],
    ["Payment status", titleCase(session.payment_status)],
  ];
}

export default async function TraineeSignupSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionId = firstParam(resolvedSearchParams.session_id);

  if (!sessionId) {
    redirect("/get-started?error=missing-session");
  }

  const loginRedirect = `/trainee-signup/success?session_id=${encodeURIComponent(sessionId)}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  }

  // The next step is the trainee profile completion
  const nextHref = `/join/trainee/profile?session_id=${encodeURIComponent(sessionId)}`;
  
  const checkoutDetails = await getCheckoutDetails(sessionId);

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
              Trainee Program
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
                  Your Trainee Program access is active. Review the payment
                  details, then continue to complete your profile.
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
                  <p className="text-sm font-semibold text-white">Account activated</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Stripe returned a successful checkout and your trainee
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
                    Complete your profile and setup your training preferences before entering the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-200/80">
              <CreditCard className="size-4" />
              Payment details
            </div>
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
              <Link href={nextHref}>
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
