const NUMBERS = ['56944637680', '56944717233'];
const HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

export function makePropertyWhatsapp({ getEnv, fetcher = fetch, warn = console.warn }) {
  return async request => {
    // Health checks and speculative prefetches must not consume a turn.
    if (request.method === 'HEAD' || /prefetch|prerender/i.test(
      (request.headers.get('purpose') || '') + (request.headers.get('sec-purpose') || '')
    )) return new Response(null, { status: 204, headers: HEADERS });
    if (request.method !== 'GET') return new Response('Método no permitido', {
      status: 405, headers: { ...HEADERS, Allow: 'GET, HEAD' },
    });
    const text = new URL(request.url).searchParams.get('text') || '';
    if (!text.startsWith('Hola, quiero más información sobre esta propiedad: ') || text.length > 2000) {
      return new Response('Consulta de propiedad inválida', { status: 400, headers: HEADERS });
    }
    let phone = NUMBERS[0];
    try {
      const base = getEnv('SUPABASE_URL');
      const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
      if (!base || !key) throw new Error('Missing routing configuration');
      const response = await fetcher(base.replace(/\/$/, '') + '/rest/v1/rpc/next_property_whatsapp', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Routing unavailable');
      const assigned = await response.json();
      if (!NUMBERS.includes(assigned)) throw new Error('Invalid routing result');
      phone = assigned;
    } catch {
      // Preserve the existing contact if infrastructure is temporarily unavailable.
      // Never log credentials or the visitor's message.
      warn('Property WhatsApp routing unavailable; using original contact.');
    }
    return new Response(null, {
      status: 302,
      headers: { ...HEADERS, Location: 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text) },
    });
  };
}
