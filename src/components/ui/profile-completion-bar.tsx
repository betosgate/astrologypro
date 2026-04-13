"use client";

import { Progress } from "@/components/ui/progress";

type MissingField = {
  key: string;
  label: string;
};

export function ProfileCompletionBar({
  percentage,
  missingFields,
  completedCount,
  totalCount,
  onMissingFieldClick,
}: {
  percentage: number;
  missingFields: MissingField[];
  completedCount: number;
  totalCount: number;
  onMissingFieldClick?: (fieldKey: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Profile completion</p>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} fields complete
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{percentage}%</p>
        </div>
      </div>

      <Progress value={percentage} className="mt-3" />

      {missingFields.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Still missing
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => onMissingFieldClick?.(field.key)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          All tracked fields are complete.
        </p>
      )}
    </div>
  );
}
