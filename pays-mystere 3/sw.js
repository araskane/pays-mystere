/* Pays Mystère — service worker
   Pages HTML : réseau d'abord (les mises à jour arrivent tout de suite), cache si hors ligne ou si le réseau
   traîne plus de 4 s (réseau très faible : on ouvre la version gardée plutôt que d'attendre).
   Scripts, données de carte, polices, icônes : cache d'abord (adresses versionnées par leur contenu).
   À chaque mise à jour, les fichiers dont l'adresse n'a pas changé sont repris de l'ancien cache au lieu
   d'être retéléchargés ; les autres sont redemandés au serveur (jamais au cache HTTP du navigateur).
   Remplace proprement l'ancien service worker (caches « pm-… » d'avant la migration) : il est effacé à l'activation. */
const V="pm-b62d2844e4",CORE=["./","index.html","defi.html","france.html","confidentialite.html","mentions-legales.html","fr.topo.json?v=06118ac8b5","carte.js?v=1a02af4298","logique.js?v=a428424fda","serveur.js?v=1f6a06492b","d3.js?v=e1a9aa3104","monde.js?v=8febdd9a54","jeu.js?v=180db3b596","assets/Duels-Cg6ayh0r.js","assets/JeuFrance-CzBR9FVw.js","assets/JeuFrance-DWGwMTtn.css","assets/PaysMystere-31k4ooM8.js","assets/PaysMystere-DyqamasO.css","assets/archivo-latin-DGOCANzV.woff2","assets/france-BubUEb40.js","assets/france-D61uwwI1.css","assets/index-BNz1GxBa.css","assets/index-BvTfq2n6.js","assets/plex-mono-latin-400-DMJ8VG8y.woff2","assets/plex-mono-latin-500-DSY6xOcd.woff2","assets/plex-sans-latin-400-CDDApCn2.woff2","assets/plex-sans-latin-500-6ng42L7E.woff2","assets/plex-sans-latin-600-CuJfVYMP.woff2","assets/plex-sans-latin-700-Bxkt5Cjx.woff2","assets/sons-BKk3Pa2a.js","assets/sons-C_Qc_ra0.css","topojson.min.js?v=25cd02ae48","globe.js?v=56721a07f3","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
const fige=u=>/^assets\/|\?v=/.test(u); // adresse qui change dès que le contenu change
async function installer(){const c=await caches.open(V);
  await Promise.all(CORE.map(async u=>{const m=fige(u)&&await caches.match(u);
    if(m)return c.put(u,m);
    const r=await fetch(new Request(u,{cache:"reload"}));if(!r.ok)throw new Error(u+" : "+r.status);return c.put(u,r)}))}
self.addEventListener("install",e=>{e.waitUntil(installer().then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const garder=(r,res)=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res};
const gardee=r=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"));
function page(r){const reseau=fetch(r).then(res=>garder(r,res));
  return new Promise(ok=>{let fini=false;const t=setTimeout(()=>gardee(r).then(m=>{if(m&&!fini){fini=true;ok(m)}}),4000);
    reseau.then(res=>{clearTimeout(t);if(!fini){fini=true;ok(res)}},()=>{clearTimeout(t);gardee(r).then(m=>{if(!fini){fini=true;ok(m||Response.error())}})})})}
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return; // Firebase & co : jamais en cache
  const html=r.mode==="navigate"||u.pathname.endsWith(".html")||u.pathname.endsWith("/");
  e.respondWith(html?page(r):caches.match(r).then(m=>m||fetch(r).then(res=>garder(r,res))))});
