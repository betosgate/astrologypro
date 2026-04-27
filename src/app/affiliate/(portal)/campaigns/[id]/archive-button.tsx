"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Archive } from "lucide-react";

export function ArchiveCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function archive() {
    if (
      !confirm(
        "Archive this campaign? The share link will stop working immediately. " +
          "Existing earnings stay intact.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/affiliate/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        title?: string;
        detail?: string;
      };
      if (!res.ok) {
        toast.error(body.detail ?? body.title ?? "Failed to archive campaign");
        setPending(false);
        return;
      }
      toast.success("Campaign archived");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={archive} disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 size-3.5 animate-spin" />
      ) : (
        <Archive className="mr-2 size-3.5" aria-hidden />
      )}
      Archive
    </Button>
  );
}
