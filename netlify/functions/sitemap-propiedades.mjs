import {sitemap} from '../../seo-core.mjs';
export default async function handler(request) {
 try {
  const url=new URL(request.url);
  const result=await fetch(new URL('/api/properties',url.origin),{signal:AbortSignal.timeout(15000)});
  if(!result.ok)throw Error('catalog unavailable');
  const data=await result.json();
  if(data.complete===false||!Array.isArray(data.properties))throw Error('incomplete catalog');
  return new Response(sitemap(data.properties,url.pathname.includes('comunas')?'landings':'properties'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
 }catch(error){
  console.error('Sitemap unavailable',error.name);
  return new Response('<error>Catálogo temporalmente no disponible</error>',{status:503,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store','Retry-After':'60'}});
 }
}
export const config={path:['/sitemap-comunas.xml','/sitemap-propiedades.xml','/.netlify/functions/sitemap-propiedades']};
