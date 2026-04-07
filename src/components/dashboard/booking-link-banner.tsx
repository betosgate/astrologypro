"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BookingLinkBannerProps {
  bookingUrl: string;
}

/**
 * Gold-standard shareable booking link banner.
 * Gradient background card, URL in monospace, copy button with feedback.
 * Task 06 — shareable booking links.
 */
export function BookingLinkBanner({ bookingUrl }: BookingLinkBannerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Booking link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-violet-900/60 p-5 shadow-xl backdrop-blur-md">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.15),transparent_70%)]" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-300/80">
            Your Booking Link
          </p>
          <p className="truncate font-mono text-sm text-white/90 sm:text-base">
            {bookingUrl}
          </p>
          <p className="mt-1 text-xs text-indigo-200/50">
            Share this link with clients to let them book a session with you.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Open in new tab */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-indigo-200 hover:bg-white/10 hover:text-white"
            aria-label="Open booking page"
          >
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>

          {/* Copy button */}
          <Button
            size="sm"
            onClick={handleCopy}
            aria-label="Copy booking link to clipboard"
            className={
              copied
                ? "bg-green-500/80 text-white hover:bg-green-500/90 border-green-400/40"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            }
          >
            {copied ? (
              <>
                <Check className="mr-1.5 size-3.5" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="mr-1.5 size-3.5" aria-hidden="true" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
