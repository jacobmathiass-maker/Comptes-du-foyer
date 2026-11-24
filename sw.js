// Permet d'ouvrir l'application sans connexion : les fichiers sont gardés en cache.
// Avec du réseau, on prend la dernière version (mise à jour automatique).
const CACHE = "comptes-du-foyer-v3";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-180.png", "./icone-192.png", "./icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
function reseau(req) {
  return new Promise((ok, ko) => {
    const t = setTimeout(ko, 4000); // réseau trop lent : on prend la version en cache
    fetch(req).then(r => {
      clearTimeout(t);
      if (r.ok) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      ok(r);
    }, err => { clearTimeout(t); ko(err); });
  });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(reseau(req).catch(() =>
    caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});
