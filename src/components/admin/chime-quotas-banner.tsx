"use client";

import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "chime_quotas_banner_dismissed";

export function ChimeQuotasBanner() {
  const [visible, setVisible] = useState(false);

  // Read localStorage after mount (SSR-safe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    }
  }, []);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1">
        <span className="font-semibold">AWS Service Quotas notice:&nbsp;</span>
        Chime phone numbers require a Service Quotas limit increase before
        provisioning for more than 5 diviners. Request an increase at{" "}
        <span className="font-medium">
          AWS Console → Service Quotas → Amazon Chime SDK → Phone Number
        </span>
        . Approval typically takes 1–3 business days.
      </p>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Dismiss"
        className="h-6 w-6 shrink-0 p-0 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
        onClick={handleDismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
