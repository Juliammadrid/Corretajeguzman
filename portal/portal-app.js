import { projectImage, installProjectImageFallback } from './project-images.mjs';
import { moveCarousel, lockPage, unlockPage } from './mobile-ui.mjs';
import { createFinanceUI } from './finance-ui.mjs';
import { createCalendarUI, calendarLink } from './calendar-ui.mjs';
import { brokerCommission } from './property-display.mjs';
import { materialButtons, installPropertyTools } from './property-tools.mjs';
import { prepareAvatar } from './avatars.mjs';
import { matchProspect } from './matching.mjs';
import { connectDesign } from './design-data.mjs';
(async function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const nf=new Intl.NumberFormat('es-CL');
  const money=n=>'$'+nf.format(Math.round(n||0));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ini=n=>String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const digits=t=>String(t||'').replace(/\D/g,'');
  const MESES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const todayISO=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);};
  const fDate=iso=>{const [y,m,d]=iso.split('-').map(Number);return d+' '+MESES[m-1];};
  const fLong=iso=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1,d);return DIAS[dt.getDay()]+' '+d+' de '+['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m-1];};
  const icons=()=>window.lucide&&lucide.createIcons();

  /* ---------- Supabase state; no demo/localStorage ---------- */
  const connected=await connectDesign();
  const API=connected.api, ME=connected.me, ADMIN=ME;
  let S=connected.state;
  const isAdmin=()=>ME.rol==='admin';
  const uKey=()=>ME.id;
  const avInner=(u,key)=>{const f=S.fotos[key];return f?'<img src="'+esc(f)+'" data-avatar-initials="'+esc(ini(u.nombre))+'" referrerpolicy="no-referrer" alt="">':esc(ini(u.nombre));};
  async function refresh(){const next=await API.load();S=next.state;S.cal=calendarUI.status.connected;Object.assign(ME,next.me);}
  function pending(section){toast(section+' pendiente de conectar. No se realizó ningún cambio.');}

  let avatarBusy=false;
  document.addEventListener('error',event=>{
    const img=event.target;
    if(img?.matches?.('img[data-avatar-initials]'))img.replaceWith(document.createTextNode(img.dataset.avatarInitials));
  },true);
  function pickPhoto(cb){
    if(avatarBusy)return;
    const inp=document.createElement('input');inp.type='file';inp.accept='image/jpeg,image/png,image/webp';
    inp.addEventListener('change',()=>{const file=inp.files?.[0];if(file)cb(file);});inp.click();
  }
  async function changeAvatar(file){
    if(avatarBusy)return;
    avatarBusy=true;
    const buttons=[$('#avEdit'),$('#avPick'),$('#avDel')].filter(Boolean);
    buttons.forEach(b=>b.disabled=true);
    try{
      const result=file?await API.saveAvatar(await prepareAvatar(file)):await API.removeAvatar();
      try{await refresh();route();}catch{toast('Foto guardada. Recarga la página para actualizar los datos.');return;}
      toast(result.cleanupPending?'Perfil actualizado; quedó pendiente eliminar la copia anterior.':file?'Foto de perfil actualizada':'Foto quitada');
    }catch(error){toast(error.message);}finally{avatarBusy=false;buttons.forEach(b=>b.disabled=false);}
  }

  let PROPS=[];
  let propertiesReady=false,propertiesLoading=true;
  async function loadProperties(){
    propertiesLoading=true;
    try{PROPS=await API.properties();propertiesReady=true;}catch{propertiesReady=false;}finally{propertiesLoading=false;}
    // Do not interrupt a prospect form or another section while the feed loads.
    if(['#/inicio','#/propiedades',''].includes(location.hash))route();
  }

  const propById=id=>PROPS.find(p=>p.id===id)||(()=>{const v=S.visits.find(v=>v.prop===id);return {id,titulo:v?.propiedad_titulo||'Propiedad no disponible',direccion:v?.propiedad_direccion||'',comuna:'',fotos:[],estado:'arrendada'};})();
  const brokerName=id=>(S.brokers.find(b=>b.id===id)||{}).nombre||'—';
  const myProspects=()=>isAdmin()?S.prospects:S.prospects.filter(p=>p.owner===ME.id);
  const myVisits=()=>isAdmin()?S.visits:S.visits.filter(v=>v.owner===ME.id);

  const ESTADO={nuevo:['Nuevo','b-new'],contactado:['Contactado','b-v'],interesado:['Interesado','b-ok'],no:['No interesado','b-mute']};
  const DICOM={limpio:['Limpio','b-ok'],obs:['Con observaciones','b-warn'],nosabe:['No sabemos','b-mute']};
  const PEST={disponible:['Disponible','b-ok'],reservada:['Reservada','b-warn'],arrendada:['Arrendada','b-mute']};
  const badge=(map,k)=>{const x=map[k]||['—','b-mute'];return '<span class="badge '+x[1]+'">'+x[0]+'</span>';};
  const waLink=(tel,msg)=>'https://wa.me/'+digits(tel)+(msg?'?text='+encodeURIComponent(msg):'');

  function toast(t){const el=$('#toast');el.innerHTML='<i data-lucide="check-circle-2" class="ico"></i>'+esc(t);icons();el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),2600);}

  /* ---------- navegación ---------- */
  const NAV_B=[['inicio','Inicio','house'],['prospectos','Prospectos','users-round'],['propiedades','Propiedades','building-2'],['visitas','Mis visitas','calendar-days'],['comisiones','Comisiones','wallet']];
  const NAV_A=[['inicio','Inicio','house'],['corredores','Corredores','id-card'],['prospectos','Prospectos','users-round'],['propiedades','Propiedades','building-2'],['visitas','Visitas','calendar-days'],['comisiones','Comisiones','wallet']];
  function parseHash(){const h=(location.hash||'').replace(/^#\/?/,'');const [path,q]=h.split('?');return {path:path||'inicio',q:new URLSearchParams(q||'')};}
  function chrome(active){
    const items=isAdmin()?NAV_A:NAV_B;
    const html=items.map(([k,l,ic])=>'<a href="#/'+k+'"'+(k===active?' class="on"':'')+'><i data-lucide="'+ic+'" class="ico"></i>'+l+'</a>').join('');
    $('#tabbar').style.setProperty('--nav-count',items.length);
    $('#nav').innerHTML=html; $('#tabbar').innerHTML=html.replace('>Mis visitas<','>Visitas<');
    const u=isAdmin()?ADMIN:ME;
    $('#avTop').innerHTML=avInner(u,uKey()); $('#avName').textContent=u.nombre; $('#avMail').textContent=u.email;
    $('#roleTag').textContent=isAdmin()?'Administrador':'Corredor';

    $('#fab').classList.toggle('hide',isAdmin()||!['inicio','prospectos'].includes(active));
  }
  function route(){
    const {path,q}=parseHash();
    const V={comisiones:vComisiones,inicio:vInicio,prospectos:vProspectos,propiedades:vPropiedades,visitas:vVisitas,cuenta:vCuenta,corredores:vCorredores};
    let p=V[path]?path:'inicio';

    if(!isAdmin()&&p==='corredores')p='inicio';
    chrome(p); $('#view').innerHTML=''; V[p](q);
    if(['127.0.0.1','localhost'].includes(location.hostname))$('#view').insertAdjacentHTML('afterbegin','<p class="mnote" style="margin:0 0 16px">Prueba local · Sin publicar</p>');
    if(location.hostname==='portal-prueba--webcorretajeguzman.netlify.app')$('#view').insertAdjacentHTML('afterbegin','<p class="mnote" style="margin:0 0 16px">Versión de prueba · No publicada en el sitio principal</p>');
    window.scrollTo(0,0); icons();
  }
  window.addEventListener('hashchange',route);

  $('#avBtn').addEventListener('click',e=>{e.stopPropagation();$('#avMenu').classList.toggle('open');});
  document.addEventListener('click',e=>{if(!e.target.closest('.who'))$('#avMenu').classList.remove('open');});
  $('#avMenu').addEventListener('click',e=>{if(e.target.closest('a,button'))$('#avMenu').classList.remove('open');});
  $('#logout').addEventListener('click',async()=>{try{await API.logout();location.href='/portal/';}catch(e){toast(e.message);}});

  $('#fab').addEventListener('click',()=>openProspect());

  /* ---------- drawer ---------- */
  function openDrawer(title,body,foot){
    $('#dTitle').textContent=title; $('#dBody').innerHTML=body; $('#dFoot').innerHTML=foot||''; $('#dFoot').classList.toggle('hide',!foot);
    $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); $('#drawer').setAttribute('aria-hidden','false');
    $('#dBody').scrollTop=0; lockPage(); icons();
  }
  function closeDrawer(){$('#drawer').classList.remove('on');$('#scrim').classList.remove('on');$('#drawer').setAttribute('aria-hidden','true');unlockPage();}
  $('#dClose').addEventListener('click',closeDrawer); $('#scrim').addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

  /* ================= INICIO ================= */
  function nextVisit(list){const t=todayISO();return list.filter(v=>v.fecha>=t).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora))[0];}
  function vInicio(){
    const pros=myProspects().filter(p=>p.estado!=='no');
    const nv=nextVisit(myVisits());
    const disp=propertiesReady?PROPS.filter(p=>p.estado==='disponible').length:'—';
    const nvTx=nv?(nv.fecha===todayISO()?'Hoy':fLong(nv.fecha))+', '+nv.hora:'Sin visitas agendadas';
    $('#view').innerHTML=`
      <h1 class="hello">Hola, ${esc(ME.nombre.split(' ')[0])}</h1>
      <p class="hello-s">¿Qué quieres hacer hoy?</p>
      <div class="quick">
        <a class="qa main-qa" href="#" data-act="add"><span class="ic"><i data-lucide="user-plus" class="ico"></i></span><span>Agregar prospecto<small>Registra renta y DICOM</small></span></a>
        <a class="qa" href="#/propiedades"><span class="ic"><i data-lucide="building-2" class="ico"></i></span><span>Ver propiedades<small>${propertiesReady?disp+' disponibles para mover':(propertiesLoading?'Consultando disponibilidad…':'Propiedades no disponibles por ahora')}</small></span></a>
        <a class="qa" href="#/propiedades"><span class="ic"><i data-lucide="calendar-plus" class="ico"></i></span><span>Agendar visita<small>Elige una propiedad</small></span></a>
      </div>
      <div class="tiles">
        <div class="card tile"><div class="k">Prospectos activos</div><div class="v">${pros.length}</div><a href="#/prospectos">Ver prospectos →</a></div>
        <div class="card tile"><div class="k">Próxima visita</div><div class="v sm">${esc(nvTx)}</div>${nv?'<div class="s">'+esc(nv.cliente)+' · '+esc(propById(nv.prop).comuna)+'</div>':''}<a href="#/visitas">Ver mis visitas →</a></div>
        <div class="card tile"><div class="k">Propiedades disponibles</div><div class="v">${disp}</div><a href="#/propiedades">Ver propiedades →</a></div>
      </div>
      ${S.cal?'':calBanner()}`;
    $('[data-act="add"]').addEventListener('click',e=>{e.preventDefault();openProspect();});
    bindCal();
  }
  const GCAL_SVG='<svg width="26" height="26" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" stroke="#4285F4" stroke-width="2"/><path d="M3 9h18" stroke="#4285F4" stroke-width="2"/><rect x="7" y="2" width="2" height="4" rx="1" fill="#4285F4"/><rect x="15" y="2" width="2" height="4" rx="1" fill="#4285F4"/><text x="12" y="18.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="7.5" fill="#34A853">31</text></svg>';
  const calBanner=()=>calendarUI.banner();
  function bindCal(){$$('[data-cal]').forEach(b=>b.addEventListener('click',()=>openCalConnect(()=>route())));}

  /* ================= PROSPECTOS ================= */
  let PF={q:'',estado:'',renta:'',orden:'recientes',corredor:''};
  function vProspectos(q){
    if(q.get('c'))PF.corredor=q.get('c');
    const adm=isAdmin();
    $('#view').innerHTML=`
      <div class="ph"><div><h1>${adm?'Todos los prospectos':'Tus prospectos'}</h1><p>${adm?'Cartera de todos los corredores.':'Tu cartera privada de potenciales compradores.'}</p></div>
        ${adm?'':'<button class="btn btn-p" id="addP"><i data-lucide="user-plus" class="ico"></i>Agregar prospecto</button>'}</div>
      <div class="filters" ${adm?'style="grid-template-columns:1.4fr 1fr 1fr 1fr 1fr"':''}>
        <div class="inp"><i data-lucide="search" class="ico"></i><input id="fq" placeholder="Buscar por nombre o teléfono" value="${esc(PF.q)}"></div>
        ${adm?'<select id="fc"><option value="">Todos los corredores</option>'+S.brokers.map(b=>'<option value="'+b.id+'"'+(PF.corredor===b.id?' selected':'')+'>'+esc(b.nombre)+'</option>').join('')+'</select>':''}
        <select id="fe"><option value="">Todos los estados</option>${Object.entries(ESTADO).map(([k,v])=>'<option value="'+k+'"'+(PF.estado===k?' selected':'')+'>'+v[0]+'</option>').join('')}</select>
        <select id="fr"><option value="">Cualquier renta</option><option value="a">Hasta $1.000.000</option><option value="b">$1.000.000 – $1.500.000</option><option value="c">$1.500.000 – $2.500.000</option><option value="d">Más de $2.500.000</option></select>
        <select id="fo"><option value="recientes">Más recientes</option><option value="renta">Mayor renta</option><option value="nombre">Nombre A–Z</option></select>
      </div>
      <p class="count" id="pcount"></p>
      <div class="card list" id="plist"></div>`;
    $('#fr').value=PF.renta; $('#fo').value=PF.orden;
    const bind=(id,k,ev)=>$(id)&&$(id).addEventListener(ev||'change',e=>{PF[k]=e.target.value;drawProspects();});
    bind('#fq','q','input');bind('#fe','estado');bind('#fr','renta');bind('#fo','orden');bind('#fc','corredor');
    $('#addP')&&$('#addP').addEventListener('click',()=>openProspect());
    drawProspects();
  }
  function drawProspects(){
    const adm=isAdmin();
    let L=myProspects().slice();
    const qq=PF.q.trim().toLowerCase(), qd=digits(PF.q);
    if(qq)L=L.filter(p=>p.nombre.toLowerCase().includes(qq)||(qd&&digits(p.tel).includes(qd)));
    if(adm&&PF.corredor)L=L.filter(p=>p.owner===PF.corredor);
    if(PF.estado)L=L.filter(p=>p.estado===PF.estado);
    const rt=p=>p.complementa&&p.rentaTotal?p.rentaTotal:p.renta;
    const R={a:[0,1e6],b:[1e6,1.5e6],c:[1.5e6,2.5e6],d:[2.5e6,1e12]}[PF.renta];
    if(R)L=L.filter(p=>rt(p)>=R[0]&&rt(p)<R[1]);
    if(PF.orden==='renta')L.sort((a,b)=>rt(b)-rt(a));
    else if(PF.orden==='nombre')L.sort((a,b)=>a.nombre.localeCompare(b.nombre));
    else L.sort((a,b)=>(b.creado||'').localeCompare(a.creado||''));
    $('#pcount').textContent=L.length+' prospecto'+(L.length===1?'':'s');
    const cls='lrow'+(adm?' with-owner':'');
    const head=`<div class="${cls} lh"><span>Nombre</span><span>Teléfono</span><span>Renta líquida</span><span class="c-dicom">DICOM</span><span class="c-estado">Estado</span>${adm?'<span class="c-owner">Corredor</span>':''}<span style="text-align:right">Acciones</span></div>`;
    if(!L.length){$('#plist').innerHTML=head+'<div class="empty">No hay prospectos con estos filtros.</div>';return;}
    $('#plist').innerHTML=head+L.map(p=>{
      const msg='Hola '+p.nombre.split(' ')[0]+', te escribe '+(adm?brokerName(p.owner):ME.nombre)+' de Corretaje Guzmán.';
      return `<div class="${cls}">
        <div class="c-name pname"><span class="av">${ini(p.nombre)}</span><div style="min-width:0"><b>${esc(p.nombre)}</b><span>${p.email?esc(p.email):'Agregado el '+fDate(p.creado)}</span></div></div>
        <div class="c-tel tel">${esc(p.tel)}</div>
        <div class="c-renta money">${money(rt(p))}${p.complementa&&p.rentaTotal?'<small>Complementada</small>':''}</div>
        <div class="c-dicom">${badge(DICOM,p.dicom)}</div>
        <div class="c-estado">${badge(ESTADO,p.estado)}</div>
        ${adm?'<div class="c-owner" style="font-size:14px;font-weight:600">'+esc(brokerName(p.owner))+'</div>':''}
        <div class="c-acts acts">
          <a class="ib wa" href="${waLink(p.tel,msg)}" target="_blank" rel="noopener" title="WhatsApp"><i data-lucide="message-circle" class="ico"></i></a>
          <a class="ib" href="tel:${esc(p.tel)}" title="Llamar"><i data-lucide="phone" class="ico"></i></a>
          <button class="ib edit" data-edit="${p.id}" title="Editar"><i data-lucide="pencil" class="ico"></i></button>
        </div>
        <div class="c-tags">${badge(DICOM,p.dicom)}${badge(ESTADO,p.estado)}${adm?'<span class="badge b-mute">'+esc(brokerName(p.owner))+'</span>':''}<button class="badge b-v" data-edit="${p.id}" style="margin-left:auto">Editar</button></div>
      </div>`;}).join('');
    $$('[data-edit]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openProspect(b.dataset.edit);}));
    $$('#plist .lrow:not(.lh)').forEach(r=>{const id=r.querySelector('[data-edit]').dataset.edit;r.querySelector('.c-name').addEventListener('click',()=>openMatch(id));});
    icons();
  }


  /* ================= OPORTUNIDADES DEL PROSPECTO =================
     Estimación referencial (no es evaluación bancaria):
     - Dividendo máximo = 25% de la renta considerada
     - Crédito hipotecario 25 años, tasa 4,5% anual, financia 80% (pie 20%)
     - Arriendo: renta debe ser ≥ 3 veces el valor del arriendo            */
  const catalogResponse=await fetch('/portal/catalog.json');
  if(!catalogResponse.ok)throw new Error('No se pudo cargar el catálogo de proyectos.');
  const catalog=await catalogResponse.json();
  const UF=catalog.config.uf, TASA=catalog.config.tasaAnual/100, ANOS=catalog.config.anios, PCT_DIV=catalog.config.cargaMax, FIN=catalog.config.financiaBanco.primera;
  function capacidad(p){
    const renta=p.complementa&&p.rentaTotal?p.rentaTotal:p.renta;
    const div=renta*PCT_DIV, r=TASA/12, n=ANOS*12;
    const credito=div*(1-Math.pow(1+r,-n))/r;
    const maxUF=Math.floor(credito/FIN/UF/10)*10;
    const pieUF=Math.round(maxUF*(1-FIN));
    return {renta,div,maxUF,pieUF,maxArriendo:Math.floor(renta/3)};
  }
  const ENT={inmediata:['Entrega inmediata','b-ok'],verde:['En verde','b-v'],futura:['Entrega futura','b-new'],ultimas:['Últimas unidades','b-warn']};
  function openMatch(id){
    const p=S.prospects.find(x=>x.id===id); if(!p)return;
    const c=capacidad(p);
    const pub=(window.PROYECTOS||[]).filter(x=>x.detalle&&x.activa!==false);
    const matching=matchProspect({...p,telefono:p.tel,renta_total:p.rentaTotal,pie_monto:p.pieMonto},catalog,catalog.config);
    const eligible=new Set(matching.rows.filter(r=>r.status==='posible').map(r=>r.project.slug));
    const review=new Set(matching.rows.filter(r=>['revisar','requiere_pie'].includes(r.status)).map(r=>r.project.slug));
    const matchedPrice=(project,statuses)=>Math.min(...matching.rows.filter(r=>r.project.slug===project.slug&&statuses.includes(r.status)).map(r=>r.priceUF));
    const ok=pub.filter(x=>eligible.has(x.slug)).map(x=>({...x,desdeUF:matchedPrice(x,['posible'])}));
    const casi=pub.filter(x=>!eligible.has(x.slug)&&review.has(x.slug)).map(x=>({...x,desdeUF:matchedPrice(x,['revisar','requiere_pie'])}));
    const arr=PROPS.filter(x=>x.estado==='disponible'&&Number.isFinite(x.precio)&&x.precio>0&&x.precio<=c.maxArriendo).sort((a,b)=>b.comision-a.comision).slice(0,4);
    const first=p.nombre.split(' ')[0];
    const proj=(x,warn)=>{const e=ENT[x.entrega];const link='https://corretajeguzman.com/proyectos/'+encodeURIComponent(x.slug)+'/';
      return '<div class="mrow"><img src="'+esc(projectImage(x))+'" alt="'+esc(x.name)+'" data-project-image loading="lazy"><div class="mt"><b>'+esc(x.name)+'</b><span>'+esc(x.commune)+(x.specs?' · '+esc(String(x.specs).split('·').slice(0,2).join('·')):'')+'</span><div class="mtags">'+(e?'<span class="badge '+e[1]+'">'+e[0]+'</span>':'')+(warn?'<span class="badge b-warn">Revisar pie y antecedentes</span>':'')+'</div></div><div class="mp"><small>Desde</small><b>UF '+nf.format(x.desdeUF)+'</b><div class="ma"><a class="ib" href="'+esc(link)+'" target="_blank" rel="noopener" title="Ver proyecto"><i data-lucide="external-link" class="ico"></i></a><a class="ib wa" href="'+waLink(p.tel,'Hola '+first+', te comparto un proyecto que calza con tu perfil: '+x.name+' en '+x.commune+', desde UF '+nf.format(x.desdeUF)+'. ¿Te gustaría conocerlo?')+'" target="_blank" rel="noopener" title="Enviar por WhatsApp"><i data-lucide="message-circle" class="ico"></i></a></div></div></div>';};
    const allMsg='Hola '+first+', según tu perfil podrías acceder a estos proyectos nuevos:\n'+ok.slice(0,5).map(x=>'• '+x.name+' ('+x.commune+') desde UF '+nf.format(x.desdeUF)).join('\n')+'\n¿Agendamos una visita?';
    openDrawer('Oportunidades del prospecto',`
      <div class="mhead"><span class="av">${ini(p.nombre)}</span><div><b>${esc(p.nombre)}</b><span>${esc(p.tel)}</span><div class="mtags">${badge(DICOM,p.dicom)}${badge(ESTADO,p.estado)}</div></div></div>
      ${p.dicom==='obs'?'<div class="mwarn"><i data-lucide="alert-triangle" class="ico"></i>Antecedentes declarados con observaciones: requieren revisión del banco. No es una aprobación ni un rechazo automático.</div>':''}
      <div class="mcap">
        <div><small>Renta considerada</small><b>${money(c.renta)}</b>${p.complementa&&p.rentaTotal?'<em>Complementada</em>':''}</div>
        <div><small>Dividendo máximo</small><b>${money(c.div)}</b><em>25% de la renta</em></div>
        <div class="hl"><small>Tope orientativo por renta</small><b>UF ${nf.format(c.maxUF)}</b><em>Pie 20%: UF ${nf.format(c.pieUF)}</em></div>
        <div><small>Arriendo hasta</small><b>${money(c.maxArriendo)}</b><em>Renta ≥ 3× arriendo</em></div>
      </div>
      <div class="msec"><h3>Puede acceder a estos proyectos <span>${ok.length}</span></h3>
        ${ok.length?ok.map(x=>proj(x)).join(''):'<p class="mnone">Con esta renta no calza todavía en los proyectos publicados. Prueba complementando renta o con pie mayor.</p>'}
        ${casi.length?'<p class="msub">Cerca de su alcance (con un pie mayor o complementando renta):</p>'+casi.map(x=>proj(x,true)).join(''):''}
      </div>
      <div class="msec"><h3>Arriendos que calzan <span>${arr.length}</span></h3>
        ${arr.length?arr.map(x=>'<div class="mrow"><img src="'+esc(x.fotos[0])+'" alt=""><div class="mt"><b>'+esc(x.titulo)+'</b><span>'+esc(x.comuna)+' · '+x.dorm+'D'+x.banos+'B</span><div class="mtags">'+(x.comisionPct===100?'<span class="badge b-v">Dueño paga +50%</span>':'')+'</div></div><div class="mp"><small>Arriendo</small><b>'+money(x.precio)+'</b><div class="ma"><button class="btn btn-p btn-sm" data-mvisit="'+x.id+'">Agendar</button></div></div></div>').join(''):'<p class="mnone">'+(propertiesReady?'No hay arriendos disponibles que calcen con su renta.':'Conexión de arriendos pendiente; no se ha evaluado su cartera.')+'</p>'}
      </div>
      <p class="mnote">Estimación referencial: dividendo máx. 25% de la renta, crédito a ${ANOS} años con tasa ${(TASA*100).toFixed(1)}% anual y ${(FIN*100).toFixed(0)}% de financiamiento, UF ${nf.format(UF)} (${catalog.ufInfo.date?.slice(0,10)||"sin fecha"}). No incluye seguros ni gastos; disponibilidad por confirmar. La evaluación final la hace el banco.</p>`,
      `<button class="btn btn-g" id="mEdit"><i data-lucide="pencil" class="ico"></i>Editar</button>${ok.length?'<a class="btn btn-wa" href="'+waLink(p.tel,allMsg)+'" target="_blank" rel="noopener"><i data-lucide="message-circle" class="ico"></i>Enviar proyectos</a>':'<a class="btn btn-wa" href="'+waLink(p.tel,'Hola '+first+', te escribe '+ME.nombre+' de Corretaje Guzmán.')+'" target="_blank" rel="noopener"><i data-lucide="message-circle" class="ico"></i>WhatsApp</a>'}`);
    $('#mEdit').addEventListener('click',()=>openProspect(id));
    $$('[data-mvisit]').forEach(b=>b.addEventListener('click',()=>openVisit(b.dataset.mvisit,{cliente:p.nombre,tel:p.tel,email:p.email})));
  }

  /* --- agregar / editar prospecto --- */
  function seg(name,opts,val){return '<div class="seg" data-seg="'+name+'">'+opts.map(([k,l])=>'<button type="button" data-v="'+k+'"'+(k===val?' class="on"':'')+'>'+l+'</button>').join('')+'</div>';}
  function openProspect(id){
    const p=id?S.prospects.find(x=>x.id===id):{nombre:'',tel:'+56 9 ',email:'',renta:'',complementa:false,rentaTotal:'',dicom:'limpio',pie:false,pieMonto:'',estado:'nuevo',notas:''};
    const fm=v=>v?nf.format(v):'';
    openDrawer(id?'Editar prospecto':'Agregar prospecto',`
      <form id="pForm" class="fgrid" novalidate>
        <div class="f full"><label>Nombre completo</label><input name="nombre" value="${esc(p.nombre)}" placeholder="Ej: Camila Rojas"><span class="err">Ingresa el nombre.</span></div>
        <div class="f"><label>Teléfono</label><input name="tel" type="tel" value="${esc(p.tel)}" placeholder="+56 9 1234 5678"><span class="err">Ingresa un teléfono válido.</span></div>
        <div class="f"><label>Correo <i>(opcional)</i></label><input name="email" type="email" value="${esc(p.email)}" placeholder="nombre@correo.cl"></div>
        <div class="f full"><label>Renta líquida mensual</label><div class="prefix"><span>$</span><input name="renta" inputmode="numeric" value="${fm(p.renta)}" placeholder="1.200.000" data-money></div><span class="err">Ingresa la renta líquida.</span></div>
        <div class="f full"><label>¿Complementa renta?</label>${seg('complementa',[['no','No'],['si','Sí']],p.complementa?'si':'no')}</div>
        <div class="f full ${p.complementa?'':'hide'}" id="fTotal"><label>Renta total complementada</label><div class="prefix"><span>$</span><input name="rentaTotal" inputmode="numeric" value="${fm(p.rentaTotal)}" placeholder="1.800.000" data-money></div></div>
        <div class="f full"><label>DICOM</label>${seg('dicom',[['limpio','Limpio'],['obs','Con observaciones'],['nosabe','No sabemos']],p.dicom)}</div>
        <div class="f full"><label>¿Tiene pie disponible?</label>${seg('pie',[['no','No'],['si','Sí']],p.pie?'si':'no')}</div>
        <div class="f full ${p.pie?'':'hide'}" id="fPie"><label>Monto del pie <i>(opcional)</i></label><div class="prefix"><span>$</span><input name="pieMonto" inputmode="numeric" value="${fm(p.pieMonto)}" placeholder="5.000.000" data-money></div></div>
        <div class="f full"><label>Estado</label>${seg('estado',Object.entries(ESTADO).map(([k,v])=>[k,v[0]]),p.estado)}</div>
        <div class="f full"><label>Notas</label><textarea name="notas" placeholder="Qué busca, comunas, mascotas, fecha de cambio…">${esc(p.notas)}</textarea></div>
        ${id?'':'<label class="f full acepta" id="pAcepta"><span class="ac-row"><input type="checkbox" name="acepta"><span>El cliente autorizó compartir sus datos con Corretaje Guzmán, según la <a href="/politica-de-privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</span></span><span class="err">Confirma que el cliente autorizó compartir sus datos.</span></label>'}
      </form>`,
      `<button class="btn btn-g" data-close>Cancelar</button><button class="btn btn-p" id="pSave">Guardar prospecto</button>`);
    const f=$('#pForm');
    $$('[data-seg]').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
      if(g.dataset.seg==='complementa')$('#fTotal').classList.toggle('hide',b.dataset.v!=='si');
      if(g.dataset.seg==='pie')$('#fPie').classList.toggle('hide',b.dataset.v!=='si');}));
    $$('[data-money]').forEach(i=>i.addEventListener('input',()=>{const d=digits(i.value);i.value=d?nf.format(+d):'';}));
    f.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>i.closest('.f').classList.remove('bad')));
    $('[data-close]').addEventListener('click',closeDrawer);
    $('#pSave').addEventListener('click',async()=>{
      const v=n=>f.elements[n].value.trim(), sv=n=>$('[data-seg="'+n+'"] .on').dataset.v;
      const bad=[]; if(!v('nombre'))bad.push('nombre'); if(digits(v('tel')).length<8)bad.push('tel'); if(!digits(v('renta')))bad.push('renta');
      f.querySelectorAll('.f').forEach(x=>x.classList.remove('bad'));
      if(!id&&f.elements.acepta&&!f.elements.acepta.checked){ $('#pAcepta').classList.add('bad'); if(!bad.length){f.elements.acepta.focus();return;} }
      if(bad.length){bad.forEach(n=>f.elements[n].closest('.f').classList.add('bad'));f.elements[bad[0]].focus();return;}
      const data={nombre:v('nombre'),tel:v('tel'),email:v('email'),renta:+digits(v('renta')),complementa:sv('complementa')==='si',rentaTotal:+digits(v('rentaTotal'))||0,dicom:sv('dicom'),pie:sv('pie')==='si',pieMonto:+digits(v('pieMonto'))||0,estado:sv('estado'),notas:v('notas')};
      const button=$('#pSave');button.disabled=true;
      try {
        const row=await API.saveProspect({...p,...data,pieMonto:v('pieMonto')?data.pieMonto:null},id,!!f.elements.acepta?.checked);
        await refresh(); toast(id?'Prospecto actualizado':'Prospecto guardado');
        location.hash='#/prospectos'; route(); openMatch(row.id);
      }catch(error){toast(error.message);}finally{button.disabled=false;}

    });
  }

  /* ================= PROPIEDADES ================= */
  let PRF={f:'todas',comuna:''};
  const propertyPrice=p=>p.moneda==='UF'?'UF '+nf.format(p.precioOriginal):money(p.precio);
  const commissionPrice=p=>{const value=brokerCommission(p);return value===null?'Por confirmar':p.moneda==='UF'?'UF '+nf.format(value):money(value);};
  function propCard(p,hot){
    return `<article class="pc" data-prop="${p.id}">
      <div class="ph-img"><img src="${esc(p.fotos[0])}" alt="${esc(p.titulo)}" loading="lazy">${badge(PEST,p.estado)}${p.comisionPct===100?'<span class="hot-badge"><i data-lucide="flame" class="ico"></i>Dueño paga +50%</span>':''}</div>
      <div class="bd">
        <div class="loc"><i data-lucide="map-pin" class="ico"></i>${esc(p.comuna)}${p.direccion?' · '+esc(p.direccion):''}</div>
        <h3>${esc(p.titulo)}</h3>
        <div class="specs"><span><i data-lucide="bed-double" class="ico"></i>${p.dorm}</span><span><i data-lucide="bath" class="ico"></i>${p.banos}</span><span><i data-lucide="car" class="ico"></i>${p.estac||'—'}</span></div>
        <div class="foot"><div class="price">${propertyPrice(p)}<small> /mes</small></div><div class="com"><small>Comisión del corredor</small><b>${commissionPrice(p)}</b></div></div>
      </div>
      ${materialButtons(p)}
      ${p.estado!=='arrendada'?'<button class="btn btn-p btn-sm agendar" data-visit="'+p.id+'"><i data-lucide="calendar-plus" class="ico"></i>Agendar visita</button>':''}
    </article>`;
  }
  function vPropiedades(){
    if(!propertiesReady){
      $('#view').innerHTML='<div class="ph"><div><h1>Propiedades en arriendo</h1><p role="status">'+(propertiesLoading?'Consultando propiedades disponibles…':'No se pudieron cargar las propiedades. Inténtalo nuevamente.')+'</p></div></div>'+(propertiesLoading?'<div class="boot-grid" aria-hidden="true"><div class="boot-card"></div><div class="boot-card"></div><div class="boot-card"></div></div>':'<button class="btn btn-p" id="retryProperties">Reintentar</button>');
      $('#retryProperties')?.addEventListener('click',()=>{void loadProperties();vPropiedades();});return;
    }
    const hot=PROPS.filter(p=>p.comisionPct===100&&p.estado==='disponible'&&(!PRF.comuna||p.comuna===PRF.comuna)&&['todas','disponible','alta'].includes(PRF.f)).sort((a,b)=>b.comision-a.comision);
    const comunas=[...new Set(PROPS.map(p=>p.comuna))].sort();
    $('#view').innerHTML=`
      <div class="ph"><div><h1>Propiedades en arriendo</h1><p>Lo que puedes mover hoy. La comisión es información interna del portal.</p></div></div>
      <div class="chips" id="prChips">
        <select id="prComuna" aria-label="Filtrar propiedades por comuna"><option value="">Todas las comunas</option>${comunas.map(c=>'<option'+(PRF.comuna===c?' selected':'')+'>'+esc(c)+'</option>').join('')}</select>
        ${[['todas','Todas'],['disponible','Disponibles'],['alta','Mayor comisión'],['reservada','Reservadas'],['arrendada','Arrendadas']].map(([k,l])=>'<button class="chip'+(PRF.f===k?' on':'')+'" data-f="'+k+'">'+l+'</button>').join('')}
      </div>
      ${hot.length?`<section class="hot"><div class="hot-h"><div><h2>Propiedades con mayor comisión</h2><p>Con prioridad recibes el 50% del arriendo; sin prioridad, el 25%. Los montos mostrados ya corresponden a tu parte.</p></div></div><div class="hot-controls"><button class="btn btn-g btn-sm" data-hot-prev aria-label="Ver oportunidades anteriores">←</button><span class="mnote">${hot.length} oportunidades · desliza para ver todas</span><button class="btn btn-g btn-sm" data-hot-next aria-label="Ver más oportunidades">→</button></div><div class="hot-row" role="region" aria-label="Oportunidades de mayor comisión" tabindex="0">${hot.map(p=>propCard(p,true)).join('')}</div></section>`:''}
      ${PROPS.some(p=>p.conversionPendiente)?'<p class="mnote" role="status">La conversión de UF a pesos no está disponible por ahora. Esas propiedades y sus comisiones se muestran en UF; no se incluyen en el cálculo de compatibilidad por renta hasta recuperar la conversión.</p>':''}<h2 class="sec-t">Todas las propiedades</h2><p class="sec-s" id="prcount"></p>
      <div class="pgrid" id="prGrid"></div>`;
    $$('#prChips .chip').forEach(c=>c.addEventListener('click',()=>{PRF.f=c.dataset.f;vPropiedades();icons();}));
    $('#prComuna').addEventListener('change',e=>{PRF.comuna=e.target.value;vPropiedades();icons();});
    const hotRow=$('.hot-row');
    const moveHot=direction=>moveCarousel(hotRow,direction);
    $('[data-hot-prev]')?.addEventListener('click',()=>moveHot(-1));
    $('[data-hot-next]')?.addEventListener('click',()=>moveHot(1));
    hotRow?.addEventListener('keydown',event=>{if(event.target===hotRow&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();moveHot(event.key==='ArrowLeft'?-1:1);}});
    bindProps(hotRow); drawProps();
  }
  function drawProps(){
    let L=PROPS.slice();
    if(PRF.f==='alta')L=L.filter(p=>p.comisionPct===100); else if(PRF.f!=='todas')L=L.filter(p=>p.estado===PRF.f);
    if(PRF.comuna)L=L.filter(p=>p.comuna===PRF.comuna);
    L.sort((a,b)=>(a.estado==='disponible'?0:1)-(b.estado==='disponible'?0:1)||b.comision-a.comision);
    $('#prcount').textContent=L.length+' propiedad'+(L.length===1?'':'es');
    $('#prGrid').innerHTML=L.length?L.map(p=>propCard(p)).join(''):'<div class="card empty" style="grid-column:1/-1">No hay propiedades con estos filtros.</div>';
    bindProps($('#prGrid')); icons();
  }
  function bindProps(root){
    if(!root)return;
    root.querySelectorAll('[data-visit]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openVisit(b.dataset.visit);}));
    root.querySelectorAll('[data-prop]').forEach(c=>c.addEventListener('click',()=>openProp(c.dataset.prop)));
  }
  function openProp(id){
    const p=propById(id);
    openDrawer('Detalle de propiedad',`
      <div class="gal-main"><img id="galMain" src="${esc(p.fotos[0])}" alt=""></div>
      ${p.fotos.length>1?'<div class="gal-th">'+p.fotos.slice(0,12).map((f,i)=>'<img src="'+esc(f)+'" data-i="'+i+'"'+(i===0?' class="on"':'')+' alt="">').join('')+'</div>':''}
      <div class="dprice"><div><div class="p">${propertyPrice(p)}<small> /mes</small></div><div style="color:var(--ink-2);font-size:14px;margin-top:2px">${esc(p.titulo)}</div></div>${badge(PEST,p.estado)}</div>
      <div style="display:flex;align-items:center;gap:6px;color:var(--ink-2);font-size:14px;margin-top:8px"><i data-lucide="map-pin" class="ico" style="width:15px;height:15px;color:var(--violet)"></i>${esc(p.direccion?p.direccion+', ':'')}${esc(p.comuna)}</div>
      <div class="dspecs"><div><b>${p.dorm}</b><span>Dormitorios</span></div><div><b>${p.banos}</b><span>Baños</span></div><div><b>${p.estac||'—'}</b><span>Estacionam.</span></div><div><b style="font-size:13.5px">${esc(p.disponibleDesde)}</b><span>Disponible</span></div></div>
      ${materialButtons(p)}
      <div class="dcom"><div class="k"><i data-lucide="lock" class="ico" style="width:13px;height:13px"></i>Comisión del corredor · interna</div><b>${commissionPrice(p)}</b><p>${brokerCommission(p)===null?'Comisión por confirmar.':'Este monto es tu 50% de la comisión de la operación. Ya está calculado: no debes dividirlo nuevamente.'}</p></div>`,
      p.estado!=='arrendada'?`<button class="btn btn-p" id="dAgendar"><i data-lucide="calendar-plus" class="ico"></i>Agendar visita</button>`:`<button class="btn btn-g" data-close>Cerrar</button>`);
    $$('.gal-th img').forEach(t=>t.addEventListener('click',()=>{$('#galMain').src=t.src;$$('.gal-th img').forEach(x=>x.classList.toggle('on',x===t));}));
    $('#dAgendar')&&$('#dAgendar').addEventListener('click',()=>openVisit(p.id));
    $('[data-close]')&&$('[data-close]').addEventListener('click',closeDrawer);
  }

  /* ================= AGENDAR VISITA ================= */
  const calendarUI=createCalendarUI({api:API,me:ME,getState:()=>S,propertyById:propById,openDrawer,closeDrawer,refresh,route,toast,esc});
  function openVisit(id,pre){calendarUI.visit(id,pre);}
  function openCalConnect(){void calendarUI.connect();}
  /* ================= MIS VISITAS ================= */
  let VF={f:'proximas',corredor:''};
  function vVisitas(){
    const adm=isAdmin();
    $('#view').innerHTML=`
      <div class="ph"><div><h1>${adm?'Visitas':'Mis visitas'}</h1><p>${adm?'Visitas agendadas por todos los corredores.':'Visitas organizadas por Corretaje Guzmán. Horarios de Santiago de Chile.'}</p></div>
        <a class="btn btn-g" href="#/propiedades"><i data-lucide="calendar-plus" class="ico"></i>Agendar visita</a></div>
      ${S.cal||adm?'':calBanner()}
      <div class="chips" id="vChips" style="${S.cal||adm?'':'margin-top:18px'}">
        ${[['hoy','Hoy'],['proximas','Próximas'],['pasadas','Pasadas']].map(([k,l])=>'<button class="chip'+(VF.f===k?' on':'')+'" data-f="'+k+'">'+l+'</button>').join('')}
        ${adm?'<select id="vC"><option value="">Todos los corredores</option>'+S.brokers.map(b=>'<option value="'+b.id+'"'+(VF.corredor===b.id?' selected':'')+'>'+esc(b.nombre)+'</option>').join('')+'</select>':''}
      </div>
      <div id="vList"></div>`;
    $$('#vChips .chip').forEach(c=>c.addEventListener('click',()=>{VF.f=c.dataset.f;$$('#vChips .chip').forEach(x=>x.classList.toggle('on',x===c));drawVisits();}));
    $('#vC')&&$('#vC').addEventListener('change',e=>{VF.corredor=e.target.value;drawVisits();});
    bindCal(); drawVisits();
  }
  function drawVisits(){
    const t=todayISO(), adm=isAdmin();
    let L=myVisits().slice();
    if(adm&&VF.corredor)L=L.filter(v=>v.owner===VF.corredor);
    if(VF.f==='hoy')L=L.filter(v=>v.fecha===t); else if(VF.f==='proximas')L=L.filter(v=>v.fecha>=t); else L=L.filter(v=>v.fecha<t);
    L.sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora)); if(VF.f==='pasadas')L.reverse();
    if(!L.length){$('#vList').innerHTML='<div class="card empty">'+(VF.f==='hoy'?'No tienes visitas para hoy.':VF.f==='pasadas'?'Aún no hay visitas pasadas.':'No tienes visitas próximas.')+'<div style="margin-top:14px"><a class="btn btn-p btn-sm" href="#/propiedades">Agendar visita</a></div></div>';return;}
    const groups={};L.forEach(v=>(groups[v.fecha]=groups[v.fecha]||[]).push(v));
    $('#vList').innerHTML=Object.entries(groups).map(([d,vs])=>`<div class="vgroup"><h3>${d===t?'Hoy · ':''}${esc(fLong(d))}</h3>${vs.map(v=>{const p=propById(v.prop);return `
      <div class="card visit${d<t?' past':''}">
        <div class="hr">${esc(v.hora)}<small>${esc(p.comuna)}</small></div>
        <div class="vt"><b>${esc(v.cliente)}</b><span>${esc(p.titulo)}</span><span>${esc(v.propiedad_direccion||p.direccion||p.comuna)}</span>${adm?'<span class="own">'+esc(brokerName(v.owner))+'</span>':''}</div>
        <div class="va">
          <a class="btn btn-wa btn-sm" href="${waLink(v.tel,'Hola '+v.cliente.split(' ')[0]+', te recuerdo tu visita a '+p.titulo+' el '+fLong(v.fecha)+' a las '+v.hora+'.')}" target="_blank" rel="noopener"><i data-lucide="message-circle" class="ico"></i>WhatsApp</a>
          <button class="btn btn-g btn-sm" data-prop="${p.id}"><i data-lucide="home" class="ico"></i>Ver propiedad</button>
          ${calendarLink(v)?'<a class="btn btn-g btn-sm" href="'+esc(calendarLink(v))+'" target="_blank" rel="noopener">Ver en Calendar</a>':'<span class="mnote">Calendar pendiente</span>'+(v.owner===ME.id?'<button class="btn btn-g btn-sm" data-calendar-retry="'+esc(v.id)+'">Reintentar Calendar</button>':'')}
        </div>
      </div>`;}).join('')}</div>`).join('');
    $$('#vList [data-calendar-retry]').forEach(b=>b.addEventListener('click',()=>calendarUI.retry(b.dataset.calendarRetry,b)));
    $$('#vList [data-prop]').forEach(b=>b.addEventListener('click',()=>openProp(b.dataset.prop)));
    icons();
  }


  /* ================= COMISIONES =================
     El administrador registra los montos recibidos.
     Cada mes parte de nuevo en N° 1 y los meses se acumulan. */
  const MESES_L=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const ymKey=iso=>iso.slice(0,7);
  const ymLabel=k=>{const [y,m]=k.split('-').map(Number);return MESES_L[m-1].replace(/^./,s=>s.toUpperCase())+' '+y;};
  let CF={corredor:'',open:{}};
  const finance=createFinanceUI({api:API,me:ME,getState:()=>S,openDrawer,closeDrawer,refresh,toast,esc,icons});
  function vComisiones(){finance.commissions();}
  /* ================= MI CUENTA ================= */
  function vCuenta(){
    const u=isAdmin()?ADMIN:ME;
    $('#view').innerHTML=`
      <div class="ph"><div><h1>Mi cuenta</h1></div></div>
      <div class="card acct">
        <div class="acct-h"><button class="av-edit" id="avEdit" aria-label="Cambiar foto de perfil"><span class="av lg">${avInner(u,uKey())}</span><span class="av-cam"><i data-lucide="camera" class="ico"></i></span></button><div><b>${esc(u.nombre)}</b><span>${isAdmin()?'Administrador':'Corredor'}</span><div class="av-links"><button id="avPick">${S.fotos[uKey()]?'Cambiar foto':'Subir foto'}</button>${S.fotos[uKey()]?'<button id="avDel" class="mute">Quitar</button>':''}</div></div></div>
        <div class="arow"><div><div class="k">Correo Google</div><div class="v">${esc(u.email)}</div></div></div>
        <div class="arow"><div><div class="k">Estado de cuenta</div><div class="v"><span class="badge b-ok">Activa</span></div></div></div>
        <div class="arow"><div><div class="k">Google Calendar</div><div class="v">${S.cal?'<span class="gcal-ok"><i data-lucide="check-circle-2" class="ico"></i>Calendario de la empresa autorizado</span>':'Google Calendar no conectado'}</div></div>
          <button class="btn btn-g btn-sm" data-cal>Ver conexión central</button></div>
      </div>`;
    bindCal();
    finance.account(document.querySelector('#view'));
    const setFoto=()=>pickPhoto(changeAvatar);
    $('#avEdit').addEventListener('click',setFoto); $('#avPick').addEventListener('click',setFoto);
    $('#avDel')&&$('#avDel').addEventListener('click',()=>changeAvatar(null));

  }

  /* ================= ADMIN: CORREDORES ================= */
  function vCorredores(){
    const t=todayISO();
    $('#view').innerHTML=`
      <div class="ph"><div><h1>Corredores</h1><p>Cuentas autorizadas para entrar al portal con Google.</p></div><button class="btn btn-p" id="inv"><i data-lucide="user-plus" class="ico"></i>Invitar corredor</button></div>
      <div class="card list">
        <div class="lrow lh" style="grid-template-columns:2fr 1fr .9fr .9fr 120px"><span>Corredor</span><span>Cuenta</span><span>Prospectos</span><span>Próx. visitas</span><span style="text-align:right">Ver</span></div>
        ${S.brokers.map(b=>{const np=S.prospects.filter(p=>p.owner===b.id).length,nv=S.visits.filter(v=>v.owner===b.id&&v.fecha>=t).length;return `
        <div class="lrow" style="grid-template-columns:2fr 1fr .9fr .9fr 120px">
          <div class="c-name pname"><span class="av">${ini(b.nombre)}</span><div style="min-width:0"><b>${esc(b.nombre)}</b><span>${esc(b.email)}</span></div></div>
          <div class="c-tel">${b.estado==='activa'?'<span class="badge b-ok">Activa</span>':'<span class="badge b-warn">Invitación enviada</span>'}</div>
          <div class="c-renta money">${np}</div>
          <div class="c-dicom money">${nv}</div>
          <div class="c-acts acts"><button class="ib" data-finance="${b.id}" title="Cuenta bancaria y comisiones" aria-label="Cuenta bancaria y comisiones"><i data-lucide="wallet" class="ico"></i></button><a class="ib" href="#/prospectos?c=${b.id}" title="Ver prospectos"><i data-lucide="users-round" class="ico"></i></a><button class="ib" data-vis="${b.id}" title="Ver visitas"><i data-lucide="calendar-days" class="ico"></i></button></div>
        </div>`;}).join('')}
      </div>`;
    $$('[data-finance]').forEach(b=>b.addEventListener('click',()=>finance.broker(b.dataset.finance)));
    $$('[data-vis]').forEach(b=>b.addEventListener('click',()=>{VF.corredor=b.dataset.vis;VF.f='proximas';location.hash='#/visitas';}));
    $('#inv').addEventListener('click',()=>{
      openDrawer('Invitar corredor',`
        <p style="color:var(--ink-2);margin-bottom:18px">Cualquier cuenta de Google puede entrar al portal. El envío de invitaciones por correo todavía no está configurado.</p>
        <form id="iForm" class="fgrid" novalidate>
          <div class="f full"><label>Nombre completo</label><input name="nombre" placeholder="Ej: Dante Muñoz"><span class="err">Ingresa el nombre.</span></div>
          <div class="f full"><label>Correo de Google</label><input name="email" type="email" placeholder="nombre@gmail.com"><span class="err">Ingresa un correo válido.</span></div>
        </form>`,
        `<button class="btn btn-g" data-close>Cancelar</button><button class="btn btn-p" id="iSave">Enviar invitación</button>`);
      $('[data-close]').addEventListener('click',closeDrawer);
      $('#iSave').addEventListener('click',()=>{
        const f=$('#iForm'),n=f.elements.nombre.value.trim(),m=f.elements.email.value.trim();
        f.querySelectorAll('.f').forEach(x=>x.classList.remove('bad'));
        if(!n)f.elements.nombre.closest('.f').classList.add('bad');
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m))f.elements.email.closest('.f').classList.add('bad');
        if(f.querySelector('.bad'))return;
        pending('Invitaciones por correo');
      });
    });
  }

  installProjectImageFallback();
  installPropertyTools({getProperty:propById,refreshProperties:()=>API.properties()});
  route();
  void loadProperties();
  void calendarUI.loadStatus().then(()=>{if(!$('#drawer').classList.contains('on')&&['#/inicio','#/cuenta','#/visitas',''].includes(location.hash))route();}).catch(()=>{});
  const calendarResult=new URLSearchParams(location.search).get('calendar');
  if(calendarResult){history.replaceState(null,'',location.pathname+location.hash);toast(calendarResult==='connected'?'Calendario de Corretaje Guzmán autorizado.':'Autorización cancelada. No se cambió la conexión.');}
})().catch(error=>{
  document.querySelector('#view').replaceChildren();
  const p=document.createElement('p');p.textContent=error.message;
  const a=document.createElement('a');a.href='/portal/';a.textContent='Volver al ingreso';a.className='btn btn-p';
  document.querySelector('#view').append(p,a);
});
