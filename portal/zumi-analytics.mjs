import {makeClient,backendFor} from './auth.mjs';
const $=id=>document.getElementById(id),fmt=new Intl.NumberFormat('es-CL');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const labels={home:'Inicio',arriendos:'Arriendos',ventas:'Ventas',ficha:'Fichas',parcelas:'Parcelas',proyectos:'Proyectos',propietario:'Propietarios',admin:'Administración',corredor:'Corredores',solicitud:'Solicitud de arriendo',simulador:'Simulador'};
let client;
function number(n){return fmt.format(Number(n)||0);}
function secs(ms){return ms==null?'—':(Number(ms)/1000).toLocaleString('es-CL',{maximumFractionDigits:2})+' s';}
function bars(el,rows,key,transform=x=>x){const max=Math.max(1,...rows.map(r=>Number(r.n)||0));el.innerHTML=rows.length?rows.map(r=>'<div class="row"><span>'+esc(transform(r[key]))+'</span><b>'+number(r.n)+'</b><div class="track"><span style="width:'+Math.min(100,100*Number(r.n)/max)+'%"></span></div></div>').join(''):'<p>Aún no hay datos para este período.</p>';}
async function load(){
 $('reload').disabled=true;$('status').textContent='Cargando estadísticas…';
 try{
  const {data,error}=await client.rpc('zumi_analytics',{p_days:Number($('days').value)});
  if(error||!data)throw Error('No pudimos consultar las estadísticas o tu cuenta no tiene permisos.');
  const t=data.totals||{},m=data.metrics||{},n=k=>number(t[k]),pct=(a,b)=>b?Math.round(100*a/b)+'%':'—';
  const rows=[['Sesiones de navegador',number(m.sessions)],['Aperturas por sección',n('conversation')],['Mensajes recibidos',n('message')],['Llamadas conectadas',n('call_connected')],['Intentos de llamada',n('call_attempt')],['Conexión de llamadas',pct(t.call_connected||0,t.call_attempt||0)],['Solicitudes de arriendo',n('rental_sent')],['Propietarios captados',n('owner_sent')],['Solicitudes de visita',n('visit_sent')],['Búsquedas sin resultado',n('search_empty')],['Fichas abiertas',n('property_view')],['Cotizadores abiertos',n('quote_open')],['WhatsApp abiertos',n('whatsapp_open')],['Formularios de arriendo abiertos',n('rental_open')],['Latencia media de voz',secs(m.avg_latency)],['Latencia P95',secs(m.p95_latency)],['Inicio del saludo',secs(m.greeting_latency)],['Duración media llamada',m.avg_call_duration==null?'—':number(m.avg_call_duration)+' s'],['Fallos de llamada',n('call_error')]];
  $('metrics').innerHTML=rows.map(([l,v])=>'<div class="card"><small>'+esc(l)+'</small><b>'+esc(v)+'</b></div>').join('');
  bars($('communes'),data.communes||[],'commune');bars($('sections'),data.sections||[],'section',s=>labels[s]||s);
  $('daysRows').innerHTML=(data.days||[]).map(r=>'<tr><td>'+esc(r.day)+'</td><td>'+number(r.chats)+'</td><td>'+number(r.calls)+'</td><td>'+number(r.leads)+'</td></tr>').join('')||'<tr><td colspan="4">Aún no hay actividad registrada.</td></tr>';
  $('status').textContent='';$('dash').hidden=false;
 }catch(e){$('status').textContent=e.message;}finally{$('reload').disabled=false;}
}
try{client=makeClient();const profile=await backendFor(client).activeProfile();if(profile.rol!=='admin')throw Error('Solo administradores de Corretaje Guzmán pueden acceder a este panel.');$('reload').onclick=load;$('days').onchange=load;await load();}catch(e){$('status').textContent=e.message+' Puedes ingresar desde el portal con tu cuenta autorizada.';}
