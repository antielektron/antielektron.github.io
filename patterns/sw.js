self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('your-magic-cache').then(function(cache) {
        return cache.addAll([
          '/patterns/',
          '/patterns/index.html',
          '/patterns/manifest.json',
          '/patterns/icon.png',
          '/patterns/LICENSE',
          '/patterns/main.js',
          '/patterns/grid.js',
          '/patterns/game_manager.js',
          '/patterns/sidebar.js',
          '/patterns/tile.js',
          '/patterns/README.md',
          '/patterns/site.js',
          '/patterns/style.css',
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