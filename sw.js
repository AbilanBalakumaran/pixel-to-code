// Service worker : cache de l'app et des librairies CDN (mode hors-ligne). Les appels Gemini ne sont jamais mis en cache.
const V = 'ptc-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'css/style.css', 'js/app.js', 'js/gemini.js', 'js/tracer.js', 'js/animator.js',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/sample.png',
  'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.includes('googleapis.com') && u.pathname.includes('generateContent')) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(V).then(ca => ca.put(e.request, c)); }
    return r;
  })));
});
