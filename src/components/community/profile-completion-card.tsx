"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProgressRing } from "@/components/community/progress-ring";
import { CheckCircle2, Circle, ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Re-export the type so consumers can import from here
export type ProfileCompletionItem = {
  key: string;
  label: string;
  completed: boolean;
  pct: number;
  action_url: string;
};

export type ProfileCompletionData = {
  overall_pct: number;
  items: ProfileCompletionItem[];
};

interface ProfileCompletionCardProps {
  initialData: ProfileCompletionData;
}

export function ProfileCompletionCard({ initialData }: ProfileCompletionCardProps) {
  // Client-side re-fetch is not needed here — data arrives server-side as a prop.
  // We use state only so a future mutation (e.g. after profile save) can invalidate it.
  const [data, setData] = useState<ProfileCompletionData>(initialData);

  // Refresh when the window regains focus (handles navigating away and back)
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/community/profile-completion");
        if (!res.ok) return;
        const json: ProfileCompletionData = await res.json();
        setData(json);
      } catch {
        // Non-critical — silently ignore
      }
    }

    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const { overall_pct, items } = data;
  const isComplete = overall_pct >= 100;
  const incompleteItems = items.filter((item) => !item.completed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Journey Progress</CardTitle>
        <CardDescription className="text-xs">
          {isComplete
            ? "Your journey is fully set up — profile, charts, family."
            : `${incompleteItems.length} milestone${incompleteItems.length !== 1 ? "s" : ""} remaining — includes charts, family & profile`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress ring */}
        <div className="flex justify-center">
          <ProgressRing
            percentage={overall_pct}
            size={96}
            strokeWidth={9}
            color={
              isComplete
                ? "hsl(142, 71%, 45%)"
                : overall_pct >= 60
                ? "hsl(var(--primary))"
                : "hsl(25, 90%, 55%)"
            }
          />
        </div>

        {/* Congratulations banner */}
        {isComplete && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-600">
            <PartyPopper className="size-4 shrink-0" />
            <span className="font-medium">Profile complete — great work!</span>
          </div>
        )}

        {/* Completion item list */}
        <ul className="space-y-2" aria-label="Profile completion checklist">
          {items.map((item) => (
            <li
              key={item.key}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                item.completed
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {item.completed ? (
                <CheckCircle2
                  className="size-4 shrink-0 text-green-500"
                  aria-label="Completed"
                />
              ) : (
                <Circle
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-label="Incomplete"
                />
              )}

              <span
                className={cn(
                  "flex-1 leading-snug",
                  item.completed && "line-through decoration-muted-foreground/50"
                )}
              >
                {item.label}
              </span>

              <span
                className={cn(
                  "shrink-0 tabular-nums font-medium",
                  item.completed ? "text-green-600" : "text-muted-foreground"
                )}
              >
                +{item.pct}%
              </span>

              {!item.completed && (
                <Link
                  href={item.action_url}
                  className="shrink-0 flex items-center gap-0.5 text-primary hover:underline"
                  aria-label={`Complete: ${item.label}`}
                >
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
