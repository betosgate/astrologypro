"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GiveawayDrawButtonProps {
  giveawayId: string;
  giveawayTitle: string;
}

export function GiveawayDrawButton({
  giveawayId,
  giveawayTitle,
}: GiveawayDrawButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDraw() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/giveaways/${giveawayId}/draw`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Failed to run draw.");
      } else {
        router.refresh();
        router.push(`/dashboard/giveaways/${giveawayId}`);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="default" disabled={loading}>
          <Trophy className="mr-1.5 size-3.5" />
          Draw Winner
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Draw a winner?</AlertDialogTitle>
          <AlertDialogDescription>
            A random winner will be selected from all eligible entries for{" "}
            <strong>{giveawayTitle}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={runDraw} disabled={loading}>
            {loading ? "Drawing…" : "Draw Winner"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
