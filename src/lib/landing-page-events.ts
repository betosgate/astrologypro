"use client";

/**
 * Client-side event tracker for landing page interactions.
 * Sends events to /api/analytics/landing-page-event
 * Fire-and-forget — never blocks UI.
 */

export type LandingPageEventType =
  | "page_view"
  | "cta_click"
  | "cta_secondary_click"
  | "lead_form_open"
  | "lead_form_submit"
  | "booking_initiated"
  | "booking_completed"
  | "link_shared"
  | "page_scroll_25"
  | "page_scroll_50"
  | "page_scroll_75"
  | "page_scroll_100"
  | "time_on_page_30s"
  | "time_on_page_60s"
  | "time_on_page_120s";

export interface LandingPageEventPayload {
  diviner_id: string;
  service_template_id: string;
  service_slug: string;
  event_type: LandingPageEventType;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * Track a landing page event. Fire-and-forget — does not block UI.
 * Uses navigator.sendBeacon for reliability on page unload.
 * Skips tracking when in preview mode.
 */
export function trackLandingEvent(payload: LandingPageEventPayload): void {
  // Do not track in preview mode
  if (typeof window !== "undefined" && window.location.search.includes("preview=true")) {
    return;
  }

  const data = JSON.stringify({
    ...payload,
    referrer: payload.referrer ?? (typeof document !== "undefined" ? document.referrer : ""),
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      "/api/analytics/landing-page-event",
      new Blob([data], { type: "application/json" })
    );
  } else {
    fetch("/api/analytics/landing-page-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
      keepalive: true,
    }).catch(() => {
      // Silently ignore tracking failures
    });
  }
}

/**
 * Track scroll depth milestones on a landing page.
 * Uses IntersectionObserver to detect 25%, 50%, 75%, 100% scroll.
 * Each milestone fires only once per page load.
 * Returns cleanup function.
 */
export function trackScrollDepth(
  divinerId: string,
  templateId: string,
  serviceSlug: string
): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return () => {};
  }

  const fired = new Set<LandingPageEventType>();
  const sentinels: HTMLElement[] = [];
  const observers: IntersectionObserver[] = [];

  const milestones: Array<{ pct: number; eventType: LandingPageEventType }> = [
    { pct: 25,  eventType: "page_scroll_25"  },
    { pct: 50,  eventType: "page_scroll_50"  },
    { pct: 75,  eventType: "page_scroll_75"  },
    { pct: 100, eventType: "page_scroll_100" },
  ];

  for (const { pct, eventType } of milestones) {
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;left:0;width:1px;height:1px;pointer-events:none;";
    el.style.top = `${pct}%`;
    document.body.style.position = "relative";
    document.body.appendChild(el);
    sentinels.push(el);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.has(eventType)) {
            fired.add(eventType);
            trackLandingEvent({
              diviner_id: divinerId,
              service_template_id: templateId,
              service_slug: serviceSlug,
              event_type: eventType,
            });
          }
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    observers.push(observer);
  }

  return () => {
    for (const obs of observers) obs.disconnect();
    for (const el of sentinels) el.remove();
  };
}

/**
 * Track time spent on a landing page.
 * Fires events at 30s, 60s, 120s.
 * Pauses when tab is hidden. Returns cleanup function.
 */
export function trackTimeOnPage(
  divinerId: string,
  templateId: string,
  serviceSlug: string
): () => void {
  if (typeof window === "undefined") return () => {};

  const thresholds: Array<{ seconds: number; eventType: LandingPageEventType; fired: boolean }> = [
    { seconds: 30,  eventType: "time_on_page_30s",  fired: false },
    { seconds: 60,  eventType: "time_on_page_60s",  fired: false },
    { seconds: 120, eventType: "time_on_page_120s", fired: false },
  ];

  let elapsed = 0;
  let hidden = false;

  const tick = setInterval(() => {
    if (hidden) return;
    elapsed += 1;
    for (const threshold of thresholds) {
      if (!threshold.fired && elapsed >= threshold.seconds) {
        threshold.fired = true;
        trackLandingEvent({
          diviner_id: divinerId,
          service_template_id: templateId,
          service_slug: serviceSlug,
          event_type: threshold.eventType,
        });
      }
    }
    // Stop once all fired
    if (thresholds.every((t) => t.fired)) clearInterval(tick);
  }, 1000);

  const onVisibilityChange = () => {
    hidden = document.hidden;
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearInterval(tick);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
