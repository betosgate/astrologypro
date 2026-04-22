"use client";

import Link from "next/link";
import { Eye, X, Pencil } from "lucide-react";
import { useState } from "react";

interface PreviewBannerProps {
  /** The service template id — used to build the "Back to builder" link. */
  templateId: string;
  /** Full URL back to the builder for this service. */
  builderUrl: string;
}

/**
 * Owner-only banner shown above the public page when rendered via
 * `?preview=true`. Simplified in Task 02 of the 2026-04-21
 * landing-page-simplification: one line of copy, one discreet "Back to
 * builder" link, no "draft" vocabulary (draft state no longer exists — this
 * is the live page, just rendered for an unpublished service).
 */
export function PreviewBanner({ builderUrl }: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500/95 backdrop-blur-sm px-4 py-2.5 text-cosmos-950 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4 flex-shrink-0" />
        <span>Preview — this is what your page will look like.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={builderUrl}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cosmos-950/15 hover:bg-cosmos-950/25 px-3 py-1 text-xs font-semibold transition-colors"
        >
          <Pencil className="size-3" />
          Back to builder
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
