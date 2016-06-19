'use strict';
const cacheNamespace = 'xylophone';
const version = 'v1.0.0';
const cacheName = `${cacheNamespace}-${version}-static`;

function updateStaticCache() {
  return caches.open(cacheName).then(cache => {
    return cache.addAll([
      './style.css',
      './',
      './app.js',
      './note/1.mp3',
      './note/2.mp3',
      './note/3.mp3',
      './note/4.mp3',
      './note/5.mp3',
      './note/6.mp3',
      './note/7.mp3',
      './note/8.mp3',
      './manifest.json',
      'images/xylophone.png',
      'images/xylophone.svg'
    ]);
  });
}

function clearOldCaches() {
  return caches.keys().then(keys => {
    return Promise.all(keys.filter(key => key.indexOf(cacheNamespace) === 0)
      .filter(key => key.indexOf(cacheName) !== 0)
      .map(key => caches.delete(key)));
  });
}

self.addEventListener('install', event => {
  event.waitUntil(updateStaticCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  // try cache firts, fall back to network
  event.respondWith(caches.match(request).then(response => {
    return response || fetch(request).then(response => {
      const copy = response.clone();
      stashInCache(cacheName, request, copy)
      return response;
    }).catch(() => {
      return;
    })
  }));
});
