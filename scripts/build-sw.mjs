import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=[];
async function walk(dir='dist',prefix='./'){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory())await walk(`${dir}/${e.name}`,`${prefix}${e.name}/`);else if(!['sw.js','.nojekyll'].includes(e.name))files.push(`${prefix}${e.name}`);}}
await walk();files.sort();const hash=createHash('sha256');for(const f of files)hash.update(f).update(await readFile('dist/'+f.slice(2)));
const version=hash.digest('hex').slice(0,16);
const worker=`const CACHE='shiye-app-${version}';
const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await cache.addAll(FILES);}catch(error){await caches.delete(CACHE);throw error;}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const old=(await caches.keys()).filter(k=>k.startsWith('shiye-app-')&&k!==CACHE);await Promise.all(old.slice(0,-2).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
const scope=new URL(self.registration.scope);const path=url.pathname.slice(scope.pathname.length);
if(url.pathname!==scope.pathname&&!FILES.includes('./'+path)&&event.request.mode!=='navigate')return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);const key=event.request.mode==='navigate'?new URL('index.html',scope).href:event.request;const hit=await cache.match(key);return hit||fetch(event.request);})());});
`;
await writeFile('dist/sw.js',worker);await writeFile('dist/.nojekyll','');
console.log(`PWA ${version}: ${files.length} files cached; update waits for confirmation.`);
