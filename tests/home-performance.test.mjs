import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {homeProperties,rentalCard,summaryProperty,rentalCards,selectHomeRentals} from '../home-render.mjs';
import handler,{normalize} from '../netlify/functions/properties.mjs';
const p={id:'rec123',source:'airtable-corretaje',operation:'arriendo',title:'<Prueba>',commune:'Macul',priceValue:500000,currency:'CLP',bedrooms:0,bathrooms:1,status:'Disponible',coverPhoto:'/assets/test.jpg'};
test('initial HTML contains eight selected rentals without waiting for API or JavaScript',()=>{
 const html=fs.readFileSync(new URL('../Home - Corretaje Guzman.html',import.meta.url),'utf8');
 const data=JSON.parse(html.match(/id="home-catalog-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
 const rent=homeProperties(data.properties).filter(p=>p.operation==='arriendo');
 assert.ok(rent.length>6);
 assert.equal((html.match(/class="ac"/g)||[]).length,8);
 assert.ok(data.uf.value>0);
 assert.deepEqual([...html.matchAll(/class="ac" href="[^"]+-(rec[A-Za-z0-9]+)"/g)].map(m=>m[1]),selectHomeRentals(rent,data.uf.value).map(p=>p.id));
 assert.equal((html.match(/class="pc"/g)||[]).length,10);
 assert.doesNotMatch(html,/unpkg.com/);
 for(const p of rent.filter(p=>p.coverPhoto)){assert.ok(p.coverPhoto.startsWith('/assets/home-catalog/'));assert.ok(fs.existsSync(new URL('..'+p.coverPhoto,import.meta.url)));}
});
test('renderer escapes catalog values and excludes unavailable properties',()=>{
 const card=rentalCard(p);assert.match(card,/&lt;Prueba&gt;/);assert.match(card,/0 dorm/);
 assert.equal(rentalCards([{...p,status:'Arrendado'}]),'');
 assert.equal(rentalCards([{...p,source:'rentando'}]),'');
 assert.ok(!('description' in summaryProperty({...p,description:'long detail',photos:['x','y']})));
});
test('normalization offers a thumbnail for cards without changing original gallery',()=>{
 const n=normalize({id:'r',fields:{Fotos:[{id:'att123',url:'https://example.org/full.jpg',thumbnails:{large:{url:'https://example.org/card.jpg'}}}] }},'arriendo');
 assert.equal(n.cardPhoto,'https://example.org/card.jpg');assert.equal(n.photos[0],'https://example.org/full.jpg');assert.equal(n.photoKey,'att123');
});
test('complete lightweight API is durably cached; partial data is never cached',async t=>{
 const prior=process.env.AIRTABLE_API_KEY;process.env.AIRTABLE_API_KEY='test-only';
 try{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({records:[{id:'r',fields:{Nombre:'Casa',Estado:'Disponible',Fotos:[{url:'https://example.org/a.jpg'}]}}]}),{headers:{'Content-Type':'application/json'}}));
 let r=await handler(new Request('https://example.org/api/properties?summary=home'));
 assert.match(r.headers.get('Netlify-CDN-Cache-Control'),/durable/);assert.match(r.headers.get('Netlify-Vary'),/summary/);
 const j=await r.json();assert.equal(j.complete,true);assert.ok(!('photos' in j.properties[0]));
 let count=0;t.mock.method(globalThis,'fetch',async()=>++count===1?new Response('{}',{status:500}):new Response(JSON.stringify({records:[{id:'r',fields:{Nombre:'Casa'}}]})));
 r=await handler(new Request('https://example.org/api/properties?summary=home'));
 assert.equal(r.headers.get('Netlify-CDN-Cache-Control'),'no-store');assert.equal((await r.json()).complete,false);
 }finally{if(prior===undefined)delete process.env.AIRTABLE_API_KEY;else process.env.AIRTABLE_API_KEY=prior;}
});
