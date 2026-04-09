"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface UnsubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Legacy "Alert!!" warning modal that confirms cancellation of the
 * Perennial Mandalism subscription. Calls
 * POST /api/community/billing/unsubscribe and refreshes the page on success.
 */
export function UnsubscribeModal({ open, onOpenChange }: UnsubscribeModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      // Delegate to the canonical /api/community/plan/cancel route which has
      // idempotent guards (already-cancelling / already-cancelled checks),
      // captures current_period_end, and is the same code path used by every
      // other cancel surface in the app. The legacy
      // /api/community/billing/unsubscribe route is kept for now but is
      // functionally a subset.
      const res = await fetch("/api/community/plan/cancel", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel subscription");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="-mx-6 -mt-6 mb-2 flex items-center gap-2 rounded-t-lg bg-orange-500 px-6 py-3 text-white">
            <AlertTriangle className="size-5" aria-hidden="true" />
            <DialogTitle className="text-base font-bold tracking-wide text-white">
              Alert!!
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            Are you sure you want to unsubscribe from the Perennial Mandalism
            Dashboard? You will lose access to your membership benefits at the
            end of the current billing period.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Unsubscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
