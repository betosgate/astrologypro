"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

interface BookingLinkBannerProps {
  bookingUrl: string;
}

/**
 * Displays the diviner's shareable booking page URL with a one-click copy button.
 * Used in the Calendar dashboard page (task 06 — shareable booking links).
 */
export function BookingLinkBanner({ bookingUrl }: BookingLinkBannerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Booking link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          Your Booking Link
        </p>
        <p className="text-sm font-medium text-foreground truncate">{bookingUrl}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0 gap-2"
        aria-label="Copy booking link to clipboard"
      >
        {copied ? (
          <Check className="size-4 text-green-500" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}
