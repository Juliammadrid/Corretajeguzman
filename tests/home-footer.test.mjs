import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectHomeRentals} from '../home-render.mjs';
import {withFooter} from '../scripts/build-footer.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const row=(id,price,currency='CLP')=>({id,priceValue:price,currency,operation:'arriendo',status:'Disponible'});
test('four cheapest and four most expensive compare UF/CLP in the same currency',()=>{
 const rows=[row('a',100000),row('b',200000),row('c',300000),row('d',400000),row('e',500000),row('f',600000),row('g',700000),row('h',800000),row('uf-low',5,'UF'),row('uf-high',30,'UF')];
 assert.deepEqual(selectHomeRentals(rows,41000).map(p=>p.id),['a','b','uf-low','c','f','g','h','uf-high']);
 assert.equal(rows.length,10);assert.equal(rows.at(-1).priceValue,30);
});
test('small catalogs have no repeats, missing prices and unavailable records are excluded',()=>{
 const rows=[row('a',1),row('b',2),row('a',1),row('bad',0),{...row('c',9),status:'Arrendado'},{...row('d',10),operation:'venta'},row('nan',null)];
 assert.deepEqual(selectHomeRentals(rows,41000).map(p=>p.id),['a','b']);
 assert.equal(selectHomeRentals(Array.from({length:8},(_,i)=>row('p'+i,i+1)),41000).length,8);
});
test('daily rent is not compared to monthly rent and missing photos do not borrow another property image',async()=>{
 const {rentalCard}=await import('../home-render.mjs');
 const daily={...row('daily',120000),title:'Casa (Arriendo diario)'};
 assert.equal(selectHomeRentals([daily,row('monthly',250000)],41000).length,1);
 assert.match(rentalCard(daily),/\/ día/);assert.match(rentalCard(daily),/Fotos por actualizar/);assert.doesNotMatch(rentalCard(daily),/<img/);
});
test('shared footer is idempotent, preserves page content, and works without JavaScript',()=>{
 const source='<html><head><title>Prueba</title></head><body><main><form>Contenido intacto</form></main><footer>Viejo</footer><script src="/existing.js"></script></body></html>';
 const result=withFooter(source);assert.equal(withFooter(result),result);
 assert.ok(result.includes('<main><form>Contenido intacto</form></main>'));
 assert.ok(result.includes('<script src="/existing.js"></script>'));
 assert.equal((result.match(/<footer\b/g)||[]).length,1);
 assert.match(result,/id="gz-site-footer"/);assert.match(result,/href="\/shared\/footer.css/);
});
test('every public page and dynamic template has the same footer',()=>{
 const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!f.startsWith('_')&&!f.startsWith('google'));
 const walk=dir=>{for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))files.push(f);}};
 for(const dir of ['proyectos','simulador-capacidad','nosotros'])walk(dir);
 files.push('seo-templates/property.txt','seo-templates/rent.txt','seo-templates/sale.txt');
 const expected=fs.readFileSync(path.join(root,'shared/footer.html'),'utf8').trim();
 for(const file of files){const h=fs.readFileSync(path.join(root,file),'utf8');assert.equal((h.match(/<footer\b/g)||[]).length,1,file);assert.ok(h.includes(expected),file);assert.match(h,/data-gz-footer/,file);}
 assert.ok(files.length>40);
});
