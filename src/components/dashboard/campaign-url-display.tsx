"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CampaignUrlDisplayProps {
  url: string;
  code?: string;
  label?: string;
  showOpenButton?: boolean;
  /**
   * When true, the URL is rendered as inactive: copy/open controls are
   * disabled, the URL is visually muted, and a warning is shown explaining
   * that the link will not route to the selected destination until the
   * campaign is activated.
   *
   * This matches the behavior of `/r/[code]/route.ts`, which redirects draft
   * campaigns to the diviner profile (not the chosen destination). Showing
   * the URL as "ready to share" while the server falls back would be
   * misleading, so we surface the inactive state here instead.
   */
  isInactive?: boolean;
  /**
   * Optional label for the inactive state (defaults to "Draft"). Used in the
   * warning copy, e.g. "This campaign is a Draft — the link will not route…".
   */
  inactiveReason?: string;
}

export function CampaignUrlDisplay({
  url,
  code,
  label = "Campaign URL",
  showOpenButton = false,
  isInactive = false,
  inactiveReason = "Draft",
}: CampaignUrlDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (isInactive) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API isn't available
    }
  }

  const displayUrl =
    url.length > 50 ? `${url.slice(0, 47)}…` : url;

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2",
          isInactive && "opacity-70"
        )}
      >
        <span
          className={cn(
            "flex-1 truncate font-mono text-xs",
            isInactive ? "text-muted-foreground line-through" : "text-foreground"
          )}
          title={url}
        >
          {displayUrl}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 shrink-0"
          onClick={handleCopy}
          disabled={isInactive}
          title={isInactive ? "Activate the campaign to enable copy" : "Copy URL"}
        >
          {copied ? (
            <Check className="size-3 text-emerald-600" />
          ) : (
            <Copy className="size-3" />
          )}
          <span className="ml-1 text-[11px]">{copied ? "Copied!" : "Copy"}</span>
        </Button>
        {showOpenButton && (
          isInactive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 shrink-0"
              disabled
              title="Activate the campaign to open the link"
            >
              <ExternalLink className="size-3" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 shrink-0"
              asChild
              title="Open in new tab"
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
              </a>
            </Button>
          )
        )}
      </div>
      {isInactive && (
        <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          <span>
            This campaign is currently <strong>{inactiveReason.toLowerCase()}</strong>. The link will
            not route to the chosen destination until the campaign is activated. Share it after activation.
          </span>
        </div>
      )}
      {code && (
        <p className="text-[11px] text-muted-foreground">
          Code: <code className="font-mono">{code}</code>
        </p>
      )}
    </div>
  );
}
