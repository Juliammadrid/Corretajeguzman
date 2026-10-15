import { SUPABASE_URL, SUPABASE_KEY, callbackFor } from './config.mjs';
import { createPortalBackend } from './backend.mjs';

export function makeClient() {
  if (!globalThis.supabase?.createClient) throw new Error('No se pudo cargar la conexión segura. Recarga la página.');
  return globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
      storage: sessionStorage, storageKey: 'cg-portal-auth', autoRefreshToken: true }
  });
}

export async function finishCallback(client, url = new URL(location.href)) {
  const code = url.searchParams.get('code');
  const failed = url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error');
  if (code || failed) {
    // OAuth values must not remain in the address bar, browser history or outgoing links.
    history.replaceState(null, '', url.pathname);
  }
  if (failed) throw new Error('Google no completó el ingreso. Vuelve a intentarlo con tu cuenta de prueba.');
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw new Error('No se pudo completar el ingreso. Abre el login e inténtalo nuevamente en esta misma pestaña.');
  }
}

export async function googleSignIn(client, origin = location.origin) {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: callbackFor(origin), scopes: 'openid email profile',
      queryParams: { prompt: 'select_account' } }
  });
  if (error) throw new Error('No pudimos iniciar la conexión con Google. Inténtalo nuevamente.');
}

export function backendFor(client) { return createPortalBackend(client); }
