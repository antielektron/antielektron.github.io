const cacheName = 'pwa-conf-v4';
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