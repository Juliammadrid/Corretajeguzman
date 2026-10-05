import {timingSafeEqual} from 'node:crypto';
import {SITE,propertyPath,isPublic} from '../../seo-core.mjs';
export function authorized(value,secret) {
 if(!secret)return false;
 const a=Buffer.from(value||''),b=Buffer.from('Bearer '+secret);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function validPropertyUrl(value) {
 try{const u=new URL(value);return u.origin===SITE&&/^\/propiedad\/[^/]+-rec[a-zA-Z0-9]{14}$/.test(u.pathname)&&!u.search&&!u.hash;}catch{return false;}
}
export default async function handler(request) {
 const key=process.env.INDEXNOW_KEY||'';
 const headers={'Cache-Control':'no-store','Content-Type':'application/json'};
 if(!/^[a-zA-Z0-9-]{8,128}$/.test(key))return new Response(JSON.stringify({error:'IndexNow no está configurado'}),{status:503,headers});
 const url=new URL(request.url);
 if(url.pathname==='/indexnow-key.txt'){
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  return new Response(request.method==='HEAD'?null:key,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
 }
 if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
 if(!authorized(request.headers.get('authorization'),process.env.INDEXNOW_WEBHOOK_SECRET))return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers});
 const raw=await request.text();if(raw.length>16000)return new Response(null,{status:413});
 let input;try{input=JSON.parse(raw);}catch{return new Response(null,{status:400});}
 const ids=Array.isArray(input.recordIds)?input.recordIds:[input.recordId];
 if(!ids.length||ids.length>50||!ids.every(id=>/^rec[a-zA-Z0-9]{14}$/.test(id||'')))return new Response(JSON.stringify({error:'recordId inválido'}),{status:400,headers});
 try {
  const result=await fetch(SITE+'/api/properties',{signal:AbortSignal.timeout(15000)});
  if(!result.ok)throw Error('catalog');
  const data=await result.json();if(data.complete===false||!Array.isArray(data.properties))throw Error('incomplete');
  const urls=data.properties.filter(p=>ids.includes(p.id)&&isPublic(p)).map(p=>SITE+propertyPath(p));
  // For a deleted/renamed record, the automation must supply its previously published URL.
  for(const old of input.previousUrls||[])if(validPropertyUrl(old)&&ids.some(id=>new URL(old).pathname.endsWith('-'+id)))urls.push(old);
  const urlList=[...new Set(urls)];
  if(!urlList.length)return new Response(JSON.stringify({error:'No se encontró una URL pública; para bajas envía previousUrls'}),{status:422,headers});
  const submitted=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:new URL(SITE).host,key,keyLocation:SITE+'/indexnow-key.txt',urlList}),signal:AbortSignal.timeout(15000)});
  return new Response(JSON.stringify({accepted:submitted.ok,count:urlList.length,providerStatus:submitted.status}),{status:submitted.ok?200:502,headers});
 }catch(error){console.error('IndexNow unavailable',error.name);return new Response(JSON.stringify({error:'No se pudo notificar; reintenta más tarde'}),{status:503,headers});}
}
export const config={path:['/api/indexnow','/indexnow-key.txt']};
