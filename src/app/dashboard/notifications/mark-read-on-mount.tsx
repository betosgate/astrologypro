"use client";

// Fires a single POST to /api/dashboard/notifications/mark-read once when
// the inbox mounts (only if there are unread rows). After it returns we
// router.refresh() so the server component re-renders with is_read=true
// and the "New" badges disappear.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function MarkReadOnMount({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (unreadCount <= 0) return;
    fired.current = true;
    fetch("/api/dashboard/notifications/mark-read", { method: "POST" })
      .then((res) => {
        if (res.ok) router.refresh();
      })
      .catch(() => {
        // Best-effort.
      });
  }, [unreadCount, router]);

  return null;
}
