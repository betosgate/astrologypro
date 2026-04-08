"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { ReactNode, MouseEvent } from "react";

interface LockedLinkProps {
  href: string;
  isLocked: boolean;
  /** API-supplied lock_reason. Used as toast body when present. */
  lockReason?: string | null;
  /**
   * Override toast message. If absent, falls back to the lockReason prop, then
   * to a generic "Complete the previous lesson first to continue in sequence."
   */
  blockedMessage?: string;
  className?: string;
  children: ReactNode;
  /** Optional ariaLabel passthrough */
  "aria-label"?: string;
}

/**
 * Sequential-lock-aware learner link.
 *
 * Renders an ordinary <Link> when not locked. When locked, renders the same
 * children as a styled non-link block and intercepts clicks to show a toast
 * derived from the same lock_reason metadata the API uses for route gating —
 * so visible UI, click behavior, and route enforcement all share one source
 * of truth.
 *
 * Drop-in replacement for `<Link>` on training learner surfaces.
 */
export function LockedLink({
  href,
  isLocked,
  lockReason,
  blockedMessage,
  className,
  children,
  "aria-label": ariaLabel,
}: LockedLinkProps) {
  if (!isLocked) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  const message =
    blockedMessage ??
    lockReason ??
    "Complete the previous lesson first to continue in sequence.";

  function handleBlockedClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    e.stopPropagation();
    toast.warning("Locked", {
      description: message,
    });
  }

  // Render as <a> so it still feels clickable, but cancel navigation.
  return (
    <a
      href={href}
      onClick={handleBlockedClick}
      aria-disabled="true"
      aria-label={ariaLabel}
      className={`${className ?? ""} cursor-not-allowed opacity-60`.trim()}
    >
      {children}
    </a>
  );
}
