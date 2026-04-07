"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

interface Props {
  giveawayId: string;
  currentStatus: GiveawayStatus;
}

const TRANSITIONS: Record<GiveawayStatus, { label: string; nextStatus: GiveawayStatus } | null> = {
  draft: { label: "Activate Giveaway", nextStatus: "active" },
  active: { label: "End Giveaway", nextStatus: "ended" },
  ended: null,
  cancelled: null,
};

export function GiveawayStatusControl({ giveawayId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transition = TRANSITIONS[currentStatus];
  if (!transition) return null;

  async function handleTransition() {
    if (!transition) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/giveaways/${giveawayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transition.nextStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Failed to update status.");
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant={currentStatus === "draft" ? "default" : "outline"}
        size="sm"
        disabled={loading}
        onClick={handleTransition}
      >
        {loading ? "Updating…" : transition.label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
