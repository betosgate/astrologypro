"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignUrlDisplayProps {
  url: string;
  code?: string;
  label?: string;
  showOpenButton?: boolean;
}

export function CampaignUrlDisplay({
  url,
  code,
  label = "Campaign URL",
  showOpenButton = false,
}: CampaignUrlDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
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
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <span className="flex-1 truncate font-mono text-xs text-foreground" title={url}>
          {displayUrl}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 shrink-0"
          onClick={handleCopy}
          title="Copy URL"
        >
          {copied ? (
            <Check className="size-3 text-emerald-600" />
          ) : (
            <Copy className="size-3" />
          )}
          <span className="ml-1 text-[11px]">{copied ? "Copied!" : "Copy"}</span>
        </Button>
        {showOpenButton && (
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
        )}
      </div>
      {code && (
        <p className="text-[11px] text-muted-foreground">
          Code: <code className="font-mono">{code}</code>
        </p>
      )}
    </div>
  );
}
