import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getStore } from '@netlify/blobs';
import { FIELDS, eligible, mapListing, readInventory, contactConfig, renderXml } from '../netlify/lib/chilepropiedades-feed.mjs';
import { persistImage, persistPictures, boundedBlobFetch, IMAGE_PATH, MAX_IMAGE_BYTES } from '../netlify/lib/chilepropiedades-images.mjs';
import { createFeedHandler, createImageHandler } from '../netlify/lib/chilepropiedades-handlers.mjs';

const origin = 'https://corretajeguzman.com';
const request = () => new Request(origin + '/api/chilepropiedades.xml');
const context = { deploy: { context: 'production', id: 'test-deploy' } };
const config = {
  AIRTABLE_API_KEY: 'PRIVATE_TOKEN', AIRTABLE_BASE_ID: 'appExample',
  AIRTABLE_RENT_TABLE_ID: 'rentTable', AIRTABLE_SALE_TABLE_ID: 'saleTable',
  CHILEPROPIEDADES_CONTACT_EMAIL: 'public@example.com', CHILEPROPIEDADES_CONTACT_PHONE: '+56912345678',
  CHILEPROPIEDADES_CONTACT_WHATSAPP: 'true',
};
const readEnv = key => config[key];
const jpeg = Buffer.from([255, 216, 255, 224, 0, 16, 255, 217]);
const photo = (changes = {}) => ({ id: 'att00000000000001', size: jpeg.length, filename: 'photo.jpg', type: 'image/jpeg', width: 10, height: 10, url: 'https://v5.airtableusercontent.com/signed-original', ...changes });
const record = (fields = {}, id = 'rec00000000000001') => ({ id, fields: {
  Estado: 'Disponible', 'Nombre de la propiedad': 'Casa & luz <Ñuñoa>', Comuna: 'Ñuñoa',
  'Direccion publica': 'Av. Pública 123', 'Tipo propiedad': 'Departamento', 'Precio valor': 500000,
  Moneda: 'CLP', 'Valor gasto comun': 0, Dormitorios: 2, 'Baños': '1', Estacionamiento: '1 subterráneo',
  'Descripción pública': 'Arriendo público ]]> & <sin HTML> \u0001 😀', 'Descripcion publica': 'Venta pública',
  'Superficie útil m2': 52.5, 'Superficie util m2': 80, 'Metros totales': 90,
  'Dirección': 'PRIVATE_ADDRESS', 'Numero Dueño': 'PRIVATE_PHONE', 'Comisión dueño': 'PRIVATE_COMMISSION',
  Fotos: [photo()], ...fields,
} });

class MemoryStore {
  entries = new Map(); writes = 0;
  async get(key) { return this.entries.get(key)?.data ?? null; }
  async getMetadata(key) { return this.entries.has(key) ? { metadata: this.entries.get(key).metadata } : null; }
  async set(key, data, { metadata = {}, onlyIfNew } = {}) {
    if (!onlyIfNew || !this.entries.has(key)) { this.entries.set(key, { data, metadata }); this.writes++; }
  }
  async setJSON(key, data, options) { await this.set(key, data, options); }
  async getWithMetadata(key) {
    const item = this.entries.get(key);
    return item ? { data: new Response(item.data).body, metadata: item.metadata, etag: 'test' } : null;
  }
}

function setup({ rent = [record()], sale = [record({ Moneda: 'UF', 'Precio valor': 2600 })], fetchOverride, store = new MemoryStore(), env = readEnv, timeoutMs } = {}) {
  const calls = [];
  const fetchImpl = async (input, options) => {
    const url = new URL(input); calls.push({ url, options });
    if (fetchOverride) { const result = await fetchOverride(url, options); if (result) return result; }
    if (url.hostname === 'api.airtable.com') return Response.json({ records: url.pathname.endsWith('rentTable') ? rent : sale });
    return new Response(jpeg, { headers: { 'content-type': 'image/jpeg' } });
  };
  const handler = createFeedHandler({ readEnv: env, fetchImpl, getImageStore: () => store, log: () => {}, timeoutMs });
  return { handler, store, calls, fetchImpl };
}

test('rent/sale use exact field names, permanent IDs, operation, CLP/UF and CLP fees', () => {
  const rent = mapListing(record(), 'rent'); const sale = mapListing(record({ Moneda: 'UF', 'Precio valor': 3500 }), 'sale');
  assert.equal(rent.referenceId, 'rent-rec00000000000001'); assert.equal(sale.referenceId, 'sale-rec00000000000001');
  assert.equal(rent.operation, 'Arriendo'); assert.equal(sale.operation, 'Venta');
  assert.equal(rent.currency, 'CLP'); assert.equal(sale.currency, 'CLF'); assert.equal(sale.price, 3500);
  assert.equal(rent.fees, 0); assert.equal(rent.usableArea, 52.5); assert.equal(sale.usableArea, 80);
  assert.match(rent.description, /^Arriendo/); assert.equal(sale.description, 'Venta pública');
  assert.equal(rent.parking, 1); assert.equal(rent.floorArea, null); assert.equal(sale.floorArea, 90); assert.equal(sale.plotArea, null);
});

test('only exact Disponible is eligible; reserved/empty/missing/case/whitespace never default', () => {
  for (const Estado of ['Reservada', '', undefined, null, 'disponible', 'Disponible ', 'Vendida', 'Arrendada']) {
    assert.equal(eligible(record({ Estado })), false); assert.equal(mapListing(record({ Estado }), 'rent'), null);
  }
  assert.equal(eligible(record({ Estado: { name: 'Disponible' } })), true);
});

test('official types, including Local/condominio/loft/parcela aliases; unknown types fail closed', () => {
  for (const [input, expected] of [['Local', 'Local Comercial'], ['Casa en condominio', 'Casa'], ['Departamento dúplex tipo loft', 'Loft'], ['Parcela con cabaña', 'Parcela'], ['Terreno Agricola', 'Terreno Agricola']]) {
    assert.equal(mapListing(record({ 'Tipo propiedad': input }), 'sale').type, expected);
  }
  for (const input of ['Castillo', '', undefined]) assert.throws(() => mapListing(record({ 'Tipo propiedad': input }), 'rent'));
});

test('land/house surfaces preserve plot versus usable area without summing terraces', () => {
  const p = mapListing(record({ 'Tipo propiedad': 'Parcela con cabaña', 'Metros totales': 5000, 'Superficie util m2': 42 }), 'sale');
  assert.equal(p.floorArea, 42); assert.equal(p.usableArea, 42); assert.equal(p.plotArea, 5000);
});

test('unknown optional counts are omitted, zero is preserved, numbers are never inferred from arbitrary text', () => {
  assert.equal(mapListing(record({ Estacionamiento: 'No' }), 'rent').parking, 0);
  assert.equal(mapListing(record({ Estacionamiento: 'No informado', Dormitorios: undefined }), 'rent').parking, null);
  assert.equal(mapListing(record({ 'Baños': '0' }), 'rent').bathrooms, 0);
  for (const fields of [{ 'Precio valor': '' }, { 'Precio valor': 0 }, { 'Precio valor': 'consultar 300' }, { Moneda: '' }, { Moneda: 'constructor' }, { Comuna: '' }, { 'Baños': '1 o 2' }, { 'Valor gasto comun': -1 }]) {
    assert.throws(() => mapListing(record(fields), 'rent'));
  }
});

test('no fallback to internal address, private description, or alternative misspelled fees', () => {
  const p = mapListing(record({ 'Direccion publica': '', 'Descripción pública': undefined, Descripción: 'PRIVATE', 'Valor gasto comun': undefined, 'Valor gasto común': 999 }), 'rent');
  assert.equal(p.address, ''); assert.equal(p.description, ''); assert.equal(p.fees, null);
});

test('configured public contact is mandatory; missing/invalid configuration fails', () => {
  assert.deepEqual(contactConfig(readEnv), { email: 'public@example.com', phone: '+56912345678', whatsapp: 'true' });
  for (const key of ['CHILEPROPIEDADES_CONTACT_EMAIL', 'CHILEPROPIEDADES_CONTACT_PHONE']) assert.throws(() => contactConfig(k => k === key ? '' : readEnv(k)));
  assert.throws(() => contactConfig(k => k === 'CHILEPROPIEDADES_CONTACT_WHATSAPP' ? 'yes' : readEnv(k)));
});

test('complete XML uses official nesting, valid CDATA, accents/emoji and stable HTTPS photographs', async () => {
  const { handler, calls } = setup(); const response = await handler(request(), context); const xml = await response.text();
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/xml; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.match(xml, /^<\?xml.*\n<listings>/);
  assert.equal((xml.match(/<listing>/g) || []).length, 2); assert.match(xml, /<prices><price currency="CLF" operation="Venta">/);
  assert.match(xml, /<contact><name>.*<phones><phone whatsapp="true">/);
  assert.match(xml, /<pictures><picture><url><!\[CDATA\[https:\/\/corretajeguzman.com\/api\/chilepropiedades-images\/v1\/[a-f0-9]{64}.jpg/);
  assert.match(xml, /\]\]\]\]><!\[CDATA\[>/); assert.match(xml, /😀/); assert.ok(!xml.includes('\u0001'));
  for (const privateText of ['PRIVATE', 'airtableusercontent', 'signed-original', 'photo.jpg']) assert.ok(!xml.includes(privateText));
  const apiCalls = calls.filter(c => c.url.hostname === 'api.airtable.com');
  assert.equal(apiCalls.length, 2);
  for (const call of apiCalls) {
    assert.equal(call.options.headers.Authorization, 'Bearer PRIVATE_TOKEN');
    for (const privateField of ['Dirección', 'Numero Dueño', 'Comisión dueño']) assert.ok(!call.url.searchParams.getAll('fields[]').includes(privateField));
  }
  const photoCalls = calls.filter(c => c.url.hostname !== 'api.airtable.com');
  assert.equal(photoCalls[0].options.headers, undefined); assert.equal(photoCalls[0].options.redirect, 'error');
});

test('reserved and absent Estado never appear, even with broken required fields/photos', async () => {
  const { handler } = setup({ rent: [record({ Estado: 'Reservada', Moneda: '' })], sale: [record({ Estado: undefined })] });
  const response = await handler(request(), context);
  assert.equal(response.status, 200); assert.equal((await response.text()).includes('<listing>'), false);
});

test('pagination fetches every page and both tables with their exact public field lists', async () => {
  const calls = [];
  const inventory = await readInventory({ readEnv, fetchImpl: async input => {
    const url = new URL(input); calls.push(url);
    if (url.pathname.endsWith('rentTable') && !url.searchParams.has('offset')) return Response.json({ records: [record()], offset: 'next' });
    return Response.json({ records: [record({}, 'rec00000000000002')] });
  } });
  assert.equal(inventory.rent.length, 2); assert.equal(inventory.sale.length, 1);
  assert.equal(calls[1].searchParams.get('offset'), 'next');
  assert.deepEqual(calls[2].searchParams.getAll('fields[]'), Object.values(FIELDS.sale));
});

test('missing credentials fail without making network calls', async () => {
  const s = setup({ env: key => key === 'AIRTABLE_API_KEY' ? undefined : readEnv(key) });
  assert.equal((await s.handler(request(), context)).status, 503); assert.equal(s.calls.length, 0);
});

for (const failure of ['rent', 'sale', '429', 'timeout', 'malformed', 'bad-json', 'second-page', 'repeated-offset']) {
  test(`upstream failure ${failure} returns generic 503, never empty/partial XML or credentials`, async () => {
    const s = setup({ fetchOverride: async url => {
      if (url.hostname !== 'api.airtable.com') return;
      if (failure === 'timeout') throw Error('PRIVATE_TOKEN internal timeout');
      if (failure === 'malformed') return Response.json({ error: 'PRIVATE_TOKEN' });
      if (failure === 'bad-json') return new Response('not JSON');
      if (failure === 'second-page' && !url.searchParams.has('offset')) return Response.json({ records: [record()], offset: 'next' });
      if (failure === 'repeated-offset') return Response.json({ records: [], offset: 'same' });
      if (failure === '429' || failure === 'second-page' || url.pathname.endsWith(failure + 'Table')) return new Response('PRIVATE_TOKEN', { status: failure === '429' ? 429 : 500 });
    } });
    const response = await s.handler(request(), context); const text = await response.text();
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(!text.includes('<listings')); assert.ok(!text.includes('PRIVATE')); assert.equal(s.store.writes, 0);
  });
}

test('invalid available record prevents the entire feed; no silent omission', async () => {
  const s = setup({ sale: [record({ 'Tipo propiedad': 'Castillo' })] });
  assert.equal((await s.handler(request(), context)).status, 503); assert.equal(s.store.writes, 0);
});

test('photo URLs survive attachment URL expiration/rotation without re-downloading', async () => {
  const store = new MemoryStore(); let calls = 0;
  const options = { store, origin, fetchImpl: async () => { calls++; return new Response(jpeg); } };
  const first = await persistImage(photo(), options);
  const second = await persistImage(photo({ url: 'https://v5.airtableusercontent.com/expired' }), { ...options, fetchImpl: async () => { throw Error('expired'); } });
  assert.equal(first, second); assert.equal(calls, 1);
  const index = [...store.entries].find(([key]) => key.startsWith('attachments/'))[1];
  assert.deepEqual(Object.keys(index.data), ['key']);
});

test('replaced attachment gets a different filename even with identical bytes and original filename', async () => {
  const options = { store: new MemoryStore(), origin, fetchImpl: async () => new Response(jpeg) };
  const a = await persistImage(photo(), options); const b = await persistImage(photo({ id: 'att00000000000002' }), options);
  assert.notEqual(a, b); assert.ok(options.store.entries.has(a.slice((origin + IMAGE_PATH).length)));
});

test('changed attachment metadata changes version; missing stored file can be repaired', async () => {
  const store = new MemoryStore(); const options = { store, origin, fetchImpl: async () => new Response(jpeg) };
  const a = await persistImage(photo(), options); const b = await persistImage(photo({ filename: 'edited.jpg' }), options);
  assert.notEqual(a, b); const key = a.slice((origin + IMAGE_PATH).length); store.entries.delete(key);
  assert.equal(await persistImage(photo(), options), a); assert.ok(store.entries.has(key));
});

test('photo order is retained despite concurrent downloads; deleted photos disappear from next feed', async () => {
  const store = new MemoryStore(); const p = mapListing(record({ Fotos: [photo(), photo({ id: 'att00000000000002' })] }), 'rent');
  await persistPictures([p], { store, origin, fetchImpl: async url => { await new Promise(r => setTimeout(r, 2)); return new Response(jpeg); } });
  assert.equal(p.pictureUrls[0], await persistImage(photo(), { store, origin })); assert.notEqual(p.pictureUrls[0], p.pictureUrls[1]);
  const s = setup({ store, rent: [record({ Fotos: [] })], sale: [] }); const xml = await (await s.handler(request(), context)).text();
  assert.ok(!xml.includes('<picture>')); assert.ok(store.entries.size > 0);
});

for (const failure of ['download', 'store', 'html', 'truncated', 'oversize', 'unsafe-host', 'manifest']) {
  test(`photo failure ${failure} prevents a successful feed`, async () => {
    const store = new MemoryStore(); let attachment = photo();
    if (failure === 'store') store.set = async () => { throw Error('PRIVATE storage error'); };
    if (failure === 'manifest') store.get = async () => { throw Error('PRIVATE storage error'); };
    if (failure === 'oversize') attachment = photo({ size: MAX_IMAGE_BYTES + 1 });
    if (failure === 'unsafe-host') attachment = photo({ url: 'https://127.0.0.1/internal' });
    const s = setup({ store, rent: [record({ Fotos: [attachment] })], sale: [], fetchOverride: async url => {
      if (url.hostname === 'api.airtable.com') return;
      if (failure === 'download') return new Response('expired', { status: 403 });
      if (failure === 'html') return new Response(Buffer.alloc(jpeg.length, 65));
      if (failure === 'truncated') return new Response(jpeg.subarray(0, 4));
    } });
    const response = await s.handler(request(), context); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('<listing'));
  });
}

test('deadline aborts feed with 503 and retains completed images for retry', async () => {
  const s = setup({ timeoutMs: 1 });
  const response = await s.handler(request(), context); assert.equal(response.status, 503);
  const store = new MemoryStore(); await persistImage(photo(), { store, origin, fetchImpl: async () => new Response(jpeg) });
  const retry = setup({ store }); assert.equal((await retry.handler(request(), context)).status, 200);
  assert.equal(retry.calls.filter(c => c.url.hostname !== 'api.airtable.com').length, 0);
});

test('public image endpoint streams persisted bytes, caches immutable versions and blocks manifest access', async () => {
  const store = new MemoryStore(); const url = await persistImage(photo(), { store, origin, fetchImpl: async () => new Response(jpeg) });
  const handler = createImageHandler({ getImageStore: () => store, log: () => {} });
  const response = await handler(new Request(url), context); assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/jpeg'); assert.match(response.headers.get('cache-control'), /immutable/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), jpeg);
  assert.equal((await handler(new Request(url, { method: 'HEAD' }), context)).status, 200);
  assert.equal((await handler(new Request(url, { headers: { 'If-None-Match': response.headers.get('etag') } }), context)).status, 304);
  for (const path of ['attachments/private.json', 'v1/nope.jpg', 'v1/' + 'f'.repeat(64) + '.jpg']) assert.equal((await handler(new Request(origin + IMAGE_PATH + path), context)).status, 404);
  const internal = url.replace(IMAGE_PATH, '/.netlify/functions/chilepropiedades-image/');
  assert.equal((await handler(new Request(internal), context)).status, 200);
});

test('image storage errors produce generic 503, and missing images are not cached', async () => {
  const handler = createImageHandler({ getImageStore: () => ({ getWithMetadata: async () => { throw Error('PRIVATE'); } }), log: () => {} });
  const response = await handler(new Request(origin + IMAGE_PATH + 'v1/' + 'a'.repeat(64) + '.jpg'), context);
  assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('PRIVATE'));
});

test('storage transport avoids SDK retries after remote failures or deadline; preserves not-found', async () => {
  for (const status of [429, 500, 503, 403]) {
    const result = await boundedBlobFetch(undefined, async () => new Response('PRIVATE', { status }))('https://storage.invalid');
    assert.equal(result.status, 400); assert.ok(!(await result.text()).includes('PRIVATE'));
  }
  const result = await boundedBlobFetch(AbortSignal.abort(), async (url, { signal }) => { signal.throwIfAborted(); })('https://storage.invalid');
  assert.equal(result.status, 400);
  assert.equal((await boundedBlobFetch(undefined, async () => new Response(null, { status: 404 }))('https://storage.invalid')).status, 404);
});

test('installed Blobs SDK rejects failed writes without waiting through its retry loop', async () => {
  let calls = 0;
  const store = getStore({ name: 'offline-test', siteID: 'test-site', token: 'test-only',
    fetch: boundedBlobFetch(undefined, async () => { calls++; return new Response('unavailable', { status: 503 }); }),
  });
  await assert.rejects(store.set('v1/test.jpg', jpeg, { metadata: { contentType: 'image/jpeg' } }));
  assert.equal(calls, 1);
});

test('PNG, WebP and GIF retain their original bytes and correct public content type', async () => {
  for (const [extension, type, bytes] of [
    ['png', 'image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])],
    ['webp', 'image/webp', Buffer.from('RIFF0000WEBPdata')],
    ['gif', 'image/gif', Buffer.from('GIF89a0000')],
  ]) {
    const store = new MemoryStore(); const attachment = photo({ size: bytes.length, type, filename: `original.${extension}` });
    const url = await persistImage(attachment, { store, origin, fetchImpl: async () => new Response(bytes) });
    assert.ok(url.endsWith(`.${extension}`));
    const response = await createImageHandler({ getImageStore: () => store })(new Request(url), context);
    assert.equal(response.headers.get('content-type'), type); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  }
});

test('only GET/HEAD are accepted; HEAD validates full feed; missing public contact returns 503', async () => {
  const s = setup(); assert.equal((await s.handler(new Request(request(), { method: 'POST' }), context)).status, 405);
  const head = await s.handler(new Request(request(), { method: 'HEAD' }), context); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  const noContact = setup({ env: key => key.startsWith('CHILEPROPIEDADES_CONTACT') ? undefined : readEnv(key) });
  assert.equal((await noContact.handler(request(), context)).status, 503); assert.equal(noContact.calls.length, 0);
});

test('previews use their own origin; production HTTPS origin cannot be injected from request host', async () => {
  const s = setup(); const preview = new Request('https://preview.netlify.app/api/chilepropiedades.xml');
  const xml = await (await s.handler(preview, { deploy: { context: 'deploy-preview', id: '123' } })).text();
  assert.ok(xml.includes('https://preview.netlify.app/api/chilepropiedades-images/'));
  const production = await (await s.handler(preview, context)).text(); assert.ok(production.includes(origin + IMAGE_PATH));
  const bad = setup({ env: key => key === 'CHILEPROPIEDADES_PUBLIC_ORIGIN' ? 'http://insecure.test' : readEnv(key) });
  assert.equal((await bad.handler(request(), context)).status, 503);
});

test('Netlify rewrites target both new functions and preserve the existing properties route', async () => {
  const toml = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(toml, /from = "\/api\/chilepropiedades.xml"\s+to = "\/.netlify\/functions\/chilepropiedades"\s+status = 200/);
  assert.match(toml, /from = "\/api\/chilepropiedades-images\/\*"\s+to = "\/.netlify\/functions\/chilepropiedades-image\/:splat"/);
  assert.match(toml, /from = "\/api\/properties"\s+to = "\/.netlify\/functions\/properties"/);
});
