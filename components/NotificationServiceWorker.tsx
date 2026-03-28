"use client";

import { useEffect } from "react";

/**
 * Registers the notification SW and handles navigate fallbacks when
 * WindowClient.navigate is not available.
 */
export function NotificationServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (d && d.type === "VIALOGI_NAVIGATE" && typeof d.url === "string") {
        window.location.assign(d.url);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    void navigator.serviceWorker
      .register("/vialogi-notification-sw.js", { scope: "/" })
      .catch(() => {
        /* ignore */
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
