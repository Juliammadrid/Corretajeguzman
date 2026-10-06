import {SITE,esc,json,head,element,isIndexable,landingPages,TYPES,cardMarkup,breadcrumbs,businessSchema,propertyPath} from '../../seo-core.mjs';

const PAGE_SIZE=20;
export default async function handler(request,context) {
 if(!['GET','HEAD'].includes(request.method))return context.next();
 const url=new URL(request.url), match=url.pathname.match(/^\/(arriendos|comprar)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/);
 if(!match)return context.next();
 try {
  const response=await fetch(new URL('/api/properties',url.origin),{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('catalog');
  const data=await response.json();
  if(data.complete===false||!Array.isArray(data.properties))throw Error('incomplete');
  const base='/'+match[1], operation=match[1]==='comprar'?'venta':'arriendo';
  const path=url.pathname.replace(/\/$/,'');
  const landings=landingPages(data.properties);
  const landing=match[2]?landings.find(g=>g.path===path):null;
  if(match[2]&&!landing)return new Response('<!doctype html><html lang="es"><head><meta name="robots" content="noindex,follow"><title>Catálogo no disponible</title></head><body><h1>No hay un catálogo publicado para esta búsqueda</h1><a href="'+base+'">Ver propiedades disponibles</a></body></html>',{status:404,headers:{'Content-Type':'text/html; charset=utf-8'}});
  const properties=landing?landing.properties:data.properties.filter(p=>p.operation===operation&&isIndexable(p));
  const pageRaw=url.searchParams.get('pagina')||'1';
  const page=Number(pageRaw), maxPage=Math.max(1,Math.ceil(properties.length/PAGE_SIZE));
  if(!/^\d+$/.test(pageRaw)||page<1||page>maxPage)return new Response('Página no encontrada',{status:404,headers:{'X-Robots-Tag':'noindex'}});
  const source=await fetch(new URL('/seo-templates/'+(operation==='venta'?'sale':'rent')+'.txt',url.origin),{signal:AbortSignal.timeout(12000)});
  if(!source.ok)throw Error('template');
  let html=await source.text();
  html=html.replace(/\b(src|href)="(?!https?:|\/|#|data:|mailto:|tel:)([^"]+)"/g,'$1="/$2"');
  const plural=type=>type==='locales'?'Locales':TYPES[type]+'s';
  const label=(landing?.type?plural(landing.type):'Propiedades')+' en '+operation+(landing?' en '+landing.commune:'');
  const title=label+(page>1?' · Página '+page:'')+' | Corretaje Guzmán';
  const description=label+'. Consulta '+properties.length+' propiedades disponibles, fotos, precios y características. Agenda una visita con Corretaje Guzmán.';
  const canonical=SITE+path+(page>1?'?pagina='+page:'');
  const filtered=[...url.searchParams.keys()].some(k=>!['pagina','utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'].includes(k));
  const visible=properties.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const image=SITE+'/og/'+(operation==='venta'?'og-comprar.jpg':'og-arriendos.jpg');
  html=head(html,{title,description,url:canonical,image,robots:filtered?'noindex,follow':'index,follow,max-image-preview:large',schema:{'@context':'https://schema.org','@graph':[businessSchema,breadcrumbs([['Inicio','/'],[label,canonical]]),{'@type':'ItemList',itemListElement:visible.map((p,i)=>({'@type':'ListItem',position:(page-1)*PAGE_SIZE+i+1,name:p.title,url:SITE+propertyPath(p)}))}]}});
  html=element(html,'count','<b>'+properties.length+'</b> propiedades en '+operation);
  html=element(html,'plist',visible.map(cardMarkup).join(''));
  const links=landings.filter(g=>g.operation===operation&&(landing?g.commune===landing.commune:g.type==='')).map(g=>'<a href="'+g.path+'">'+esc(g.commune+(g.type?' · '+plural(g.type):''))+' ('+g.properties.length+')</a>').join(' · ');
  const pages=Array.from({length:maxPage},(_,i)=>'<a href="'+path+(i?'?pagina='+(i+1):'')+'"'+(page===i+1?' aria-current="page"':'')+'>Página '+(i+1)+'</a>').join(' · ');
  // Keep the main rental listing focused on the photos; retain its accessible heading.
  const intro=operation==='arriendo'&&!landing
   ? '<h1 class="catalog-heading-accessible">'+esc(label)+'</h1>'
   : '<section class="seo-catalog-intro"><h1>'+esc(label)+'</h1><p>'+esc(description)+'</p><nav aria-label="Catálogos por comuna">'+links+'</nav></section>';
  html=html.replace('<div class="plist" id="plist">',intro+'<div class="plist" id="plist">');
  html=html.replace('<footer','<nav class="wrap seo-pagination" aria-label="Páginas de propiedades">'+pages+'</nav><footer');
  html=html.replace('</head>','<style>.catalog-heading-accessible{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}.seo-catalog-intro{margin:0 0 24px;line-height:1.6}.seo-catalog-intro h1{font-size:24px;line-height:1.3}.seo-catalog-intro a,.seo-pagination a{color:#6d28d9}.seo-pagination{padding:24px}</style><script id="catalog-seo-data" type="application/json">'+json({properties:data.properties})+'</script><script id="listing-seo-data" type="application/json">'+json({title,commune:landing?.commune||'',type:TYPES[landing?.type]||'',page,pageSize:PAGE_SIZE})+'</script></head>');
  return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate','Netlify-CDN-Cache-Control':'public, max-age=60, stale-while-revalidate=240','X-Robots-Tag':filtered?'noindex,follow':'index,follow'}});
 }catch(error){console.error('Catalog SEO unavailable',error.name);return new Response('No pudimos consultar las propiedades. Intenta nuevamente en unos minutos.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Retry-After':'60'}});}
}
export const config={path:['/arriendos','/arriendos/*','/comprar','/comprar/*'],cache:'manual'};
