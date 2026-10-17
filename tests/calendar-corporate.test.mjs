import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANY,CORPORATE,SCOPE,seal,unseal,hash,canConnect,eventForVisit,normalizeVisit,verifyEvent } from '../netlify/lib/calendar-core.mjs';
import { makeCalendarHandler } from '../netlify/lib/calendar-handler.mjs';
import { calendarLink } from '../portal/calendar-ui.mjs';

const origin='https://corretajeguzman.com',now=Date.parse('2026-10-16T12:00:00Z');
const actor={user:{id:'user-1',email:COMPANY,email_confirmed_at:'2026-01-01'},profile:{id:'broker-1',rol:'admin',estado:'activa',nombre:'Corredora'}};
const input={id:'12345678-1234-4123-8123-123456789abc',email:'candidate@example.com',cliente:'Cliente',propiedad_id:'recExample',propiedad_titulo:'Departamento',propiedad_direccion:'Dirección pública',fecha:'2026-10-20',hora:'18:30'};
const row=()=>normalizeVisit(input,actor,now);
function fixture({legacy=true,corporate=true,existing=null,marker=null,upstreamFailure=false,patchFailure=false,wrongIdentity=false}={}){
  const values=new Map(),events=new Map(),calls=[];
  const env={GOOGLE_CALENDAR_CLIENT_ID:'client',GOOGLE_CALENDAR_CLIENT_SECRET:'secret',SUPABASE_URL:'https://db.example',SUPABASE_PUBLISHABLE_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'private'};
  const context='calendar-credentials:'+origin;
  for(const [enabled,email,key] of [[legacy,COMPANY,'company-authorization'],[corporate,CORPORATE,'corporate-authorization']])if(enabled)values.set(key,seal({email,refreshToken:email,connectedAt:'2026-10-16'},'secret',context));
  const routeKey='visit-organizer/'+hash(actor.profile.id+'\0'+input.id);
  if(marker)values.set(routeKey,marker);
  let visit=existing,failPatch=patchFailure;
  const store={get:async key=>values.get(key)??null,set:async(key,value,opts={})=>{if(opts.onlyIfNew&&values.has(key))return {modified:false};values.set(key,value);return {modified:true};}};
  const fetcher=async(url,opts={})=>{
    calls.push({url,method:opts.method||'GET',body:opts.body});
    if(url.endsWith('/auth/v1/user'))return Response.json(actor.user);
    if(url.includes('/corredores?'))return Response.json([actor.profile]);
    if(url.includes('/visitas')){
      if(opts.method==='POST'){visit=JSON.parse(opts.body);return Response.json([visit],{status:201});}
      if(opts.method==='PATCH'){if(failPatch){failPatch=false;return new Response('',{status:503});}visit={...visit,...JSON.parse(opts.body)};return Response.json([visit]);}
      return Response.json(visit?[visit]:[]);
    }
    if(url==='https://oauth2.googleapis.com/token'){
      if(upstreamFailure)throw new Error('private upstream failure');
      return Response.json({access_token:opts.body.get('refresh_token')||CORPORATE,refresh_token:CORPORATE,scope:SCOPE});
    }
    if(url.includes('/userinfo'))return Response.json({email:wrongIdentity?'unrelated@example.com':opts.headers.Authorization.slice(7),email_verified:true});
    if(url.includes('/calendar/v3/')){
      const email=opts.headers.Authorization.slice(7);
      if(opts.method==='POST'){const event=JSON.parse(opts.body),saved={...event,organizer:{email}};events.set(email+'/'+event.id,saved);return Response.json(saved,{status:201});}
      const event=events.get(email+'/'+url.split('/').at(-1));return event?Response.json(event):new Response('',{status:404});
    }
    throw new Error('Unexpected mock URL');
  };
  const handler=makeCalendarHandler({getEnv:k=>env[k],storeFor:()=>store,fetcher,now:()=>now});
  const request=(action='visit',body=input)=>handler(new Request(origin+'/.netlify/functions/portal-calendar?action='+action,{method:action==='status'?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer session'},...(action==='status'?{}:{body:JSON.stringify(body)})}));
  return {request,handler,values,events,calls,routeKey};
}
test('only verified active administrators can authorize either corporate identity',()=>{
  assert.equal(canConnect({...actor.user,email:CORPORATE},actor.profile),true);
  assert.equal(canConnect({...actor.user,email:CORPORATE},{...actor.profile,rol:'corredor'}),false);
  assert.equal(canConnect({...actor.user,email_confirmed_at:null},actor.profile),false);
  assert.equal(canConnect({...actor.user,email:'other@example.com'},actor.profile),false);
});
test('legacy event IDs and links remain compatible; corporate events link to corporate calendar',()=>{
  const legacy=eventForVisit(row(),actor,origin),corporate=eventForVisit(row(),actor,origin,CORPORATE);
  assert.equal(legacy.id,hash(origin+'\0'+actor.profile.id+'\0'+input.id));
  assert.equal(corporate.id,'c0'+legacy.id);
  for(const [event,email] of [[legacy,COMPANY],[corporate,CORPORATE]])assert.equal(atob(new URL(calendarLink({gcal_event_id:event.id})).searchParams.get('eid')),event.id+' '+email);
});
test('corporate organizer is not invited as a guest and cannot be the candidate',()=>{
  const admin={...actor,user:{...actor.user,email:CORPORATE}};
  assert.deepEqual(eventForVisit(row(),admin,origin,CORPORATE).attendees,[{email:input.email}]);
  assert.throws(()=>normalizeVisit({...input,email:CORPORATE},actor,now,CORPORATE));
  const event=eventForVisit(row(),actor,origin,CORPORATE);
  assert.throws(()=>verifyEvent({...event,organizer:{email:COMPANY}},event,CORPORATE));
});
test('legacy stays active until corporate consent succeeds',async()=>{
  const f=fixture({corporate:false});const data=await (await f.request('status')).json();
  assert.equal(data.organizer,COMPANY);assert.equal(data.connectOrganizer,CORPORATE);assert.equal(data.connected,true);
  const auth=new URL((await (await f.request('connect')).json()).url);
  assert.equal(auth.searchParams.get('login_hint'),CORPORATE);
});
test('new visits use corporate authorization and route before creating event',async()=>{
  const f=fixture();const response=await f.request();assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.calendarConfirmed,true);
  assert.equal(result.visit.gcal_event_id.length,66);assert.equal(f.values.get(f.routeKey),CORPORATE);
  assert.equal([...f.events.values()][0].organizer.email,CORPORATE);
});
test('legacy pending visits remain on original calendar after corporate connection',async()=>{
  const f=fixture({existing:row()});assert.equal((await f.request('visit',{id:input.id})).status,200);
  assert.equal([...f.events.values()][0].organizer.email,COMPANY);
});
test('corporate retry recovers accepted event without a second invitation',async()=>{
  const f=fixture({patchFailure:true});assert.equal((await f.request()).status,502);
  assert.equal((await f.request('visit',{id:input.id})).status,200);
  assert.equal(f.calls.filter(c=>c.url.includes('sendUpdates=all')).length,1);
});
test('legacy accepted event is recovered without re-sending after migration',async()=>{
  const f=fixture({existing:row()});const event=eventForVisit(row(),actor,origin);
  f.events.set(COMPANY+'/'+event.id,{...event,organizer:{email:COMPANY}});
  assert.equal((await f.request('visit',{id:input.id})).status,200);
  assert.equal(f.calls.filter(c=>c.url.includes('sendUpdates=all')).length,0);
});
test('missing legacy credential never copies an existing visit to corporate calendar',async()=>{
  const f=fixture({legacy:false,existing:row()});assert.equal((await f.request('visit',{id:input.id})).status,409);assert.equal(f.events.size,0);
});
test('external failures and mismatched Google identity send no invitations',async()=>{
  for(const options of [{upstreamFailure:true},{wrongIdentity:true}]){
    const f=fixture(options),response=await f.request();assert.ok(response.status>=400);
    assert.equal(f.events.size,0);assert.doesNotMatch(await response.text(),/private upstream failure|refresh_token/);
  }
});
test('OAuth callback preserves legacy credential and stores only verified corporate authorization',async()=>{
  const f=fixture({corporate:false}),legacy=f.values.get('company-authorization');
  const state=seal({state:'nonce',expires:now+60000,authorization:'Bearer session',verifier:'verifier'},'secret','calendar-state:'+origin);
  const r=await f.handler(new Request(origin+'/.netlify/functions/portal-calendar?action=callback&state=nonce&code=test',{headers:{Cookie:'__Host-cg-calendar='+state}}));
  assert.equal(r.status,303);assert.equal(f.values.get('company-authorization'),legacy);
  assert.equal(unseal(f.values.get('corporate-authorization'),'secret','calendar-credentials:'+origin).email,CORPORATE);
});
test('wrong OAuth account does not replace either authorization',async()=>{
  const f=fixture({corporate:false,wrongIdentity:true}),legacy=f.values.get('company-authorization');
  const state=seal({state:'nonce',expires:now+60000,authorization:'Bearer session',verifier:'verifier'},'secret','calendar-state:'+origin);
  const r=await f.handler(new Request(origin+'/.netlify/functions/portal-calendar?action=callback&state=nonce&code=test',{headers:{Cookie:'__Host-cg-calendar='+state}}));
  assert.equal(r.status,403);assert.equal(f.values.get('company-authorization'),legacy);assert.equal(f.values.has('corporate-authorization'),false);
});
