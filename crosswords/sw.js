const cacheName = 'pwa-conf-v2';
const staticAssets = [
    './app.js ',
    './big_icon.png',
    './english.html',
    './german.html',
    './grid.js',
    './infoBox.js',
    './manifest.json',
    './serverConnection.js',
    './cookie.js',
    './favicon.png',
    './gridBoxes.js',
    './index.html',
    './main.js',
    './solutionBox.js',
    './websocket.js'
];


self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);


    await cache.addAll(staticAssets);


});

self.addEventListener('fetch', event => {
    const req = event.request;
    event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);


    const cachedResponse = await cache.match(req);


    return cachedResponse || fetch(req);


}