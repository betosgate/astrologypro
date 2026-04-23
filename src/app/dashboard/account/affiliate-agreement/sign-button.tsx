"use client";

// Client-side Sign button for the affiliate partnership agreement.
// POSTs to /api/dashboard/affiliate-agreement which updates the diviners
// row's affiliate_agreement_signed flag.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck } from "lucide-react";

export function SignAgreementButton() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSign() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/affiliate-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? j?.detail ?? `Sign failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      toast.success("Agreement signed. You can now invite affiliates.");
      router.push("/dashboard/affiliates");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky bottom-0 flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <label
        htmlFor="agree-checkbox"
        className="flex items-start gap-2 text-sm"
      >
        <Checkbox
          id="agree-checkbox"
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
          className="mt-0.5"
        />
        <span>
          I&rsquo;ve read and agree to the affiliate partnership terms above.
        </span>
      </label>
      <Button
        onClick={handleSign}
        disabled={!checked || submitting}
        className="shrink-0"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Signing&hellip;
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 size-4" aria-hidden />
            Sign agreement
          </>
        )}
      </Button>
    </div>
  );
}
