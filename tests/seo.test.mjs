import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {SITE,head,propertyPath,isIndexable,isPublic,enrichedPropertySeo,landingPages,sitemap,lastmod,similarProperties} from '../seo-core.mjs';
import propertyHandler from '../netlify/edge-functions/property-share-edge.js';
import catalogHandler from '../netlify/edge-functions/catalog-seo.js';
import sitemapHandler from '../netlify/functions/sitemap-propiedades.mjs';
import {authorized,validPropertyUrl} from '../netlify/functions/indexnow.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const p={id:'rec12345678901234',title:'Departamento en Ñuñoa',commune:'Ñuñoa',address:'Dirección pública',operation:'arriendo',propertyType:'Departamento',status:'Disponible',priceValue:500000,currency:'CLP',bedrooms:2,bathrooms:1,usableArea:52,photos:['https://example.org/photo.jpg'],coverPhoto:'https://example.org/photo.jpg',description:'Descripción comercial original.',features:['Terraza']};
const q={...p,id:'rec12345678901235',title:'Otro departamento'};
const setupFetch=(t,properties=[p,q],complete=true)=>{
 t.mock.method(globalThis,'fetch',async(input)=>{
  const url=new URL(input);
  if(url.pathname==='/api/properties')return Response.json({properties,complete});
  if(url.pathname.startsWith('/seo-templates/'))return new Response(fs.readFileSync(root+url.pathname,'utf8'));
  throw Error('Unexpected fetch '+url.pathname);
 });
};
test('metadatos únicos, seguros y canonical única',()=>{
 const h=head('<head><title>Antes</title><meta name="description" content="x"><meta name="description" content="y"><link rel="canonical" href="/old"></head>',enrichedPropertySeo(p));
 assert.equal((h.match(/name="description"/g)||[]).length,1);assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.match(h,/summary_large_image/);
});
test('estado, fechas reales y sitemaps sin inventario no disponible',()=>{
 for(const status of ['Arrendada','Vendido','Reservada','Borrador','No disponible','Privado'])assert.equal(isIndexable({...p,status}),false,status);
 assert.equal(isPublic({...p,status:'Borrador'}),false);
 assert.equal(lastmod(''), '');assert.equal(lastmod('2026-02-30'), '');assert.equal(lastmod('2099-01-01'), '');
 const xml=sitemap([p,{...q,status:'Reservada'}]);assert.ok(xml.includes(p.id));assert.ok(!xml.includes(q.id));assert.ok(!xml.includes('<lastmod>'));
});
test('JSON-LD baños, dormitorios, UF correcta y sin mascotas/coordenadas inventadas',()=>{
 const s=enrichedPropertySeo({...p,currency:'UF',priceValue:3000}).schema['@graph'][0];
 assert.equal(s.mainEntity.numberOfBedrooms,2);assert.equal(s.mainEntity.numberOfBathroomsTotal,1);assert.equal(s.offers.priceCurrency,'CLF');assert.equal(s.mainEntity.geo,undefined);assert.equal(s.mainEntity.petsAllowed,undefined);
});
test('comunas/tipos limitados a inventario real y similares de la misma operación',()=>{
 assert.equal(landingPages([p]).length,0);assert.equal(landingPages([p,q]).length,1);
 assert.deepEqual(similarProperties([q,{...q,id:'sale',operation:'venta'}],p).map(x=>x.id),[q.id]);
});
test('propiedad SSR, legacy 301, no disponible conservada, inexistente 404, fallo 503',async t=>{
 setupFetch(t);
 let r=await propertyHandler(new Request(SITE+'/propiedad?id='+p.id),{});assert.equal(r.status,301);assert.equal(r.headers.get('Location'),SITE+propertyPath(p));
 r=await propertyHandler(new Request(SITE+propertyPath(p)),{});let h=await r.text();assert.equal(r.status,200);assert.ok(h.includes(p.description));assert.ok(h.includes('id="catalog-seo-data"'));assert.ok(h.includes('fetchpriority="high"'));assert.ok(!h.includes('http-equiv="refresh"'));assert.match(h,/<a id="crumbOp" href="\/arriendos">/);assert.ok(h.includes(propertyPath(q)));
 r=await propertyHandler(new Request(SITE+'/propiedad?id=rec00000000000000'),{});assert.equal(r.status,404);
 globalThis.fetch=async()=>Response.json({properties:[p],complete:false});
 r=await propertyHandler(new Request(SITE+propertyPath(p)),{});assert.equal(r.status,503);
});
test('catálogo SSR con imagen social propia, filtros noindex y comuna inexistente 404',async t=>{
 setupFetch(t);
 let r=await catalogHandler(new Request(SITE+'/arriendos/nunoa'),{});let h=await r.text();assert.equal(r.status,200);assert.ok(h.includes(propertyPath(p)));assert.ok(h.includes('/og/og-arriendos.jpg'));assert.equal((h.match(/<h1[ >]/g)||[]).length,1);
 r=await catalogHandler(new Request(SITE+'/arriendos?comuna=Ñuñoa'),{});assert.equal(r.headers.get('X-Robots-Tag'),'noindex,follow');
 r=await catalogHandler(new Request(SITE+'/arriendos/comuna-inexistente'),{});assert.equal(r.status,404);
});
test('sitemap no publica un catálogo parcial como válido',async t=>{
 setupFetch(t,[p],false);const r=await sitemapHandler(new Request(SITE+'/sitemap-propiedades.xml'));assert.equal(r.status,503);
});
test('IndexNow protegido y restringido al dominio y fichas reales',()=>{
 assert.ok(!authorized('Bearer a',''));assert.ok(authorized('Bearer test-secret','test-secret'));assert.ok(!authorized('Bearer wrong','test-secret'));
 assert.ok(validPropertyUrl(SITE+propertyPath(p)));assert.ok(!validPropertyUrl('https://evil.example'+propertyPath(p)));
});
test('21 fichas conservan las 95 plantas y el precio mínimo confirmado en HTML',()=>{
 const ctx={window:{}};vm.createContext(ctx);
 for(const file of ['data-proyectos.js','data-proyectos-detalle.js','tipologias-confirmadas.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),ctx);
 assert.equal(ctx.window.PROYECTOS.length,21);assert.equal(Object.values(ctx.window.TIPOLOGIAS_CONFIRMADAS).flat().length,95);
 for(const item of ctx.window.PROYECTOS){const h=fs.readFileSync(root+'proyectos/'+item.slug+'/index.html','utf8');assert.ok(h.includes('data-seo-project="'+item.slug+'"'));assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.ok(h.includes('UF '+new Intl.NumberFormat('es-CL').format(item.desdeUF)));assert.ok(h.includes('plantas-visor.js'));assert.ok(h.includes('tipologias-20261002c'));}
});
test('parcelas sin recargo ni descuento y con pie mínimo 40%',()=>{
 const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'data-parcelas-proyectos.js','utf8'),ctx);
 const p=Object.values(ctx.window).flatMap(v=>Object.values(v)).find(x=>x?.credito);
 assert.equal(p.credito.recargo,0);assert.equal(p.credito.pieMin,40);assert.equal(p.credito.pieDefault,40);
 const source=fs.readFileSync(root+'parcela-ficha.js','utf8');assert.ok(source.includes('const valorFin=valor;'));assert.ok(source.includes('let uf='));
 const value=2500*40746.28, pie=value*.4, capital=value-pie, cuota=capital*.01/(1-Math.pow(1.01,-36));
 assert.equal(Math.round(pie),40746280);assert.equal(Math.round(capital),61119420);assert.equal(Math.round(cuota),2030039);
});
