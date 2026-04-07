"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * Client component — calls POST /api/community/discount-token to get/create
 * a member discount token, then redirects to the diviner discovery page
 * with the token appended as a query param.
 */
export function BookReadingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/discount-token", {
        method: "POST",
      });

      if (!res.ok) {
        // Fallback — go to diviner page without token
        window.location.href = "/diviner";
        return;
      }

      const { token } = (await res.json()) as { token: string };
      window.location.href = `/diviner?discount_token=${encodeURIComponent(token)}`;
    } catch {
      window.location.href = "/diviner";
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      size="sm"
      className="gap-1.5"
    >
      <Sparkles className="size-3.5" />
      {loading ? "Preparing…" : "Book a Reading (5% member discount)"}
    </Button>
  );
}
