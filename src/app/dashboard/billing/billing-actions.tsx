"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// ─── Manage Billing (Stripe Portal) ──────────────────────────────────────────

interface ManageBillingButtonProps {
  className?: string;
}

export function ManageBillingButton({ className }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.detail ?? json.title ?? "Failed to open billing portal.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Opening…" : "Manage Billing"}
        {!loading && <ExternalLink className="ml-1.5 size-3" />}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Subscribe to Plan ────────────────────────────────────────────────────────

interface SubscribeButtonProps {
  planSlug: string;
  label: string;
  addonSlugs?: string[];
  disabled?: boolean;
  variant?: "default" | "outline";
  className?: string;
}

export function SubscribeButton({
  planSlug,
  label,
  addonSlugs,
  disabled = false,
  variant = "default",
  className,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_slug: planSlug,
          ...(addonSlugs && addonSlugs.length > 0
            ? { addon_slugs: addonSlugs }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.detail ?? json.title ?? "Checkout failed.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        variant={variant}
        size="sm"
        onClick={handleClick}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? "Redirecting…" : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
