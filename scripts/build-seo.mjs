import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {SITE,esc,head,element,breadcrumbs,absolute,businessSchema,json} from '../seo-core.mjs';
import {imageDimensions} from './image-dimensions.mjs';
import './build-home.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['data-proyectos.js','data-proyectos-detalle.js','tipologias-confirmadas.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const projects=ctx.window.PROYECTOS,fichas=ctx.window.PROYECTO_FICHAS;
const template=fs.readFileSync(path.join(root,'proyecto.html'),'utf8');
// A .txt transport avoids Netlify Pretty URLs redirecting the HTML template
// back through /ficha and recursively invoking property rendering.
fs.mkdirSync(path.join(root,'seo-templates'),{recursive:true});
fs.copyFileSync(path.join(root,'Ficha Propiedad - Corretaje Guzman v2.html'),path.join(root,'seo-templates/property.txt'));
fs.copyFileSync(path.join(root,'Arriendos - Corretaje Guzman.html'),path.join(root,'seo-templates/rent.txt'));
fs.copyFileSync(path.join(root,'Ventas - Corretaje Guzman.html'),path.join(root,'seo-templates/sale.txt'));
const originalTemplates=new Set(['best-site','all-nunoa-2','metropolitan-park-nunoa','smart-too']);
const states={inmediata:'Entrega inmediata',verde:'Venta en verde',futura:'Entrega futura',ultimas:'Últimas unidades'};
const assetPath=value=>{const u=new URL(value,SITE);return u.origin===SITE?u.pathname+u.search:u.href;};
for(const item of projects){
 const p=fichas[item.slug];if(!p)throw Error('Falta ficha: '+item.slug);
 const url=SITE+item.detalle, image=absolute(p.bannerImg||p.heroImg||item.image);
 const title=`${p.name} | Departamentos en ${p.commune} | Corretaje Guzmán`;
 const description=`${p.name}, departamentos en venta en ${p.commune}. ${item.specs}. Desde UF ${new Intl.NumberFormat('es-CL').format(p.desdeUF)}. ${states[p.entrega]||''}. Cotiza con Corretaje Guzmán.`;
 const file=path.join(root,'proyectos',item.slug,'index.html');
 let html=originalTemplates.has(item.slug)?fs.readFileSync(file,'utf8'):template;
 html=html.replace(/\b(src|href)="(?!https?:|\/|#|data:|mailto:|tel:)([^"]+)"/g,'$1="/$2"');
 html=html.replace(/<html\b[^>]*>/,'<html lang="es" data-seo-project="'+esc(item.slug)+'">');
 html=head(html,{title,description,url,image,project:true,schema:{'@context':'https://schema.org','@graph':[
  {'@type':'RealEstateListing','@id':url+'#listing',name:p.name,url,description:p.lead||description,image,mainEntity:{'@type':'ApartmentComplex',name:p.name,address:{'@type':'PostalAddress',streetAddress:p.address,addressLocality:p.commune,addressCountry:'CL'}},offers:{'@type':'Offer',url,price:p.desdeUF,priceCurrency:'CLF'}},
  businessSchema, breadcrumbs([['Inicio','/'],['Proyectos nuevos','/proyectos/'],[p.name,url]])
 ]}});
 for(const [id,value] of Object.entries({pName:p.name,pAddr:p.address||p.commune,pLead:p.lead||'',descTitle:p.descTitulo||(p.heroFull?'El proyecto':p.name),pbPrice:'UF '+new Intl.NumberFormat('es-CL').format(p.desdeUF),pbReserva:p.reserva||'$150.000'}))html=element(html,id,esc(value));
 html=html.replace(/<img\b[^>]*\bid="heroImg"[^>]*>/,`<img id="heroImg" src="${esc(assetPath(p.bannerHero||p.heroImg||item.image))}" alt="${esc(p.name+' en '+p.commune)}" loading="eager" fetchpriority="high" onerror="this.style.display='none'">`);
 html=html.replace(/<link[^>]*data-project-hero-preload[^>]*>\s*/g,'');
 html=html.replace('<head>',`<head>\n<link rel="preload" as="image" data-project-hero-preload href="${esc(assetPath(p.bannerHero||p.heroImg||item.image))}">`);
 html=html.replace(/\/proyecto-ficha\.js\?v=[^"']+/g,'/proyecto-ficha.js?v=seo-20261001');
 const dims=imageDimensions(path.join(root,assetPath(p.bannerHero||p.heroImg||item.image).replace(/^\//,'')));
 if(dims)html=html.replace('<img id="heroImg"','<img width="'+dims.width+'" height="'+dims.height+'" id="heroImg"');
 html=html.replace(/<noscript data-seo-typologies>[\s\S]*?<\/noscript>/g,'');
 const types=p.tipologiasDisponibles||[];
 const imageSizes={};
 for(const src of [p.bannerHero,p.heroImg,...types.map(t=>t.plano)].filter(Boolean)){
  const dim=imageDimensions(path.join(root,assetPath(src).replace(/^\//,'')));if(dim)imageSizes[src]=dim;
 }
 html=html.replace(/<script id="seo-image-dimensions" type="application\/json">[\s\S]*?<\/script>/g,'');
 html=html.replace('</head>','<script id="seo-image-dimensions" type="application/json">'+json(imageSizes)+'</script></head>');
 if(types.length)html=html.replace('<section class="sec" id="galeria">','<noscript data-seo-typologies><section class="sec"><div class="wrap"><h2>Tipologías disponibles en '+esc(p.name)+'</h2>'+types.map(t=>'<article><h3>'+esc(t.nombre+' · Planta '+t.planta)+'</h3><p>'+esc([t.m2tot,t.orientacion,'Desde UF '+new Intl.NumberFormat('es-CL').format(t.desdeUF)].filter(Boolean).join(' · '))+'</p><a href="'+esc(t.plano)+'">Ver plano de '+esc(t.nombre)+'</a> · <a href="/cotizacion.html?slug='+item.slug+'&amp;planta='+encodeURIComponent(t.id)+'">Cotizar esta tipología</a></article>').join('')+'</div></section></noscript><section class="sec" id="galeria">');
 html=html.replace(/\n(?:[ \t]*\n){2,}/g,'\n\n');
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
}
const urls=projects.map(p=>`  <url><loc>${esc(SITE+p.detalle)}</loc><image:image><image:loc>${esc(absolute(fichas[p.slug].bannerImg||fichas[p.slug].heroImg||p.image))}</image:loc></image:image></url>`).join('\n');
fs.writeFileSync(path.join(root,'sitemap-proyectos.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`);
console.log(`SEO: ${projects.length} proyectos generados con metadatos, contenido inicial y sitemap.`);
// Crawlable links also remain available when JavaScript is disabled.
const listingFile=path.join(root,'proyectos/index.html');
let listing=fs.readFileSync(listingFile,'utf8').replace(/<noscript data-seo-projects>[\s\S]*?<\/noscript>/g,'');
listing=listing.replace('<div class="grid" id="grid"></div>','<div class="grid" id="grid"></div><noscript data-seo-projects><nav aria-label="Proyectos disponibles"><ul>'+projects.map(p=>'<li><a href="'+esc(p.detalle)+'">'+esc(p.name+' · '+p.commune)+'</a></li>').join('')+'</ul></nav></noscript>');
fs.writeFileSync(listingFile,listing);
// The property sitemap is live. Static project URLs have a separate sitemap.
const servicesFile=path.join(root,'sitemap-servicios.xml');
let services=fs.readFileSync(servicesFile,'utf8').replace(/\s*<url><loc>https:\/\/corretajeguzman\.com\/proyectos\/[^<]+<\/loc>[\s\S]*?<\/url>/g,'');
services=services.replace(/<url><loc>https:\/\/corretajeguzman\.com\/parcela-campo-alto-roble\.html<\/loc><\/url>/g,'');
if(!services.includes('/parcelas/campo-alto-roble'))services=services.replace('</urlset>','<url><loc>'+SITE+'/parcelas/campo-alto-roble</loc></url>\n</urlset>');
fs.writeFileSync(servicesFile,services);
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['servicios','proyectos','propiedades','comunas'].map(s=>'<sitemap><loc>'+SITE+'/sitemap-'+s+'.xml</loc></sitemap>').join('\n')+'</sitemapindex>\n');
const homeFile=path.join(root,'Home - Corretaje Guzman.html');
let home=fs.readFileSync(homeFile,'utf8');
home=home.replace(/<script type="application\/ld\+json">[^<]*"@type":"RealEstateAgent"[^<]*<\/script>/,'<script type="application/ld+json">'+json({'@context':'https://schema.org',...businessSchema})+'</script>');
fs.writeFileSync(homeFile,home);
const aboutFile=path.join(root,'nosotros','index.html');
const homeHead=home.slice(0,home.indexOf('</head>')+7).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
const aboutTitle='Sobre Corretaje Guzmán | Arriendo, venta y asesoría inmobiliaria';
const aboutDescription='Conoce Corretaje Guzmán: propiedades en arriendo y venta, proyectos nuevos y asesoría inmobiliaria. Contacto en Las Condes, Santiago.';
const header=home.match(/<header\b[\s\S]*?<\/header>/)?.[0]||'';
const footer=home.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]||'';
const about=head(homeHead,{title:aboutTitle,description:aboutDescription,url:SITE+'/nosotros/',image:SITE+'/og/og-home.jpg',schema:{'@context':'https://schema.org','@graph':[businessSchema,{'@type':'AboutPage',name:aboutTitle,url:SITE+'/nosotros/',about:{'@id':SITE+'/#organization'}},breadcrumbs([['Inicio','/'],['Sobre nosotros','/nosotros/']])]}})
 +'<body>'+header+'<main class="wrap" style="padding-top:64px;padding-bottom:64px"><nav aria-label="Ruta de navegación"><a href="/">Inicio</a> / Sobre nosotros</nav><h1>Sobre Corretaje Guzmán</h1><p>Corretaje de inmuebles en Chile. Te acompañamos en el arriendo, venta y compra de tu próxima propiedad.</p><h2>Propiedades y asesoría inmobiliaria</h2><p>Consulta nuestros <a href="/arriendos">arriendos disponibles</a>, <a href="/comprar">propiedades en venta</a> y <a href="/proyectos/">proyectos nuevos</a>. La <a href="/simulador-capacidad/">calculadora de capacidad de compra</a> entrega una estimación referencial; no constituye una aprobación de crédito.</p><h2>Contacto</h2><p>Av. Manquehue Sur 350, of. 201, Las Condes, Chile.</p><p><a href="tel:+56944637680">+56 9 4463 7680</a> · <a href="mailto:contacto@corretajeguzman.com">contacto@corretajeguzman.com</a></p><p><a class="btn btn-violet" href="https://wa.me/56944637680">Contáctanos por WhatsApp</a></p></main>'+footer+'<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><script src="/guzman-header.js"></script></body></html>';
// Preserve the existing About page when the Home design changes.
if(!fs.existsSync(aboutFile)){fs.mkdirSync(path.dirname(aboutFile),{recursive:true});fs.writeFileSync(aboutFile,about);}
if(!home.includes('href="/nosotros/"')){home=home.replace('<h4>Acceso rápido</h4>','<h4>Acceso rápido</h4><a href="/nosotros/">Sobre Corretaje Guzmán</a>');fs.writeFileSync(homeFile,home);}
services=fs.readFileSync(servicesFile,'utf8');if(!services.includes('/nosotros/')){services=services.replace('</urlset>','<url><loc>'+SITE+'/nosotros/</loc></url>\n</urlset>');fs.writeFileSync(servicesFile,services);}
