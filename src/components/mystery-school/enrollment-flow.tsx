"use client";

import { useEffect, useState } from "react";
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
const STEP_LABELS = ["Overview", "Quarter", "Review", "Payment"];

function StepIndicator({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
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
                  "hidden max-w-[72px] text-center text-[10px] font-medium leading-tight sm:block",
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
                  "mx-1 h-px w-8 transition-all sm:w-12",
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
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
            <Star className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Enter the Mystery School</h1>
        <p className="mx-auto max-w-lg text-base text-muted-foreground">
          A five-quarter initiatory journey through the hidden teachings — the foundation,
          the 36 decans, and the path to Priest or Priestess.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border bg-primary/5 p-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-sm">$97 one-time enrollment</Badge>
          <span className="text-sm text-muted-foreground">+</span>
          <Badge variant="secondary" className="px-3 py-1 text-sm">$27 / month</Badge>
        </div>
        {isPmMember && discountEnabled && (
          <p className="mt-1 text-sm text-muted-foreground">
            Active Perennial Mandalism members qualify for the current monthly member rate of{" "}
            <span className="font-semibold text-primary">$17.03/month</span>.
          </p>
        )}
        <p className="text-xs text-muted-foreground">5-quarter commitment · cancel after any quarter</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardHeader className="pb-2">
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10">
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
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Entry Quarter</h2>
        <p className="text-sm text-muted-foreground">
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
                "group rounded-xl border-2 bg-card p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-2xl">{meta.emoji}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold capitalize ${meta.colorClass}`}>
                      {q.quarter} {q.year}
                    </span>
                    {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    Starting {new Date(q.isoDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Review &amp; Confirm</h2>
        <p className="text-sm text-muted-foreground">
          Review the details of your enrollment before proceeding to payment.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-5">
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
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Monthly cost</span>
              <span className="text-primary">
                ${isPmMember && discountEnabled ? "17.03" : "27.00"} / month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={onToggleConfirm}
        className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-pressed={confirmed}
      >
        {confirmed ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
        ) : (
          <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          By continuing I agree to the{" "}
          <span className="font-medium text-foreground">5-quarter commitment</span>
          {" "}and understand that access to the curriculum begins in{" "}
          <span className="font-medium capitalize text-foreground">
            {selected.quarter} {selected.year}
          </span>.
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
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Ready to Enroll</h2>
        <p className="text-sm text-muted-foreground">
          You will be redirected to Stripe to complete your secure payment.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-3 py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <span>{meta.emoji}</span>
            <span className="capitalize">{selected.quarter} {selected.year}</span>
            <span className="text-base font-normal text-muted-foreground">cohort</span>
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
            className="w-full gap-2 sm:w-auto"
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

export function MysterySchoolEnrollmentFlow() {
  const [step, setStep] = useState(1);
  const [selectedQuarter, setSelectedQuarter] = useState<UpcomingEntryDate | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPmMember, setIsPmMember] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);

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
