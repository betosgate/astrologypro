"use client";

import { useState, useCallback } from "react";

/**
 * Opens a Stripe Express dashboard login link in a new tab so the
 * affiliate can view 1099-NEC and other tax documents Stripe maintains.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export function TaxInfoLink() {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async () => {
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

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={open}
        disabled={working}
        className="text-zinc-700 underline underline-offset-2 hover:text-zinc-900 disabled:opacity-60"
      >
        {working ? "Opening…" : "View tax documents on Stripe"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
