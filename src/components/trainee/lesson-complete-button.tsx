"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonCompleteButtonProps {
  lessonId: string;
  alreadyCompleted: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function LessonCompleteButton({
  lessonId,
  alreadyCompleted,
  disabled = false,
  disabledReason,
  className,
}: LessonCompleteButtonProps) {
  const [done, setDone] = useState(alreadyCompleted);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3",
          className
        )}
      >
        <CheckCircle2 className="size-5 text-green-500 shrink-0" />
        <span className="text-sm font-medium text-green-600">
          Lesson Complete
        </span>
      </div>
    );
  }

  async function handleMark() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trainee/training/lessons/${lessonId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to mark complete");
      }
      setDone(true);
      toast.success("Lesson marked as complete!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not save progress.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Button
        onClick={handleMark}
        disabled={loading || disabled}
        className="w-full"
      >
        {loading ? "Saving…" : "Mark as Complete"}
      </Button>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground text-center">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
