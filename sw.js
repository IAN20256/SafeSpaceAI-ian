// Safe Space — Service Worker
// Must be served as a real file (not a Blob URL) from the same origin as the app.
const CACHE = 'safespace-v3';
const PRECACHE_URLS = ['./', './index.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(PRECACHE_URLS).catch(function(){
        // If addAll fails (e.g. a URL 404s), don't block install
      });
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status === 200){
        var clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(cached){
        if(cached) return cached;
        if(e.request.mode === 'navigate') return caches.match('./');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
