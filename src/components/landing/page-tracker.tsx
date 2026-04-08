"use client";

import { useEffect } from "react";

interface PageTrackerProps {
  divinerId: string;
  path: string;
  username?: string;
}

export function PageTracker({ divinerId, path, username }: PageTrackerProps) {
  useEffect(() => {
    const data = JSON.stringify({
      divinerId,
      path,
      referrer: document.referrer || null,
    });

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([data], { type: "application/json" })
      );
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {
        // Silently ignore tracking failures
      });
    }

    // Set preferred diviner cookie client-side to avoid server-side restriction
    if (username) {
      const maxAge = 60 * 60 * 24 * 90; // 90 days
      document.cookie = `preferred_diviner=${username}; path=/; max-age=${maxAge}; samesite=lax`;
    }
  }, [divinerId, path, username]);

  return null;
}
