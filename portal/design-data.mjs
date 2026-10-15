import { makeClient, finishCallback, backendFor } from './auth.mjs';
import { createAvatarStore, safeAvatarURL } from './avatars.mjs';
import { createFinanceData } from './finance-data.mjs';

export const prospectFromDB = p => ({...p, creado:p.creado?.slice(0,10), owner:p.corredor_id, tel:p.telefono,
  rentaTotal:p.renta_total, pieMonto:p.pie_monto});
export const visitFromDB = v => ({...v, owner:v.corredor_id, prop:v.propiedad_id,
  tel:v.telefono, hora:v.hora.slice(0,5)});
export function createDesignData(client) {
  const api = backendFor(client);
  const avatars = createAvatarStore(client, api.activeProfile);
  return {
    ...createFinanceData(client, api.activeProfile),
    async calendar(action='status',body) {
      const {data,error}=await client.auth.getSession();
      if(error||!data?.session?.access_token)throw new Error('Inicia sesión para continuar.');
      const response=await fetch('/.netlify/functions/portal-calendar?action='+encodeURIComponent(action),{
        method:action==='status'?'GET':'POST',credentials:'same-origin',
        headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},
        body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(60000)});
      let result;try{result=await response.json();}catch{throw new Error('Calendar está disponible en el portal de prueba publicado, no en el servidor local simple.');}
      if(!response.ok)throw new Error(result.error||'No se pudo completar la operación con Calendar.');
      return result;
    },
    saveAvatar: avatars.save,
    removeAvatar: avatars.remove,
    async load() {
      const x = await api.snapshot();
      return { me:{...x.profile,tel:x.profile.telefono}, state:{
        prospects:x.prospects.map(prospectFromDB), visits:x.visits.map(visitFromDB),
        brokers:x.brokers, pagos:x.payments.map(p=>({...p,owner:p.corredor_id})),
        fotos:Object.fromEntries(x.brokers.filter(b=>safeAvatarURL(b.foto_url)).map(b=>[b.id,safeAvatarURL(b.foto_url)])),
        cal:x.profile.calendar_conectado
      }};
    },
    async saveProspect(p,id,accepted) {
      return prospectFromDB(await api.saveProspect({...p, telefono:p.tel,
        renta_total:p.rentaTotal,pie_monto:p.pieMonto,acepta:accepted},id));
    },
    async properties() {
      // Local session supplies a token, but the function independently verifies it.
      const {data,error}=await client.auth.getSession();
      if(error||!data?.session?.access_token)throw new Error('Inicia sesión para ver propiedades.');
      const response=await fetch('/.netlify/functions/portal-properties',{
        headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store',signal:AbortSignal.timeout(45000)});
      if(!response.ok)throw new Error('La conexión privada de propiedades aún no está disponible.');
      const result=await response.json();
      if(!Array.isArray(result.properties))throw new Error('Respuesta de propiedades inválida.');
      return result.properties;
    },
    async logout() {
      const {error}=await client.auth.signOut({scope:'local'});
      if(error)throw new Error('No se pudo cerrar sesión. Inténtalo nuevamente.');
    }
  };
}
export async function connectDesign() {
  const client=makeClient(); await finishCallback(client);
  const api=createDesignData(client);
  return { api, ...(await api.load()) };
}
