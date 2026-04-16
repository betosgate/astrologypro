/**
 * AstrologyPro Service Worker
 *
 * Handles Web Push notifications for incoming call alerts.
 * Runs in the background — receives push events even when
 * the browser tab is closed or minimised.
 */

// Listen for push events from the server
self.addEventListener("push", (event) => {
  let data = { title: "AstrologyPro", body: "You have a notification" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.warn("[SW] Failed to parse push data:", e);
  }

  const options = {
    body: data.body || "You have a notification",
    icon: data.icon || "/favicon.svg",
    badge: "/favicon-32x32.png",
    tag: data.tag || "astropro-notification",
    requireInteraction: data.requireInteraction !== false,
    vibrate: [200, 100, 200, 100, 200], // Phone-like vibration pattern
    data: {
      url: data.url || "/dashboard",
      phoneSessionId: data.phoneSessionId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "AstrologyPro", options)
  );
});

// When the diviner taps the notification, open/focus the dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If the dashboard is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Clean up notifications when the call is answered/dismissed
self.addEventListener("message", (event) => {
  if (event.data?.type === "DISMISS_CALL_NOTIFICATION") {
    self.registration.getNotifications({ tag: "incoming-call" }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});
