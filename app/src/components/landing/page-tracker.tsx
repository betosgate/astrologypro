"use client";

import { useEffect } from "react";

interface PageTrackerProps {
  divinerId: string;
  path: string;
}

export function PageTracker({ divinerId, path }: PageTrackerProps) {
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
  }, [divinerId, path]);

  return null;
}
