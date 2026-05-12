"use client";

import { useEffect, useRef } from "react";

type RefreshReason = "focus" | "pageshow" | "visible";

export function usePageReturnRefresh(
  refresh: (reason: RefreshReason) => void | Promise<void>,
  options?: { minIntervalMs?: number }
) {
  const refreshRef = useRef(refresh);
  const lastRefreshAtRef = useRef(0);
  const minIntervalMs = options?.minIntervalMs ?? 1500;

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    lastRefreshAtRef.current = Date.now();

    function run(reason: RefreshReason, force = false) {
      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < minIntervalMs) return;
      lastRefreshAtRef.current = now;
      void refreshRef.current(reason);
    }

    function handlePageShow(event: PageTransitionEvent) {
      run("pageshow", event.persisted);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") run("visible");
    }

    function handleFocus() {
      run("focus");
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [minIntervalMs]);
}
