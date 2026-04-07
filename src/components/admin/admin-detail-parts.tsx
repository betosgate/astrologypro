"use client";

import { cn } from "@/lib/utils";

export function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-4 px-3 py-2.5", className)}>
      <span className="w-24 shrink-0 pt-0.5 text-xs capitalize text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
