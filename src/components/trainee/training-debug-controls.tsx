"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TrainingDebugControls() {
  const [loading, setLoading] = useState<"bypass" | "reset" | null>(null);
  const router = useRouter();

  async function handleBypass() {
    if (!confirm("This will mark ALL training as completed and trigger graduation. Continue?")) {
      return;
    }

    setLoading("bypass");
    try {
      const res = await fetch("/api/trainee/debug/bypass-training", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to bypass training");
      }

      toast.success("Training bypassed and graduation triggered!");
      router.refresh();
      setTimeout(() => {
        router.push("/trainee/training/graduation");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleReset() {
    if (!confirm("This will WIPE all your training progress and graduation status. Continue?")) {
      return;
    }

    setLoading("reset");
    try {
      const res = await fetch("/api/trainee/debug/reset-training", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset training");
      }

      toast.success("Training progress reset!");
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        toast.warning(data.warnings.join(" "));
      }
      router.refresh();
      router.push("/trainee");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleBypass}
        disabled={!!loading}
        className="border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/20"
      >
        {loading === "bypass" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Zap className="mr-2 size-4 fill-amber-500 text-amber-500" />
        )}
        Bypass
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReset}
        disabled={!!loading}
        className="border-red-500/50 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
      >
        {loading === "reset" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 size-4 text-red-500" />
        )}
        Reset
      </Button>
    </div>
  );
}
