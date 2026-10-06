import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const home=fs.readFileSync(new URL('../Home - Corretaje Guzman.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../home-v2.js',import.meta.url),'utf8');
test('Home mantiene ruta, metadatos únicos y catálogo confirmado',()=>{
  assert.equal((home.match(/rel="canonical"/g)||[]).length,1);
  assert.match(home,/rel="canonical" href="https:\/\/corretajeguzman.com\/"/);
  assert.equal((home.match(/property="og:image"/g)||[]).length,1);
  assert.match(home,/tipologias-confirmadas.js/);
  assert.match(home,/guzman-header.js/);
  assert.doesNotMatch(home,/data-propiedades.js|api\/lead-alerta/);
  assert.match(js,/getJSON\('\/api\/properties'\)/);
  assert.match(js,/getJSON\('\/api\/reviews'\)/);
});
test('Favicons públicos apuntan al ícono cuadrado, no al logo horizontal',()=>{
  const redirects=fs.readFileSync(new URL('../_redirects',import.meta.url),'utf8');
  for(const alias of ['favicon.ico','favicon.png']) assert.ok(redirects.includes('/'+alias+'  /assets/favicon-512.png  200!'));
  for(const alias of ['apple-touch-icon.png','apple-touch-icon-precomposed.png']) assert.ok(redirects.includes('/'+alias+'  /assets/favicon-180.png  200!'));
});
test('Recursos locales del nuevo Home existen',()=>{
  const refs=[...home.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m=>m[1]);
  for(const ref of refs)assert.ok(fs.existsSync(new URL('..'+ref,import.meta.url)),ref);
});
