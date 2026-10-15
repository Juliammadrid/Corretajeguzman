import { randomBytes, createHash } from 'node:crypto';
import { COMPANY,SCOPE,CalendarError,fail,hash,seal,unseal,canConnect,normalizeVisit,eventForVisit,verifyEvent } from './calendar-core.mjs';

const COOKIE='__Host-cg-calendar';
const PATH='/.netlify/functions/portal-calendar';
const ORIGINS=['https://portal-prueba--webcorretajeguzman.netlify.app','https://corretajeguzman.com'];
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
const cookie=(value,age=600)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;

export function makeCalendarHandler({getEnv,storeFor,fetcher=fetch,now=()=>Date.now()}={}){
 return async request=>{
  const url=new URL(request.url),origin=url.origin,action=url.searchParams.get('action')||'status';
  let callback=action==='callback';
  try{
    if(!ORIGINS.includes(origin))fail('Abre el portal de prueba o el sitio autorizado.',403);
    if(request.method!==(callback||action==='status'?'GET':'POST'))fail('Método no permitido.',405);
    if(request.method==='POST'&&request.headers.get('origin')!==origin)fail('Origen no permitido.',403);
    const clientId=getEnv('GOOGLE_CALENDAR_CLIENT_ID'),secret=getEnv('GOOGLE_CALENDAR_CLIENT_SECRET');
    const configured=!!clientId&&!!secret;
    const serviceKey=getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const sb=getEnv('SUPABASE_URL'),key=getEnv('SUPABASE_PUBLISHABLE_KEY');
    if(!sb||!key)fail('La conexión del servidor está pendiente.',503);
    const fetchTimed=(url,opts={})=>fetcher(url,{...opts,signal:AbortSignal.timeout(10000)});
    async function actorFor(authorization){
      if(!/^Bearer [^\s]+$/.test(authorization||''))fail('Inicia sesión nuevamente.',401);
      const dbHeaders={apikey:key,Authorization:authorization};
      const r=await fetchTimed(sb+'/auth/v1/user',{headers:dbHeaders});
      if(!r.ok)fail('Sesión vencida. Ingresa nuevamente.',401);
      const user=await r.json();if(!user.id||!user.email||!user.email_confirmed_at)fail('Cuenta sin correo verificado.',403);
      const p=await fetchTimed(sb+'/rest/v1/corredores?select=id,nombre,email,rol,estado&user_id=eq.'+encodeURIComponent(user.id),{headers:dbHeaders});
      if(!p.ok)fail('No se pudo verificar tu cuenta.',403);
      const profiles=await p.json(),profile=profiles.find(p=>p.estado==='activa');
      if(!profile)fail('Tu cuenta no está activa.',403);
      return {user,profile,dbHeaders};
    }
    const redirect=result=>new Response(null,{status:303,headers:{...headers,Location:origin+'/portal/app.html?calendar='+result+'#/cuenta','Set-Cookie':cookie('',0)}});
    const store=()=>storeFor('portal-calendar-'+hash(origin).slice(0,16));
    const context='calendar-credentials:'+origin;
    async function stored(){
      const value=await store().get('company-authorization');if(!value)return null;
      // Rotating the OAuth client secret invalidates old encrypted authorization;
      // allow the administrator to reconnect without exposing or reusing it.
      try{return unseal(value,secret,context);}catch{return null;}
    }
    async function tokenRequest(params){
      const r=await fetchTimed('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:secret,...params})});
      if(!r.ok)fail('La autorización de Calendar venció o fue revocada. Administración debe reconectarla.',409);
      const data=await r.json();if(!data.access_token)fail('Google no entregó autorización válida.',502);return data;
    }
    async function googleIdentity(accessToken){
      const r=await fetchTimed('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+accessToken}});
      if(!r.ok)fail('No se pudo verificar la cuenta de Google.',502);
      const u=await r.json();
      if(!u.email_verified||u.email?.toLowerCase()!==COMPANY)fail('Debes elegir la cuenta '+COMPANY+'.',403);
    }
    if(callback){
      if(!configured)fail('Falta configurar Calendar.',503);
      const raw=(request.headers.get('cookie')||'').split('; ').find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
      let state;try{state=unseal(raw||'',secret,'calendar-state:'+origin);}catch{fail('Autorización expirada. Vuelve al portal y pulsa Conectar.',400);}
      if(!state.state||state.state!==url.searchParams.get('state')||state.expires<now())fail('Autorización expirada. Vuelve a conectar.',400);
      const actor=await actorFor(state.authorization);
      if(!canConnect(actor.user,actor.profile))fail('Solo administración puede conectar el calendario de la empresa.',403);
      if(url.searchParams.has('error'))return redirect('cancelled');
      const code=url.searchParams.get('code');if(!code)fail('Google no devolvió un código.',400);
      const token=await tokenRequest({code,grant_type:'authorization_code',redirect_uri:origin+PATH+'?action=callback',code_verifier:state.verifier});
      if(!token.scope?.split(' ').includes(SCOPE)||!token.refresh_token)fail('Autoriza Calendar y el acceso sin conexión para continuar.',400);
      await googleIdentity(token.access_token);
      await store().set('company-authorization',seal({refreshToken:token.refresh_token,email:COMPANY,connectedAt:new Date(now()).toISOString(),connectedBy:actor.user.id},secret,context));
      return redirect('connected');
    }
    const actor=await actorFor(request.headers.get('authorization'));
    if(action==='status'){
      let connection=null;if(configured)connection=await stored();
      return json({configured,visitConfigured:!!serviceKey,connected:!!connection,organizer:COMPANY,canConnect:canConnect(actor.user,actor.profile),connectedAt:connection?.connectedAt||null});
    }
    if(!configured)fail('Falta configurar las credenciales de Google Calendar en Netlify. Administración debe completar ese paso.',503);
    if(action==='connect'){
      if(!canConnect(actor.user,actor.profile))fail('Solo el administrador '+COMPANY+' puede conectar Calendar.',403);
      const state=randomBytes(24).toString('base64url'),verifier=randomBytes(32).toString('base64url');
      const payload=seal({state,verifier,expires:now()+600000,authorization:request.headers.get('authorization')},secret,'calendar-state:'+origin);
      if(payload.length>3700)fail('La sesión es demasiado grande. Contacta a administración.',400);
      const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      auth.search=new URLSearchParams({client_id:clientId,redirect_uri:origin+PATH+'?action=callback',response_type:'code',scope:'openid email '+SCOPE,access_type:'offline',prompt:'consent select_account',state,login_hint:COMPANY,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
      return json({url:auth.href},200,{'Set-Cookie':cookie(payload)});
    }
    if(action!=='visit')fail('Acción no disponible.',404);
    if(!serviceKey)fail('Falta configurar el acceso privado del servidor para guardar la confirmación de Calendar.',503);
    // Reads use the caller's RLS. Narrow writes use server credentials ONLY AFTER
    // verified identity/active profile, fixed ownership and field allowlisting.
    // Do not grant clients write access to gcal_event_id or a chosen record ID.
    const writeHeaders={apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json',Prefer:'return=representation'};
    const connection=await stored();if(!connection)fail('Administración debe conectar el calendario de Corretaje Guzmán primero.',409);
    const raw=await request.text();if(raw.length>10000)fail('Formulario demasiado grande.',413);
    let body;try{body=JSON.parse(raw);}catch{fail('Formulario inválido.');}
    if(!/^[0-9a-f-]{36}$/i.test(body.id||''))fail('Visita inválida.');
    const query='id=eq.'+encodeURIComponent(body.id)+'&corredor_id=eq.'+encodeURIComponent(actor.profile.id);
    const select=()=>fetchTimed(sb+'/rest/v1/visitas?select=*&'+query,{headers:actor.dbHeaders});
    let existing=await select();if(!existing.ok)fail('No se pudo consultar Mis visitas.',502);
    let visit=(await existing.json())[0];
    // Validate before writing. On a retry the persisted row, not changed input, is authoritative.
    const candidate=visit||normalizeVisit(body,actor,now());
    const token=await tokenRequest({grant_type:'refresh_token',refresh_token:connection.refreshToken});
    await googleIdentity(token.access_token);
    if(!visit){
      const insert=await fetchTimed(sb+'/rest/v1/visitas',{method:'POST',headers:writeHeaders,body:JSON.stringify(candidate)});
      if(insert.status===409){existing=await select();if(!existing.ok)fail('No se pudo recuperar la visita.',502);visit=(await existing.json())[0];}
      else if(insert.ok)visit=(await insert.json())[0];
      if(!visit)fail('No se pudo guardar la visita. No se enviaron invitaciones.',502);
    }
    const event=eventForVisit(visit,actor,origin),endpoint='https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const googleHeaders={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
    // Deterministic IDs make retries safe even if Google accepted the first request but our response was lost.
    let lookup=await fetchTimed(endpoint+'/'+event.id,{headers:googleHeaders}),saved;
    if(lookup.ok){saved=await lookup.json();verifyEvent(saved,event);}
    else if(lookup.status===404){
      // Existing pending rows may be retried later. Do not issue invitations for
      // past visits; an already-created event is still recovered by the lookup above.
      if(Date.parse(event.start.dateTime)<=now())fail('Esta visita ya pasó y no tiene evento en Calendar. Revísala con administración.',409);
      const insert=await fetchTimed(endpoint+'?sendUpdates=all',{method:'POST',headers:googleHeaders,body:JSON.stringify(event)});
      if(insert.status===409){lookup=await fetchTimed(endpoint+'/'+event.id,{headers:googleHeaders});if(lookup.ok)saved=await lookup.json();}
      else if(insert.ok)saved=await insert.json();
      if(!saved)fail('Visita guardada, pero Calendar no confirmó el envío. Reintenta desde Mis visitas; no crees otra.',502);
      verifyEvent(saved,event);
    }else fail('Visita guardada, pero Calendar no respondió. Reintenta desde Mis visitas.',502);
    const update=await fetchTimed(sb+'/rest/v1/visitas?'+query,{method:'PATCH',headers:writeHeaders,body:JSON.stringify({gcal_event_id:event.id})});
    if(!update.ok)fail('Google creó la invitación, pero falta actualizar Mis visitas. Reintenta la misma visita para sincronizarla.',502);
    const updated=(await update.json())[0];
    if(!updated)fail('Google creó la invitación, pero la visita ya no está en el portal. Contacta a administración.',409);
    return json({visit:updated,calendarConfirmed:true});
  }catch(error){
    const message=error instanceof CalendarError?error.message:'No se pudo completar la conexión. Si estabas agendando, revisa Mis visitas y reintenta la misma visita.';
    // Never serialize upstream responses, tokens, OAuth codes, or personal form data.
    return json({error:message},error instanceof CalendarError?error.status:502,callback?{'Set-Cookie':cookie('',0)}:{});
  }
 };
}
