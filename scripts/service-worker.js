/* Public resources only. Account responses, sessions and tutor requests never enter these caches. */
const VERSION = "__VERSION__";
const CORE = "chinese-core-" + VERSION,
  PACK = "chinese-pack-" + VERSION;
const PRECACHE = __CORE__;
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CORE).then((cache) => cache.addAll(PRECACHE))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("chinese-core-") && name !== CORE)
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname === "/sw.js"
  )
    return;
  if (request.mode === "navigate" && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    event.respondWith(
      caches
        .open(CORE)
        .then(
          async (cache) => (await cache.match("/index.html")) || fetch(request),
        ),
    );
    return;
  }
  if (!PRECACHE.includes(url.pathname) && !url.pathname.startsWith("/library/"))
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(
        url.pathname.startsWith("/library/") ? PACK : CORE,
      );
      const cached = await cache.match(url.pathname);
      if (cached) {
        const range = request.headers.get("Range");
        if (range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(range);
          if (match) {
            const blob = await cached.blob(),
              start = match[1]
                ? Number(match[1])
                : Math.max(0, blob.size - Number(match[2])),
              end =
                match[1] && match[2]
                  ? Math.min(Number(match[2]), blob.size - 1)
                  : blob.size - 1;
            if (start > end || start >= blob.size)
              return new Response(null, {
                status: 416,
                headers: { "Content-Range": `bytes */${blob.size}` },
              });
            return new Response(blob.slice(start, end + 1), {
              status: 206,
              headers: {
                "Content-Type":
                  cached.headers.get("Content-Type") ||
                  "application/octet-stream",
                "Content-Range": `bytes ${start}-${end}/${blob.size}`,
                "Content-Length": String(end - start + 1),
                "Accept-Ranges": "bytes",
              },
            });
          }
        }
        return cached;
      }
      const response = await fetch(request);
      if (
        response.ok &&
        response.status === 200 &&
        !request.headers.has("Range")
      )
        await cache.put(url.pathname, response.clone());
      return response;
    })(),
  );
});

// Activate only after the learner chooses Update ESC; do not interrupt study.
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
