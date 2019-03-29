
var home = "https://antielektron.github.io/ttt/";
var rel_home = "/ttt";

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open('your-magic-cache').then(function (cache) {
      return cache.addAll([
        '/ttt/',
        '/ttt/tools.js',
        '/ttt/index.html',
        '/ttt/manifest.json',
        '/ttt/icon.png',
        '/ttt/LICENSE',
        '/ttt/main.js',
        '/ttt/grid.js',
        '/ttt/local_match_manager.js',
        '/ttt/online_match_manager.js',
        '/ttt/websocket_connection.js',
        '/ttt/infobar.js',
        '/ttt/infocontainer.js',
        '/ttt/settings.js',
        '/ttt/subgrid.js',
        '/ttt/tile.js',
        '/ttt/README.md',
        '/ttt/site.js',
        '/ttt/style.css',
      ]);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  clients.openWindow(home);
});