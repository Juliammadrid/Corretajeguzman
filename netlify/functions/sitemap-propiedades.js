import properties from './properties.js';
import {SITE,esc,propertyPath,isAvailable} from '../../seo-core.mjs';

export default async function handler() {
 try {
  const result=await properties.handler({queryStringParameters:{}});
  if(result.statusCode!==200)throw new Error('Catalog temporarily unavailable');
  const data=JSON.parse(result.body);
  // Never replace the sitemap with an empty/partial catalog after an API failure.
  if(data.complete!==true)throw new Error('Incomplete catalog');
  const entries=data.properties.filter(isAvailable).map(p=>{
   const date=String(p.updatedAt||'');
   const lastmod=/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(date)&&Number.isFinite(Date.parse(date))?'<lastmod>'+esc(date.slice(0,10))+'</lastmod>':'';
   return '  <url><loc>'+esc(SITE+propertyPath(p))+'</loc>'+lastmod+'</url>';
  });
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+entries.join('\n')+'\n</urlset>\n',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
 }catch(error){
  console.error('Sitemap unavailable',error.message);
  return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Temporalmente no disponible</error>',{status:503,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store','Retry-After':'60'}});
 }
}
