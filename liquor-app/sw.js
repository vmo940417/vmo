// 술사전 서비스워커 — 앱 셸 오프라인 캐시 (API 호출은 캐시하지 않음)
const CACHE = "sulsajeon-v10";
const SHELL = ["./", "index.html", "styles.css", "app.js", "icons.js", "data.js", "data-extra.js", "data-bulk-1.js", "data-bulk-2.js", "data-bulk-3.js", "data-bulk-4.js", "data-bulk-5.js", "data-bulk-6.js", "data-bulk-7.js", "data-scores.js", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // 네트워크 우선, 실패 시 캐시 (데이터 업데이트가 바로 반영되도록)
  // GitHub Pages의 10분 HTTP 캐시를 건너뛰고 항상 서버에 최신 여부를 확인
  const fresh = e.request.mode === "navigate" ? new Request(e.request.url, { cache: "no-cache" }) : new Request(e.request, { cache: "no-cache" });
  e.respondWith(fetch(fresh).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
