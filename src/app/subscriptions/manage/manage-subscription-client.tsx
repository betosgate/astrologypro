"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionClient(props: {
  token: string;
  initialCancelled: boolean;
  initialEmailOptOut: boolean;
  periodEndLabel: string | null;
}) {
  const { token, initialCancelled, initialEmailOptOut, periodEndLabel } = props;
  const [isCancelled, setIsCancelled] = useState(initialCancelled);
  const [emailPaused, setEmailPaused] = useState(initialEmailOptOut);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "cancel" | "pause_emails" | "resume_emails") {
    setLoadingAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });

      const json = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      if (action === "cancel") setIsCancelled(true);
      if (action === "pause_emails") setEmailPaused(true);
      if (action === "resume_emails") setEmailPaused(false);
      setMessage(json.message ?? "Updated.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Manage weekly updates</h2>
        <p className="text-sm text-zinc-300">
          Use this page to pause email deliveries or cancel the subscription entirely.
        </p>
        {periodEndLabel && (
          <p className="text-xs text-zinc-400">
            Current billing period ends {periodEndLabel}.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Email delivery</p>
          <p className="mt-1 text-sm text-zinc-400">
            {emailPaused
              ? "Weekly messages are paused for this email address."
              : "Weekly messages are active and will continue to arrive here."}
          </p>
          <Button
            className="mt-4 w-full"
            variant={emailPaused ? "default" : "outline"}
            disabled={loadingAction !== null}
            onClick={() =>
              runAction(emailPaused ? "resume_emails" : "pause_emails")
            }
          >
            {loadingAction === "pause_emails" || loadingAction === "resume_emails"
              ? "Saving..."
              : emailPaused
              ? "Resume emails"
              : "Pause emails"}
          </Button>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-white">Subscription status</p>
          <p className="mt-1 text-sm text-zinc-400">
            {isCancelled
              ? "This subscription is cancelled."
              : "Cancel now to stop renewal at the end of the current billing period."}
          </p>
          <Button
            className="mt-4 w-full"
            variant="destructive"
            disabled={isCancelled || loadingAction !== null}
            onClick={() => runAction("cancel")}
          >
            {loadingAction === "cancel" ? "Cancelling..." : isCancelled ? "Cancelled" : "Cancel subscription"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
