/* Çevrimdışı çalışma: uygulama kabuğu önbelleğe alınır (aynı kaynak istekleri). Arşiv zaten cihazdadır. */
const V='rc-v5',A=['./','index.html','css/style.css','js/cameras.js','js/camart.js','js/util.js','js/forevye-adapter.js','js/app.js','manifest.webmanifest','icons/icon-192.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.match(r).then(h=>{const n=fetch(r).then(x=>{if(x.ok)caches.open(V).then(c=>c.put(r,x.clone()));return x}).catch(()=>h);return h||n}))});
