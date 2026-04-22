"use client";

import { useEffect } from "react";
import { trackLandingEvent, trackScrollDepth, trackTimeOnPage } from "@/lib/landing-page-events";

interface PageTrackerProps {
  divinerId: string;
  path: string;
  username?: string;
  /** New: service-level tracking */
  serviceTemplateId?: string;
  serviceSlug?: string;
  attributionSource?: string;
}

export function PageTracker({
  divinerId,
  path,
  username,
  serviceTemplateId,
  serviceSlug,
  attributionSource,
}: PageTrackerProps) {
  useEffect(() => {
    // Read ?ref= (affiliate attribution) off the URL on every fire so
    // subsequent SPA navigations (where Task 02 preserves ?ref=) still
    // record attribution on each page_view.
    const params = new URLSearchParams(window.location.search);
    const rawRef = params.get("ref");
    // Cap length defensively — column is TEXT but an oversized value
    // suggests abuse.
    const refCode =
      typeof rawRef === "string" && rawRef.length > 0
        ? rawRef.slice(0, 256)
        : null;

    // General page view tracking (existing /api/analytics/track)
    const data = JSON.stringify({
      divinerId,
      path,
      referrer: document.referrer || null,
      search: window.location.search || "",
      refCode,
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
      }).catch(() => {});
    }

    // Set preferred diviner cookie client-side
    if (username) {
      const maxAge = 60 * 60 * 24 * 90; // 90 days
      document.cookie = `preferred_diviner=${username}; path=/; max-age=${maxAge}; samesite=lax`;
    }

    // Service-level analytics
    if (serviceTemplateId && serviceSlug) {
      // Fire page_view event
      trackLandingEvent({
        diviner_id: divinerId,
        service_template_id: serviceTemplateId,
        service_slug: serviceSlug,
        event_type: "page_view",
        referrer: document.referrer || undefined,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
      });

      // Set up scroll depth tracking
      const cleanupScroll = trackScrollDepth(divinerId, serviceTemplateId, serviceSlug);
      // Set up time on page tracking
      const cleanupTime = trackTimeOnPage(divinerId, serviceTemplateId, serviceSlug);

      return () => {
        cleanupScroll();
        cleanupTime();
      };
    }
  }, [divinerId, path, username, serviceTemplateId, serviceSlug, attributionSource]);

  return null;
}
