"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ManageSubscriptionButtonProps = React.ComponentProps<typeof Button>;

export function ManageSubscriptionButton({
  children = "Manage Subscription",
  ...props
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    const popup = window.open("", "_blank");

    try {
      const res = await fetch("/api/mystery-school/billing-portal", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        popup?.close();
        setError(data.error ?? "Failed to open billing portal");
        return;
      }

      if (popup) {
        popup.opener = null;
        popup.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } catch {
      popup?.close();
      setError("Unexpected error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? "Redirecting…" : children}
      </Button>
      {error ? (
        <p className="text-xs text-red-200/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
