/* Doxa Web · service worker
   - guarda o app (HTML, CSS, JS, fontes, imagens) para abrir sem internet;
   - entrega os textos instalados (cache "doxa-data") nos mesmos caminhos do Android: data/… e interlinear/…  */
const VERSION='__DOXA_BUILD__';
const SHELL='doxa-shell-'+VERSION;
const DATA='doxa-data';
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL);
    const list=await (await fetch('precache.json',{cache:'no-store'})).json();
    // em lotes, para não estourar conexões no iPhone
    for(let i=0;i<list.files.length;i+=12)await cache.addAll(list.files.slice(i,i+12).map(f=>new Request(f,{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const k of await caches.keys())if(k.startsWith('doxa-shell-')&&k!==SHELL)await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  const scope=new URL(self.registration.scope);if(!url.pathname.startsWith(scope.pathname))return;
  const rel=decodeURIComponent(url.pathname.slice(scope.pathname.length));
  if(rel.startsWith('data/')||rel.startsWith('interlinear/')){
    event.respondWith((async()=>{const c=await caches.open(DATA);return(await c.match(new URL(rel,scope).href))||fetch(req)})());
    return;
  }
  if(rel==='precache.json'||rel==='sw.js')return;
  event.respondWith((async()=>{
    const c=await caches.open(SHELL);
    const key=new URL(rel===''?'index.html':rel,scope).href;
    const hit=await c.match(key,{ignoreSearch:true});if(hit)return hit;
    try{return await fetch(req)}
    catch(e){if(req.mode==='navigate'){const r=await c.match(new URL('index.html',scope).href);if(r)return r}throw e}
  })());
});
