"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WatchlistRemoveButton({ entityId }: { entityId: string }) {
  const [removing, setRemoving] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/mundane/watchlist/${entityId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to remove from watchlist");
      }
      toast.success("Removed from watchlist");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove from watchlist");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-destructive/60 hover:text-destructive"
      onClick={handleRemove}
      disabled={removing}
      title="Remove from watchlist"
    >
      {removing ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </Button>
  );
}
