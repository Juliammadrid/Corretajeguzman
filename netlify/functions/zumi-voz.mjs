// Only forward browser offers. Session settings and the provider key stay on the server.
export default async function handler(req) {
  if (req.method !== 'POST') return new Response(null, {status: 405});
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response(null, {status: 403});
  if (req.headers.get('content-type') !== 'application/sdp') return new Response(null, {status: 415});
  const offer = await req.text();
  if (!offer.startsWith('v=0') || offer.length > 32000) return new Response(null, {status: 400});
  const token = process.env.ZUMI_BRIDGE_TOKEN;
  if (!token) return new Response(null, {status: 503});
  const response = await fetch('https://aoemvstjbwvkoqjoirsx.supabase.co/functions/v1/zumi-asistente', {
    method: 'POST', headers: {'Content-Type':'application/sdp','x-zumi-bridge':token},
    body: offer, signal: AbortSignal.timeout(25000)
  });
  return new Response(response.ok ? response.body : null, {status: response.status, headers: {
    'content-type':'application/sdp','cache-control':'no-store'
  }});
}
export const config = {rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:600,windowLimit:4}};
