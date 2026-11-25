// Permet d'ouvrir l'application sans connexion : les fichiers sont gardés en cache.
// Avec du réseau, on prend la dernière version (mise à jour automatique).
const CACHE = "comptes-du-foyer-v8";
const CACHE_OUTILS = "comptes-du-foyer-outils-v1"; // lecture des tickets (Tesseract), gardée entre les versions
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-180.png", "./icone-192.png", "./icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== CACHE_OUTILS).map(k => caches.delete(k)))));
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
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // Outil de lecture des tickets : versions figées, donc on les garde une fois téléchargées (marche ensuite hors ligne).
  if (url.hostname === "cdn.jsdelivr.net" && /\/npm\/(tesseract\.js|tesseract\.js-core|@tesseract\.js-data)@/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE_OUTILS).then(c => c.match(req).then(r => r || fetch(req).then(rep => { if (rep.ok) c.put(req, rep.clone()); return rep; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(reseau(req).catch(() =>
    caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});
