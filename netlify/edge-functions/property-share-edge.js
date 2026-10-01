import {esc,json,head,element,propertyPath,propertySeo,priceText} from '../../seo-core.mjs';

function errorPage(status) {
 const unavailable=status===404;
 return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,follow"><title>${unavailable?'Propiedad no encontrada':'Intenta nuevamente'} | Corretaje Guzmán</title></head><body><h1>${unavailable?'Propiedad no encontrada':'No pudimos cargar la propiedad en este momento'}</h1><p>${unavailable?'El enlace no corresponde a una propiedad publicada.':'Intenta nuevamente en unos minutos.'}</p><a href="/arriendos">Ver arriendos</a> · <a href="/comprar">Ver propiedades en venta</a></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',...(status===503?{'Retry-After':'60'}:{})}});
}
export default async function handler(request,context) {
 const url=new URL(request.url);
 if(/\.(?:js|css|png|jpe?g|webp|svg|ico)$/i.test(url.pathname))return context.next();
 const id=url.searchParams.get('id')||url.pathname.match(/-(rec[a-zA-Z0-9]+)\/?$/)?.[1];
 if(!/^rec[a-zA-Z0-9]{14}$/.test(id||''))return errorPage(404);
 try {
  // Same normalized Airtable data used by the catalog; no alternate source.
  const result=await fetch(new URL('/api/property/'+encodeURIComponent(id),url.origin),{signal:AbortSignal.timeout(12000)});
  if(!result.ok)return errorPage(503);
  const data=await result.json();
  if(data.complete===false)return errorPage(503);
  const p=data.properties?.find(x=>x.id===id);
  if(!p)return errorPage(404);
  const canonicalPath=propertyPath(p);
  if(url.pathname!==canonicalPath)return new Response(null,{status:301,headers:{Location:new URL(canonicalPath,url.origin).href,'Cache-Control':'public, max-age=120'}});
  // Keep the existing design and deliver identical content to all user agents.
  const source=await fetch(new URL('/seo-templates/property.txt',url.origin),{signal:AbortSignal.timeout(12000)});
  if(!source.ok)return errorPage(503);
  let html=await source.text();
  if(!html.includes('id="gallery"'))return errorPage(503);
  html=html.replace(/\b(src|href)="(?!https?:|\/|#|data:|mailto:|tel:)([^"]+)"/g,'$1="/$2"');
  const seo=propertySeo(p);
  html=head(html,seo);
  for(const [key,value] of Object.entries({title:p.title,addr:[p.address,p.commune].filter(Boolean).join(' · '),crumbTitle:p.title,crumbCom:p.commune,price:priceText(p),pricePer:p.operation==='arriendo'?'/ mes':'',opPillTxt:p.operation==='venta'?'En venta':'En arriendo'}))html=element(html,key,esc(value));
  html=element(html,'desc',String(p.description||'').split(/\n+/).filter(Boolean).map((t,i)=>'<p'+(!i?' class="lead"':'')+'>'+esc(t)+'</p>').join(''));
  const details=[['Tipo',p.propertyType],['Operación',p.operation],['Dormitorios',p.bedrooms],['Baños',p.bathrooms],['Sup. útil',p.usableArea?p.usableArea+' m²':null],['Estado',p.status]].filter(([,v])=>v!=null&&v!=='');
  html=element(html,'detgrid',details.map(([k,v])=>'<div class="d"><span class="k">'+esc(k)+'</span><span class="v">'+esc(v)+'</span></div>').join(''));
  const photos=(p.photos||[]).slice(0,5);
  html=html.replace('<div class="gallery" id="gallery">','<div class="gallery'+(photos.length<=1?' single':'')+'" id="gallery">'+photos.map((src,i)=>'<div class="g'+(!i?' g-main':'')+'"><img src="'+esc(src)+'" alt="'+esc(p.title+' · foto '+(i+1))+'" loading="'+(!i?'eager':'lazy')+'"'+(!i?' fetchpriority="high"':'')+'></div>').join(''));
  html=html.replace('</head>','<script id="property-seo-data" type="application/json">'+json({title:seo.title,description:seo.description})+'</script>\n</head>');
  return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=120','X-Robots-Tag':seo.robots}});
 }catch(error){console.error('Property SEO temporarily unavailable',error.name);return errorPage(503);}
}
export const config={path:['/propiedad','/propiedad/*','/ficha'],method:['GET','HEAD']};
