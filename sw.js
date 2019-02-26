self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('your-magic-cache').then(function(cache) {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/icon.png',
          '/LICENSE',
          '/main.js',
          '/grid.js',
          '/game_manager.js',
          '/sidebar.js',
          '/tile.js',
          '/README.md',
          '/site.js',
          '/style.css',
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });