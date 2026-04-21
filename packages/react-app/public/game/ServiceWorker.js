const cacheName = "DefaultCompany-MiniPay SandDrop-1.0";
const contentToCache = [
    "Build/85b74916a9e60850f1e81997d93b62ff.loader.js",
    "Build/aae0786fd8f24e475f83a0221a123f3d.framework.js",
    "Build/b2bea87d9a892556156eaa129579ef20.data",
    "Build/cb19f8d2a816eb3aeffb9905799618ee.wasm",
    "TemplateData/style.css"

];

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching all: app shell and content');
      await cache.addAll(contentToCache);
    })());
});

self.addEventListener('fetch', function (e) {
    e.respondWith((async function () {
      let response = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (response) { return response; }

      response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })());
});
