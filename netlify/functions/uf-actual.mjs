/**
 * UF vigente para simuladores de Corretaje Guzmán.
 * La respuesta se cachea 15 minutos en Netlify y el navegador la revalida en cada apertura.
 */
const asNumber = (value) => {
  if (typeof value === 'number') return value;
  const raw = String(value ?? '').trim();
  return Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw);
};

export default async (request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const upstream = await fetch('https://mindicador.cl/api/uf', {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!upstream.ok) throw new Error('Indicador UF no disponible');

    const payload = await upstream.json();
    const latest = payload?.serie?.[0] ?? payload?.uf;
    const value = asNumber(latest?.valor);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Valor UF inválido');

    return new Response(JSON.stringify({ value, date: latest?.fecha ?? null }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, durable, max-age=900, stale-while-revalidate=1800'
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'UF temporalmente no disponible' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const config = { path: '/api/uf-actual' };
