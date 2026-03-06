const CACHE_NAME = 'insect-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // ★追加：データの送信（POST）はキャッシュシステムを通さず、直接ネットワークへ送る！
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // 1. GASのAPIへの通信はキャッシュせず、常にネットワークで処理する
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) {
    return; 
  }

  // 2. Google Driveの画像をキャッシュする（キャッシュ優先＆裏で更新）
  if (url.includes('drive.google.com/thumbnail')) {
    event.respondWith(
      caches.open('insect-images-cache-v1').then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // オフライン時はエラーを無視して進める
          });
          return response || fetchPromise; 
        });
      })
    );
    return;
  }
  
  // 3. HTMLやCSSはキャッシュがあれば即座に返す（オフライン起動の要）
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
