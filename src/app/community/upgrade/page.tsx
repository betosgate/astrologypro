"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  BookOpen,
  Moon,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  getUpcomingEntryDates,
  QUARTER_UI_META,
  type UpcomingEntryDate,
  type QuarterName,
} from "@/lib/mystery-school/quarters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: BookOpen,
    title: "12-Week Foundation Training",
    body: "Week-by-week structured learning with audio introductions from Beto and in-depth reading material.",
  },
  {
    icon: Moon,
    title: "36-Decan Year-Long Practice",
    body: "Work through all 36 decans of the zodiac, each with a pre-built ritual, scrying journal, and mundane impact log.",
  },
  {
    icon: Star,
    title: "Ritual Performer",
    body: "Step-through ritual interface per decan — invocations, gates, and sequences fully prepared for you.",
  },
  {
    icon: Sparkles,
    title: "Priest/Priestess Graduation",
    body: "Complete all 36 decans and graduate to the rank of Priest or Priestess within the tradition.",
  },
];

const TOTAL_STEPS = 4;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {labels.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 bg-background text-muted-foreground/50",
                ].join(" ")}
              >
                {isCompleted ? <CheckCircle2 className="size-4" /> : step}
              </div>
              <span
                className={[
                  "hidden sm:block text-[10px] font-medium max-w-[72px] text-center leading-tight",
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-primary/70"
                    : "text-muted-foreground/50",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={[
                  "h-px w-8 sm:w-12 mx-1 transition-all",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — What is Mystery School?
// ---------------------------------------------------------------------------

function Step1Info({
  isPmMember,
  discountEnabled,
  onNext,
}: {
  isPmMember: boolean;
  discountEnabled: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
            <Star className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Enter the Mystery School</h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          A five-quarter initiatory journey through the hidden teachings — the foundation,
          the 36 decans, and the path to Priest or Priestess.
        </p>
      </div>

      {/* Pricing block */}
      <div className="rounded-xl border bg-primary/5 p-5 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-sm px-3 py-1">$97 one-time enrollment</Badge>
          <span className="text-muted-foreground text-sm">+</span>
          <Badge variant="secondary" className="text-sm px-3 py-1">$27 / month</Badge>
        </div>
        {isPmMember && discountEnabled && (
          <p className="text-sm text-muted-foreground mt-1">
            You currently pay{" "}
            <span className="font-semibold text-foreground">$9.97/month</span> for
            Perennial Mandalism. Upgrading adds just{" "}
            <span className="font-semibold text-primary">+$17.03/month</span> net.
          </p>
        )}
        <p className="text-xs text-muted-foreground">5-quarter commitment · cancel after any quarter</p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardHeader className="pb-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <Icon className="size-4 text-primary" />
                </div>
                <CardTitle className="text-sm">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button size="lg" onClick={onNext} className="gap-2">
          Choose Your Start Quarter <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Quarter selection
// ---------------------------------------------------------------------------

function Step2Quarter({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: UpcomingEntryDate | null;
  onSelect: (q: UpcomingEntryDate) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const quarters = getUpcomingEntryDates();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Entry Quarter</h2>
        <p className="text-muted-foreground text-sm">
          Mystery School cohorts begin at each seasonal turning point.
          Select the quarter you want to start.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {quarters.map((q) => {
          const meta = QUARTER_UI_META[q.quarter as QuarterName];
          const isSelected = selected?.isoDate === q.isoDate;
          return (
            <button
              key={q.isoDate}
              type="button"
              onClick={() => onSelect(q)}
              className={[
                "group rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 bg-card",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{meta.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold capitalize ${meta.colorClass}`}>
                      {q.quarter} {q.year}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="size-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    Starting {new Date(q.isoDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.firstWeekLabel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!selected} className="gap-2">
          Review &amp; Confirm <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review & Confirm
// ---------------------------------------------------------------------------

function Step3Review({
  selected,
  isPmMember,
  discountEnabled,
  confirmed,
  onToggleConfirm,
  onNext,
  onBack,
}: {
  selected: UpcomingEntryDate;
  isPmMember: boolean;
  discountEnabled: boolean;
  confirmed: boolean;
  onToggleConfirm: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const meta = QUARTER_UI_META[selected.quarter as QuarterName];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Review &amp; Confirm</h2>
        <p className="text-muted-foreground text-sm">
          Review the details of your enrollment before proceeding to payment.
        </p>
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="py-5 space-y-4">
          {/* Selected quarter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.emoji}</span>
              <div>
                <p className="text-sm font-medium capitalize">
                  {selected.quarter} {selected.year} Cohort
                </p>
                <p className="text-xs text-muted-foreground">{selected.label}</p>
              </div>
            </div>
            <Badge variant="outline" className={`${meta.colorClass} border-current`}>
              {selected.firstWeekLabel}
            </Badge>
          </div>

          <div className="border-t" />

          {/* Pricing breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">One-time enrollment fee</span>
              <span className="font-medium">$97.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly subscription</span>
              <span className="font-medium">$27.00 / month</span>
            </div>
            {isPmMember && discountEnabled && (
              <div className="flex justify-between text-primary">
                <span>PM member discount applied</span>
                <span className="font-medium">−$9.97 / month</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Monthly cost</span>
              <span className="text-primary">
                ${isPmMember && discountEnabled ? "17.03" : "27.00"} / month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commitment checkbox */}
      <button
        type="button"
        onClick={onToggleConfirm}
        className="flex items-start gap-3 w-full text-left rounded-lg border p-3 hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-pressed={confirmed}
      >
        {confirmed ? (
          <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
        ) : (
          <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <span className="text-sm text-muted-foreground">
          By continuing I agree to the{" "}
          <span className="font-medium text-foreground">5-quarter commitment</span>
          {" "}and understand that access to the curriculum begins in{" "}
          <span className="font-medium text-foreground capitalize">
            {selected.quarter} {selected.year}
          </span>
          .
        </span>
      </button>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!confirmed} className="gap-2">
          Proceed to Payment <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Payment / Checkout redirect
// ---------------------------------------------------------------------------

function Step4Payment({
  selected,
  isPmMember,
  discountEnabled,
  onBack,
}: {
  selected: UpcomingEntryDate;
  isPmMember: boolean;
  discountEnabled: boolean;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "mystery_school",
          planType: "individual",
          entry_quarter: selected.quarter,
          entry_year: selected.year,
          upgrade_from_pm: isPmMember,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to initiate checkout");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const meta = QUARTER_UI_META[selected.quarter as QuarterName];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Ready to Enroll</h2>
        <p className="text-muted-foreground text-sm">
          You will be redirected to Stripe to complete your secure payment.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <span>{meta.emoji}</span>
            <span className="capitalize">{selected.quarter} {selected.year}</span>
            <span className="text-muted-foreground font-normal text-base">cohort</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">$97</span> enrollment +{" "}
            <span className="font-semibold text-foreground">
              ${isPmMember && discountEnabled ? "17.03" : "27.00"}
            </span>
            /mo
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
            className="gap-2 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              <>
                Enroll in Mystery School <ChevronRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Secure checkout via Stripe · Cancel anytime after the first quarter
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack} disabled={loading} className="gap-1">
          <ChevronLeft className="size-4" /> Back
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page component
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Overview", "Quarter", "Review", "Payment"];

export default function UpgradeToMysterySchoolPage() {
  const [step, setStep] = useState(1);
  const [selectedQuarter, setSelectedQuarter] = useState<UpcomingEntryDate | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPmMember, setIsPmMember] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);

  // Detect PM membership and admin discount toggle
  useEffect(() => {
    Promise.all([
      fetch("/api/community/subscription").then((r) => r.json()).catch(() => ({})),
      fetch("/api/community/settings").then((r) => r.json()).catch(() => ({})),
    ]).then(([subData, settingsData]) => {
      if (subData?.subscription?.membership_type === "perennial_mandalism") {
        setIsPmMember(true);
      }
      if (settingsData?.ms_pm_discount_enabled === true) {
        setDiscountEnabled(true);
      }
    });
  }, []);

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
    // Reset confirmation when stepping back past review
    if (step === 3) setConfirmed(false);
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <StepIndicator current={step} labels={STEP_LABELS} />

      {step === 1 && (
        <Step1Info isPmMember={isPmMember} discountEnabled={discountEnabled} onNext={goNext} />
      )}

      {step === 2 && (
        <Step2Quarter
          selected={selectedQuarter}
          onSelect={setSelectedQuarter}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 3 && selectedQuarter && (
        <Step3Review
          selected={selectedQuarter}
          isPmMember={isPmMember}
          discountEnabled={discountEnabled}
          confirmed={confirmed}
          onToggleConfirm={() => setConfirmed((v) => !v)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 4 && selectedQuarter && (
        <Step4Payment
          selected={selectedQuarter}
          isPmMember={isPmMember}
          discountEnabled={discountEnabled}
          onBack={goBack}
        />
      )}
    </div>
  );
}
