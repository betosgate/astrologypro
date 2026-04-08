"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Lock, AlertCircle } from "lucide-react";

// ── Stripe singleton (publishable key only — never the secret) ────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

interface DivinerSignupPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  email: string;
  name?: string;
  /** Called once payment succeeds; parent can navigate to the success page. */
  onPaid?: (paymentIntentId: string) => void;
}

interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

function formatAmount(amount: number, currency: string): string {
  // amount is in the smallest currency unit (paise/cents).
  const display = amount / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(display);
  } catch {
    return `${currency.toUpperCase()} ${display.toLocaleString()}`;
  }
}

// ── Inner form (must be inside Elements provider) ─────────────────────────

interface PaymentFormProps {
  email: string;
  amount: number;
  currency: string;
  onPaid: (paymentIntentId: string) => void;
}

function PaymentForm({ email, amount, currency, onPaid }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { paymentIntent, error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: { email },
        },
      },
      // Inline confirm — only redirect if the payment method requires it
      // (3DS, redirect-based wallets). For card payments this resolves
      // synchronously and we can navigate ourselves.
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message ?? "Payment confirmation failed.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" && paymentIntent.id) {
      onPaid(paymentIntent.id);
      return;
    }

    if (paymentIntent?.status === "processing") {
      setError(
        "Payment is processing. We'll update your account once Stripe confirms it.",
      );
    } else {
      setError(
        `Unexpected payment status: ${paymentIntent?.status ?? "unknown"}`,
      );
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Total Amount
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {formatAmount(amount, currency)}
        </p>
      </div>

      <PaymentElement />

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={submitting || !stripe}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        <Lock className="mr-2 size-4" />
        Pay Now
      </Button>
    </form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────

export function DivinerSignupPaymentModal({
  open,
  onOpenChange,
  userId,
  email,
  name,
  onPaid,
}: DivinerSignupPaymentModalProps) {
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paid, setPaid] = useState<string | null>(null);

  const fetchIntent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setIntent(null);
    try {
      const res = await fetch("/api/diviner-signup/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setIntent(data as PaymentIntentResponse);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId, email, name]);

  // Auto-fetch the intent on open.
  useEffect(() => {
    if (open && !intent && !loading && !loadError) {
      void fetchIntent();
    }
    if (!open) {
      setIntent(null);
      setLoadError(null);
      setPaid(null);
    }
  }, [open, intent, loading, loadError, fetchIntent]);

  function handlePaid(id: string) {
    setPaid(id);
    onPaid?.(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4" />
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        {paid ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="size-9 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Successful</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome to the Professional Divination Course. You can now
                sign in with your new account.
              </p>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Preparing secure payment…
          </div>
        ) : loadError ? (
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p>{loadError}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={fetchIntent}>
              Retry
            </Button>
          </div>
        ) : intent ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: intent.client_secret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentForm
              email={email}
              amount={intent.amount}
              currency={intent.currency}
              onPaid={handlePaid}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
