import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

export const IMAGE_PATH = '/api/chilepropiedades-images/';
export const IMAGE_KEY = /^v1\/[a-f0-9]{64}\.(?:jpg|png|webp|gif)$/;
export const MAX_IMAGE_BYTES = 18 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const unavailable = () => new Error('Images unavailable');

export const boundedBlobFetch = (signal, fetchImpl = fetch) => async (url, options = {}) => {
  // Blobs 11 retries transport errors/5xx five times with 5-second sleeps,
  // including AbortError. Convert failures at this transport boundary into a
  // non-retryable SDK error so the function can return 503 within its deadline.
  try {
    const response = await fetchImpl(url, { ...options,
      signal: AbortSignal.any([...(signal ? [signal] : []), ...(options.signal ? [options.signal] : []), AbortSignal.timeout(10000)]),
    });
    if (response.ok || response.status === 404 || response.status === 412) return response;
    await response.body?.cancel();
  } catch { /* Report only a generic error through the SDK. */ }
  return new Response('Storage unavailable', { status: 400 });
};

export function imageStore(context = {}, signal) {
  // Production persists across deploys. Previews can never write production's store.
  const production = context.deploy?.context === 'production';
  const suffix = production ? 'production' : `preview-${hash(context.deploy?.id || 'local').slice(0, 16)}`;
  return getStore({
    name: `chilepropiedades-photos-${suffix}`, consistency: 'strong',
    fetch: boundedBlobFetch(signal),
  });
}

function attachmentVersion(attachment) {
  if (!attachment || !/^att[a-zA-Z0-9]{14}$/.test(attachment.id) || !Number.isSafeInteger(attachment.size) || attachment.size <= 0 || attachment.size > MAX_IMAGE_BYTES) throw unavailable();
  // Airtable replacements get a new attachment ID. Signed URLs and their expiry
  // are deliberately excluded, so refreshing an URL cannot change image identity.
  return hash(JSON.stringify([attachment.id, attachment.size, attachment.type, attachment.filename, attachment.width, attachment.height]));
}

function attachmentUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
    !(url.hostname.endsWith('.airtableusercontent.com') || url.hostname === 'dl.airtable.com')) throw unavailable();
  return url;
}

function imageFormat(data) {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return ['jpg', 'image/jpeg'];
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['png', 'image/png'];
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6))) return ['gif', 'image/gif'];
  throw unavailable();
}

async function readImage(response, expectedSize) {
  const length = Number(response.headers.get('content-length'));
  if (!response.body || length > MAX_IMAGE_BYTES) throw unavailable();
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) throw unavailable();
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
  if (size !== expectedSize) throw unavailable();
  return Buffer.concat(chunks);
}

export async function persistImage(attachment, { store, origin, fetchImpl = fetch, signal }) {
  signal?.throwIfAborted();
  const version = attachmentVersion(attachment);
  const indexKey = `attachments/${version}.json`;
  const cached = await store.get(indexKey, { type: 'json' });
  if (cached && IMAGE_KEY.test(cached.key) && await store.getMetadata(cached.key)) {
    return `${origin}${IMAGE_PATH}${cached.key}`;
  }
  const response = await fetchImpl(attachmentUrl(attachment.url), {
    redirect: 'error', // Do not forward to arbitrary hosts, or send Airtable credentials.
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  if (!response.ok) throw unavailable();
  const data = await readImage(response, attachment.size);
  const [extension, contentType] = imageFormat(data);
  const key = `v1/${hash(Buffer.concat([Buffer.from(version), data]))}.${extension}`;
  // Unconditional writes are intentional: Blobs 11.1.4 conditional writes can
  // treat non-412 error statuses as success. This content-derived key can only
  // ever be written with the exact same bytes and metadata, including races.
  await store.set(key, data, { metadata: { contentType } });
  // Commit the lookup only after durable storage succeeds; never retain signed URLs.
  await store.setJSON(indexKey, { key });
  return `${origin}${IMAGE_PATH}${key}`;
}

export async function persistPictures(listings, options) {
  const jobs = [];
  for (const listing of listings) {
    listing.pictureUrls = new Array(listing.photos.length);
    listing.photos.forEach((attachment, i) => jobs.push(async () => {
      listing.pictureUrls[i] = await persistImage(attachment, options);
    }));
  }
  let next = 0;
  let failure;
  // Bounded memory/downloads, stable ordering, and no dangling writes after return.
  await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, async () => {
    while (!failure && next < jobs.length) {
      const job = jobs[next++];
      try { options.signal?.throwIfAborted(); await job(); }
      catch (error) { failure = error; }
    }
  }));
  if (failure) throw failure;
}
