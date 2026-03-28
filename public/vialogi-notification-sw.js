/* Minimal SW: only handles notification clicks so navigation works when the tab was sleeping/discarded. */
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const data = event.notification.data;
  const raw = data && typeof data.url === "string" ? data.url : null;
  if (!raw) return;

  var urlToOpen;
  try {
    urlToOpen = new URL(raw, self.location.origin).href;
  } catch (e) {
    return;
  }

  var focusOnly = data && data.focusOnly === true;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
      var i;
      var client = null;
      for (i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.indexOf(self.location.origin) === 0) {
          client = windowClients[i];
          break;
        }
      }
      if (client) {
        if (focusOnly) {
          return client.focus();
        }
        /* Do not use client.navigate(): it often drops #hash (e.g. /fr#loads → /fr). */
        return client.focus().then(function () {
          return client.postMessage({ type: "VIALOGI_NAVIGATE", url: urlToOpen });
        });
      }
      if (focusOnly) {
        return;
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
