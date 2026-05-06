"use client";

import { useEffect, useState, useCallback } from "react";

interface StatusResponse {
  connected?: boolean;
  stripeAccountId?: string | null;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  syncedAt?: string | null;
}

/**
 * Renders a Connect / Resume / Pending verification / Connected card
 * based on /api/affiliate/stripe-connect/status.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export function StripeConnectPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/stripe-connect/status", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as StatusResponse;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startOnboarding = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/stripe-connect/start", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Failed to start Stripe onboarding");
      }
      window.location.href = json.url;
    } catch (err) {
      setWorking(false);
      setError(err instanceof Error ? err.message : "Failed to start onboarding");
    }
  }, []);

  const openLoginLink = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/stripe-connect/login-link", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Failed to open Stripe dashboard");
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open dashboard");
    } finally {
      setWorking(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        Checking Stripe status…
      </div>
    );
  }

  const connected = !!status?.connected;
  const payoutsEnabled = !!status?.payoutsEnabled;
  const detailsSubmitted = !!status?.detailsSubmitted;

  let title = "Connect Stripe";
  let description =
    "Connect a Stripe account to start receiving affiliate payouts.";
  let primaryLabel = "Connect Stripe";
  let primaryAction: () => void = startOnboarding;
  let tone: "warning" | "info" | "success" = "warning";

  if (connected && payoutsEnabled) {
    title = "Stripe connected";
    description = "Your bank account is verified. Payouts run automatically.";
    primaryLabel = "Open Stripe dashboard";
    primaryAction = openLoginLink;
    tone = "success";
  } else if (connected && detailsSubmitted) {
    title = "Stripe verification pending";
    description =
      "Stripe is verifying your account. We'll enable payouts as soon as verification completes.";
    primaryLabel = "View verification status";
    primaryAction = openLoginLink;
    tone = "info";
  } else if (connected) {
    title = "Resume Stripe onboarding";
    description =
      "Your Stripe account exists but onboarding is incomplete. Finish onboarding to enable payouts.";
    primaryLabel = "Resume onboarding";
    primaryAction = startOnboarding;
  }

  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "info"
        ? "border-blue-200 bg-blue-50"
        : "border-amber-200 bg-amber-50";

  return (
    <div className={`rounded-lg border p-4 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-700">{description}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <button
          type="button"
          onClick={primaryAction}
          disabled={working}
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {working ? "Working…" : primaryLabel}
        </button>
      </div>
    </div>
  );
}
