"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { triggerCronJob } from "./actions";

type TriggerState = "idle" | "running" | "success" | "error";

export function TriggerButton({ jobPath }: { jobPath: string }) {
  const [state, setState] = useState<TriggerState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleTrigger() {
    setState("running");
    setMessage("");
    try {
      const result = await triggerCronJob(jobPath);
      setState("success");
      setMessage(JSON.stringify(result, null, 0));
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Trigger failed");
    }
    // Reset after 5s
    setTimeout(() => {
      setState("idle");
      setMessage("");
    }, 5000);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleTrigger}
        disabled={state === "running"}
        className="gap-1.5"
      >
        {state === "running" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Play className="size-3.5" />
        )}
        {state === "running" ? "Running..." : "Trigger"}
      </Button>
      {state === "success" && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="size-3.5" />
          OK
        </span>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3.5" />
          {message}
        </span>
      )}
    </div>
  );
}
