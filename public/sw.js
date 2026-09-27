// English Helper service worker.
// - Build assets and icons: cache-first (Next.js hashes filenames, so they never go stale).
// - Page navigations: always network (pages are per-user and must be fresh);
//   if offline, show the cached offline page.
// - Push: shows the daily study reminder; clicking it opens/focuses the app.
// Registered as /sw.js?dev=1 during `next dev`, where caching is skipped so it
// doesn't fight hot reloading (push still works for testing).
// Bump VERSION to drop old caches after changing this file or offline.html.
const VERSION = "v2";
const DEV = new URL(self.location.href).searchParams.has("dev");
const CACHE = `english-helper-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("english-helper-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (DEV || request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const url = new URL(request.url);
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "English Helper", {
      body: data.body || "Time to study English!",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "daily-reminder",
      renotify: true,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find(
          (w) => new URL(w.url).origin === self.location.origin,
        );
        if (open) {
          return open.navigate(target).then((w) => (w || open).focus());
        }
        return self.clients.openWindow(target);
      }),
  );
});
