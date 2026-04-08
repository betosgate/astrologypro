"use client";

import { useState, useCallback } from "react";
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
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";

// ── Stripe instance (singleton) ───────────────────────────────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ── Success overlay ───────────────────────────────────────────────────────────
interface SuccessOverlayProps {
  setupIntentId: string;
  email: string;
  onClose: () => void;
}

function SuccessOverlay({ setupIntentId, email, onClose }: SuccessOverlayProps) {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <CheckCircle2 className="size-8 text-emerald-600" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Payment Method Updated</h3>
        <p className="text-sm text-muted-foreground">
          Your new payment method has been saved successfully.
        </p>
      </div>

      <dl className="w-full rounded-lg border bg-muted/30 divide-y text-sm text-left">
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-xs truncate max-w-[180px]">{setupIntentId}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-muted-foreground">Account</dt>
          <dd className="truncate max-w-[180px]">{email}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-muted-foreground">Date</dt>
          <dd>{date}</dd>
        </div>
      </dl>

      <Button className="w-full" onClick={onClose}>
        Go to Dashboard
      </Button>
    </div>
  );
}

// ── Inner form (must be inside Elements) ─────────────────────────────────────
interface PaymentFormProps {
  email: string;
  onSuccess: (setupIntentId: string) => void;
}

function PaymentForm({ email, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { setupIntent, error: stripeErr } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: { email },
        },
      },
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message ?? "Payment confirmation failed.");
      setSubmitting(false);
      return;
    }

    if (setupIntent?.id) {
      onSuccess(setupIntent.id);
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting || !stripe}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        Update Payment Method
      </Button>
    </form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function UpdatePaymentModal({
  open,
  onOpenChange,
  email,
}: UpdatePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const fetchSetupIntent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setClientSecret(null);
    setSuccessId(null);
    try {
      const res = await fetch("/api/community/billing/setup-intent", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "Failed to initialize payment form.");
        return;
      }
      setClientSecret(data.clientSecret);
    } catch {
      setLoadError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(next: boolean) {
    if (next) {
      fetchSetupIntent();
    } else {
      setClientSecret(null);
      setSuccessId(null);
      setLoadError(null);
    }
    onOpenChange(next);
  }

  function handleSuccess(id: string) {
    setSuccessId(id);
  }

  function handleClose() {
    handleOpenChange(false);
    // Reload page so membership card reflects any changes
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Update Payment Method
          </DialogTitle>
        </DialogHeader>

        {successId ? (
          <SuccessOverlay
            setupIntentId={successId}
            email={email}
            onClose={handleClose}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
            <Button variant="outline" className="w-full" onClick={fetchSetupIntent}>
              Retry
            </Button>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                  borderRadius: "6px",
                },
              },
            }}
          >
            <PaymentForm email={email} onSuccess={handleSuccess} />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
