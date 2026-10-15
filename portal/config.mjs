// Publishable key only. Authorization is enforced by Supabase RLS, never by this file.
export const SUPABASE_URL = 'https://aoemvstjbwvkoqjoirsx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_W0jdkGh4ZfYsd-5C5WcHpA_vDDMEw2u';
export const LOCAL_ORIGIN = 'http://127.0.0.1:8767';
export const PUBLIC_ORIGIN = 'https://corretajeguzman.com';
export const PREVIEW_ORIGIN = 'https://portal-prueba--webcorretajeguzman.netlify.app';

export function callbackFor(origin) {
  if (origin === LOCAL_ORIGIN) return `${origin}/portal/auth-check.html`;
  if (origin === PREVIEW_ORIGIN) return `${origin}/portal/auth-check.html`;
  if (origin === PUBLIC_ORIGIN) return `${origin}/portal/app.html`;
  throw new Error('Este origen no está autorizado para iniciar sesión.');
}
