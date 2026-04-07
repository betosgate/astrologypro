"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface BeginOverlayProps {
  ritualName: string;
  children: React.ReactNode;
}

export function BeginOverlay({ ritualName, children }: BeginOverlayProps) {
  const [started, setStarted] = useState(false);

  if (started) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-xl border bg-muted/30 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Prepare Sacred Space</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Take a moment to ground yourself before beginning{" "}
          <span className="font-medium text-foreground">{ritualName}</span>.
          Ensure you are in a quiet space free from interruptions.
        </p>
      </div>
      <Button size="lg" onClick={() => setStarted(true)}>
        Begin the Ritual
      </Button>
    </div>
  );
}
