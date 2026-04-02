self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = {};
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Farishtaa";
  const body = notification.body || data.body || "You have a new update.";

  const options = {
    body,
    icon: notification.icon || "/favicon.ico",
    badge: notification.badge || "/favicon.ico",
    tag: data.notificationId || "farishtaa-notification",
    data: {
      route: data.route || "/",
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const route = event.notification?.data?.route || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const relativeRoute = route.startsWith("/") ? route : `/${route}`;

      for (const client of windowClients) {
        const url = new URL(client.url);
        if (url.pathname === relativeRoute && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(relativeRoute);
      }

      return null;
    })
  );
});
