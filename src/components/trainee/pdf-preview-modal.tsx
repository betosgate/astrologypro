"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfPreviewModalProps {
  url: string;
  title: string;
  open: boolean;
  onClose: () => void;
}

export function PdfPreviewModal({ url, title, open, onClose }: PdfPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${title}`}
    >
      <div
        className={cn(
          "relative flex w-full max-w-4xl flex-col rounded-lg border bg-background shadow-xl",
          "h-[85vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="truncate text-sm font-medium">{title}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1.5 text-xs"
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Open in tab
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden rounded-b-lg">
          <iframe
            src={`${url}#toolbar=1`}
            className="h-full w-full"
            title={title}
            onError={() => {
              /* iframe load errors are silent — user can use "Open in tab" */
            }}
          />
        </div>

        {/* Fallback message inside the iframe area (shown if iframe is blocked) */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center rounded-b-lg bg-muted text-sm text-muted-foreground">
            Preview not available.{" "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary underline underline-offset-2"
            >
              Open in new tab
            </a>
          </div>
        </noscript>
      </div>
    </div>
  );
}
