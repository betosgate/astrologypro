"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  productName: string;
  periodEnd?: string;
}

export function CancelSubscriptionButton({
  subscriptionId,
  productName,
  periodEnd,
}: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const periodEndLabel = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-US", { dateStyle: "long" })
    : null;

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/portal/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
      });
      const body = (await res.json()) as { success?: boolean; message?: string; error?: string };

      if (!res.ok || !body.success) {
        throw new Error(body.error ?? "Failed to cancel subscription.");
      }

      setSuccessMessage(body.message ?? "Subscription cancelled.");
      setConfirmOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <p className="text-xs text-muted-foreground">{successMessage}</p>
    );
  }

  if (!confirmOpen) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <XCircle className="mr-1.5 size-3.5" />
        Cancel Subscription
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
      <p className="font-medium">Cancel {productName}?</p>
      {periodEndLabel ? (
        <p className="text-xs text-muted-foreground">
          You will continue to have access until {periodEndLabel}.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Your subscription will be cancelled immediately.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          Yes, Cancel
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setConfirmOpen(false);
            setError("");
          }}
          disabled={loading}
        >
          Keep Subscription
        </Button>
      </div>
    </div>
  );
}
