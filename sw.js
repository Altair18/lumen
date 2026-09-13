const CACHE='gloam-v3';
const ASSETS=['./','./index.html','./manifest.webmanifest','./privacy.html','./terms.html','./support.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.pathname.includes('/api/')||url.pathname.includes('/.netlify/functions/')){
    e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({source:'offline',text:'The wick is still here. We can try again in a minute.'}),{headers:{'content-type':'application/json'}})));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match('./index.html'))));
});
