import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {SITE,esc,head,element,breadcrumbs,absolute} from '../seo-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['data-proyectos.js','data-proyectos-detalle.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const projects=ctx.window.PROYECTOS,fichas=ctx.window.PROYECTO_FICHAS;
const template=fs.readFileSync(path.join(root,'proyecto.html'),'utf8');
// A .txt transport avoids Netlify Pretty URLs redirecting the HTML template
// back through /ficha and recursively invoking property rendering.
fs.mkdirSync(path.join(root,'seo-templates'),{recursive:true});
fs.copyFileSync(path.join(root,'Ficha Propiedad - Corretaje Guzman v2.html'),path.join(root,'seo-templates/property.txt'));
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
 html=html.replace(/<html\b[^>]*>/,'<html lang="es" data-seo-project="'+esc(item.slug)+'">');
 html=head(html,{title,description,url,image,project:true,schema:{'@context':'https://schema.org','@graph':[
  {'@type':'RealEstateListing','@id':url+'#listing',name:p.name,url,description:p.lead||description,image,mainEntity:{'@type':'ApartmentComplex',name:p.name,address:{'@type':'PostalAddress',streetAddress:p.address,addressLocality:p.commune,addressCountry:'CL'}},offers:{'@type':'Offer',url,price:p.desdeUF,priceCurrency:'CLF'}},
  breadcrumbs([['Inicio','/'],['Proyectos nuevos','/proyectos/'],[p.name,url]])
 ]}});
 for(const [id,value] of Object.entries({pName:p.name,pAddr:p.address||p.commune,pLead:p.lead||'',descTitle:p.descTitulo||(p.heroFull?'El proyecto':p.name),pbPrice:'UF '+new Intl.NumberFormat('es-CL').format(p.desdeUF),pbReserva:p.reserva||'$150.000'}))html=element(html,id,esc(value));
 html=html.replace(/<img\b[^>]*\bid="heroImg"[^>]*>/,`<img id="heroImg" src="${esc(assetPath(p.heroImg||item.image))}" alt="${esc(p.name+' en '+p.commune)}" loading="eager" fetchpriority="high" onerror="this.style.display='none'">`);
 html=html.replace(/<link[^>]*data-project-hero-preload[^>]*>\s*/g,'');
 html=html.replace('<head>',`<head>\n<link rel="preload" as="image" data-project-hero-preload href="${esc(assetPath(p.bannerHero||p.heroImg||item.image))}">`);
 html=html.replace(/\/proyecto-ficha\.js\?v=[^"']+/g,'/proyecto-ficha.js?v=seo-20261001');
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
