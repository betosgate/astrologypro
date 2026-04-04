"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MarkCompleteButtonProps {
  lessonId: string;
  alreadyCompleted: boolean;
}

export default function MarkCompleteButton({ lessonId, alreadyCompleted }: MarkCompleteButtonProps) {
  const [done, setDone] = useState(alreadyCompleted);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <CheckCircle2 className="size-5 text-primary shrink-0" />
        <span className="text-sm font-medium text-primary">Lesson complete</span>
      </div>
    );
  }

  async function handleMark() {
    setLoading(true);
    try {
      const res = await fetch("/api/trainee/lesson-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) throw new Error("Failed to mark complete");
      setDone(true);
      toast.success("Lesson marked as complete!");
    } catch {
      toast.error("Could not save your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleMark} disabled={loading} className="w-full sm:w-auto">
      {loading ? "Saving…" : "Mark as Complete"}
    </Button>
  );
}
