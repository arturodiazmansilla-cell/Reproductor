/* Service worker del Reproductor.
   v2: la página y los iconos se guardan para abrir sin internet, pero ahora se
   REVISAN en segundo plano cada vez que abres la app (stale-while-revalidate),
   así las actualizaciones llegan solas. Cambia el número de CACHE si algún día
   quieres forzar que todos descarguen todo de nuevo. */
const CACHE='reproductor-v2';
const FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  if(new URL(req.url).origin!==location.origin)return; // fuentes de Google, etc.: las maneja el navegador
  e.respondWith(caches.open(CACHE).then(async c=>{
    const cached=await c.match(req);
    const net=fetch(req,{cache:'no-cache'}).then(res=>{
      if(res&&res.ok)c.put(req,res.clone());
      return res;
    }).catch(()=>null);
    if(cached){e.waitUntil(net);return cached} // responde al instante y actualiza en segundo plano
    return (await net)||(await c.match('./index.html'))||Response.error();
  }));
});
