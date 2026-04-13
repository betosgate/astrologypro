"use client";

import { Loader2 } from "lucide-react";

export function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center justify-center gap-3 px-4 py-3 horoscope-section-header">
        <Loader2 className="size-4 animate-spin text-amber-500" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + i * 15}%` }} />)}
      </div>
    </div>
  );
}

export function SectionError({ title }: { title: string }) {
  return (
    <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
      <p className="text-sm font-semibold text-destructive">{title} — failed to load</p>
      <p className="text-xs text-muted-foreground mt-1">The AI interpretation could not be retrieved. Check network and try again.</p>
    </div>
  );
}
