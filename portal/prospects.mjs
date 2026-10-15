import { makeClient, finishCallback, backendFor } from './auth.mjs';
import { matchProspect } from './matching.mjs';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf = new Intl.NumberFormat('es-CL',{maximumFractionDigits:2});
const money = value => '$' + Math.round(value).toLocaleString('es-CL');
const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('');
const statusNames = {nuevo:'Nuevo',contactado:'Contactado',interesado:'Interesado',no:'No interesado'};
const matchNames = {posible:'Posible match · renta y pie cubiertos',revisar:'Requiere revisar antecedentes',requiere_pie:'Dentro del rango por renta · falta pie',sobre_renta:'Sobre el rango de renta',incompleto:'Faltan datos para estimar'};
let client, api, profile, catalog, prospects = [], previousFocus;
let search = '', state = '', busy = false;
const assumptions = {};
const notice = '<p class="portal-notice">Prueba local · Prospectos y matches conectados. Arriendos, Calendar y pagos aún pendientes de integración. Sin deploy.</p>';
function errorPage(message) {
  $('view').innerHTML = `<div class="empty"><p>${esc(message)}</p><a class="btn btn-p" href="/portal/">Volver al ingreso</a></div>`;
  $('fab').classList.add('hide');
}
function openDrawer(title, body, footer='') {
  previousFocus = document.activeElement;
  $('dTitle').textContent = title; $('dBody').innerHTML = body; $('dFoot').innerHTML = footer;
  $('drawer').classList.add('on'); $('scrim').classList.add('on');
  $('drawer').setAttribute('aria-hidden','false'); $('drawer').setAttribute('role','dialog');
  $('drawer').setAttribute('aria-modal','true'); $('drawer').setAttribute('aria-labelledby','dTitle');
  document.body.style.overflow='hidden'; $('dClose').focus();
}
function closeDrawer() {
  if (busy) return;
  $('drawer').classList.remove('on'); $('scrim').classList.remove('on');
  $('drawer').setAttribute('aria-hidden','true'); document.body.style.overflow='';
  if (previousFocus?.isConnected) previousFocus.focus();
}
$('dClose').textContent='×'; $('fab').textContent='+';
$('dClose').addEventListener('click',closeDrawer); $('scrim').addEventListener('click',closeDrawer);
document.addEventListener('keydown',event=>{
  if ($('drawer').getAttribute('aria-hidden')!=='false') return;
  if(event.key==='Escape') closeDrawer();
  if(event.key==='Tab') {
    const targets=[...$('drawer').querySelectorAll('a[href],button,input,select,textarea')].filter(el=>!el.disabled && el.getClientRects().length);
    const first=targets[0], last=targets.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
});
$('avBtn').addEventListener('click',()=> $('avMenu').classList.toggle('open'));
$('logout').addEventListener('click',async()=>{
  const {error}=await client.auth.signOut({scope:'local'});
  if(error){errorPage('No se pudo cerrar sesión. Inténtalo nuevamente.');return;}
  location.replace('/portal/');
});
$('fab').addEventListener('click',()=>editProspect());

function chrome() {
  const html='<a href="#/prospectos" class="on">Prospectos</a><a href="#/cuenta">Mi cuenta</a>';
  $('nav').innerHTML=html; $('tabbar').innerHTML=html;
  $('avTop').textContent=initials(profile.nombre); $('avName').textContent=profile.nombre;
  $('avMail').textContent=profile.email; $('roleTag').textContent=profile.rol==='admin'?'Administrador':'Corredor';
}
function route() {
  closeDrawer(); $('avMenu').classList.remove('open');
  const account=location.hash==='#/cuenta'; $('fab').classList.toggle('hide',account);
  if(account){
    $('view').innerHTML=notice+`<h1>Mi cuenta</h1><div class="account-panel"><h2>${esc(profile.nombre)}</h2><p>${esc(profile.email)}</p><p>${profile.rol==='admin'?'Administrador':'Corredor'} · Cuenta activa</p><p>Tu sesión está validada con Google. No se almacenan prospectos en este navegador.</p><a class="btn btn-p" href="#/prospectos">Ver prospectos</a></div>`;
  } else renderList();
}
function renderList() {
  $('view').innerHTML=notice+`<div class="page-head"><h1>Prospectos</h1><p>Tu cartera y sus posibles matches con departamentos en venta.</p></div>
    <div class="match-toolbar"><input id="search" aria-label="Buscar prospectos" placeholder="Buscar nombre, teléfono o correo…" value="${esc(search)}"><select id="state" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${Object.entries(statusNames).map(([k,v])=>`<option value="${k}" ${state===k?'selected':''}>${v}</option>`).join('')}</select><button class="btn btn-p" id="add">Agregar prospecto</button><button class="btn btn-g" id="reload">Actualizar</button></div><p id="listSummary" role="status"></p><div class="prospect-grid" id="prospectList"></div>`;
  $('search').addEventListener('input',e=>{search=e.target.value;drawList();});
  $('state').addEventListener('change',e=>{state=e.target.value;drawList();});
  $('add').addEventListener('click',()=>editProspect());
  $('reload').addEventListener('click',async()=>{
    $('reload').disabled=true;
    try{prospects=await api.listProspects();drawList();}
    catch(e){$('listSummary').textContent=e.message;}
    finally{if($('reload'))$('reload').disabled=false;}
  }); drawList();
}
function drawList(){
  const term=search.toLocaleLowerCase('es');
  const list=prospects.filter(p=>(!state || p.estado===state) && [p.nombre,p.telefono,p.email].some(x=>String(x||'').toLocaleLowerCase('es').includes(term)));
  $('listSummary').textContent=`${list.length} prospectos${profile.rol==='admin'?' · Vista administrativa de todas las carteras':''}`;
  $('prospectList').innerHTML=list.length?list.map(p=>{
    const result=matchProspect(p,catalog,catalog.config);
    return `<article class="prospect-card"><span class="badge b-v">${statusNames[p.estado] || 'Nuevo'}</span><h2>${esc(p.nombre)}</h2><p>${esc(p.telefono)}</p><p>Renta ${money(result.income)}${p.complementa?' · total complementada':''}</p><p>${result.missing.length?'Datos pendientes':result.possible+' posibles matches'}</p><div class="prospect-actions"><button class="btn btn-p btn-sm" data-match="${esc(p.id)}">Ver oportunidades</button><button class="btn btn-g btn-sm" data-edit="${esc(p.id)}">Editar</button></div></article>`;
  }).join(''):'<div class="empty">No hay prospectos con estos filtros. Agrega un cliente con su autorización para evaluar posibles matches.</div>';
  $('prospectList').querySelectorAll('[data-match]').forEach(b=>b.addEventListener('click',()=>showMatch(b.dataset.match)));
  $('prospectList').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editProspect(b.dataset.edit)));
}
const field=(label,name,value='',type='text',extra='')=>`<div class="f"><label for="p-${name}">${label}</label><input id="p-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const select=(label,name,options,value)=>`<div class="f"><label for="p-${name}">${label}</label><select id="p-${name}" name="${name}">${options.map(([k,v])=>`<option value="${esc(k)}" ${String(value??'')===String(k)?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`;
function editProspect(id) {
  const p=id?prospects.find(x=>x.id===id):{dicom:'nosabe',estado:'nuevo',destino_compra:'primera'};
  if(!p)return;
  const communes=[...new Set(catalog.projects.map(x=>x.commune))].sort();
  if(p.comuna_preferida && !communes.includes(p.comuna_preferida))communes.push(p.comuna_preferida);
  openDrawer(id?'Editar prospecto':'Agregar prospecto',`<form id="pForm" class="fgrid">
    ${field('Nombre completo','nombre',p.nombre,'text','required maxlength="160"')}
    ${field('Teléfono','telefono',p.telefono,'tel','required minlength="8" maxlength="30"')}
    ${field('Correo (opcional)','email',p.email,'email','maxlength="254"')}
    ${field('Renta líquida mensual (CLP)','renta',p.renta,'number','required min="0" step="1"')}
    ${select('¿Complementa renta?','complementa',[['no','No'],['si','Sí']],p.complementa?'si':'no')}
    ${field('Renta TOTAL complementada (CLP)','renta_total',p.renta_total,'number','min="0" step="1"')}
    ${select('Antecedentes DICOM declarados','dicom',[['nosabe','Por confirmar'],['limpio','Sin observaciones'],['obs','Con observaciones']],p.dicom)}
    ${select('¿Tiene pie disponible?','pie',[['no','No'],['si','Sí']],p.pie?'si':'no')}
    ${field('Monto disponible para el pie (CLP)','pie_monto',p.pie_monto,'number','min="0" step="1"')}
    ${select('Estado','estado',Object.entries(statusNames),p.estado)}
    ${select('Comuna preferida','comuna_preferida',[['','Sin preferencia'],...communes.map(x=>[x,x])],p.comuna_preferida)}
    ${select('Dormitorios mínimos','dormitorios_min',[['','Sin preferencia'],[0,'Studio o más'],[1,'1 o más'],[2,'2 o más'],[3,'3 o más'],[4,'4 o más']],p.dormitorios_min)}
    ${select('Destino de compra','destino_compra',[['primera','Primera vivienda'],['inversion','Inversión'],['segunda','Segunda vivienda']],p.destino_compra)}
    <div class="f full"><label for="p-notas">Notas</label><textarea id="p-notas" name="notas" maxlength="5000">${esc(p.notas)}</textarea></div>
    ${id?'':'<label class="f full acepta"><span class="ac-row"><input name="acepta" type="checkbox" required><span>El cliente autorizó compartir sus datos con Corretaje Guzmán según la <a href="/politica-de-privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</span></span></label>'}
    <p class="f full form-error" id="formError" role="alert"></p></form>`,
    '<button class="btn btn-g" id="cancelEdit">Cancelar</button><button type="submit" form="pForm" class="btn btn-p" id="saveProspect">Guardar y ver matches</button>');
  const form=$('pForm');
  const depend=()=>{
    for(const [toggle,name] of [['complementa','renta_total'],['pie','pie_monto']]){
      const active=form.elements[toggle].value==='si';
      form.elements[name].disabled=!active;form.elements[name].required=active;
      form.elements[name].closest('.f').hidden=!active;
    }
  };
  form.elements.complementa.addEventListener('change',depend);form.elements.pie.addEventListener('change',depend);depend();
  $('cancelEdit').addEventListener('click',closeDrawer);
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy || !form.reportValidity())return;
    const input=Object.fromEntries(new FormData(form));
    input.complementa=input.complementa==='si';input.pie=input.pie==='si';input.acepta=form.elements.acepta?.checked===true;
    busy=true; $('saveProspect').disabled=true; $('dClose').disabled=true; $('formError').textContent='Guardando…';
    try{
      const saved=await api.saveProspect(input,id);
      prospects=[saved,...prospects.filter(x=>x.id!==saved.id)];
      busy=false; $('dClose').disabled=false;
      if(location.hash!=='#/prospectos') history.replaceState(null,'','#/prospectos');
      renderList();showMatch(saved.id,'Prospecto guardado en Supabase.');
    }catch(e){$('formError').textContent=e.message;}
    finally{busy=false;$('dClose').disabled=false;if($('saveProspect'))$('saveProspect').disabled=false;}
  });
}

function safeSiteLink(relative) {
  const url=new URL(relative,'https://corretajeguzman.com');
  if(url.origin!=='https://corretajeguzman.com')throw new Error('Enlace de catálogo inválido');
  return url.href;
}
function showMatch(id, savedMessage='') {
  const p=prospects.find(x=>x.id===id);if(!p)return;
  const config={...catalog.config,...assumptions[id]};
  const result=matchProspect(p,catalog,config);
  const ufDate=catalog.ufInfo.date?String(catalog.ufInfo.date).slice(0,10):'fecha no informada';
  openDrawer('Oportunidades del prospecto',`
    ${savedMessage?`<p class="badge b-ok" role="status">${esc(savedMessage)}</p>`:''}
    <div class="mhead"><span class="av">${esc(initials(p.nombre))}</span><div><b>${esc(p.nombre)}</b><span>${esc(p.comuna_preferida||'Todas las comunas')} · ${p.dormitorios_min==null?'Todos los dormitorios':p.dormitorios_min+' dormitorios o más'}</span></div></div>
    <div class="mcap"><div><small>Renta considerada</small><b>${money(result.income)}</b><em>${p.complementa?'Total complementada, no se suma dos veces':'Individual'}</em></div><div><small>Pie disponible</small><b>${money(result.savings)}</b></div><div><small>Dividendo máximo estimado</small><b>${money(result.maxPayment)}</b><em>${config.cargaMax*100}% de la renta</em></div><div class="hl"><small>Posibles matches</small><b>${result.possible}</b><em>Tipologías con renta y pie cubiertos</em></div></div>
    <div class="match-disclaimer">Estimación orientativa, no aprobación bancaria. Precio «desde» y disponibilidad sujetos a confirmación. No incluye seguros, gastos operacionales ni otras deudas. Los antecedentes son declarados, no una consulta a DICOM. <a href="https://www.cmfchile.cl/educa/621/w3-propertyvalue-45015.html" target="_blank" rel="noopener">Referencia CMF</a>.</div>
    <p class="mnote">Catálogo del sitio, sincronizado ${esc(catalog.builtAt.slice(0,10))}. UF de referencia: ${money(config.uf)} (${esc(ufDate)}${catalog.ufInfo.fallback?', respaldo':''}). Tasa anual referencial ${config.tasaAnual}%, plazo ${config.anios} años; financiamiento máximo supuesto ${config.financiaBanco[p.destino_compra||'primera']*100}%. No es una oferta bancaria.</p>
    <details class="match-settings"><summary>Ajustar tasa y plazo para esta simulación</summary><form id="settings" class="fgrid">${field('Tasa anual (%)','tasaAnual',config.tasaAnual,'number','min="0" max="30" step="0.01" required')}${select('Plazo','anios',[[15,'15 años'],[20,'20 años'],[25,'25 años'],[30,'30 años']],config.anios)}<button class="btn btn-g" type="submit">Recalcular</button></form><p class="mnote">Ajuste temporal, no cambia las condiciones del banco ni los datos del cliente.</p></details>
    ${result.missing.length?`<div class="mwarn">${result.missing.map(esc).join('<br>')}</div>`:''}
    <div class="match-toolbar"><label for="matchFilter">Mostrar</label><select id="matchFilter"><option value="prioridad">Matches y opciones por revisar</option><option value="posible">Solo posibles matches</option><option value="todos">Todas las tipologías evaluadas</option></select></div><p id="matchCount" role="status"></p><div id="matchRows"></div>`,
    '<button class="btn btn-g" id="editFromMatch">Editar prospecto</button><button class="btn btn-p" id="closeMatch">Volver a la cartera</button>');
  const draw=()=>{
    const filter=$('matchFilter').value;
    const rows=result.missing.length?[]:result.rows.filter(r=>filter==='todos' || (filter==='posible'?r.status==='posible':r.status!=='sobre_renta'));
    $('matchCount').textContent=`${rows.length} de ${result.rows.length} tipologías según sus preferencias`;
    $('matchRows').innerHTML=rows.length?rows.map(r=>{
      const link=safeSiteLink(r.project.detalle)+'#tipologias';
      const message=`Hola ${p.nombre}, te comparto una alternativa para revisar: ${r.project.name}, ${r.type.nombre}, planta ${r.type.planta}, desde UF ${nf.format(r.priceUF)}. ${matchNames[r.status]}. Es una estimación, sujeta a disponibilidad y evaluación bancaria. ${link}`;
      return `<article class="match-card"><h3>${esc(r.project.name)} · ${esc(r.project.commune)}</h3><p>${esc(r.type.nombre)} · ${esc(r.type.planta)} · ${esc(r.type.m2tot)}</p><span class="badge ${r.status==='posible'?'b-ok':'b-warn'}">${matchNames[r.status]}</span><dl><div><dt>Precio desde</dt><dd>UF ${nf.format(r.priceUF)}</dd></div><div><dt>Dividendo estimado, sin seguros</dt><dd>${money(r.payment)}/mes</dd></div><div><dt>Pie mínimo supuesto</dt><dd>${money(r.minimumDown)}</dd></div><div><dt>Pie faltante</dt><dd>${money(r.gapDown)}</dd></div>${r.extraIncome>.01?`<div><dt>Renta adicional referencial</dt><dd>${money(r.extraIncome)}/mes</dd></div>`:''}</dl>${r.reasons.length?`<ul>${r.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>`:''}<div class="match-actions"><a href="${esc(link)}" class="btn btn-g btn-sm" target="_blank" rel="noopener noreferrer">Ver proyecto</a><a href="${esc(safeSiteLink(r.type.plano))}" class="btn btn-g btn-sm" target="_blank" rel="noopener noreferrer">Ver plano</a><a class="btn btn-wa btn-sm" href="https://wa.me/${p.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer">Compartir</a></div></article>`;
    }).join(''):'<p class="mnone">'+(result.missing.length?'Completa los datos para calcular.':'No hay coincidencias en esta categoría. Puedes revisar todas las tipologías evaluadas o ajustar las preferencias con el cliente.')+'</p>';
  };
  $('matchFilter').addEventListener('change',draw);draw();
  $('editFromMatch').addEventListener('click',()=>editProspect(id));$('closeMatch').addEventListener('click',closeDrawer);
  $('settings').addEventListener('submit',event=>{event.preventDefault();const f=event.currentTarget;if(!f.reportValidity())return;assumptions[id]={tasaAnual:Number(f.elements.tasaAnual.value),anios:Number(f.elements.anios.value)};showMatch(id);});
}

try {
  client=makeClient(); await finishCallback(client); api=backendFor(client);
  profile=await api.activeProfile();
  const response=await fetch('/portal/catalog.json',{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo cargar el catálogo real. Recarga para intentarlo nuevamente.');
  catalog=await response.json();prospects=await api.listProspects();chrome();route();
  window.addEventListener('hashchange',route);
} catch(e){errorPage(e.message);}
