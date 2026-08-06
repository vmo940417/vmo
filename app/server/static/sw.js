/* 서비스 워커.
 *
 * 원칙 하나만 지킨다: **시세는 절대 캐시하지 않는다.**
 * 주식 앱에서 캐시된 옛날 가격을 보여주는 건 아무것도 안 보여주는 것보다 나쁘다.
 * 그래서 /api/ 는 네트워크 전용이고, 캐시는 껍데기(HTML/아이콘)에만 쓴다.
 * 껍데기를 캐시하는 이유는 오프라인 지원이 아니라 홈 화면에서 즉시 뜨게 하려는 것.
 */

const SHELL = 'stockwhy-shell-v1';
const ASSETS = [
  '/',
  '/static/manifest.webmanifest',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // 자산 하나 실패해도 설치는 진행
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 시세/분석 응답: 네트워크 전용. 실패하면 실패한 대로 알린다.
  if (url.pathname.startsWith('/api/')) return;

  // 문서: 네트워크 우선, 끊겼을 때만 캐시된 껍데기.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  // 정적 자산: 캐시 우선.
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(request, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
