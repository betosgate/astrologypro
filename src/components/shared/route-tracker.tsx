"use client";

import { useEffect } from "react";

/**
 * Persists the current portal route so the login page can redirect users
 * back to the last dashboard they used.
 *
 * Writes to two places:
 * 1. localStorage  — fast local fallback (same device/browser)
 * 2. DB via API    — survives across devices and browser sessions (fire-and-forget)
 */
export function RouteTracker({ href }: { href: string }) {
  useEffect(() => {
    // 1. localStorage fallback
    try {
      localStorage.setItem("ap_last_route", href);
    } catch {
      // localStorage may be unavailable in private browsing
    }

    // 2. Persist to DB (fire-and-forget — never block the UI on this)
    fetch("/api/auth/save-last-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: href }),
    }).catch(() => {
      // Silently ignore — unauthenticated users or network errors are fine here
    });
  }, [href]);

  return null;
}
