"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonCompleteButtonProps {
  lessonId: string;
  alreadyCompleted: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  hideCompletedState?: boolean;
  /**
   * Route to navigate to after marking the lesson complete.
   * If not provided, stays on the current page.
   * Examples:
   *   - Next lesson:   "/trainee/training/{programId}/{categoryId}/{nextLessonId}"
   *   - Next category: "/trainee/training/{programId}/{nextCategoryId}"
   *   - Graduation:    "/trainee/training/graduation"
   */
  nextRoute?: string | null;
  /** Human-readable label for the next destination shown on the button */
  nextLabel?: string | null;
  /** Optional callback when the lesson is successfully marked complete */
  onComplete?: () => void;
}

export function LessonCompleteButton({
  lessonId,
  alreadyCompleted,
  disabled = false,
  disabledReason,
  className,
  hideCompletedState = false,
  nextRoute,
  nextLabel,
  onComplete,
}: LessonCompleteButtonProps) {
  const router = useRouter();
  const [done, setDone] = useState(alreadyCompleted);
  const [loading, setLoading] = useState(false);

  // Once done and a nextRoute is provided, show the Next button instead
  if (done && nextRoute) {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideCompletedState && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-600 flex-1">
              Lesson Complete
            </span>
          </div>
        )}
        <Button
          className="w-full"
          onClick={() => router.push(nextRoute)}
        >
          {nextLabel ? `Next: ${nextLabel}` : "Continue"}
          <ChevronRight className="size-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  if (done) {
    if (hideCompletedState) {
      return null;
    }
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
      onComplete?.();
      toast.success("Lesson marked as complete!");
      // Navigate to next item after a brief delay so the success toast is visible
      if (nextRoute) {
        setTimeout(() => router.push(nextRoute), 800);
      }
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
        {loading ? "Saving…" : nextRoute ? "Complete & Continue" : "Mark as Complete"}
      </Button>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground text-center">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
