"use client";

import { useEffect, useState } from "react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, RefreshCcw, Star } from "lucide-react";
import { toast } from "sonner";
import {
  QUARTER_UI_META,
  type QuarterName,
} from "@/lib/mystery-school/quarters";

interface PricingPlan {
  plan_id: string;
  display_name: string;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  description: string | null;
}

interface StudentStatus {
  exists: boolean;
  status: string | null;
  entry_quarter: string | null;
  entry_year: number | null;
  billing_valid: boolean;
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function MysterySchoolResubscribePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<StudentStatus | null>(null);
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [isPmMember, setIsPmMember] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/mystery-school/student-status").then((r) => {
        if (r.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            "/join/mystery-school/resubscribe"
          )}`;
          return null;
        }
        return r.json();
      }),
      fetch("/api/community/subscription").then((r) => r.json()).catch(() => ({})),
      fetch("/api/community/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/pricing/mystery_school").then((r) => r.json()).catch(() => ({ plans: [] })),
    ])
      .then(([statusData, subData, settingsData, pricingData]) => {
        if (cancelled || !statusData) return;

        const status = statusData as StudentStatus;
        if (!status.exists) {
          window.location.href = "/join/mystery-school";
          return;
        }
        if (status.billing_valid && status.status === "active") {
          window.location.href = "/mystery-school";
          return;
        }
        setStudent(status);

        const isActivePm =
          subData?.subscription?.membership_type === "perennial_mandalism" &&
          subData?.subscription?.status === "active";
        const discountEnabled = settingsData?.ms_pm_discount_enabled === true;
        setIsPmMember(isActivePm && discountEnabled);

        const plans: PricingPlan[] = pricingData?.plans ?? [];
        const planId =
          isActivePm && discountEnabled
            ? "plan_mystery_monthly_pm_discount"
            : "plan_mystery_monthly";
        const selected = plans.find((p) => p.plan_id === planId) ?? plans[0] ?? null;
        setPlan(selected);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load resubscribe details. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResubscribe() {
    if (!student) return;
    setSubmitting(true);
    try {
      // entry_quarter / entry_year are sent only when the existing row
      // has them. The checkout endpoint skips its validation when
      // resubscribe=true and the finalize endpoint preserves the
      // existing row's quarter/year regardless.
      const body: Record<string, unknown> = {
        membershipType: "mystery_school",
        planType: "individual",
        resubscribe: true,
      };
      if (student.entry_quarter) body.entry_quarter = student.entry_quarter;
      if (student.entry_year) body.entry_year = student.entry_year;

      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          "/join/mystery-school/resubscribe"
        )}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const quarterMeta = student?.entry_quarter
    ? QUARTER_UI_META[student.entry_quarter as QuarterName]
    : null;
  const recurringPrice = plan?.recurring_amount;
  const recurringCurrency = plan?.recurring_currency ?? "USD";
  const recurringInterval = plan?.recurring_interval ?? "month";

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <RefreshCcw className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Your Mystery School subscription is no longer active. Resubscribe
              to pick up where you left off — your decan progress, journals,
              and ritual history are all still here.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5" />
                Resubscribe to Mystery School
              </CardTitle>
              <CardDescription>
                The one-time enrollment fee was already paid on your original
                enrollment. Only the recurring subscription is charged today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : !student ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Could not load your enrollment. Please refresh the page.
                </p>
              ) : (
                <>
                  {student.entry_quarter && student.entry_year && (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                      <div className="flex items-center gap-2 text-sm">
                        {quarterMeta && <span className="text-lg">{quarterMeta.emoji}</span>}
                        <span className="capitalize font-medium">
                          {student.entry_quarter} {student.entry_year}
                        </span>
                        <span className="text-muted-foreground">cohort</span>
                      </div>
                      <span className="text-xs text-muted-foreground">resuming</span>
                    </div>
                  )}

                  {plan && recurringPrice != null && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold">{plan.display_name}</span>
                        {isPmMember && (
                          <p className="text-xs text-muted-foreground">
                            Perennial Mandalism member discount applied
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold">
                        {formatCurrency(recurringPrice, recurringCurrency)}/
                        {recurringInterval === "month" ? "mo" : recurringInterval}
                      </span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleResubscribe}
                    disabled={submitting || !plan}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Redirecting to Stripe…
                      </>
                    ) : (
                      "Resubscribe Now"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Secure checkout via Stripe · Cancel anytime
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
