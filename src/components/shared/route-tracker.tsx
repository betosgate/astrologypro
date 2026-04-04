"use client";

import { useEffect } from "react";

/**
 * Persists the current portal route to localStorage so the login page
 * can redirect multi-role users back to the last dashboard they used.
 */
export function RouteTracker({ href }: { href: string }) {
  useEffect(() => {
    try {
      localStorage.setItem("ap_last_route", href);
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, [href]);

  return null;
}
