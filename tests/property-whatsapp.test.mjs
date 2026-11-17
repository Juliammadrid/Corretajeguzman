import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { makePropertyWhatsapp } from '../netlify/lib/property-whatsapp.mjs';

const message = 'Hola, quiero más información sobre esta propiedad: Ñuñoa & Jardín. La vi por Ana.';
const request = (options = {}) => new Request('https://corretajeguzman.com/.netlify/functions/property-whatsapp?text=' + encodeURIComponent(message), options);
const getEnv = name => name === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'server-only-test-key';

test('different visitors share the global allocation and preserve the entire message', async () => {
  let turn = 0;
  const handler = makePropertyWhatsapp({ getEnv, fetcher: async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/rest/v1/rpc/next_property_whatsapp');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer server-only-test-key');
    return Response.json(['56944637680', '56944717233'][turn++ % 2]);
  }});
  for (const expected of ['56944637680', '56944717233', '56944637680', '56944717233']) {
    const response = await handler(request());
    assert.equal(response.status, 302);
    const url = new URL(response.headers.get('location'));
    assert.equal(url.pathname, '/' + expected);
    assert.equal(url.searchParams.get('text'), message);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    assert.equal(response.headers.get('Netlify-CDN-Cache-Control'), 'no-store');
    assert.ok(!JSON.stringify([...response.headers]).includes('server-only-test-key'));
  }
});

test('HEAD, prefetch, invalid input and unsupported methods never allocate a turn', async () => {
  let calls = 0;
  const handler = makePropertyWhatsapp({ getEnv, fetcher: async () => { calls++; throw Error(); } });
  assert.equal((await handler(request({ method: 'HEAD' }))).status, 204);
  assert.equal((await handler(request({ headers: { 'sec-purpose': 'prefetch' } }))).status, 204);
  assert.equal((await handler(request({ method: 'POST' }))).status, 405);
  assert.equal((await handler(new Request('https://corretajeguzman.com/.netlify/functions/property-whatsapp?text=spam'))).status, 400);
  assert.equal(calls, 0);
});

test('routing failures retain the original WhatsApp without exposing errors or secrets', async () => {
  for (const fetcher of [async () => { throw Error('secret'); }, async () => new Response('', { status: 503 }), async () => Response.json('attacker')]) {
    const logs = [];
    const handler = makePropertyWhatsapp({ getEnv, fetcher, warn: value => logs.push(value) });
    const response = await handler(request());
    assert.equal(new URL(response.headers.get('location')).pathname, '/56944637680');
    assert.equal(logs.length, 1);
    assert.ok(!logs[0].includes('secret'));
  }
});

test('desktop and mobile links use one router for rentals/sales only, without allocating on render', () => {
  const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const body = source.match(/const updateWa = \(\) => \{([\s\S]*?)\n  \};/)[1];
  for (const operation of ['arriendo', 'venta', 'other']) {
    const links = { '#waBtn': {}, '#mWa': {} };
    vm.runInNewContext(body, { p: { operation }, sel: { value: 'Ana' }, URL, encodeURIComponent,
      GZ: { waLink: () => 'https://wa.me/56944637680?text=' + encodeURIComponent(message) }, $: id => links[id],
    });
    assert.equal(links['#waBtn'].href, links['#mWa'].href);
    assert.equal(links['#waBtn'].href.startsWith('/.netlify/functions/property-whatsapp'), operation !== 'other');
    assert.equal(new URL(links['#waBtn'].href, 'https://corretajeguzman.com').searchParams.get('text'), message);
  }
});

test('database allocator is invoker-only, uncached and unavailable to browser roles', () => {
  const sql = fs.readFileSync(new URL('../scripts/property-whatsapp.sql', import.meta.url), 'utf8');
  assert.match(sql, /CACHE 1/);
  assert.match(sql, /SECURITY INVOKER SET search_path = ''/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.next_property_whatsapp\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.next_property_whatsapp\(\) TO service_role/);
});
