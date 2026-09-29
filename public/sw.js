self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "NOXVEIL ARCANUM", body: event.data ? event.data.text() : "New notification" };
  }

  const title = typeof payload.title === "string" ? payload.title : "NOXVEIL ARCANUM";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "Market intelligence update",
    tag: typeof payload.tag === "string" ? payload.tag : "noxveil-update",
    data: { url: typeof payload.url === "string" ? payload.url : "/expert" },
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && typeof event.notification.data.url === "string"
    ? event.notification.data.url
    : "/expert";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
