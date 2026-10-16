import { env, contactConfig, readInventory, mapListing, renderXml } from './chilepropiedades-feed.mjs';
import { IMAGE_PATH, IMAGE_KEY, imageStore, persistPictures } from './chilepropiedades-images.mjs';

const noCache = { 'Cache-Control': 'no-store', 'Netlify-CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const errorResponse = () => new Response('Servicio temporalmente no disponible.', {
  status: 503, headers: { ...noCache, 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' },
});
const methodError = () => new Response('Método no permitido.', { status: 405, headers: { ...noCache, Allow: 'GET, HEAD' } });

function publicOrigin(request, context, readEnv) {
  const raw = context.deploy?.context === 'production'
    ? readEnv('CHILEPROPIEDADES_PUBLIC_ORIGIN') || 'https://corretajeguzman.com'
    : new URL(request.url).origin;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Invalid origin');
  return url.origin;
}

export function createFeedHandler({ readEnv = env, fetchImpl = fetch, getImageStore = imageStore, timeoutMs = 20000, log = console.error } = {}) {
  return async (request, context = {}) => {
    if (!['GET', 'HEAD'].includes(request.method)) return methodError();
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const contact = contactConfig(readEnv);
      const origin = publicOrigin(request, context, readEnv);
      const inventory = await readInventory({ readEnv, fetchImpl, signal });
      const listings = Object.entries(inventory).flatMap(([source, records]) => records.map(record => mapListing(record, source)).filter(Boolean));
      const store = getImageStore(context, signal);
      await persistPictures(listings, { store, origin, fetchImpl, signal });
      signal.throwIfAborted();
      const xml = renderXml(listings, contact);
      if (Buffer.byteLength(xml) > 5 * 1024 * 1024) throw Error('Feed too large');
      return new Response(request.method === 'HEAD' ? null : xml, { headers: {
        ...noCache, 'Content-Type': 'application/xml; charset=utf-8',
      } });
    } catch {
      // Do not log exception messages/URLs: upstream errors may contain secrets.
      log('chilepropiedades_feed_unavailable');
      return errorResponse();
    }
  };
}

export function createImageHandler({ getImageStore = imageStore, log = console.error } = {}) {
  return async (request, context = {}) => {
    if (!['GET', 'HEAD'].includes(request.method)) return methodError();
    const url = new URL(request.url);
    const prefix = url.pathname.startsWith(IMAGE_PATH) ? IMAGE_PATH : '/.netlify/functions/chilepropiedades-image/';
    const key = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : '';
    // Only versioned image keys; attachment manifests are never public.
    if (!IMAGE_KEY.test(key)) return new Response('No encontrado.', { status: 404, headers: noCache });
    try {
      const store = getImageStore(context, AbortSignal.timeout(15000));
      const result = await store.getWithMetadata(key, { type: 'stream' });
      if (!result) return new Response('No encontrado.', { status: 404, headers: noCache });
      const types = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
      const contentType = types[key.split('.').pop()];
      if (result.metadata?.contentType !== contentType) throw Error('Invalid image');
      const headers = {
        'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Netlify-CDN-Cache-Control': 'public, durable, max-age=31536000, immutable',
        ETag: `"${key.split('/').pop()}"`,
      };
      if (request.method === 'HEAD' || request.headers.get('if-none-match') === headers.ETag) {
        await result.data?.cancel();
        return new Response(null, { status: request.method === 'HEAD' ? 200 : 304, headers });
      }
      return new Response(result.data, { headers });
    } catch {
      log('chilepropiedades_image_unavailable');
      return errorResponse();
    }
  };
}
