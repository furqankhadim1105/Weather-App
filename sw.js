self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('weather-app-v2').then((cache) => {  // <-- yahan version change kiya
      return cache.addAll([
        './',
        './index.html',
        './script.js',
        './manifest.json'
      ]);
    })
  );
});

// Purana cache delete karne ke liye yeh extra event add kar dein taaki naya version foran load ho:
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== 'weather-app-v2') {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});