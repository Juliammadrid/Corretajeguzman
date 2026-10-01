import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SITE,propertyPath,isAvailable,propertySeo,head,esc} from '../seo-core.mjs';
import properties from '../netlify/functions/properties.js';
import sitemap from '../netlify/functions/sitemap-propiedades.js';
const root=new URL('../',import.meta.url);
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('data-proyectos.js',root),'utf8'),ctx);
test('All projects have initial content, unique canonical, parseable schema and real hero assets',()=>{
 const titles=new Set();
 for(const p of ctx.window.PROYECTOS){
  const html=fs.readFileSync(new URL(p.detalle.slice(1)+'index.html',root),'utf8');
  assert(html.includes('href="'+SITE+p.detalle+'"'));assert(html.includes('data-seo-project="'+p.slug+'"'));
  assert(html.includes('<h1 id="pName">'+esc(p.name)+'</h1>'));
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.equal((html.match(/data-project-hero-preload/g)||[]).length,1);
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!titles.has(title));titles.add(title);
  JSON.parse(html.match(/<script type="application\/ld\+json" data-seo-schema[^>]*>([\s\S]*?)<\/script>/)[1]);
  const hero=new URL(html.match(/<img id="heroImg" src="([^"]+)"/)[1],SITE);assert(fs.existsSync(new URL(hero.pathname.slice(1),root)),p.slug);
 }
});
test('Availability excludes unpublished or unavailable listings',()=>{
 for(const status of ['Arrendada','Arrendado','Vendida','Vendido','No disponible','Borrador','Inactivo','Retirada','Reservada'])assert(!isAvailable({status}));
 assert(isAvailable({status:'Disponible'}));
});
test('Slug, prices and schema preserve accents safely without duplicating metadata',()=>{
 const p={id:'rec12345678901234',title:'Departamento Ñuñoa & terraza',propertyType:'Departamento',operation:'arriendo',commune:'Ñuñoa',currency:'UF',priceValue:12.5,status:'Disponible'};
 assert.equal(propertyPath(p),'/propiedad/arriendo-departamento-departamento-nunoa-y-terraza-nunoa-rec12345678901234');
 const seo=propertySeo(p);assert.equal(seo.schema['@graph'][0].offers.price,12.5);assert.equal(seo.schema['@graph'][0].offers.priceCurrency,'CLF');
 let html='<html><head><title>Old</title><meta name="description" content="old"><link rel="canonical" href="old"></head><body></body></html>';
 html=head(head(html,seo),seo);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.equal((html.match(/name="description"/g)||[]).length,1);assert.equal((html.match(/data-seo-schema/g)||[]).length,1);
});
test('Sitemap updates from catalog and does not publish partial outages as an empty success',async()=>{
 const original=properties.handler;
 try{
  const p={id:'rec12345678901234',title:'Nuevo departamento',propertyType:'Departamento',operation:'arriendo',commune:'Ñuñoa',status:'Disponible',updatedAt:'2026-09-30T12:00:00Z'};
  properties.handler=async()=>({statusCode:200,body:JSON.stringify({properties:[p,{...p,id:'rec99999999999999',status:'Arrendada'}],complete:true})});
  let r=await sitemap();assert.equal(r.status,200);const xml=await r.text();assert(xml.includes(SITE+propertyPath(p)));assert(!xml.includes('rec99999999999999'));assert(xml.includes('<lastmod>2026-09-30</lastmod>'));
  properties.handler=async()=>({statusCode:200,body:JSON.stringify({properties:[],complete:false})});r=await sitemap();assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');
  properties.handler=async()=>({statusCode:502,body:'{}'});assert.equal((await sitemap()).status,503);
 }finally{properties.handler=original;}
});
