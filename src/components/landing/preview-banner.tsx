"use client";

import Link from "next/link";
import { Eye, X, Pencil } from "lucide-react";
import { useState } from "react";

interface PreviewBannerProps {
  templateId: string;
  builderUrl: string;
}

export function PreviewBanner({ templateId, builderUrl }: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500/95 backdrop-blur-sm px-4 py-2.5 text-cosmos-950 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4 flex-shrink-0" />
        <span>You are viewing a <strong>draft preview</strong> — this page is not published yet.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={builderUrl}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cosmos-950/15 hover:bg-cosmos-950/25 px-3 py-1 text-xs font-semibold transition-colors"
        >
          <Pencil className="size-3" />
          Edit in Builder
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-cosmos-950/15 transition-colors"
          aria-label="Dismiss preview banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
