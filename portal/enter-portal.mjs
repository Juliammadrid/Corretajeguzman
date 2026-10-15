import { finishCallback, backendFor } from './auth.mjs';

// Keep the callback already authorized in Supabase; no new OAuth permissions.
export async function enterPortal(client, navigate = path => location.replace(path)) {
  await finishCallback(client);
  await backendFor(client).activeProfile();
  navigate('/portal/app.html#/inicio');
}
