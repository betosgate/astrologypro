"use client";

import { useEffect, useRef } from "react";

/**
 * Hook that registers the service worker and subscribes to Web Push
 * notifications. Call this once in the dashboard layout — it handles:
 *
 *   1. Register /sw.js service worker
 *   2. Request notification permission
 *   3. Subscribe to push via VAPID key
 *   4. POST the subscription to /api/push/subscribe
 *
 * Safe to call multiple times — only runs once per mount.
 */
export function usePushNotifications() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] Browser does not support push notifications");
      return;
    }

    registered.current = true;

    async function setupPush() {
      try {
        // 1. Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[Push] Service worker registered:", registration.scope);

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        // 2. Check/request notification permission
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.log("[Push] Notification permission denied");
            return;
          }
        } else if (Notification.permission === "denied") {
          console.log("[Push] Notifications blocked by user");
          return;
        }

        // 3. Subscribe to push
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
          return;
        }

        // Convert VAPID key to Uint8Array
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          console.log("[Push] New push subscription created");
        } else {
          console.log("[Push] Existing push subscription found");
        }

        // 4. Send subscription to server
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });

        if (res.ok) {
          console.log("[Push] Subscription saved to server");
        } else {
          console.error("[Push] Failed to save subscription:", await res.text());
        }
      } catch (err) {
        console.error("[Push] Setup failed:", err);
      }
    }

    setupPush();
  }, []);
}
