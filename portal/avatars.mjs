import { SUPABASE_URL } from './config.mjs';

export const AVATAR_BUCKET = 'avatares';
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const publicPrefix = SUPABASE_URL + '/storage/v1/object/public/' + AVATAR_BUCKET + '/';
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export function ownAvatarPath(url, userId) {
  if (typeof url !== 'string' || !url.startsWith(publicPrefix)) return null;
  const path = url.slice(publicPrefix.length);
  return new RegExp('^' + uuid + '/' + uuid + '\\.jpg$').test(path) && path.split('/')[0] === userId ? path : null;
}

export function safeAvatarURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    if (value.startsWith(publicPrefix) && new RegExp('^' + uuid + '/' + uuid + '\\.jpg$').test(value.slice(publicPrefix.length))) return value;
    if (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com')) return value;
  } catch { /* Missing/invalid image: use initials. */ }
  return '';
}

// Preserve the delivered square crop; re-encode to JPEG to discard file metadata.
export async function prepareAvatar(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elige una foto JPG, PNG o WebP.');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('La foto debe pesar como máximo 10 MB.');
  let image;
  try { image = await createImageBitmap(file); } catch { throw new Error('No se pudo leer la imagen. Prueba con otra foto.'); }
  try {
    if (!image.width || !image.height || image.width * image.height > 40000000) throw new Error('La imagen es demasiado grande. Elige una versión más pequeña.');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la foto.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 320, 320);
    const side = Math.min(image.width, image.height);
    ctx.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 0, 0, 320, 320);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .85));
    if (!blob) throw new Error('No se pudo preparar la foto.');
    return blob;
  } finally { image.close(); }
}

export function createAvatarStore(client, activeProfile) {
  const bucket = () => client.storage.from(AVATAR_BUCKET);
  async function discard(path) {
    if (!path) return true;
    try { const {error} = await bucket().remove([path]); return !error; } catch { return false; }
  }
  async function save(blob) {
    const profile = await activeProfile();
    if (!blob || blob.type !== 'image/jpeg' || !blob.size || blob.size > MAX_AVATAR_BYTES) throw new Error('La foto preparada debe ser JPG y pesar como máximo 2 MB.');
    const signature = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
    if (signature[0] !== 255 || signature[1] !== 216 || signature[2] !== 255) throw new Error('La imagen JPG no es válida.');
    const path = profile.user_id + '/' + crypto.randomUUID() + '.jpg';
    const {error: uploadError} = await bucket().upload(path, blob, {contentType:'image/jpeg', cacheControl:'3600', upsert:false});
    if (uploadError) throw new Error('No se pudo subir la foto. Tu foto anterior no cambió.');
    const url = publicPrefix + path;
    let result;
    try {
      result = await client.from('corredores').update({foto_url:url}).eq('id',profile.id).eq('user_id',profile.user_id).select('id,foto_url').single();
    } catch {
      // An interrupted request may have committed. Never delete a possibly referenced image.
      throw new Error('No pudimos confirmar el guardado. Recarga Mi cuenta antes de intentar nuevamente.');
    }
    if (result.error || !result.data) {
      // Supabase may return transport errors instead of throwing; commit is then unknown.
      if (!/^[0-9A-Z]{5}$/.test(result.error?.code || '')) throw new Error('No pudimos confirmar el guardado. Recarga Mi cuenta antes de intentar nuevamente.');
      await discard(path);
      throw new Error('No se pudo guardar la foto en tu perfil.');
    }
    const cleaned = await discard(ownAvatarPath(profile.foto_url, profile.user_id));
    return {url, cleanupPending:!cleaned};
  }
  async function remove() {
    const profile = await activeProfile();
    const result = await client.from('corredores').update({foto_url:null}).eq('id',profile.id).eq('user_id',profile.user_id).select('id,foto_url').single();
    if (result.error || !result.data) throw new Error('No se pudo quitar la foto de tu perfil.');
    const cleaned = await discard(ownAvatarPath(profile.foto_url, profile.user_id));
    return {url:null, cleanupPending:!cleaned};
  }
  return Object.freeze({save, remove});
}
