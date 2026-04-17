"use client";

import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface CampaignAutoPauseBannerProps {
  campaignId: string;
  reason: string | null;
  canReactivate: boolean;
  onReactivated?: () => void;
}

export function CampaignAutoPauseBanner({
  campaignId,
  reason,
  canReactivate,
  onReactivated,
}: CampaignAutoPauseBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleReactivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/campaigns/${campaignId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Campaign reactivated");
        onReactivated?.();
      } else {
        const err = await res.json();
        toast.error(err.detail ?? err.title ?? "Failed to reactivate");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Campaign Auto-Paused</p>
        <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
          {reason ?? "The linked service was disabled by an admin."}
          {canReactivate
            ? " The service has been re-enabled. You can reactivate this campaign."
            : " Contact your administrator to re-enable the linked service before reactivating."}
        </p>
      </div>
      {canReactivate && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
          onClick={handleReactivate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          <span className="ml-1.5">{loading ? "Reactivating…" : "Reactivate"}</span>
        </Button>
      )}
    </div>
  );
}
