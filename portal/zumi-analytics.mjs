import {makeClient,backendFor,googleSignIn} from './auth.mjs';
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
let control,notes={},currentNote='home',dirty=false;
function configStatus(message){document.querySelectorAll('[data-config-status]').forEach(e=>e.textContent=message);}
function snapshotNote(){if(control)notes[currentNote]=$('noteText').value.trim().slice(0,1200);}
function renderConfig(c){control=c;notes={...c.notes};$('greeting').value=c.greeting;$('tone').value=c.tone;$('voice').value=c.voice;$('duration').value=String(c.max_call_seconds);$('callsEnabled').checked=c.calls_enabled;$('analyticsEnabled').checked=c.analytics_enabled;$('noteText').value=notes[currentNote]||'';$('revision').textContent='Revisión '+c.revision+' · '+new Date(c.updated_at).toLocaleString('es-CL');dirty=false;}
async function getConfig(){try{const {data,error}=await client.from('zumi_control').select('*').eq('id',1).single();if(error||!data)throw Error('No se pudo leer la configuración.');renderConfig(data);configStatus('Configuración guardada cargada.');}catch(e){configStatus(e.message);}}
async function saveConfig(){
 if(!control){configStatus('Primero carga la configuración.');return;}snapshotNote();const greeting=$('greeting').value.trim();if(greeting.length<5||greeting.length>100){configStatus('El saludo debe tener entre 5 y 100 caracteres.');return;}
 const payload={greeting,tone:$('tone').value,voice:$('voice').value,max_call_seconds:Number($('duration').value),calls_enabled:$('callsEnabled').checked,analytics_enabled:$('analyticsEnabled').checked,notes:Object.fromEntries(Object.entries(notes).filter(([k,v])=>Object.hasOwn(labels,k)&&v)),revision:control.revision+1,updated_at:new Date().toISOString()};
 const buttons=[...document.querySelectorAll('[data-save]')];buttons.forEach(b=>b.disabled=true);configStatus('Guardando…');
 try{const {data,error}=await client.from('zumi_control').update(payload).eq('id',1).eq('revision',control.revision).select('*').maybeSingle();if(error)throw Error('No se pudieron guardar los cambios.');if(!data)throw Error('La configuración cambió en otra sesión. Recarga antes de guardar.');renderConfig(data);configStatus('Guardado. Se aplicará a nuevas conversaciones tras actualizar la configuración.');}catch(e){configStatus(e.message);}finally{buttons.forEach(b=>b.disabled=false);}
}
async function loadUsage(){ $('usageStatus').textContent='Consultando consumo…';try{const {data,error}=await client.rpc('zumi_usage',{p_days:Number($('usageDays').value)});if(error||!data)throw Error('No se pudo consultar el consumo.');const t=data.text||{},v=data.voice||{};const entries=[['Consultas IA de texto',t.requests],['Tokens de entrada (texto)',t.input],['Tokens de salida (texto)',t.output],['Tokens de entrada (audio)',v.voice_input_audio],['Tokens de salida (audio)',v.voice_output_audio],['Tokens de texto en llamadas (entrada)',v.voice_input_text],['Tokens de texto en llamadas (salida)',v.voice_output_text]];$('usageMetrics').innerHTML=entries.map(([l,n])=>'<div class="card"><small>'+esc(l)+'</small><b>'+number(n)+'</b></div>').join('');$('usageStatus').textContent='';}catch(e){$('usageStatus').textContent=e.message;}}
async function loadLeads(){
 $('loadLeads').disabled=true;$('leadsStatus').textContent='Consultando Airtable…';
 try{const {data:{session}}=await client.auth.getSession();if(!session)throw Error('Inicia sesión nuevamente.');const r=await fetch('/.netlify/functions/zumi-admin-leads',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});if(!r.ok)throw Error('No se pudieron consultar las solicitudes.');const body=await r.json(),groups=body.groups||[],records=groups.flatMap(g=>g.records||[]).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $('leadRows').innerHTML=records.map(x=>'<tr><td><a href="'+esc(x.link)+'" target="_blank" rel="noopener">'+esc(x.name||'Sin nombre')+'</a></td><td>'+esc(x.kind)+'</td><td>'+esc(x.commune)+'</td><td>'+(x.amount==null?'—':'$'+number(x.amount))+'</td><td>'+esc(x.detail)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.source)+'</td><td>'+esc(String(x.date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="8">No hay solicitudes en esta consulta.</td></tr>';
 $('leadsStatus').textContent=groups.some(x=>x.error)?'Una o más tablas no respondieron. Se muestran los datos disponibles.':records.length+' registros recientes (máximo 25 por tabla).';
 }catch(e){$('leadsStatus').textContent=e.message;}finally{$('loadLeads').disabled=false;}
}
function tab(name){document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==name);document.querySelectorAll('[data-tab]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.tab===name)));if(name==='leads')void loadLeads();if(name==='usage')void loadUsage();}
$('noteSection').innerHTML=Object.entries(labels).map(([k,l])=>'<option value="'+k+'">'+esc(l)+'</option>').join('');
$('noteSection').onchange=()=>{snapshotNote();currentNote=$('noteSection').value;$('noteText').value=notes[currentNote]||'';};
document.querySelectorAll('[data-save]').forEach(b=>b.onclick=saveConfig);document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('reloadConfig').onclick=()=>{if(!dirty||confirm('¿Descartar cambios sin guardar?'))void getConfig();};
document.querySelectorAll('.settings input,.settings textarea,.settings select').forEach(e=>e.addEventListener('input',()=>{dirty=true;configStatus('Cambios sin guardar.');}));
$('loadLeads').onclick=loadLeads;$('reloadUsage').onclick=loadUsage;$('usageDays').onchange=loadUsage;
try{client=makeClient();const profile=await backendFor(client).activeProfile();if(profile.rol!=='admin')throw Error('Solo administradores de Corretaje Guzmán pueden acceder a este panel.');$('center').hidden=false;$('reload').onclick=load;$('days').onchange=load;await Promise.all([load(),getConfig()]);}catch(e){$('status').textContent=e.message;$('loginBox').hidden=false;$('googleLogin').onclick=async()=>{try{await googleSignIn(client||makeClient());}catch(err){$('status').textContent=err.message;}};}
