/**
 * Shows a desktop notification that navigates to `url` on click.
 * Uses the service worker when available so clicks still work after Chrome
 * discards/suspends the tab (plain Notification.onclick is unreliable then).
 */
export async function showAppNotification(options: {
  title: string;
  body: string;
  /** Path + optional hash, e.g. /fr#loads or /fr/chat/uuid */
  url: string;
  /** If true, click only focuses the site tab (no navigation). */
  focusOnly?: boolean;
}): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const pathUrl = options.url.startsWith("http")
    ? new URL(options.url).pathname +
      new URL(options.url).search +
      new URL(options.url).hash
    : options.url;

  const focusOnly = options.focusOnly === true;

  const fallback = () => {
    try {
      const n = new Notification(options.title, {
        body: options.body,
        tag: `vialogi-${Date.now()}`,
      });
      const go = () => {
        n.close();
        try {
          window.focus();
        } catch {
          /* ignore */
        }
        if (!focusOnly) {
          window.location.assign(new URL(pathUrl, window.location.origin).href);
        }
      };
      n.addEventListener("click", go, { once: true });
      n.onclick = go;
    } catch {
      /* ignore */
    }
  };

  if (!("serviceWorker" in navigator)) {
    fallback();
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/vialogi-notification-sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    await reg.showNotification(options.title, {
      body: options.body,
      tag: `vialogi-${Date.now()}`,
      data: { url: pathUrl, focusOnly },
    });
  } catch {
    fallback();
  }
}
