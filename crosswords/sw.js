const cacheName = 'pwa-conf-v5';
const staticAssets = [
    './',
    './index.html',
    './app.js',
    './main.js',
    './websocket.js',
    './grid.js',
    './clue_area.js',
    './keyboard.js',
    './menu.js',
    './notification-area.js',
    './notification-manager.js',
    './styles.css',
    './manifest.json',
    './favicon.png',
    './big_icon.png'
];


self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);


    await cache.addAll(staticAssets);


});

self.addEventListener('fetch', event => {
    const req = event.request;
    event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);


    const cachedResponse = await cache.match(req);


    return cachedResponse || fetch(req);


}

async function networkFirst(req) {
    return fetch(req).catch(function() {
        return caches.match(req);
    }) 
}
