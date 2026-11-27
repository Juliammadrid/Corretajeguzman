/* ============================================================
   Zumi v2 — integración con los servicios de Corretaje Guzmán
   Interfaz y recorridos del ZIP, con catálogo y servicios del sitio.
   Para usar el personaje original: window.ZUMI_IMG = '/assets/zumi.png'
   ============================================================ */
(async function(){
  if(window.top!==window||document.getElementById('zumi-root')) return;
  const ZUMI_IMG=window.ZUMI_IMG||'/assets/zumi.png';
  const ZUMI_BODY=window.ZUMI_BODY||'/assets/zumi-body.png', ZUMI_ARM=window.ZUMI_ARM||'/assets/zumi-arm.png';
  // Only the actual homepage is allowed to display the plush launcher.
  function isHomePage(pathname){
    const p=decodeURIComponent(pathname||'/').replace(/\/+$/,'').toLowerCase();
    return p===''||p==='/index.html'||p==='/home - corretaje guzman.html';
  }
  const homePage=isHomePage(location.pathname);
  let homeMinimized=false;
  const WA=['56944637680','56944717233'];
  const KEY='zumi_v2_live';
  const nf=new Intl.NumberFormat('es-CL');
  const $$=(r,s)=>r.querySelector(s);
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const money=n=>'$'+nf.format(Math.round(n));
  const PAGES={arriendos:'/arriendos',ventas:'/ventas',proyectos:'/proyectos/',parcelas:'/parcela-campo-alto-roble.html',solicitud:'/propietarios',servicios:'/Administracion%20de%20Propiedades%20-%20Corretaje%20Guzman.html',ficha:'/arriendos'};
  const R=[], V=[], ALL=[]; let catalogAvailable=false,catalogFetchedAt=0;
  const byId=id=>ALL.find(x=>x.id===id);
  const sameSite=u=>{try{const x=new URL(u,location.origin);return (x.origin===location.origin||x.hostname==='corretajeguzman.com'||x.hostname==='www.corretajeguzman.com')?x.pathname+x.search+x.hash:'';}catch{return '';}};
  const loadScript=src=>new Promise(resolve=>{const e=document.createElement('script');const timer=setTimeout(()=>{e.remove();resolve();},8000);e.src=src;e.onload=e.onerror=()=>{clearTimeout(timer);resolve();};document.head.appendChild(e);});
  await Promise.all([
    window.PROYECTOS?Promise.resolve():loadScript('/data-proyectos.js'),
    window.PARCELA_PROYECTOS?Promise.resolve():loadScript('/data-parcelas-proyectos.js')
  ]);
  const PROJ=(window.PROYECTOS||[]).filter(x=>x&&x.activa!==false&&x.desdeUF&&sameSite(x.detalle)&&x.image).map(x=>({id:x.slug,t:x.name,c:x.commune,uf:x.desdeUF,ent:x.entrega,img:sameSite(x.image),href:sameSite(x.detalle)}));
  for(const [slug,p] of Object.entries(window.PARCELA_PROYECTOS||{})){
    if(p.activa===false||!p.name||!p.desdeUF)continue;
    const lots=(p.parcelas||[]).filter(x=>(x.status||'disponible')==='disponible'&&x.uf>0);
    PROJ.push({id:'parcel:'+slug,t:p.name,c:p.sector,uf:lots.length?Math.min(...lots.map(x=>x.uf)):p.desdeUF,ent:'parcela',img:sameSite(p.heroImg),href:sameSite(p.detalle||p.ficha||'/parcelas/'+slug),parcela:true});
  }
  let knowledge=null;
  const knowledgeReady=fetch('/zumi-knowledge.json',{cache:'no-cache',signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(j=>knowledge=j).catch(()=>null);
  const loadCatalog=async()=>{try{const r=await fetch('/.netlify/functions/zumi-catalog',{cache:'no-store',signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error();const j=await r.json();if(!j.available)throw Error();R.length=0;V.length=0;ALL.length=0;for(const x of [...j.rent,...j.buy]){const href=sameSite(x.url);if(!href||!/^rec[a-zA-Z0-9]{14}$/.test(x.id)||!x.price)continue;const venta=x.kind==='buy';const y={id:x.id,op:venta?'venta':'arriendo',t:x.name,c:x.commune,dir:'',p:x.currency==='CLP'?x.price:null,uf:x.currency==='UF'?x.price:null,gc:x.commonExpensesCLP,d:x.beds,b:x.baths,e:/^(?:si|sí|[1-9]|incluido)/i.test(x.parking)?1:0,type:x.propertyType,pets:null,img:sameSite(x.image),href};(venta?V:R).push(y);ALL.push(y);}catalogAvailable=true;catalogFetchedAt=Date.now();}catch{catalogAvailable=false;}};
  let catalogReady=loadCatalog();let catalogRetryAt=0;
  async function ensureCatalog(){await catalogReady;if((!catalogAvailable||Date.now()-catalogFetchedAt>60000)&&Date.now()-catalogRetryAt>15000){catalogRetryAt=Date.now();catalogReady=loadCatalog();await catalogReady;}return catalogAvailable;}
  const CERCA={'san miguel':['San Joaquín','La Cisterna'],'santiago':['Independencia','Estación Central'],'nunoa':['Providencia','Macul'],'la florida':['Puente Alto','Macul'],'san joaquin':['San Miguel','Macul'],'independencia':['Recoleta','Santiago'],'buin':['Paine','San Bernardo'],'las condes':['Vitacura','Providencia'],'providencia':['Ñuñoa','Las Condes'],'macul':['Ñuñoa','La Florida']};
  const COMUNAS=['San Miguel','Santiago','Ñuñoa','La Florida','San Joaquín','Independencia','Las Condes','Providencia','Macul','Estación Central','La Cisterna','Recoleta','Buin','Puente Alto','Vitacura','Maipú','Villarrica','Pucón','Concón'];
  const CONFIG={planes:[['Plan Prioridad','Publicación destacada, fotos profesionales, difusión en portales y redes, evaluación del arrendatario y contrato.'],['Plan Básico','Publicación del aviso y coordinación de visitas, sin costo para el dueño.'],['Administración','Cobro mensual, pago al propietario, mantenciones y reportes. Consulta las condiciones con nuestro equipo.']]};

  /* ---------- contexto de la página ---------- */
  function pagePropertyId(){
    const p=decodeURIComponent(location.pathname);
    if(!/\/propiedad\/|Ficha Propiedad/i.test(p))return '';
    const id=new URLSearchParams(location.search).get('id')||p.match(/rec[A-Za-z0-9]{14}(?=\/|$)/)?.[0]||'';
    return /^rec[A-Za-z0-9]{14}$/.test(id)?id:'';
  }
  function pageCtx(){
    const p=decodeURIComponent(location.pathname+location.search);
    const F=window.PROYECTO_FICHAS||{}, fs=window.FICHA_SLUG||new URLSearchParams(location.search).get('slug');
    if(fs&&F[fs]){const x=F[fs];return {type:'proyecto',id:fs,name:x.name,c:x.commune,uf:x.desdeUF,ent:x.entrega};}
    const direct=PROJ.find(x=>!x.parcela&&x.href.replace(/\/$/,'')===location.pathname.replace(/\/$/,''));if(direct)return {type:'proyecto',id:direct.id,name:direct.t,c:direct.c,uf:direct.uf,ent:direct.ent};
    const PP=window.PARCELA_PROYECTOS||{}, ps=window.PARCELA_SLUG;
    if(ps&&PP[ps]){const x=PP[ps];return {type:'parcela',id:ps,name:x.name,c:x.sector||'Villarrica',uf:x.desdeUF};}
    if(/parcela/i.test(p))return {type:'parcela',name:'Campo Alto Roble',c:'Villarrica',uf:2400};
    const propertyId=pagePropertyId(), property=byId(propertyId);
    if(propertyId)return {type:property?.op==='arriendo'?'ficha-arriendo':property?.op==='venta'?'ficha-venta':'ficha',id:propertyId,name:property?.t};
    if(/Ficha Propiedad/.test(p))return {type:'ficha'};
    if(/simulador|cuanto-puedo/i.test(p))return {type:'simulador'};
    if(/Quiero Arrendar|arrendar-mi|propietarios/i.test(p))return {type:'propietario'};
    if(/Administracion|administracion/.test(p))return {type:'admin'};
    if(/Se Corredor|se-corredor/.test(p))return {type:'corredor'};
    if(/arriendos/i.test(p))return {type:'arriendos'};
    if(/Proyectos en Venta|proyectos/.test(p))return {type:'proyectos'};
    if(/ventas/i.test(p))return {type:'ventas'};
    return {type:'home'};
  }
  // Section identity is independent from rental preferences and survives only on this page.
  function sectionFromPath(pathname,query=''){
    const p=norm(decodeURIComponent(pathname||'/')).replace(/\/+$/,'');
    if(/^(?:\/propiedad(?:\/|$)|\/ficha(?:$|[ -]))/.test(p))return 'ficha';
    if(/^\/parcelas?(?:[\/ -]|$)/.test(p))return 'parcelas';
    if(/^\/proyectos?(?:[\/ .-]|$)/.test(p))return 'proyectos';
    if(/^\/(?:comprar|ventas)(?:[\/ -]|$)/.test(p))return 'ventas';
    if(/^\/arriendos(?:[\/ -]|$)/.test(p))return 'arriendos';
    if(/^\/(?:propietarios|quiero arrendar|arrendar-mi)/.test(p))return 'propietario';
    if(/^\/administracion/.test(p))return 'admin';
    if(/^\/(?:corredores|se corredor|se-corredor)/.test(p))return 'corredor';
    if(/^\/(?:solicitud|formulario de arriendo)/.test(p))return 'solicitud';
    if(/^\/(?:simulador|cuanto-puedo)/.test(p))return 'simulador';
    return 'home';
  }
  let section=sectionFromPath(location.pathname,location.search);
  const specialist=()=>['parcelas','proyectos','propietario','admin','corredor','solicitud','simulador'].includes(section);
  function sectionFocus(){
    const p=decodeURIComponent(location.pathname).replace(/\/+$/,'');
    const slug=new URLSearchParams(location.search).get('slug')||p.split('/').pop();
    if(section==='parcelas')return PROJ.find(x=>x.parcela&&(x.id==='parcel:'+slug||x.id==='parcel:'+slug.replace(/^parcela-/,'').replace(/\.html$/,'')))?.id||'';
    if(section==='proyectos')return PROJ.find(x=>!x.parcela&&x.id===slug)?.id||'';
    return '';
  }
  const SECTION_UI={
    parcelas:{hello:'Te ayudo a conocer nuestras parcelas. ¿Buscas un terreno para vivir o invertir?',options:[['Ver proyectos de parcelas','listar parcelas'],['Precios y disponibilidad','precios y disponibilidad de parcelas'],['Crédito directo','cómo funciona el crédito directo'],['Ubicación y urbanización','ubicación y servicios de las parcelas'],['Coordinar visita','quiero coordinar una visita a una parcela']],url:'/parcelas'},
    proyectos:{hello:'Te ayudo a encontrar un proyecto nuevo. ¿Buscas primera vivienda o inversión?',options:[['Ver proyectos','listar proyectos'],['Buscar por comuna','buscar proyectos por comuna'],['Pie y financiamiento','cómo funciona el pie financiado'],['Cotizar proyecto','quiero cotizar un proyecto']],url:'/proyectos/'},
    propietario:{hello:'Te ayudo a arrendar tu propiedad. ¿Quieres conocer los planes o iniciar la publicación?',options:[['Comparar planes','comparar planes de arriendo para propietarios'],['Publicar mi propiedad','iniciar publicación'],['Cómo funciona','cómo funciona el servicio de arriendo']],url:'/propietarios'},
    admin:{hello:'Te ayudo con la administración de tu propiedad. ¿Quieres conocer los costos o qué incluye el servicio?',options:[['Tarifas de administración','cuánto cuesta administrar'],['Qué incluye','qué incluye administración'],['Ya tengo arrendatario','pueden administrar una propiedad ya arrendada'],['Solicitar administración','solicitar administración']],url:'/administracion'},
    corredor:{hello:'¿Te interesa sumarte a Corretaje Guzmán como corredor? Te explico cómo empezar.',options:[['Comparar planes','comparar planes gratis y premium'],['Cómo gano dinero','cómo gano dinero como corredor'],['Requisitos','qué necesito para ser corredor'],['Postular','quiero postular como corredor']],url:'/corredores'},
    solicitud:{hello:'Te ayudo con tu solicitud de arriendo. ¿Quieres conocer los requisitos o completar el formulario?',options:[['Cómo funciona','cómo funciona la solicitud de arriendo'],['Comisión','cuál es la comisión del arrendatario'],['Completar solicitud','completar solicitud de arriendo']],url:'/solicitud'},
    simulador:{hello:'Te ayudo a estimar cuánto podrías comprar. ¿Quieres simular tu capacidad o conocer cómo funciona el pie?',options:[['Simular capacidad','abrir simulador'],['Cómo se calcula','cómo se calcula mi capacidad de compra'],['Pie financiado','cómo funciona el pie financiado']],url:'/simulador-capacidad/'},
    ventas:{hello:'Te ayudo a encontrar una propiedad en venta. ¿En qué comuna buscas?',options:[['Buscar propiedades en venta','busco comprar'],['Proyectos nuevos','proyectos nuevos'],['Cuánto puedo comprar','cuanto puedo comprar']],url:'/comprar'}
  };
  function sectionRows(kind=section){
    return kind==='parcelas'?PROJ.filter(x=>x.parcela).concat(V.filter(x=>norm(x.type)==='parcela')):kind==='proyectos'?PROJ.filter(x=>!x.parcela):[];
  }
  function sectionMenu(){
    const ui=SECTION_UI[section];if(!ui)return false;
    const focus=sectionRows().find(x=>x.id===sectionFocus());
    add(focus?'Hola, estás viendo <b>'+esc(focus.t)+'</b>. ¿Quieres conocer precios, características o coordinar una visita?':esc(ui.hello));
    chips(ui.options.map(([t,q])=>({t,q})).concat({t:'Otros servicios',act:'sectionhome'}));
    return true;
  }
  function sectionContact(){
    const ui=SECTION_UI[section];if(!ui)return;
    const subject=sectionRows().find(x=>x.id===sectionFocus());
    const message='Hola, vengo desde Zumi y quiero información sobre '+(subject?.t||ui.url.replaceAll('/',' ')||'el servicio')+'.';
    chips([{t:'Contactar por WhatsApp',href:'/.netlify/functions/property-whatsapp?text='+encodeURIComponent(message),blank:true,cls:'wa'},{t:'Ver sección',href:ui.url}]);
  }
  function sectionFormChips(){
    if(section==='propietario')return showOwnerForm();
    const ui=SECTION_UI[section];if(ui)chips([{t:section==='simulador'?'Abrir simulador':section==='corredor'?'Ir a postulación':section==='propietario'?'Publicar propiedad':section==='admin'?'Solicitar administración':'Completar solicitud',href:ui.url,cls:'pri'}]);
  }
  function explicitSectionSwitch(t){
    const q=norm(t);
    if(/^(?:volver al inicio|otros servicios|menu principal|empezar de nuevo)$/.test(q))return 'home';
    if(/\b(?:busco arriendo|quiero arrendar (?:un|una)|buscar arriendo)\b/.test(q))return 'arriendos';
    if(/\b(?:busco comprar|propiedades en venta|quiero comprar (?:una casa|un departamento))\b/.test(q))return 'ventas';
    if(/^(?:parcelas|proyectos de parcelas|busco parcelas)$/.test(q))return 'parcelas';
    if(/^(?:proyectos nuevos|ver proyectos nuevos)$/.test(q))return 'proyectos';
    if(/^(?:arrendar mi propiedad|publicar mi propiedad)$/.test(q))return 'propietario';
    if(/^(?:administracion de propiedades|quiero administrar mi propiedad)$/.test(q))return 'admin';
    if(/^(?:se corredor|quiero ser corredor)$/.test(q))return 'corredor';
    return '';
  }
  function switchSection(next){if(!next||next===section)return false;section=next;S.flow=null;S.await=null;S.sectionHist=[];if(next==='ventas')S.voiceOperation='buy';if(next==='arriendos')S.voiceOperation='rent';save();return true;}
  const OWNER_PLANS=['Plan Prioridad','Plan Básico','No estoy seguro','Quiero asesoría'];
  const OWNER_TYPES=['Departamento','Casa','Estudio','Oficina','Parcela','Otro'];
  function ownerPlan(value){const q=norm(value);return /prioridad/.test(q)?OWNER_PLANS[0]:/basico/.test(q)?OWNER_PLANS[1]:/asesor/.test(q)?OWNER_PLANS[3]:/seguro/.test(q)?OWNER_PLANS[2]:'';}
  function ownerIntent(value){const q=norm(value).trim();
    if(/^(?:comparar planes|conocer los planes|que plan me conviene|ver planes|diferencia entre (?:los )?planes)/.test(q))return 'plans';
    if(/^(?:iniciar publicacion|inscribir mi propiedad|publicar mi propiedad|completar formulario|quiero (?:inscribir|publicar|avanzar)|avanzar|quiero (?:el )?plan (?:prioridad|basico)|plan (?:prioridad|basico))/.test(q))return 'form';
    return '';
  }
  function showOwnerPlans(){
    switchSection('propietario');S.flow=null;S.await=null;
    if(call){call.viewer?.close();compactVoice();}
    add('Estos son nuestros dos planes para arrendar tu propiedad. Elige el que más te acomode y te ayudo a inscribirla.');
    block('<div class="zw-owner-plans"><a href="/assets/planes-propietarios-original.jpg" target="_blank" rel="noopener" aria-label="Ampliar comparación de planes"><img src="/assets/planes-propietarios-original.jpg" alt="Plan Prioridad: 50% de un mes de arriendo, solo al concretarlo. Plan Básico: 0% de comisión para el propietario."></a></div>');
    chips([{t:'Quiero Plan Prioridad',act:'ownerform',id:'prioridad',cls:'pri'},{t:'Quiero Plan Básico',act:'ownerform',id:'basico'},{t:'Inscribir mi propiedad',act:'ownerform'},{t:'Hablar con un ejecutivo',act:'sectioncontact'}]);
  }
  function showOwnerForm(preferred=''){
    switchSection('propietario');S.flow=null;S.await=null;
    if(call){call.viewer?.close();compactVoice();}
    const plan=ownerPlan(preferred);
    const current=msgs.querySelector('form[data-owner-form]');
    if(current){if(plan){for(const el of current.querySelectorAll('input[name=plan]'))el.checked=el.value===plan;}current.scrollIntoView({block:'start'});return;}
    const opts=(list,optional=false)=>'<option value="">'+(optional?'Selecciona si corresponde…':'Selecciona…')+'</option>'+list.map(x=>'<option value="'+esc(x[1])+'">'+esc(x[0])+'</option>').join('');
    const plans=OWNER_PLANS.map((name,i)=>'<label class="zw-owner-plan"><input type="radio" name="plan" value="'+esc(name)+'"'+(i===0?' required':'')+(name===plan?' checked':'')+'> '+esc(name)+'</label>').join('');
    add('Perfecto. Completa tus datos y los de tu propiedad aquí mismo. Nuestro equipo recibirá tu solicitud.');
    block('<form class="zw-owner-form" data-owner-form><strong>Inscribir mi propiedad</strong><small>Completa el formulario de Corretaje Guzmán. Los campos marcados como opcionales puedes dejarlos en blanco.</small><h4>Tus datos</h4><label>Nombre y apellido<input name="nombre" autocomplete="name" maxlength="100" required placeholder="Ej: Patricio Soto"></label><label>WhatsApp (+56)<input type="tel" name="whatsapp" autocomplete="tel" maxlength="20" required placeholder="9 1234 5678"></label><label>Correo electrónico<input type="email" name="email" autocomplete="email" maxlength="150" required placeholder="tucorreo@ejemplo.cl"></label><h4>Tu propiedad</h4><label>Tipo de propiedad<select name="tipo" required>'+opts(OWNER_TYPES.map(v=>[v,v]))+'</select></label><label>Comuna<input name="comuna" maxlength="100" required placeholder="Ej: Providencia"></label><label>Dirección (opcional)<input name="direccion" maxlength="200" placeholder="Calle y número"></label><div class="zw-owner-row"><label>Dormitorios<select name="dormitorios">'+opts([['Estudio','0'],['1','1'],['2','2'],['3','3'],['4 o más','4']],true)+'</select></label><label>Baños<select name="banos">'+opts([['1','1'],['2','2'],['3 o más','3']],true)+'</select></label></div><label>Valor de arriendo estimado (opcional)<input name="valor" inputmode="numeric" maxlength="14" placeholder="$450.000"></label><h4>Plan de interés</h4><div class="zw-owner-row">'+plans+'</div><label class="zw-owner-consent"><input type="checkbox" name="acepta" required> Autorizo a Corretaje Guzmán a contactarme para gestionar el arriendo de mi propiedad.</label><small>Consulta nuestra <a href="/politica-de-privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</small><button type="submit">Enviar e inscribir mi propiedad</button><div class="zw-owner-status" role="alert"></div></form>');
    const form=msgs.querySelector('form[data-owner-form]');requestAnimationFrame(()=>form?.scrollIntoView({block:'start',behavior:'smooth'}));
  }
  function ownerPhone(value){
    let d=String(value||'').replace(/\D/g,'');if(d.startsWith('56')&&d.length===11)d=d.slice(2);
    return /^9\d{8}$/.test(d)?'+56'+d:'';
  }
  function ownerPayload(values){
    const phone=ownerPhone(values.whatsapp);
    const nombre=String(values.nombre||'').trim(),email=String(values.email||'').trim(),comuna=String(values.comuna||'').trim();
    if(!nombre||!phone||!/^\S+@\S+\.\S+$/.test(email)||!comuna||!OWNER_TYPES.includes(values.tipo)||!OWNER_PLANS.includes(values.plan)||!values.acepta)throw Error('Revisa tus datos y acepta la autorización de contacto.');
    const result={nombre,whatsapp:phone,email,tipo:values.tipo,comuna,direccion:String(values.direccion||'').trim(),plan:values.plan,acepta:true,origen:'Zumi · Propietarios',etapa:'Formulario completo',fecha_envio:new Date().toISOString()};
    for(const k of ['dormitorios','banos'])if(values[k]!==''&&values[k]!=null)result[k]=Number(values[k]);
    const v=String(values.valor||'').replace(/\D/g,'');if(v)result.valor=Number(v);
    return result;
  }
  async function submitOwnerForm(form){
    if(!form.reportValidity()||form.dataset.submitting==='1')return;
    const status=form.querySelector('.zw-owner-status'),button=form.querySelector('button[type=submit]');
    let payload;
    try{payload=ownerPayload(Object.fromEntries(new FormData(form)));}catch(e){status.textContent=e.message;return;}
    status.textContent='';form.dataset.submitting='1';button.disabled=true;button.textContent='Enviando…';
    try{
      const r=await fetch('/api/lead-propietario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(18000)});
      const j=await r.json().catch(()=>null);
      if(!r.ok||!j?.ok||!/^rec[A-Za-z0-9]{14}$/.test(j.id||''))throw Error('No se confirmó el registro.');
      form.parentElement.remove();save();
      add('¡Listo! Recibimos tu solicitud de arriendo. Nuestro equipo se pondrá en contacto contigo para coordinar la publicación.');
      chips([{t:'Hablar con un ejecutivo',act:'sectioncontact'}]);pose('success',1600);
    }catch(e){
      status.textContent='No pude confirmar que tu solicitud se registró. Puedes reintentar sin volver a completar tus datos.';
      form.dataset.submitting='0';button.disabled=false;button.textContent='Reintentar envío';
    }
  }

  async function askSpecial(v){
    const q=norm(v);
    if(/^(?:listar parcelas|listar proyectos)$/.test(q)){
      await ensureCatalog();const rows=sectionRows();
      return bot(rows.length?'Estas son las opciones publicadas actualmente.':'Por ahora no encontré proyectos publicados.',()=>{if(rows.length)showCards(rows);sectionContact();});
    }
    if(section==='propietario'){
      const intent=ownerIntent(v);if(intent==='plans')return showOwnerPlans();if(intent==='form')return showOwnerForm(v);
    }
    if(/^(?:solicitar administracion|quiero postular como corredor|completar solicitud de arriendo|abrir simulador)$/.test(q))return bot('Te dejo el acceso directo para que puedas continuar.',sectionFormChips);
    if(/^(?:coordinar visita|quiero coordinar una visita a una parcela|quiero cotizar un proyecto|hablar con un ejecutivo)$/.test(q))return bot('Te conecto con nuestro equipo para confirmar los detalles.',sectionContact);
    return askAI(v,section);
  }

  /* ---------- calculadora de compra (supuestos referenciales) ---------- */
  const CALC={div:0.25,anios:25,tasa:0.045,fin:0.80,uf:39500};
  function parseMoney(t){
    const s=norm(t).replace(/\$/g,'');let m;
    const out={};
    const grab=(re)=>{const mm=s.match(re);if(!mm)return null;let v=mm[1].replace(/\./g,'').replace(',','.');v=parseFloat(v);
      const u=mm[2]||'';if(/mill|palo|m\b/.test(u))v*=1e6;else if(/luca|mil|k\b/.test(u))v*=1e3;else if(v<10000)v*=(v<100?1e6:1e3);return Math.round(v);};
    const rr=/(?:gano|ganamos|ganan|renta|sueldo|ingreso|liquido|recibo|sumamos)[^0-9]{0,20}([0-9][0-9.,]*)\s*(millones?|millon|palos?|lucas?|mil|k)?/;
    const pr=/pie[^0-9]{0,15}([0-9][0-9.,]*)\s*(millones?|millon|palos?|lucas?|mil|k)?/;
    out.renta=grab(rr);out.pie=grab(pr)||grab(/([0-9][0-9.,]*)\s*(millones?|millon|palos?|lucas?|mil|k)?\s*(?:de|en|para el)?\s*pie/);
    if(!out.renta&&!out.pie){const mm=s.match(/([0-9][0-9.,]*)\s*(millones?|millon|palos?|lucas?|mil|k)?/);if(mm)out.solo=grab(/([0-9][0-9.,]*)\s*(millones?|millon|palos?|lucas?|mil|k)?/);}
    out.comp=/complement|con mi (pareja|esposa|marido|polola|pololo)|entre los dos|sumamos/.test(s);
    return out;
  }
  function capacidad(renta){
    const r=Math.pow(1+CALC.tasa,1/12)-1,n=CALC.anios*12,div=renta*CALC.div;
    const credCLP=div*(1-Math.pow(1+r,-n))/r, credUF=credCLP/CALC.uf;
    return {div,credUF,precioUF:credUF/CALC.fin,pieUF:credUF/CALC.fin*(1-CALC.fin)};
  }
  function allProjects(){return PROJ.filter(x=>!x.parcela);}
  function calcResult(renta,pie){
    const c=capacidad(renta), ufN=v=>'UF '+nf.format(Math.round(v));
    const fits=allProjects().filter(p=>p.uf<=c.precioUF).sort((a,b)=>b.uf-a.uf);
    fits.forEach(p=>{if(!PROJ.find(q=>q.id===p.id))PROJ.push(p);});
    S.calc={renta,pie,precioUF:Math.round(c.precioUF)};S.await=null;save();
    let pieTx='';
    if(pie){const pu=pie/CALC.uf;pieTx=pu>=c.pieUF?'<br>✓ Tu pie de <b>'+money(pie)+'</b> alcanza para el 20% requerido.':'<br>Tu pie de <b>'+money(pie)+'</b> cubre parte del 20%. Varios proyectos ofrecen <b>pie en cuotas</b> para completarlo.';}
    const html='Con una renta de <b>'+money(renta)+'</b>, podrías acceder a una propiedad de hasta <b>'+ufN(c.precioUF)+'</b> aprox.<div class="zw-calc"><div><small>Dividendo máx.</small><b>'+money(c.div)+'</b></div><div><small>Crédito aprox.</small><b>'+ufN(c.credUF)+'</b></div><div><small>Pie (20%)</small><b>'+ufN(c.pieUF)+'</b></div></div>'+pieTx+'<br><span class="zw-ref">Referencial</span><span class="zw-note">Estimación referencial (25 años, tasa 4,5%, 80% de financiamiento). La evaluación final la hace el banco.</span>';
    bot(html,()=>{
      if(fits.length){bot('Estos proyectos calzan con tu capacidad:',()=>{showCards(fits.slice(0,4));chips([{t:'Ver todos los proyectos',href:PAGES.proyectos},'Complemento renta',{t:'Hablar con un ejecutivo',act:'human'}]);},500);}
      else bot('Con esa renta aún no calza ningún proyecto, pero si <b>complementas renta</b> con otra persona tu capacidad aumenta bastante.',()=>chips(['Complemento renta','Ver arriendos',{t:'Hablar con un ejecutivo',act:'human'}]),500);
    },700);
  }
  function startCalc(o){
    if(o&&o.renta)return calcResult(o.renta,o.pie);
    S.await='calc';save();
    bot('¡Te calculo cuánto puedes comprar! 🏡 ¿Cuál es tu <b>renta líquida mensual</b>? Si tienes pie, dímelo también (ej: <i>gano 1.500.000 y tengo 5 millones de pie</i>).',()=>chips(['$1.000.000','$1.500.000','$2.000.000','$3.000.000']));
  }

  /* ---------- estado persistente ---------- */
  let S;
  try{S=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){S=null;}
  if(!S) S={html:'',prefs:{},flow:null,last:[],favs:[],sound:true,open:false,hidden:false,started:false};
  const KN={comuna:v=>v,budget:v=>'Hasta '+money(v),uf:v=>'Hasta UF '+nf.format(v),dorm:v=>v+' dorm',banos:v=>v+' baños',est:()=>'Con estacionamiento',pets:()=>'Con mascota',tipo:v=>v,bodega:()=>'Con bodega',amob:()=>'Amoblado'};
  function renderKnow(){
    const el=document.getElementById('zwKnow');if(!el)return;
    const p=S.prefs||{},items=Object.keys(KN).filter(k=>p[k]!=null&&p[k]!==false&&p[k]!=='').map(k=>[k,KN[k](p[k])]);
    if(S.calc&&S.calc.renta)items.push(['calc','Renta '+money(S.calc.renta)]);
    el.innerHTML=items.length?'<span class="lb">Lo que sé de ti</span>'+items.map(([k,t])=>'<button class="kc" data-k="'+k+'" title="Quitar">'+esc(t)+'<i>×</i></button>').join(''):'';
    el.classList.toggle('on',!!items.length);
  }
  const save=()=>{renderKnow();try{S.html=msgs?msgs.innerHTML:S.html;localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};

  /* ---------- estilos ---------- */
  const css=`
#zumi-root{--zv:#7c3aed;--zvd:#6b27d6;--zvdd:#4c1d95;--zt:#f2ecfe;--zk:#16121f;--zk2:#5a5370;--zk3:#958fab;--zl:#ece6f6;font-family:'Hanken Grotesk',system-ui,sans-serif;position:fixed;right:20px;bottom:20px;z-index:2147483000;-webkit-font-smoothing:antialiased;transition:bottom .3s}
#zumi-root *{box-sizing:border-box}
:where(#zumi-root button){font-family:inherit;cursor:pointer;border:0;background:none;color:inherit;padding:0}
#zumi-root a{text-decoration:none}
.zw-dock{display:flex;align-items:flex-end;gap:10px}
.zw-bubble{position:relative;background:#fff;border:1px solid var(--zl);border-radius:16px 16px 4px 16px;padding:12px 14px 13px 16px;box-shadow:0 12px 34px rgba(76,29,149,.16);max-width:224px;animation:zIn .45s cubic-bezier(.2,.8,.2,1) both}
.zw-bubble b{display:block;font-family:'Sora',sans-serif;font-size:14px;color:var(--zk)}
.zw-bubble span{display:block;font-size:12.5px;color:var(--zk2);margin-top:2px}
.zw-cta{margin-top:9px;display:inline-flex;align-items:center;gap:7px;background:var(--zv);color:#fff;font-weight:700;font-size:13px;padding:8px 13px;border-radius:50px;box-shadow:0 6px 16px rgba(124,58,237,.35)}
.zw-cta:hover{background:var(--zvd)}
.zw-x{position:absolute;top:-9px;left:-9px;width:24px;height:24px;border-radius:50%;background:#fff;border:1px solid var(--zl);display:grid;place-items:center;color:var(--zk3);box-shadow:0 3px 8px rgba(0,0,0,.08)}
.zw-x:hover{color:var(--zk)}
#zumi-root.open .zw-bubble{display:none}
#zumi-root .zw-dock{display:none}
#zumi-root.home-mascot:not(.open) .zw-dock{display:flex}
#zumi-root.open .zw-dock{display:none}
#zumi-root .zw-peek{position:absolute;right:0;bottom:0;width:58px;height:58px;border-radius:50%;background:var(--zv);color:#fff;display:grid;place-items:center;box-shadow:0 10px 24px rgba(124,58,237,.4);padding:0;transition:transform .2s}
#zumi-root .zw-peek:hover{transform:scale(1.04)}
#zumi-root .zw-peek:focus-visible{outline:3px solid #c4b5fd;outline-offset:3px}
#zumi-root.open .zw-peek,#zumi-root.home-mascot .zw-peek{display:none}
#zumi-root .zw-cards[hidden]{display:none}
/* personaje */
.zw-char{position:relative;width:100px;height:119px;flex:none}
.zw-z{position:absolute;inset:0}
.zw-z img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none}
.zw-z .zb{filter:drop-shadow(0 10px 16px rgba(76,29,149,.26))}
.zw-z .za{transform-origin:81.7% 48.6%;transition:transform .5s cubic-bezier(.3,.8,.3,1)}
.zw-z .lid{position:absolute;width:6.6%;height:5.6%;border-radius:50%;background:rgb(245,219,218);transform:translate(-50%,-50%) scaleY(0);animation:zLid 5.2s infinite}
.zw-z .lid.l{left:36.7%;top:23.9%}.zw-z .lid.r{left:59.8%;top:21.9%;animation-delay:.02s}
#zumi-root[data-zs=idle] .za{animation:zSway 4.2s ease-in-out infinite}
#zumi-root[data-zs=greet] .za{animation:zHi .6s ease-in-out 4}
#zumi-root[data-zs=greet] .zw-body{animation:zGreetB 2.4s ease-in-out}
#zumi-root[data-zs=point] .za{transform:rotate(-26deg)}
#zumi-root[data-zs=point] .zw-body{transform:rotate(-3deg)}
#zumi-root[data-zs=listen] .zw-body{transform:rotate(-6deg) translateY(1px)}
#zumi-root[data-zs=listen] .za{transform:rotate(-8deg)}
#zumi-root[data-zs=speak] .zw-body{animation:zTalkB .55s ease-in-out infinite}
#zumi-root[data-zs=speak] .za{animation:zSway 1.1s ease-in-out infinite}
#zumi-root[data-zs=success] .za{animation:zHi .35s ease-in-out 5}
#zumi-root[data-zs=success] .zw-body{animation:zHop .55s ease-in-out 2}
#zumi-root[data-zs=wait] .za{transform:rotate(-3deg)}
.zw-mini{overflow:hidden;background:radial-gradient(circle at 50% 30%,#fff,#efe7ff)!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)!important}
.zw-mini::before,.zw-mini::after{display:none}
.zw-mini img{width:100%;height:100%;object-fit:cover;object-position:50% 6%;transform:scale(1.55) translateY(14%);border-radius:0}
.zw-hit{position:absolute;left:18px;right:18px;top:10px;bottom:14px;border-radius:40%;cursor:pointer;z-index:4}
.zw-char .glow{position:absolute;left:50%;bottom:2px;width:70px;height:14px;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(76,29,149,.32),transparent);border-radius:50%;animation:zShadow 3.2s ease-in-out infinite}
.zw-body{position:absolute;inset:0;animation:zBreathe 3.4s ease-in-out infinite;transform-origin:50% 100%;transition:transform .5s}
.zw-body>img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(76,29,149,.28))}
.zw-ph{position:absolute;left:12px;right:12px;bottom:10px;top:8px;border-radius:46% 46% 42% 42%;background:radial-gradient(circle at 34% 28%,#d8c8ff 0,#a881f7 34%,#7c3aed 70%,#5b21b6 100%);box-shadow:inset -6px -10px 18px rgba(46,16,101,.45),inset 6px 8px 14px rgba(255,255,255,.35),0 12px 22px rgba(76,29,149,.32)}
.zw-ph::before,.zw-ph::after{content:"";position:absolute;top:-6px;width:22px;height:26px;border-radius:50% 50% 40% 40%;background:#8b5cf6;box-shadow:inset -3px -4px 6px rgba(46,16,101,.35)}
.zw-ph::before{left:8px;transform:rotate(-14deg)}.zw-ph::after{right:8px;transform:rotate(14deg)}
.zw-eye{position:absolute;top:36%;width:11px;height:14px;border-radius:50%;background:#1b1030;animation:zBlink 5.5s infinite;transition:transform .3s}
.zw-eye::after{content:"";position:absolute;top:2px;left:2px;width:4px;height:4px;border-radius:50%;background:#fff}
.zw-eye.l{left:28%}.zw-eye.r{right:28%}
.zw-cheek{position:absolute;top:53%;width:12px;height:6px;border-radius:50%;background:rgba(255,160,200,.55)}
.zw-cheek.l{left:17%}.zw-cheek.r{right:17%}
.zw-mouth{position:absolute;top:56%;left:50%;width:14px;height:7px;transform:translateX(-50%);border-bottom:2.5px solid #1b1030;border-radius:0 0 12px 12px;transition:all .25s}
.zw-arm{position:absolute;top:50%;width:19px;height:34px;border-radius:11px;background:linear-gradient(180deg,#9b6cf8,#7c3aed);box-shadow:inset -3px -4px 6px rgba(46,16,101,.35);transform-origin:50% 12%;transition:transform .55s cubic-bezier(.3,.8,.3,1);z-index:3}
.zw-arm.l{left:7px}.zw-arm.r{right:7px}
/* estados */
#zumi-root[data-zs=idle] .zw-arm.l{transform:rotate(-78deg) translate(8px,2px)}
#zumi-root[data-zs=idle] .zw-arm.r{transform:rotate(78deg) translate(-8px,6px)}
#zumi-root[data-zs=greet] .zw-arm.l{animation:zWave 1.1s ease-in-out 2}
#zumi-root[data-zs=greet] .zw-mouth{height:9px;width:16px;border-bottom-width:3px}
#zumi-root[data-zs=point] .zw-arm.l{transform:rotate(112deg)}
#zumi-root[data-zs=point] .zw-eye{transform:translateX(-2px)}
#zumi-root[data-zs=listen] .zw-arm.r{transform:rotate(-158deg) translate(2px,4px)}
#zumi-root[data-zs=listen] .zw-body{transform:rotate(-6deg)}
#zumi-root[data-zs=listen] .zw-mouth{width:9px;height:9px;border:2.5px solid #1b1030;border-radius:50%}
#zumi-root[data-zs=speak] .zw-arm.l{animation:zTalkL 1.4s ease-in-out infinite}
#zumi-root[data-zs=speak] .zw-arm.r{animation:zTalkR 1.4s ease-in-out infinite}
#zumi-root[data-zs=speak] .zw-mouth{animation:zMouth .32s ease-in-out infinite}
#zumi-root[data-zs=success] .zw-arm.l{transform:rotate(150deg)}
#zumi-root[data-zs=success] .zw-arm.r{transform:rotate(-150deg)}
#zumi-root[data-zs=success] .zw-body{animation:zHop .6s ease-in-out 2}
#zumi-root[data-zs=success] .zw-mouth{width:18px;height:10px;border-bottom-width:3px}
#zumi-root[data-zs=wait] .zw-arm.l{transform:rotate(-12deg)}
#zumi-root[data-zs=wait] .zw-arm.r{transform:rotate(12deg)}
/* panel */
.zw-panel{position:absolute;right:0;bottom:0;width:384px;height:min(660px,calc(100dvh - 40px));background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(20,15,30,.28);display:flex;flex-direction:column;overflow:hidden;transform-origin:100% 100%;transform:translateY(28px) scale(.97);opacity:0;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
#zumi-root.open .zw-panel{transform:none;opacity:1;pointer-events:auto}
.zw-head{position:relative;background:linear-gradient(135deg,#1d1238 0%,#4c1d95 55%,#7c3aed 100%);color:#fff;padding:14px 12px 15px 16px;display:flex;align-items:center;gap:10px;flex:none}
.zw-head::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:22px 22px;-webkit-mask-image:linear-gradient(200deg,#000,transparent 70%);mask-image:linear-gradient(200deg,#000,transparent 70%);pointer-events:none}
.zw-mini{position:relative;width:40px;height:40px;flex:none;border-radius:50%;background:radial-gradient(circle at 34% 28%,#d8c8ff,#8b5cf6 60%,#5b21b6);box-shadow:inset -3px -5px 8px rgba(46,16,101,.45)}
.zw-mini::before,.zw-mini::after{content:"";position:absolute;top:15px;width:5px;height:7px;border-radius:50%;background:#1b1030}
.zw-mini::before{left:12px}.zw-mini::after{right:12px}
.zw-mini img{width:100%;height:100%;object-fit:contain;border-radius:50%}
.zw-hd{flex:1;min-width:0;position:relative;z-index:1}
.zw-hd b{display:block;font-family:'Sora',sans-serif;font-size:15.5px}
.zw-hd span{display:flex;align-items:flex-start;gap:6px;font-size:11.5px;line-height:1.3;opacity:.85}
.zw-hd span i{flex:none;margin-top:3px}
.zw-hd span i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.25)}
.zw-hb{position:relative;z-index:1;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#fff}
.zw-hb:hover{background:rgba(255,255,255,.22)}
.zw-menu{position:absolute;top:56px;right:10px;z-index:6;background:#fff;border-radius:14px;box-shadow:0 18px 44px rgba(20,15,30,.22);padding:6px;width:210px;display:none}
.zw-menu.on{display:block}
.zw-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:9px;font-size:13.5px;font-weight:600;color:var(--zk);text-align:left}
.zw-menu button:hover{background:#f6f4fa}
.zw-msgs{flex:1;overflow-y:auto;padding:16px 14px 10px;background:#faf9fd;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
.zw-m{max-width:88%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.48;color:var(--zk);animation:zIn .35s cubic-bezier(.2,.8,.2,1) both}
.zw-m.bot{background:#fff;border:1px solid var(--zl);border-bottom-left-radius:5px}
.zw-m.me{background:var(--zv);color:#fff;margin-left:auto;border-bottom-right-radius:5px}
.zw-m.sys{align-self:center;background:none;color:var(--zk3);font-size:12px;padding:2px}
.zw-typing{display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid var(--zl);border-radius:16px;border-bottom-left-radius:5px;width:max-content}
.zw-typing i{width:7px;height:7px;border-radius:50%;background:#b9a7e8;animation:zDot 1.1s infinite}
.zw-typing i:nth-child(2){animation-delay:.15s}.zw-typing i:nth-child(3){animation-delay:.3s}
.zw-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.zw-acts .zw-act:last-child:nth-child(odd){grid-column:1/-1}
#zumi-root.kb #zwKnow,#zumi-root.kb .zw-legal{display:none!important}
#zumi-root.kb .zw-head{padding-top:8px;padding-bottom:8px}
.zw-act{display:flex;flex-direction:column;gap:7px;text-align:left;background:#fff;border:1px solid var(--zl);border-radius:14px;padding:12px;font-weight:700;font-size:13px;color:var(--zk);transition:border-color .15s,transform .15s,box-shadow .15s}
.zw-act:hover{border-color:#cdbcf3;transform:translateY(-2px);box-shadow:0 8px 20px rgba(76,29,149,.1)}
.zw-act .ic{width:32px;height:32px;border-radius:10px;background:var(--zt);color:var(--zvd);display:grid;place-items:center}
.zw-act small{font-weight:500;font-size:11.5px;color:var(--zk3);margin-top:-3px}
.zw-chips{display:flex;gap:6px;flex-wrap:wrap}
.zw-chips button,.zw-chips a{border:1px solid var(--zl);background:#fff;border-radius:50px;padding:7px 12px;font-size:12.5px;font-weight:600;color:var(--zk2);display:inline-flex;align-items:center;gap:6px}
.zw-chips button:hover,.zw-chips a:hover{border-color:var(--zv);color:var(--zvd)}
.zw-chips .pri{background:var(--zv);border-color:var(--zv);color:#fff}
.zw-chips .pri:hover{background:var(--zvd);color:#fff}
.zw-chips .wa{background:#1faf54;border-color:#1faf54;color:#fff}
.zw-cards{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 6px;margin:0 -2px;scrollbar-width:none}
.zw-cards::-webkit-scrollbar{display:none}
.zw-card{flex:0 0 232px;scroll-snap-align:start;background:#fff;border:1px solid var(--zl);border-radius:14px;overflow:hidden}
.zw-card .im{height:120px;background:linear-gradient(135deg,#efe9fb,#e3d8fb) center/cover no-repeat;position:relative}
.zw-card .im .tag{position:absolute;left:8px;top:8px;background:#fff;color:var(--zvdd);font-size:10.5px;font-weight:800;padding:4px 8px;border-radius:50px}
.zw-card .im .tag.g{color:#1f8a5b}
.zw-card .fav{position:absolute;right:8px;top:8px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.95);display:grid;place-items:center;color:var(--zk3)}
.zw-card .fav.on{color:#e11d48}
.zw-card .bd{padding:10px 11px 11px}
.zw-card .pr{font-family:'Sora',sans-serif;font-weight:700;font-size:15.5px;color:var(--zk)}
.zw-card .pr small{font-family:'Hanken Grotesk',sans-serif;font-size:11px;font-weight:600;color:var(--zk3)}
.zw-card .ti{font-size:12.5px;font-weight:600;color:var(--zk);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zw-card .ad{font-size:11.5px;color:var(--zk3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.zw-card .sp{display:flex;gap:8px;font-size:11.5px;color:var(--zk2);margin-top:5px;flex-wrap:wrap}
.zw-card .gc{font-size:11px;color:var(--zk3);margin-top:3px}
.zw-card .bt{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
.zw-card .bt a,.zw-card .bt button{text-align:center;font-weight:700;font-size:11.5px;padding:8px 4px;border-radius:9px}
.zw-card .bt>*:first-child{background:var(--zt);color:var(--zvdd)}
.zw-card .bt>*:last-child{background:var(--zv);color:#fff}
.zw-sum{background:#fff;border:1px solid var(--zl);border-radius:14px;padding:4px 14px}
.zw-sum div{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #f2eef8;font-size:13px}
.zw-sum div:last-child{border-bottom:0}
.zw-sum span{color:var(--zk3);width:78px;flex:none}
.zw-sum b{color:var(--zk);font-weight:600}

.zw-owner-plans{width:100%;border:1px solid var(--zl);border-radius:15px;overflow:hidden;background:#100b1e}
.zw-owner-plans a{display:block}.zw-owner-plans img{display:block;width:100%;height:auto;max-width:100%;border-radius:14px}
.zw-owner-form{display:grid;gap:12px;background:#fff;border:1px solid var(--zl);border-radius:15px;padding:14px;color:var(--zk);font-size:13px;width:100%;min-width:0}
.zw-owner-form strong{font-size:17px}.zw-owner-form small{color:var(--zk2);line-height:1.35}
.zw-owner-form h4{margin:4px 0 0;font-size:11px;text-transform:uppercase;color:#6b27d6;letter-spacing:.06em}
.zw-owner-form label{display:grid;gap:5px;font-weight:600;min-width:0}
.zw-owner-form input:not([type=checkbox]):not([type=radio]),.zw-owner-form select{width:100%;min-width:0;padding:10px;border:1px solid var(--zl);border-radius:9px;font:inherit;font-size:16px;background:#fff;color:var(--zk)}
.zw-owner-form .zw-owner-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.zw-owner-form .zw-owner-plan,.zw-owner-form .zw-owner-consent{display:flex;align-items:flex-start;gap:7px;font-weight:400}
.zw-owner-form .zw-owner-plan{padding:9px;border:1px solid var(--zl);border-radius:9px}
.zw-owner-form input[type=radio],.zw-owner-form input[type=checkbox]{accent-color:#7c3aed;flex:none;margin-top:3px}
.zw-owner-form button[type=submit]{background:var(--zv);color:#fff;font-weight:700;padding:12px;border-radius:10px;white-space:normal}
.zw-owner-form button:disabled{opacity:.55;cursor:default}.zw-owner-status{color:#b42318;font-size:12px;white-space:normal}.zw-owner-status:empty{display:none}
@media(max-width:360px){.zw-owner-form .zw-owner-row{grid-template-columns:1fr}}

.zw-visit-form{display:grid;gap:10px;background:#fff;border:1px solid var(--zl);border-radius:14px;padding:14px;color:var(--zk);font-size:13px}
.zw-visit-form strong{font-size:16px}.zw-visit-form small{color:var(--zk2);font-size:12px}
.zw-visit-form label{display:grid;gap:5px;font-weight:600}
.zw-visit-form input:not([type=checkbox]),.zw-visit-form select{width:100%;min-width:0;padding:10px;border:1px solid var(--zl);border-radius:9px;font:inherit;font-size:16px;background:#fff;color:var(--zk)}
.zw-visit-form .zw-visit-consent{display:flex;align-items:flex-start;font-size:12px;font-weight:400}
.zw-visit-form button{background:var(--zv);color:white;font-weight:700;padding:11px;border-radius:10px}
.zw-visit-form button:disabled{opacity:.55;cursor:default}
.zw-cmp{background:#fff;border:1px solid var(--zl);border-radius:14px;overflow:hidden;font-size:12px}
.zw-cmp table{width:100%;border-collapse:collapse}
.zw-cmp th,.zw-cmp td{padding:8px 9px;border-bottom:1px solid #f2eef8;text-align:left;vertical-align:top}
.zw-cmp th{font-size:10.5px;color:var(--zk3);font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:#faf8fd}
.zw-cmp td:first-child{color:var(--zk3);font-weight:600;width:74px}
.zw-cmp .best{color:#1f8a5b;font-weight:700}
.zw-foot{flex:none;border-top:1px solid var(--zl);padding:10px 10px calc(10px + env(safe-area-inset-bottom));background:#fff}
.zw-rec{display:none;align-items:center;gap:10px;background:#fff1f4;border:1px solid #fbd1dc;border-radius:14px;padding:8px 8px 8px 14px;margin-bottom:8px;font-size:13px;font-weight:700;color:#be123c}
.zw-rec.on{display:flex}
.zw-rec .dot{width:9px;height:9px;border-radius:50%;background:#e11d48;animation:zRec 1s infinite}
.zw-rec .t{font-variant-numeric:tabular-nums;color:var(--zk2);font-weight:600}
.zw-rec button{margin-left:auto;font-size:12.5px;font-weight:700;padding:7px 11px;border-radius:9px;color:var(--zk2);background:#fff}
.zw-rec button.ok{margin-left:0;background:var(--zv);color:#fff}
.zw-in{display:flex;align-items:center;gap:6px;background:#f6f4fa;border:1px solid var(--zl);border-radius:16px;padding:5px 5px 5px 14px;transition:border-color .15s,box-shadow .15s}
.zw-in:focus-within{border-color:var(--zv);box-shadow:0 0 0 3px var(--zt)}
.zw-in input{flex:1;min-width:0;border:0;background:transparent;font-family:inherit;font-size:16px;color:var(--zk);padding:8px 0;outline:none}
.zw-ib{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--zk2);flex:none}
.zw-ib:hover{background:#ece6f6;color:var(--zvd)}
.zw-ib.send{background:var(--zv);color:#fff}
.zw-ib.send:hover{background:var(--zvd)}
.zw-legal{text-align:center;font-size:10.5px;color:var(--zk3);margin-top:7px}
.zw-legal a{color:inherit;text-decoration:underline}
.zw-voice{position:absolute;inset:0;z-index:7;background:linear-gradient(160deg,#160c28 0%,#3a1a78 60%,#6b27d6 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px;opacity:0;pointer-events:none;transition:opacity .3s}
.zw-voice.on{opacity:1;pointer-events:auto}
.zw-voice.on.compact{position:relative;inset:auto;flex:none;display:flex;flex-direction:row;flex-wrap:wrap;gap:6px;padding:8px 10px;justify-content:space-between}
.zw-voice.compact .zw-orb,.zw-voice.compact .zw-bars,.zw-voice.compact .zw-vsub{display:none}
.zw-voice.compact .zw-vst{font-size:12px}.zw-voice.compact .zw-vtimer{font-size:11px}.zw-voice.compact .zw-vctl{gap:5px;margin:0}
.zw-voice.compact .zw-vctl button{width:35px;height:35px}.zw-voice.compact .zw-vctl button.txt{width:auto;padding:0 8px;font-size:11px}
.zw-voice .zw-vsee{color:white;font-size:13px;text-decoration:underline;padding:5px}.zw-voice.compact .zw-vsee{display:none}
.zw-orb{position:relative;width:150px;height:150px;display:grid;place-items:center}
.zw-orb::before,.zw-orb::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(196,181,253,.45);animation:zRing 2.4s ease-out infinite}
.zw-orb::after{animation-delay:1.2s}
.zw-orb .zw-mini{width:96px;height:96px}
.zw-orb .zw-mini::before,.zw-orb .zw-mini::after{top:36px;width:11px;height:15px}
.zw-orb .zw-mini::before{left:28px}.zw-orb .zw-mini::after{right:28px}
.zw-vst{font-family:'Sora',sans-serif;font-weight:700;font-size:18px}
.zw-vsub{font-size:13px;opacity:.82;text-align:center;max-width:30ch;min-height:38px}
.zw-bars{display:flex;align-items:center;gap:4px;height:34px}
.zw-bars i{width:4px;border-radius:4px;background:#c4b5fd;animation:zEq .9s ease-in-out infinite}
.zw-bars i:nth-child(odd){animation-duration:1.15s}.zw-bars i:nth-child(3n){animation-duration:.75s}
.zw-vctl{display:flex;gap:14px;margin-top:6px}
.zw-vctl button{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.14);color:#fff}
.zw-vctl button.on{background:rgba(225,29,72,.85)}
.zw-vctl button.end{background:#e11d48}
.zw-vctl button.txt{width:auto;border-radius:50px;padding:0 18px;font-weight:700;font-size:13px}
.zw-vtimer{font-size:12px;opacity:.7;font-variant-numeric:tabular-nums}
@keyframes zLid{0%,91%,100%{transform:translate(-50%,-50%) scaleY(0)}94%{transform:translate(-50%,-50%) scaleY(1)}97%{transform:translate(-50%,-50%) scaleY(0)}}
@keyframes zHi{0%,100%{transform:rotate(0)}50%{transform:rotate(-20deg)}}
@keyframes zSway{0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg)}}
@keyframes zGreetB{0%,100%{transform:rotate(0)}25%{transform:rotate(2deg) translateY(-2px)}60%{transform:rotate(-1.5deg)}}
@keyframes zTalkB{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px) scale(1.01,.99)}}
@keyframes zIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes zBreathe{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-3px) scale(1.015,.99)}}
@keyframes zShadow{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(.88);opacity:.75}}
@keyframes zBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes zWave{0%,100%{transform:rotate(140deg)}50%{transform:rotate(172deg)}}
@keyframes zTalkL{0%,100%{transform:rotate(8deg)}50%{transform:rotate(28deg)}}
@keyframes zTalkR{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(-26deg)}}
@keyframes zMouth{0%,100%{height:4px}50%{height:9px}}
@keyframes zHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}
@keyframes zDot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
@keyframes zRec{50%{opacity:.3}}
@keyframes zRing{from{transform:scale(.7);opacity:1}to{transform:scale(1.35);opacity:0}}
@keyframes zEq{0%,100%{height:6px}50%{height:30px}}
@media(prefers-reduced-motion:reduce){#zumi-root *{animation:none!important;transition:none!important}}
@media(max-width:640px){
  #zumi-root{right:12px;bottom:calc(12px + env(safe-area-inset-bottom))}
  .zw-bubble{max-width:196px}
  .zw-char{width:62px;height:68px}
  #zumi-root.open .zw-dock{display:none}
  .zw-head{gap:7px;padding:12px 10px 13px 12px}
  .zw-hb{width:32px;height:32px}
  .zw-panel{position:fixed;inset:0;width:100%;height:100dvh;border-radius:0;right:0}
}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  /* ---------- íconos ---------- */
  const I=(d,s)=>'<svg width="'+(s||18)+'" height="'+(s||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
  const IC={tree:'<path d="M12 22v-6"/><path d="M8 16h8l-3-4h2l-3-4h2l-2-4-2 4h2l-3 4h2z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',min:'<path d="M5 12h14"/>',dots:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',send:'<path d="m5 12 14-7-5 14-2.5-5.5z"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',vol:'<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',mute:'<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M15 8l2 2"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',home:'<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',build:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',plus:'<path d="M12 5v14M5 12h14"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'};
  const charHTML='<div class="zw-z"><img class="zb" src="'+ZUMI_BODY+'" alt="Zumi" draggable="false"><img class="za" src="'+ZUMI_ARM+'" alt="" draggable="false"><span class="lid l"></span><span class="lid r"></span></div>';
  const miniHTML='<img src="'+ZUMI_IMG+'" alt="">';

  const css2=`
#zumi-root .zw-know{display:none;align-items:center;gap:6px;flex-wrap:nowrap;overflow-x:auto;padding:8px 12px;border-bottom:1px solid var(--zl);background:#fff;scrollbar-width:none}
#zumi-root .zw-know::-webkit-scrollbar{display:none}
#zumi-root .zw-know.on{display:flex}
#zumi-root .zw-know .lb{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--zk3);white-space:nowrap;margin-right:2px}
#zumi-root .zw-know .kc{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;background:var(--zt);color:var(--zvdd);font-size:12px;font-weight:700;padding:5px 6px 5px 10px;border-radius:50px;border:0;cursor:pointer}
#zumi-root .zw-know .kc i{font-style:normal;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:rgba(76,29,149,.12);font-size:12px;line-height:1}
#zumi-root .zw-know .kc:hover i{background:var(--zv);color:#fff}
#zumi-root .zw-m.bot{position:relative}
#zumi-root .zw-m.bot.streaming::after{content:"";display:inline-block;width:2px;height:1em;background:var(--zv);margin-left:2px;vertical-align:-2px;animation:zwCaret .8s steps(1) infinite}
@keyframes zwCaret{50%{opacity:0}}
#zumi-root .zw-fb{display:flex;gap:4px;margin-top:6px;opacity:0;transition:opacity .2s}
#zumi-root .zw-m.bot:hover .zw-fb,#zumi-root .zw-fb:has(.on){opacity:1}
@media (hover:none){#zumi-root .zw-fb{opacity:.7}}
#zumi-root .zw-fb button{width:26px;height:24px;border-radius:7px;border:1px solid var(--zl);background:#fff;color:var(--zk3);display:grid;place-items:center;cursor:pointer}
#zumi-root .zw-fb button:hover{color:var(--zv);border-color:var(--zt)}
#zumi-root .zw-fb button.on{background:var(--zt);color:var(--zvd);border-color:var(--zt)}
#zumi-root .zw-ver{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.03em;color:#1f8a5b;background:#e7f5ee;padding:2px 7px 2px 5px;border-radius:50px;margin-bottom:5px}
#zumi-root .zw-ref{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.03em;color:#9a5b00;background:#fdf1dc;padding:2px 8px;border-radius:50px;margin-top:8px}
#zumi-root .zw-calc{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0 4px}
#zumi-root .zw-calc div{background:var(--zt);border-radius:10px;padding:8px 9px}
#zumi-root .zw-calc small{display:block;font-size:10.5px;color:var(--zk3);font-weight:700}
#zumi-root .zw-calc b{font-family:'Sora',sans-serif;font-size:13px;color:var(--zvdd)}
#zumi-root .zw-note{display:block;font-size:11px;color:var(--zk3);margin-top:6px;line-height:1.4}
#zumi-root .zw-sep{text-align:center;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--zk3);margin:12px 0 6px}
#zumi-root .zw-typing{display:flex;align-items:center;gap:5px}
#zumi-root .zw-tav{width:24px;height:24px;border-radius:50%;background:var(--zt);overflow:hidden;margin-right:4px;flex:none;display:grid;place-items:center}
#zumi-root .zw-tav img{width:30px;height:auto;margin-top:6px;animation:zwTav 1.2s ease-in-out infinite}
@keyframes zwTav{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@media (max-width:640px){#zumi-root.scrolled:not(.open) .zw-bubble{opacity:0;pointer-events:none;transform:translateY(6px)}}
`;
  /* ---------- DOM ---------- */
  const root=document.createElement('div');root.id='zumi-root';root.dataset.zs='greet';if(homePage)root.classList.add('home-mascot');
  root.innerHTML=`
  ${homePage?`  <div class="zw-dock">
    <div class="zw-bubble" id="zwBubble">
      <button type="button" class="zw-x" id="zwHide" aria-label="Minimizar a Zumi">${I(IC.x,12)}</button>
      <b id="zwBT">¿Necesitas ayuda?</b><span id="zwBS">Te ayudo a encontrar tu próxima propiedad.</span>
      <button type="button" class="zw-cta" id="zwOpen" aria-controls="zwPanel">Conversa con Zumi</button>
    </div>
    <div class="zw-char"><span class="glow"></span><div class="zw-body">${charHTML}</div><span class="zw-hit" id="zwHit" role="button" tabindex="0" aria-label="Abrir conversación con Zumi"></span></div>
  </div>`:''}
  <button type="button" class="zw-peek" id="zwPeek" aria-label="Abrir conversación con Zumi" aria-controls="zwPanel" aria-expanded="false">${I(IC.chat,27)}</button>
  <section class="zw-panel" id="zwPanel" aria-label="Conversación con Zumi" aria-hidden="true" inert>
    <header class="zw-head">
      <div class="zw-mini">${miniHTML}</div>
      <div class="zw-hd"><b>Zumi</b><span><i></i>Asistente de Corretaje Guzmán</span></div>
      <button class="zw-hb" id="zwSound" aria-label="Silenciar">${I(S.sound?IC.vol:IC.mute,17)}</button>
      <button class="zw-hb" id="zwCall" aria-label="Conversar por voz">${I(IC.phone,17)}</button>
      <button class="zw-hb" id="zwMore" aria-label="Más opciones">${I(IC.dots,18)}</button>
      <button class="zw-hb" id="zwClose" aria-label="Minimizar">${I(IC.min,18)}</button>
      <div class="zw-menu" id="zwMenu">
        <button data-act="favs">${I(IC.heart,16)}Mis favoritos</button>
        <button data-act="compare">${I(IC.search,16)}Comparar propiedades</button>
        <button data-act="human">${I(IC.user,16)}Hablar con un ejecutivo</button>
        <button data-act="reset">${I(IC.plus,16)}Nueva conversación</button>
      </div>
    </header>
    <div class="zw-know" id="zwKnow" aria-label="Lo que Zumi sabe de ti"></div>
    <div class="zw-msgs" id="zwMsgs"></div>
    <footer class="zw-foot">
      <div class="zw-rec" id="zwRec"><span class="dot"></span>Grabando<span class="t" id="zwRecT">0:00</span><button type="button" id="zwRecX">Cancelar</button><button type="button" class="ok" id="zwRecOk">Enviar</button></div>
      <form class="zw-in" id="zwForm"><input id="zwInput" placeholder="Escribe o habla con Zumi…" autocomplete="off" enterkeyhint="send" aria-label="Mensaje"><button type="button" class="zw-ib" id="zwMic" aria-label="Grabar mensaje de voz">${I(IC.mic,19)}</button><button class="zw-ib send" aria-label="Enviar">${I(IC.send,18)}</button></form>
      <div class="zw-legal">Zumi puede equivocarse. Conversación guardada en este dispositivo y procesada por IA. · <a href="/politica-de-privacidad.html">Privacidad</a></div>
    </footer>
    <div class="zw-voice" id="zwVoice">
      <div class="zw-orb"><div class="zw-mini">${miniHTML}</div></div>
      <div class="zw-vst" id="zwVst">Conectando…</div>
      <div class="zw-bars" id="zwBars" style="visibility:hidden">${'<i></i>'.repeat(9)}</div>
      <div class="zw-vsub" id="zwVsub">Preparando la conversación</div>
      <div class="zw-vtimer" id="zwVt">00:00 / 05:00</div><button type="button" class="zw-vsee" id="zwVsee">Ver chat y propiedades</button>
      <div class="zw-vctl"><button id="zwVmute" aria-label="Silenciar micrófono">${I(IC.mic,22)}</button><button class="end" id="zwVend" aria-label="Terminar">${I(IC.phone,22)}</button><button class="txt" id="zwVtxt">Seguir por texto</button></div>
    </div>
  </section>`;
  document.body.appendChild(root);
  {const st2=document.createElement('style');st2.textContent=css2;document.head.appendChild(st2);}
  /* teclado en celular: el panel sigue al viewport visible, sin encogerse raro */
  (async function(){const vv=window.visualViewport;if(!vv)return;const fit=()=>{const p=root.querySelector('.zw-panel');if(!p)return;
    if(!matchMedia('(max-width:640px)').matches){p.style.height='';p.style.top='';root.classList.remove('kb');return;}
    const kb=vv.height<window.innerHeight*0.78;root.classList.toggle('kb',kb);
    p.style.height=vv.height+'px';p.style.top=vv.offsetTop+'px';p.style.bottom='auto';
    const m=document.getElementById('zwMsgs');if(m&&kb)m.scrollTop=m.scrollHeight;};
    vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit);fit();})();
  const g=s=>$$(root,s);
  const msgs=g('#zwMsgs');

  /* ---------- posición adaptativa ---------- */
  function place(){
    const bars=[...document.querySelectorAll('.pricebar,.mbar,.pb-in,.sticky-cta,.tabbar,.mobile-bar,.bottom-bar')].filter(e=>{
      if(root.contains(e))return false;
      const cs=getComputedStyle(e),r=e.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&r.height>0&&r.bottom>=innerHeight-2&&r.top<innerHeight;
    });
    const h=bars.reduce((m,e)=>Math.max(m,innerHeight-e.getBoundingClientRect().top),0);
    root.style.bottom=h?Math.round(h+14)+'px':'';
  }
  place();addEventListener('resize',place);addEventListener('scroll',place,{passive:true});addEventListener('load',place);
  setTimeout(place,600);setTimeout(place,1800);
  try{new ResizeObserver(place).observe(document.body);}catch(e){}

  /* ---------- estados del personaje ---------- */
  let poseT=null;
  function pose(s,ms){clearTimeout(poseT);root.dataset.zs=s;if(ms)poseT=setTimeout(()=>{root.dataset.zs=root.classList.contains('open')?'wait':'idle';},ms);}
  pose(homePage?'greet':'idle',homePage?2600:0);
  if(homePage)setInterval(()=>{if(root.classList.contains('home-mascot')&&!document.hidden)pose('greet',2400);},14000);

  /* ---------- sonido / voz ---------- */
  function chime(){if(!S.sound)return;try{const a=new (window.AudioContext||window.webkitAudioContext)();[[660,0],[990,.11]].forEach(([f,t])=>{const o=a.createOscillator(),gn=a.createGain();o.type='sine';o.frequency.value=f;gn.gain.setValueAtTime(.0001,a.currentTime+t);gn.gain.exponentialRampToValueAtTime(.07,a.currentTime+t+.02);gn.gain.exponentialRampToValueAtTime(.0001,a.currentTime+t+.3);o.connect(gn);gn.connect(a.destination);o.start(a.currentTime+t);o.stop(a.currentTime+t+.32);});}catch(e){}}
  let kattyAudio=null, kattyURL=null, kattyAbort=null, speechEpoch=0, kattyUnavailableUntil=0;
  function stopSpeech(){
    speechEpoch++;kattyAbort?.abort();kattyAbort=null;
    if(kattyAudio){kattyAudio.pause();kattyAudio.removeAttribute('src');kattyAudio.remove();kattyAudio=null;}
    if(kattyURL){URL.revokeObjectURL(kattyURL);kattyURL=null;}
    try{window.speechSynthesis?.cancel();}catch{}
  }
  function browserSay(t,epoch){
    if(epoch!==speechEpoch||!S.sound||!S.open||call||!('speechSynthesis' in window))return;
    try{const u=new SpeechSynthesisUtterance(t);u.lang='es-CL';u.rate=1;const voices=speechSynthesis.getVoices();const v=voices.find(v=>/^es-CL$/i.test(v.lang))||voices.find(v=>/es-(419|US|MX)/i.test(v.lang))||voices.find(v=>/^es/i.test(v.lang));if(v)u.voice=v;u.onstart=()=>pose('speak');u.onend=()=>{if(epoch===speechEpoch)pose('wait');};speechSynthesis.speak(u);}catch{}
  }
  async function say(t,fallback=true){
    if(!S.sound||!S.open||call)return;
    t=String(t||'').trim().slice(0,650);if(!t)return;
    stopSpeech();const epoch=speechEpoch;
    if(Date.now()<kattyUnavailableUntil){if(fallback)browserSay(t,epoch);return;}
    const ctl=new AbortController();kattyAbort=ctl;const timer=setTimeout(()=>ctl.abort(),9000);
    try{
      const r=await fetch('/.netlify/functions/zumi-tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t}),signal:ctl.signal});
      if(!r.ok){if(r.status===503||r.status===429)kattyUnavailableUntil=Date.now()+60000;throw Error('TTS '+r.status);}
      if(!/^audio\//i.test(r.headers.get('content-type')||''))throw Error('Invalid audio');
      const blob=await r.blob();if(epoch!==speechEpoch||!S.sound||!S.open||call)return;
      const a=document.createElement('audio');kattyAudio=a;kattyURL=URL.createObjectURL(blob);a.src=kattyURL;a.preload='auto';document.body.append(a);
      a.onplaying=()=>{if(epoch===speechEpoch)pose('speak');};
      a.onended=()=>{if(epoch===speechEpoch){stopSpeech();pose('wait');}};
      await a.play();
    }catch(e){
      if(epoch===speechEpoch){stopSpeech();if(fallback)browserSay(t,speechEpoch);}
    }finally{clearTimeout(timer);if(kattyAbort===ctl)kattyAbort=null;}
  }

  /* ---------- mensajes ---------- */
  const add=(html,who)=>{const d=document.createElement('div');d.className='zw-m '+(who||'bot');d.innerHTML=html;msgs.appendChild(d);scroll();save();return d;};
  const block=html=>{const d=document.createElement('div');d.innerHTML=html;msgs.appendChild(d);scroll();save();return d;};
  const scroll=()=>{msgs.scrollTop=msgs.scrollHeight;};
  const chips=list=>block('<div class="zw-chips">'+list.map(c=>{
    if(typeof c==='string')return '<button data-q="'+esc(c)+'">'+esc(c)+'</button>';
    const cls=c.cls?' class="'+c.cls+'"':'';
    if(c.href)return '<a'+cls+' href="'+esc(c.href)+'"'+(c.blank?' target="_blank" rel="noopener"':'')+'>'+esc(c.t)+'</a>';
    return '<button'+cls+(c.act?' data-act="'+c.act+'"'+(c.id?' data-id="'+c.id+'"':''):' data-q="'+esc(c.q||c.t)+'"')+'>'+esc(c.t)+'</button>';
  }).join('')+'</div>');
  const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* escribe el HTML en vivo, carácter a carácter, respetando las etiquetas */
  function stream(el,html,done){
    el.innerHTML=html;if(RM){done&&done();return;}
    const nodes=[],w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())nodes.push([n,n.nodeValue]);
    nodes.forEach(([nd])=>nd.nodeValue='');
    const total=nodes.reduce((a,[,t])=>a+t.length,0),step=Math.max(2,Math.ceil(total/70));let i=0,k=0;
    el.classList.add('streaming');
    (function tick(){let left=step;while(left>0&&i<nodes.length){const [nd,t]=nodes[i];const take=Math.min(left,t.length-k);nd.nodeValue+=t.slice(k,k+take);k+=take;left-=take;if(k>=t.length){i++;k=0;}}
      scroll();if(i<nodes.length)setTimeout(tick,16);else{el.classList.remove('streaming');done&&done();}})();
  }
  function fbBar(el){
    const id='m'+Date.now()+Math.random().toString(36).slice(2,6);el.dataset.mid=id;
    const f=document.createElement('div');f.className='zw-fb';
    f.innerHTML='<button data-fb="up" aria-label="Respuesta útil">'+I('<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18.4 21H7V10l4-8a2 2 0 0 1 2 2.1z"/>',13)+'</button><button data-fb="down" aria-label="Respuesta no útil">'+I('<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 5.6 3H17v11l-4 8a2 2 0 0 1-2-2.1z"/>',13)+'</button>';
    el.appendChild(f);
  }
  function bot(html,after,ms){
    pose('speak');
    const t=block('<div class="zw-typing"><span class="zw-tav"><img src="'+ZUMI_IMG+'" alt=""></span><i></i><i></i><i></i></div>');
    setTimeout(()=>{t.remove();const d=document.createElement('div');d.className='zw-m bot';msgs.appendChild(d);
      stream(d,html,()=>{fbBar(d);if(after)after();pose('wait');save();});},ms||650+Math.random()*400);
  }

  /* ---------- tarjetas ---------- */
  const isFav=id=>S.favs.includes(id);
  function card(x){
    const venta=x.op==='venta', proj=!x.op;
    const price=proj?'Desde UF '+nf.format(x.uf): (x.uf!=null?'UF '+nf.format(x.uf):money(x.p))+(venta?'':' <small>/mes</small>');
    const tag=proj?(x.parcela?'Parcela':x.ent==='inmediata'?'Entrega inmediata':x.ent==='verde'?'En verde':'Entrega futura'):venta?'Venta':'Arriendo';
    const sp=proj?'<span>'+esc(x.c)+'</span>':'<span>'+x.d+' dorm</span><span>'+x.b+' baño'+(x.b>1?'s':'')+'</span>'+(x.e?'<span>'+x.e+' estac.</span>':'');
    const gc=!proj&&!venta?'<div class="gc">'+(x.gc!=null?'+ '+money(x.gc)+' gastos comunes':'Gastos comunes por confirmar')+'</div>':'';
    const view=x.href;
    return '<div class="zw-card"><div class="im" style="background-image:url(\''+esc(x.img)+'\')"><span class="tag'+(tag==='Entrega inmediata'?' g':'')+'">'+tag+'</span>'+(proj?'':'<button class="fav'+(isFav(x.id)?' on':'')+'" data-act="fav" data-id="'+x.id+'" aria-label="Guardar en favoritos">'+I(IC.heart,15)+'</button>')+'</div>'+
      '<div class="bd"><span class="zw-ver" title="Precio y disponibilidad desde nuestro catálogo">'+I('<path d="M20 6 9 17l-5-5"/>',11)+'Dato verificado</span><div class="pr">'+price+'</div><div class="ti">'+esc(x.t)+'</div>'+(x.c?'<div class="ad">'+esc([x.dir,x.c].filter(Boolean).join(' · '))+'</div>':'')+'<div class="sp">'+sp+'</div>'+gc+
      '<div class="bt"><a href="'+esc(view)+'" data-act="view" data-id="'+x.id+'">'+(proj?'Ver proyecto':'Ver propiedad')+'</a>'+
      (proj?'<button data-act="info" data-id="'+x.id+'">Solicitar info</button>':'<button data-act="visit" data-id="'+x.id+'">Agendar visita</button>')+'</div></div></div>';
  }
  const showCards=list=>{S.last=list.map(x=>x.id);block('<div class="zw-cards">'+list.map(card).join('')+'</div>');pose('success',1600);};

  /* ---------- comprensión del texto ---------- */
  function parse(t){
    const s=norm(t), o={};
    const c=COMUNAS.find(c=>s.includes(norm(c)));if(c)o.comuna=c;
    let m;
    if(m=s.match(/(\d+(?:[.,]\d+)?)\s*(lucas|luca|mil|k)\b/))o.budget=Math.round(parseFloat(m[1].replace(',','.'))*1000);
    else if(m=s.match(/(\d+(?:[.,]\d+)?)\s*(palos|palo|millon|millones)/))o.budget=Math.round(parseFloat(m[1].replace(',','.'))*1e6);
    else if(m=s.match(/\$\s?([\d.]{5,})/))o.budget=+m[1].replace(/\./g,'');
    else if(m=s.match(/\b(\d{3}[.]?\d{3})\b/))o.budget=+m[1].replace(/\./g,'');
    if(m=s.match(/uf\s?([\d.]+)|([\d.]+)\s?uf/))o.uf=+(m[1]||m[2]).replace(/\./g,'');
    const W={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4};
    if(m=s.match(/(\d|un|uno|una|dos|tres|cuatro)\s*(dorm|habitac|pieza|d\b)/))o.dorm=W[m[1]]||+m[1];
    if(/(?:sin|no necesito|no quiero) estacionamiento/.test(s))o.est=false;else if(/estacionamiento|auto\b/.test(s))o.est=true;
    if(/mascota|perro|gato/.test(s))o.pets=true;
    if(/\bcasa\b/.test(s))o.tipo='Casa';else if(/depto|departamento/.test(s))o.tipo='Departamento';
    return o;
  }
  const know=()=>{const p=S.prefs;return [p.comuna,p.budget&&('hasta '+money(p.budget)),p.dorm&&(p.dorm+' dorm'),p.est&&'con estacionamiento',p.pets&&'con mascota'].filter(Boolean).join(' · ');};

  /* ---------- búsqueda ---------- */
  async function rent(){
    await catalogReady;if(!catalogAvailable)return bot("No pude consultar el catálogo ahora. ¿Te conecto con un ejecutivo?",()=>chips([{t:"Hablar con un ejecutivo",act:"human"}]));
    const p=S.prefs;
    const f=(list,x)=>list.filter(r=>(!x.comuna||communeKey(r.c)===communeKey(x.comuna))&&(!x.budget||(r.p!=null&&r.p<=x.budget))&&(!x.dorm||r.d===x.dorm)&&(!x.est||r.e>0)&&(!x.pets||r.pets)).sort((a,b)=>a.p-b.p);
    let res=f(R,p);
    if(res.length){
      bot('Encontré <b>'+res.length+' opción'+(res.length>1?'es':'')+'</b> para ti'+(know()?' ('+esc(know())+')':'')+'. Filtré por valor del arriendo; los gastos comunes van aparte.',()=>{showCards(res);chips(['Ver más propiedades','Algo más barato','¿Aceptan mascotas?',{t:'Comparar',act:'compare'},'Cambiar comuna']);});
      return;
    }
    const near=(CERCA[norm(p.comuna)]||[]);
    let alt=[];near.forEach(c=>alt=alt.concat(f(R,{...p,comuna:c})));
    if(!alt.length&&p.budget)alt=f(R,{...p,budget:Math.round(p.budget*1.12)});
    if(!alt.length)alt=f(R,{dorm:p.dorm});
    bot('Por ahora no tenemos '+(p.tipo||'propiedades').toLowerCase()+(p.comuna?' en <b>'+esc(p.comuna)+'</b>':'')+' con todas esas características'+(alt.length?', pero encontré alternativas interesantes'+(near.length?' en '+near.slice(0,2).join(' y '):'')+'. ¿Te las muestro?':'.'),()=>{
      chips([alt.length&&{t:'Ver alternativas',act:'alts',cls:'pri'},'Ampliar presupuesto','Buscar otras comunas',{t:'Avísame cuando llegue una',act:'alert'}].filter(Boolean));
      S.alts=alt.map(x=>x.id);save();
    });
  }
  async function buy(){
    await catalogReady;if(!catalogAvailable)return bot("No pude consultar el catálogo ahora.",()=>chips([{t:"Hablar con un ejecutivo",act:"human"}]));
    const p=S.prefs;
    let res=V.filter(v=>(!p.comuna||communeKey(v.c)===communeKey(p.comuna))&&(!p.uf||(v.uf!=null&&v.uf<=p.uf))&&(!p.budget||(v.p!=null&&v.p<=p.budget))&&(!p.dorm||v.d===p.dorm));
    if(!res.length)return bot("No encontré opciones con esos filtros. ¿Quieres cambiar el presupuesto o hablar con un ejecutivo?",()=>chips(["Cambiar presupuesto",{t:"Hablar con un ejecutivo",act:"human"}]));
    bot('Estas son las propiedades en venta que mejor calzan contigo:',()=>{showCards(res);chips([{t:'Ver proyectos nuevos',q:'Proyectos nuevos'},{t:'Hablar con un ejecutivo',act:'human'},'Cambiar presupuesto']);});
  }
  function projects(obj){
    const list=obj==='parcela'?PROJ.filter(x=>x.parcela):PROJ.filter(x=>!x.parcela).slice(0,4).concat(obj==='invertir'?PROJ.filter(x=>x.parcela):[]);
    bot(obj==='parcela'?'Tenemos <b>Campo Alto Roble</b>: parcelas de 5.000 m² a 4 km de Villarrica, con crédito directo y 40% de pie.':'Estos proyectos podrían interesarte'+(obj==='invertir'?' para invertir':'')+'. Los precios son desde, según disponibilidad vigente.',()=>{showCards(list);chips([{t:'Hablar con un ejecutivo',act:'human'},{t:'¿Cuánto puedo comprar?',href:'Simulador Capacidad - Corretaje Guzman.html'},'Volver al inicio']);});
  }

  /* ---------- recorridos guiados ---------- */
  const FLOWS={
    owner:[
      {k:'comuna',q:'¡Excelente! Te ayudaré a encontrar un arrendatario para tu propiedad. Cuéntame, ¿en qué <b>comuna</b> está ubicada?',c:['San Miguel','Santiago','Ñuñoa','La Florida','Las Condes']},
      {k:'direccion',q:'Perfecto. ¿Cuál es la <b>dirección</b>? (calle y número, sin depto si prefieres)'},
      {k:'tipo',q:'¿Qué tipo de propiedad es?',c:['Departamento','Casa','Oficina','Local']},
      {k:'dormb',q:'¿Cuántos dormitorios y baños tiene?',c:['1D · 1B','2D · 1B','2D · 2B','3D · 2B']},
      {k:'extras',q:'¿Incluye estacionamiento o bodega?',c:['Estacionamiento','Bodega','Ambos','Ninguno']},
      {k:'valor',q:'¿En cuánto te gustaría arrendarla?',c:['$400.000','$500.000','$650.000','No sé, quiero asesoría']},
      {k:'dispo',q:'¿Desde cuándo está disponible?',c:['Inmediata','Este mes','Próximo mes']},
      {k:'nombre',q:'¡Vamos bien! ¿Cómo te llamas?'},
      {k:'tel',q:'Gracias. ¿A qué <b>teléfono</b> te puede contactar un ejecutivo?'}
    ],
    rent:[
      {k:'comuna',q:'¡Perfecto! Encontraremos una propiedad para ti. ¿En qué <b>comuna</b> te gustaría vivir?',c:['San Miguel','Santiago','Ñuñoa','La Florida','San Joaquín']},
      {k:'budget',q:'¿Cuál es tu <b>presupuesto mensual</b> de arriendo? (sin gastos comunes)',c:['Hasta $400.000','Hasta $500.000','Hasta $600.000']},
      {k:'dorm',q:'¿Cuántos <b>dormitorios</b> necesitas?',c:['1 dormitorio','2 dormitorios','3 dormitorios']}
    ],
    buy:[
      {k:'comuna',q:'¡Excelente! Comprar una propiedad es una gran decisión. ¿En qué <b>comuna</b> te gustaría buscar?',c:['Ñuñoa','Santiago','Las Condes','Buin']},
      {k:'uf',q:'¿Cuál es tu presupuesto aproximado?',c:['Hasta UF 3.000','Hasta UF 4.000','Hasta UF 5.000']},
      {k:'pago',q:'¿Comprarías al contado o con crédito hipotecario?',c:['Crédito hipotecario','Contado','Aún no lo sé']}
    ],
    visit:[
      {k:'nombre',q:'¡Genial! Coordinemos tu visita. ¿Cuál es tu <b>nombre</b>?'},
      {k:'tel',q:'¿A qué <b>teléfono</b> te confirmamos?'},
      {k:'dia',q:'¿Qué día prefieres?',c:()=>nextDays()},
      {k:'hora',q:'¿Qué horario prefieres? Está sujeto a confirmación.',c:['10:00','11:30','16:30','18:30']}
    ]
  };
  function nextDays(){const D=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];const out=[];const d=new Date();for(let i=1;out.length<4;i++){const x=new Date(d);x.setDate(d.getDate()+i);if(x.getDay()===0)continue;out.push((i===1?'Mañana ':D[x.getDay()]+' ')+x.getDate()+'/'+(x.getMonth()+1));}return out;}
  function startFlow(name,extra){S.flow={name,step:0,data:Object.assign({},extra||{})};save();nextStep();}
  function nextStep(){
    const F=S.flow;if(!F)return;const steps=FLOWS[F.name];
    while(F.step<steps.length){const st=steps[F.step];
      const have=F.name==='rent'||F.name==='buy'?S.prefs[st.k==='budget'?'budget':st.k==='uf'?'uf':st.k]:F.data[st.k];
      if(have!==undefined&&have!==null&&have!=='')F.step++;else break;}
    if(F.step>=steps.length){finishFlow();return;}
    const st=steps[F.step];save();
    bot(st.q,()=>{const c=typeof st.c==='function'?st.c():st.c;if(c)chips(c);});
  }
  function flowInput(t){
    const F=S.flow,st=FLOWS[F.name][F.step];
    if(F.name==='rent'||F.name==='buy'){
      const o=parse(t);Object.assign(S.prefs,o);
      if(st.k==='comuna'&&!o.comuna)S.prefs.comuna=t.trim();
      if(st.k==='budget'&&!o.budget){const n=+t.replace(/\D/g,'');if(n)S.prefs.budget=n<10000?n*1000:n;}
      if(st.k==='uf'&&!o.uf){const n=+t.replace(/\D/g,'');if(n)S.prefs.uf=n;}
      if(st.k==='dorm'&&!o.dorm){const n=+t.replace(/\D/g,'');if(n)S.prefs.dorm=n;}
      if(st.k==='pago')S.prefs.pago=t;
    } else {
      if(st.k==='tel'&&t.replace(/\D/g,'').length<8){bot('Mmm, ese número parece incompleto. ¿Me lo escribes con el 9 adelante? Ej: 9 1234 5678');return;}
      F.data[st.k]=t.trim();
    }
    F.step++;save();nextStep();
  }
  function finishFlow(){
    const F=S.flow;S.flow=null;save();
    if(F.name==='rent')return rent();
    if(F.name==='buy')return buy();
    if(F.name==='owner'){
      const d=F.data;S.owner=d;save();
      bot('¡Listo, '+esc(d.nombre.split(' ')[0])+'! Tengo todo lo necesario. Este es el resumen de tu propiedad:',()=>{
        block('<div class="zw-sum"><div><span>Propiedad</span><b>'+esc(d.tipo)+' · '+esc(d.dormb)+'</b></div><div><span>Dirección</span><b>'+esc(d.direccion)+', '+esc(d.comuna)+'</b></div><div><span>Extras</span><b>'+esc(d.extras)+'</b></div><div><span>Valor</span><b>'+esc(d.valor)+'</b></div><div><span>Disponible</span><b>'+esc(d.dispo)+'</b></div><div><span>Contacto</span><b>'+esc(d.nombre)+' · '+esc(d.tel)+'</b></div></div>');
        chips([{t:'Completar solicitud',href:PAGES.solicitud,cls:'pri'},{t:'Hablar con un ejecutivo',act:'human',cls:'wa'},{t:'Conocer nuestros servicios',act:'services'}]);
        pose('success',1600);
      });
      return;
    }
    if(F.name==='visit'){
      const x=byId(F.data.id);if(!x)return bot("La ficha ya no está disponible. Busquemos otra opción.");S.visit=Object.assign({},F.data);save();
      bot('Revisa los datos de tu visita antes de enviarla:',()=>{
        block('<div class="zw-sum"><div><span>Propiedad</span><b>'+esc(x.t)+'</b></div><div><span>Dirección</span><b>'+esc(x.dir)+', '+esc(x.c)+'</b></div><div><span>Fecha</span><b>'+esc(F.data.dia)+'</b></div><div><span>Horario</span><b>'+esc(F.data.hora)+' hrs</b></div><div><span>Cliente</span><b>'+esc(F.data.nombre)+' · '+esc(F.data.tel)+'</b></div></div>');
        chips([{t:'Enviar solicitud',act:'vconfirm',cls:'pri'},{t:'Cambiar horario',act:'vchange'},{t:'Cancelar',act:'vcancel'}]);
      });
    }
  }

  /* ---------- formulario de visita contextual ---------- */
  function showVisitForm(x,preferred=''){
    if(!x)return;
    if(call){call.viewer?.close();compactVoice();call.known.add(x.id);call.selected=x.id;}
    S.viewing=x.id;S.flow=null;
    const existing=Array.from(msgs.querySelectorAll('form[data-visit-form]')).find(el=>el.dataset.visitForm===x.id);
    if(existing){save();existing.scrollIntoView({block:'nearest'});return;}
    msgs.querySelectorAll('form[data-visit-form]').forEach(el=>el.parentElement.remove());
    const days=nextDays().map(d=>'<option>'+esc(d)+'</option>').join('');
    const hours=['10:00','11:30','16:30','18:30','Por coordinar'];
    const hourOptions=hours.map(h=>'<option'+(h===preferred?' selected':'')+'>'+h+'</option>').join('');
    add('Coordinemos una visita a <b>'+esc(x.t)+'</b>. Completa tus datos y te conectamos con un ejecutivo.');
    block('<form class="zw-visit-form" data-visit-form="'+esc(x.id)+'"><strong>Agendar visita</strong><small>'+esc(x.t)+' · '+esc(x.c)+'</small><label>Nombre completo<input name="nombre" autocomplete="name" maxlength="100" required placeholder="Tu nombre"></label><label>Teléfono / WhatsApp<input name="tel" type="tel" autocomplete="tel" maxlength="25" required placeholder="+56 9 1234 5678"></label><label>Día preferido<select name="dia" required>'+days+'<option>Por coordinar</option></select></label><label>Horario preferido<select name="hora" required>'+hourOptions+'</select></label><label class="zw-visit-consent"><input type="checkbox" name="consent" required> Autorizo compartir estos datos para coordinar mi visita.</label><button type="submit">Continuar por WhatsApp</button><small>La visita está sujeta a confirmación. El mensaje se prepara para que tú lo envíes en WhatsApp.</small></form>');
  }
  function visitWhatsAppUrl(v,x){
    const price=x.uf!=null?'UF '+nf.format(x.uf):money(x.p);
    const lines=['Hola, quiero más información sobre esta propiedad: '+x.t,
      'Quiero coordinar una visita.','Comuna: '+x.c,'Valor: '+price+(x.op==='arriendo'?' / mes':''),
      'Nombre: '+v.nombre,'Teléfono: '+v.tel,'Día preferido: '+v.dia,'Horario preferido: '+v.hora,
      'Ficha: '+new URL(x.href,location.origin).href,'¿Me pueden confirmar disponibilidad y horario?'];
    return '/.netlify/functions/property-whatsapp?text='+encodeURIComponent(lines.join('\n'));
  }
  function visitWhatsAppChip(v,x){return {t:'Abrir WhatsApp para coordinar visita',href:visitWhatsAppUrl(v,x),blank:true,cls:'wa'};}
  async function contextVisit(direct=false){
    const id=pagePropertyId();if(!id)return;
    if(!await ensureCatalog()){bot('No pude verificar esta ficha. Inténtalo de nuevo o habla con un ejecutivo.',()=>chips([{t:'Reintentar',act:'pagevisit'},{t:'Hablar con un ejecutivo',act:'human'}]));return;}
    const x=byId(id);if(!x){bot('Esta ficha no está disponible en el catálogo actual.',()=>chips([{t:'Hablar con un ejecutivo',act:'human'},{t:'Ver otras propiedades',q:'busco arriendo'}]));return;}
    S.viewing=x.id;
    if(direct){S.contextOffer=id;save();return showVisitForm(x);}
    if(S.contextOffer===id)return;
    S.contextOffer=id;save();
    const subject=/departamento|\bdepto\b/i.test(x.t)?'este departamento':/\bcasa\b/i.test(x.t)?'esta casa':'esta propiedad';
    add('¿Te gustaría agendar una visita a '+subject+'?');
    chips([{t:'Sí, agendar visita',act:'visit',id:x.id,cls:'pri'},{t:'Ver otras propiedades',q:'busco '+(x.op==='venta'?'comprar':'arriendo')}]);
  }
  /* ---------- WhatsApp alternado ---------- */
  function waNum(){let i=0;try{i=+localStorage.getItem('cg_wa_turno')||0;localStorage.setItem('cg_wa_turno',String((i+1)%WA.length));}catch(e){}return WA[i%WA.length];}
  function summary(){
    const p=S.prefs,lines=['Hola, vengo desde Zumi en corretajeguzman.com.'];
    if(S.owner){const d=S.owner;lines.push('Quiero arrendar mi propiedad: '+d.tipo+' '+d.dormb+' en '+d.direccion+', '+d.comuna+'. Valor esperado '+d.valor+'. Disponible: '+d.dispo+'.','Soy '+d.nombre+', mi teléfono es '+d.tel+'.');}
    else{if(know())lines.push('Busco: '+know()+'.');
      const ids=S.last.slice(0,2).map(byId).filter(Boolean);if(ids.length)lines.push('Me interesa: '+ids.map(x=>x.t+' ('+x.c+')').join(' y ')+'.');
      if(S.alert)lines.push('Quiero que me avisen cuando llegue una propiedad con estas preferencias.');
      if(S.visit)lines.push('Quiero visitar el '+S.visit.dia+' a las '+S.visit.hora+'. Soy '+S.visit.nombre+' ('+S.visit.tel+').');}
    return lines.join('\n');
  }
  let sendingVisit=false;
  async function submitVisit(){const v=S.visit,x=v&&byId(v.id);if(!x||sendingVisit)return; if(v.sent)return bot('Esta solicitud ya fue registrada. Está pendiente de confirmación.');sendingVisit=true;try{const r=await fetch('/.netlify/functions/lead-propiedad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:v.nombre,telefono:v.tel,propiedad:x.t,operacion:x.op,comuna:x.c,url:location.origin+x.href,codigo:x.id,mensaje:'Solicitud de visita desde Zumi. Preferencia: '+v.dia+' '+v.hora+'; pendiente de confirmación.'})});const j=await r.json();if(!r.ok||!j.ok)throw Error();v.sent=true;save();bot('Solicitud enviada. Tu visita queda pendiente de confirmación por un ejecutivo.',()=>chips([visitWhatsAppChip(v,x)]));}catch{bot('No pude registrar tu solicitud. Puedes reintentar o enviarla por WhatsApp.',()=>chips([{t:'Reintentar',act:'vconfirm'},visitWhatsAppChip(v,x)]));}finally{sendingVisit=false;}}
  function handoff(){
    const txt=summary();
    bot('Te conecto con un ejecutivo. Preparé este resumen para que no tengas que repetir nada — revísalo antes de enviar:',()=>{
      block('<div class="zw-sum" style="padding:12px 14px;font-size:13px;white-space:pre-line;color:var(--zk2)">'+esc(txt)+'</div>');
      chips([{t:'Abrir WhatsApp con este resumen',act:'wa',cls:'wa'},'Volver al inicio']);
    });
  }

  /* ---------- comparar / favoritos / alertas ---------- */
  function compare(ids){
    const list=(ids||S.last).slice(0,3).map(byId).filter(Boolean);
    if(list.length<2){bot('Primero te muestro algunas propiedades y luego las comparamos.',()=>chips(['Busco arriendo']));return;}
    const rent=list[0].op==='arriendo';
    const vals=k=>list.map(x=>x[k]);
    const best=(k,lo)=>{const v=vals(k);const b=lo?Math.min(...v):Math.max(...v);return v.map(x=>x===b);};
    const row=(lab,f,bm)=>'<tr><td>'+lab+'</td>'+list.map((x,i)=>'<td'+(bm&&bm[i]?' class="best"':'')+'>'+f(x)+'</td>').join('')+'</tr>';
    const tot=list.map(x=>(x.p||0)+(x.gc||0)),tb=tot.map(t=>t===Math.min(...tot));
    bot('Aquí tienes la comparación. En verde, lo más conveniente:',()=>{
      block('<div class="zw-cmp"><table><tr><th></th>'+list.map((x,i)=>'<th>Opción '+(i+1)+'</th>').join('')+'</tr>'+
        row('Comuna',x=>esc(x.c))+
        (rent?row('Arriendo',x=>x.uf!=null?'UF '+nf.format(x.uf):money(x.p))+row('G. común',x=>x.gc==null?'Por confirmar':money(x.gc))+'<tr><td>Total</td>'+list.map((x,i)=>'<td'+(tb[i]?' class="best"':'')+'>'+(x.gc==null||x.p==null?'Por confirmar':money(tot[i]))+'</td>').join('')+'</tr>':row('Precio',x=>x.uf!=null?'UF '+nf.format(x.uf):money(x.p)))+
        row('Dorm.',x=>x.d,best('d'))+row('Baños',x=>x.b,best('b'))+row('Estac.',x=>x.e||'—',best('e'))+(rent?row('Mascotas',x=>x.pets==null?'Consultar':x.pets?'Sí':'No'):'')+'</table></div>');
      chips(list.map((x,i)=>({t:'Abrir opción '+(i+1),href:x.href})).concat([{t:'Agendar visita',act:'visit',id:list[0].id}]));
    });
  }
  function favs(){
    const list=S.favs.map(byId).filter(Boolean);
    if(!list.length){bot('Aún no guardas favoritos. Toca el corazón en cualquier propiedad para guardarla aquí.');return;}
    bot('Tus favoritos ('+list.length+'):',()=>{block('<div class="zw-cards">'+list.map(card).join('')+'</div>');S.last=list.map(x=>x.id);chips([{t:'Comparar favoritos',act:'compare'}]);});
  }
  function alertFlow(){
    bot('¡Claro! Te aviso apenas ingrese una propiedad con: <b>'+esc(know()||'tus preferencias')+'</b>. ¿Me autorizas a contactarte por WhatsApp para eso?',()=>chips([{t:'Sí, avísenme',act:'alertok',cls:'pri'},'No por ahora']));
  }

  /* ---------- intención libre ---------- */
  function route(t){
    const s=norm(t), o=parse(t);
    if(S.await==='calc'||/cuanto puedo comprar|capacidad|credito hipotecario|me alcanza|gano |ganamos|mi renta|mi sueldo|puedo comprar|complemento renta|complementar/.test(s)){
      const mo=parseMoney(t);
      if(/complemento renta|complementar/.test(s)&&!mo.renta&&!mo.solo){S.await='calc';save();return bot('¡Buena idea! Suma tu renta y la de la otra persona y dime el total (ej: <i>entre los dos ganamos 2.400.000</i>).');}
      const renta=mo.renta||(S.await==='calc'?mo.solo:null);
      if(renta)return calcResult(renta,mo.pie||(S.calc&&S.calc.pie));
      if(S.await!=='calc')return startCalc();
    }
    if(S.flow&&!/^(volver al inicio|cancelar|hablar con|ejecutivo|persona)/.test(s)){
      if(S.flow.name==='rent'||S.flow.name==='buy'){Object.assign(S.prefs,o);if(Object.keys(o).length>1){S.flow.step++;save();return nextStep();}}
      return flowInput(t);
    }
    if(/volver al inicio|nueva conversacion|empezar de nuevo/.test(s)){S.flow=null;save();return menu(true);}
    if(/persona|ejecutivo|humano|asesor/.test(s))return handoff();
    if(/vender mi|quiero vender/.test(s))return bot('¡Te ayudamos a vender! Cuéntame algunos datos y un ejecutivo te contactará con una tasación referencial.',()=>{S.flow={name:'owner',step:0,data:{op:'venta'}};save();nextStep();});
    if(/arrendar mi|mi propiedad|mi depto|mi departamento|publicar/.test(s)){switchSection('propietario');return sectionMenu();}
    if(/llevame|ir a|abre los|abre las|muestrame los/.test(s)){
      const dest=/arriendo/.test(s)?'arriendos':/proyecto/.test(s)?'proyectos':/parcela/.test(s)?'parcelas':/formulario|propietario|solicitud/.test(s)?'solicitud':/venta|comprar/.test(s)?'ventas':null;
      if(dest){bot('¡Vamos! Te llevo ahí. Seguiré aquí mismo si necesitas algo.',()=>{setTimeout(()=>{location.href=PAGES[dest];},700);});return;}
    }
    let m;
    if(m=s.match(/\b(primera|segunda|tercera|1ra|2da|3ra|ultima)\b/)){
      const idx={primera:0,'1ra':0,segunda:1,'2da':1,tercera:2,'3ra':2,ultima:S.last.length-1}[m[1]];const x=byId(S.last[idx]);
      if(x){if(/visita|agendar/.test(s))return act('visit',x.id);bot('Abro <b>'+esc(x.t)+'</b>. La conversación sigue disponible aquí.',()=>{S.viewing=x.id;save();setTimeout(()=>{location.href=x.href;},700);});return;}
    }
    if(/mas barat/.test(s)){const cur=S.last.map(byId).filter(x=>x&&x.p);if(cur.length){S.prefs.budget=Math.min(...cur.map(x=>x.p))-1;delete S.prefs.comuna;}return rent();}
    if(/mascota/.test(s)){const x=byId(S.viewing)||byId(S.last[0]);return x?bot('<b>'+esc(x.t)+'</b> '+(x.pets?'acepta mascotas ✓.':'no tiene registrado que acepte mascotas. Puedo consultarlo con un ejecutivo.'),()=>chips(x.pets?[{t:'Agendar visita',act:'visit',id:x.id},'Ver otras que acepten']:[{t:'Consultar con un ejecutivo',act:'human'},'Ver otras que acepten'])):(S.prefs.pets=true,rent());}
    if(/gasto comun|gastos comunes/.test(s)){const list=S.last.map(byId).filter(Boolean);return list.length?bot(list.map((x,i)=>(i+1)+'. '+esc(x.t)+': <b>'+(x.gc==null?'Por confirmar':money(x.gc))+'</b>').join('<br>')):bot('Los gastos comunes dependen de cada propiedad. Busquemos una y te los muestro.',()=>chips(['Busco arriendo']));}
    if(/cuanto necesito|requisito|que necesito/.test(s))return bot('Para arrendar normalmente se pide (referencial, según cada propietario):<br>• Renta líquida de ~3 veces el arriendo<br>• 1 mes de garantía + 1 mes adelantado<br>• Liquidaciones y DICOM sin protestos o un aval',()=>chips(['Busco arriendo',{t:'Hablar con un ejecutivo',act:'human'}]));
    if(/compar/.test(s))return compare();
    if(/favorit/.test(s))return favs();
    if(/parcela/.test(s))return projects('parcela');
    if(/proyecto|nuevo|en verde|entrega inmediata/.test(s))return bot('Te presento los proyectos que comercializamos. ¿Buscas para vivir o para invertir?',()=>chips([{t:'Para vivir',act:'proj',id:'vivir'},{t:'Para invertir',act:'proj',id:'invertir'},{t:'Parcelas',act:'proj',id:'parcela'}]));
    if(/compra|comprar|venta/.test(s)){Object.assign(S.prefs,o);return startFlow('buy');}
    if(/arriend|busco|depto|departamento|casa|lucas|dorm/.test(s)||o.comuna||o.budget){Object.assign(S.prefs,o);return startFlow('rent');}
    if(/ampliar presupuesto/.test(s)){S.prefs.budget=Math.round((S.prefs.budget||400000)*1.15);return rent();}
    if(/otras comunas|cambiar comuna/.test(s)){delete S.prefs.comuna;save();return startFlow('rent');}
    if(/cambiar presupuesto/.test(s)){delete S.prefs.budget;delete S.prefs.uf;save();return startFlow(S.last[0]&&byId(S.last[0])&&byId(S.last[0]).op==='venta'?'buy':'rent');}
    if(/ver mas propiedades|ver otras/.test(s)){const shown=new Set(S.last);const more=R.filter(x=>!shown.has(x.id)).slice(0,3);return bot('Aquí tienes más opciones:',()=>{showCards(more);chips(['Algo más barato',{t:'Comparar',act:'compare'}]);});}
    if(/hola|buenas/.test(s))return bot('¡Hola! 😊 ¿Buscas arrendar, comprar o quieres publicar tu propiedad?',()=>chips(['Busco arriendo','Busco comprar','Arrendar mi propiedad']));
    bot('No estoy seguro de haberte entendido. Puedo buscar propiedades, contarte de nuestros servicios o conectarte con un ejecutivo.',()=>chips(['Busco arriendo','Busco comprar','Proyectos nuevos',{t:'Hablar con un ejecutivo',act:'human'}]));
  }
  /* ---------- puente con la IA (OpenAI vía servidor) ----------
     Si window.ZUMI_AI_ENDPOINT existe, cada mensaje se envía al servidor.
     El servidor responde { text, actions:[...] } y Zumi lo dibuja.
     Si falla o no hay endpoint, usa las reglas locales (route). */
  const AI='/.netlify/functions/zumi-conversar';
  S.hist=S.hist||[];
  function render(a){
    if(!a||!a.type)return;
    const T=a.type;
    if(T==='cards'){const list=(a.items||[]).map(x=>typeof x==='string'?(byId(x)||PROJ.find(p=>p.id===x)):x).filter(Boolean);if(list.length)showCards(list);}
    else if(T==='chips')chips(a.items||[]);
    else if(T==='calc')calcResult(a.renta,a.pie);
    else if(T==='visit')act('visit',a.id);
    else if(T==='handoff')handoff();
    else if(T==='compare')compare();
    else if(T==='prefs'){Object.assign(S.prefs,a.prefs||{});save();}
    else if(T==='navigate'&&a.page){const u=PAGES[a.page]||a.url;if(u)setTimeout(()=>{location.href=u;},700);}
    else if(T==='lead'){try{fetch('/api/lead-zumi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({origen:'Zumi',pagina:location.pathname,prefs:S.prefs},a.data||{}))});}catch(e){}}
  }
  async function askAI(v,domain=''){
    const ctrl=new AbortController(),to=setTimeout(()=>ctrl.abort(),38000);
    const t=block('<div class="zw-typing"><span class="zw-tav"><img src="'+ZUMI_IMG+'" alt=""></span><i></i><i></i><i></i></div>');pose('think');
    try{
      const r=await fetch(AI,{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,
        body:JSON.stringify({message:v.slice(0,1000),history:(domain?(S.sectionHist||[]):(S.hist||[])).slice(-8).map(m=>({role:m.role,content:String(m.content).slice(0,750)})),section:domain||undefined,focus:domain?sectionFocus():undefined,propertyId:pagePropertyId()||S.viewing||null})});
      clearTimeout(to);if(!r.ok)throw new Error('ai '+r.status);
      const j=await r.json();await catalogReady;t.remove();j.text=typeof j.reply==='string'?j.reply:'';
      const ids=Array.isArray(j.ids)?j.ids.filter(id=>domain?sectionRows(domain).some(x=>x.id===id):byId(id)):[];
      j.actions=[...(ids.length?[{type:'cards',items:ids}]:[]),{type:'chips',items:[{t:'Hablar con un ejecutivo',act:domain?'sectioncontact':'human'},...(domain&&SECTION_UI[domain]?[{t:'Ver sección',href:SECTION_UI[domain].url}]:[])]}];
      const histKey=domain?'sectionHist':'hist';
      S[histKey]=(S[histKey]||[]).concat({role:'user',content:v},...(j.text?[{role:'assistant',content:j.text}]:[])).slice(-16);
      if(j.text){void say(j.text,false);pose('speak');const d=document.createElement('div');d.className='zw-m bot';msgs.appendChild(d);
        stream(d,esc(j.text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,"$1")).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>"),()=>{fbBar(d);(j.actions||[]).forEach(render);pose('wait');save();});}
      else{(j.actions||[]).forEach(render);save();}
    }catch(e){clearTimeout(to);t.remove();
      add('Tuve un problema para responder. ¿Lo intentamos de nuevo o prefieres hablar con un ejecutivo?','sys');
      chips([{t:'Reintentar',q:v},{t:'Hablar con un ejecutivo',act:'human'}]);pose('wait');save();}
  }
  async function ask(t){const v=String(t).trim();if(!v)return;
    const pId=pagePropertyId(),lastBot=Array.from(msgs.querySelectorAll('.zw-m.bot')).pop()?.textContent||'';
    if(!call&&pId&&!S.flow&&(/^(?:si|claro|por supuesto|me gustaria|dale|bueno)[.!\s]*$/.test(norm(v))&&/^¿Te gustaría agendar una visita/.test(lastBot)||/^(?:si[, ]+)?(?:quiero |me gustaria |podemos )?(?:agendar|coordinar|solicitar) (?:una |la |mi )?visita(?: a (?:esta propiedad|este departamento|esta casa))?[.!?]*$/.test(norm(v)))){
      add(esc(v),'me');return contextVisit(true);
    }
    if(call&&S.flow?.name!=='visit'){call.lastUser=v;call.transcriptionPending=false;call.transcriptReady?.();add(esc(v),'me');voiceHistory('user',v);voiceSend(call,{type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:v}]}});call.needsResponse=true;continueVoice(call);return;}add(esc(v),'me');const next=explicitSectionSwitch(v);if(!S.flow&&next&&next!==section){switchSection(next);if(section==='home')return menu(true);if(section==='propietario'&&ownerIntent(v)==='form')return showOwnerForm(v);if(specialist()||section==='ventas')return sectionMenu();}if(section==='propietario'&&ownerIntent(v)){S.flow=null;S.await=null;return askSpecial(v);}if(specialist()&&!S.flow&&!S.await)return askSpecial(v);await ensureCatalog();if(S.flow||S.await||/compar|favorit|mas barat|ver mas propiedades|gastos comunes|gasto comun|volver al inicio|nueva conversacion|empezar de nuevo|arrendar mi propiedad|proyectos nuevos|parcela|cuanto puedo comprar|me alcanza|hablar con|ejecutivo|cambiar presupuesto|cambiar comuna|ampliar presupuesto|otras comunas/i.test(norm(v)))return route(v);const u=userSearchCriteria(v);
    if(u.comuna&&u.maximo>0){
      if(!catalogAvailable)return bot('No pude verificar el catálogo en este momento. Inténtalo nuevamente.',()=>chips([{t:'Reintentar',q:v}]));
      const f=mergedSearchFilters({...voiceFilters(),...(section==='ventas'?{operacion:'buy'}:{})},u,v);applyVoiceFilters(f);
      const matches=voiceMatches(ALL,f);
      if(matches.length)return bot('Encontré <b>'+matches.length+' '+(matches.length===1?'propiedad':'propiedades')+'</b> que cumplen tus filtros.',()=>showCards(matches.slice(0,6)));
      return bot('No encontré propiedades que cumplan todos esos filtros. ¿Te gustaría cambiar alguno?',()=>chips(['Cambiar comuna','Cambiar presupuesto']));
    }
    Object.assign(S.prefs,parse(v));save();return askAI(v);}
  window.Zumi=Object.assign(window.Zumi||{},{render,ask,open:()=>open(),state:()=>S,context:pageCtx});

  /* ---------- acciones de botones ---------- */
  function act(a,id,el){
    if(a==='start'&&id==='buy'){add('Comprar','me');return bot('¿Qué te gustaría comprar?',()=>chips([{t:'Propiedades en venta',q:'busco comprar'},{t:'Proyectos nuevos',q:'proyectos nuevos'}]));}
    if(a==='start'&&id==='parcel'){add('Parcelas','me');switchSection('parcelas');return sectionMenu();}
    if(a==='sectionhome'){switchSection('home');return menu(true);}
    if(a==='ownerform')return showOwnerForm(id||'');
    if(a==='ownerplans')return showOwnerPlans();
    if(a==='start'&&id==='owner'){add('Arrendar mi propiedad','me');switchSection('propietario');return sectionMenu();}
    if(a==='sectioncontact')return sectionContact();
    if(a==='start'&&id==='others'){add('Otros servicios','me');return bot('También te podemos ayudar con:<br>• <b>Administración de propiedades</b>: cobramos el arriendo, pagamos al propietario y enviamos la liquidación cada mes.<br>• <b>Ser corredor</b>: trabaja con nuestra cartera de propiedades y tu propio portal.',()=>chips([{t:'Administración de propiedades',href:'/Administracion%20de%20Propiedades%20-%20Corretaje%20Guzman.html'},{t:'Quiero ser corredor',href:'/Se%20Corredor%20-%20Corretaje%20Guzman.html'},{t:'Hablar con un ejecutivo',act:'human'}]));}
    if(a==='start'){const map={owner:'owner',rent:'rent',buy:'buy'};if(id==='proj'){add('Proyectos nuevos','me');return route('proyectos nuevos');}add(esc(el&&el.dataset.label||id),'me');return startFlow(map[id]);}
    if(a==='fav'){const i=S.favs.indexOf(id);if(i>=0)S.favs.splice(i,1);else S.favs.push(id);root.querySelectorAll('.fav[data-id="'+id+'"]').forEach(b=>b.classList.toggle('on',i<0));save();if(i<0)pose('success',1200);return;}
    if(a==='view'){S.viewing=id;close();return;}
    if(a==='pagevisit')return contextVisit(true);
    if(a==='visit'){const x=byId(id);if(!x)return;add('Agendar visita · '+esc(x.t),'me');return showVisitForm(x);}
    if(a==='info'){const x=PROJ.find(p=>p.id===id);add('Solicitar información · '+esc(x?x.t:''),'me');if(x){const msg='Hola, me interesa '+x.t+'. ¿Me pueden enviar información y coordinar una visita?';return bot('Te dejo el contacto para que nuestro equipo te asesore.',()=>chips([{t:'Contactar por WhatsApp',href:'/.netlify/functions/property-whatsapp?text='+encodeURIComponent(msg),blank:true,cls:'wa'}]));}return handoff();}
    if(a==='vconfirm'){return submitVisit();}
    if(a==='vchange'){if(S.visit){S.flow={name:'visit',step:2,data:S.visit};save();}return nextStep();}
    if(a==='vcancel'){if(S.visit?.sent)return bot('La solicitud ya fue enviada. Contacta al ejecutivo para cancelarla.');S.visit=null;save();return bot('Listo, descarté el borrador. ¿Te ayudo con algo más?',()=>chips(['Ver más propiedades','Volver al inicio']));}
    if(a==='human')return handoff();
    if(a==='wa'){window.open('/.netlify/functions/property-whatsapp?text='+encodeURIComponent(summary()),'_blank');add('Se abrió WhatsApp con tu resumen. Recuerda presionar <b>enviar</b> en WhatsApp para que llegue al ejecutivo.','sys');return;}
    if(a==='services'&&section==='propietario')return showOwnerPlans();
    if(a==='services'){return bot('Así trabajamos con propietarios:<br>'+CONFIG.planes.map(([t,d])=>'<br><b>'+t+'</b> — '+d).join(''),()=>chips([{t:'Ver detalle de servicios',href:PAGES.servicios},{t:'Completar solicitud',href:PAGES.solicitud,cls:'pri'},{t:'Hablar con un ejecutivo',act:'human'}]));}
    if(a==='compare')return compare();
    if(a==='favs')return favs();
    if(a==='alts'){const list=(S.alts||[]).map(byId).filter(Boolean);return list.length?(showCards(list),chips(['Ampliar presupuesto',{t:'Avísame cuando llegue una',act:'alert'}])):rent();}
    if(a==='alert')return alertFlow();
    if(a==='alertok'){S.alert=Object.assign({},S.prefs);save();return bot('Para registrar el aviso, envía tu solicitud al ejecutivo por WhatsApp.',()=>chips([{t:'Enviar solicitud por WhatsApp',act:'wa',cls:'wa'}]));}
    if(a==='proj'){add(el?el.textContent.trim():id,'me');return projects(id);}
    if(a==='reset'){stopSpeech();S={html:'',prefs:{},flow:null,last:[],favs:S.favs,sound:S.sound,open:true,hidden:false,started:false,hist:[]};msgs.innerHTML='';save();return menu(false);}
  }

  /* ---------- menú inicial ---------- */
  function menu(again){
    if(sectionMenu())return;
    const X=pageCtx();
    const back=!again&&S.prefs&&(S.prefs.comuna||S.calc);
    const ctxT={
      proyecto:X.name?'¡Hola! Soy <b>Zumi</b>. Veo que estás viendo <b>'+esc(X.name)+'</b>'+(X.uf?', desde <b>UF '+nf.format(X.uf)+'</b>':'')+'. ¿Te calculo si calzas, te cuento las condiciones o coordinamos una visita?':null,
      parcela:'¡Hola! Soy <b>Zumi</b>. Estás viendo <b>'+esc(X.name||'nuestras parcelas')+'</b>. ¿Te muestro las parcelas disponibles o simulamos el <b>crédito directo con 40% de pie</b>?',
      simulador:'¡Hola! Soy <b>Zumi</b>. Si quieres, te calculo aquí mismo cuánto puedes comprar y te muestro los proyectos que calzan.',
      propietario:'¡Hola! Soy <b>Zumi</b>. ¿Quieres arrendar tu propiedad? Te hago 4 preguntas y un ejecutivo te contacta hoy.',
      admin:'¡Hola! Soy <b>Zumi</b>. ¿Te cuento cómo funciona la administración? Cobramos el arriendo, pagamos al propietario y te enviamos tu liquidación cada mes.',
      corredor:'¡Hola! Soy <b>Zumi</b>. ¿Quieres trabajar con nosotros como corredor? Te cuento cómo funciona.'
    }[X.type];
    const ctxC={
      proyecto:[{t:'¿Me alcanza?',q:'cuanto puedo comprar'},{t:'Solicitar información',act:'info',id:X.id},'Ver otros proyectos'],
      parcela:[{t:'Ver parcelas y valores',href:'#parcelas'},{t:'Simular crédito directo',href:'#credito'},{t:'Hablar con un ejecutivo',act:'human'}],
      simulador:[{t:'Calcular con Zumi',q:'cuanto puedo comprar'},'Ver proyectos nuevos'],
      propietario:[{t:'Empezar',q:'arrendar mi propiedad'},{t:'Conocer los planes',act:'services'}],
      admin:[{t:'Quiero administrar',q:'arrendar mi propiedad'},{t:'Hablar con un ejecutivo',act:'human'}],
      corredor:[{t:'Quiero postular',href:'#formulario'},{t:'Hablar con un ejecutivo',act:'human'}]
    }[X.type];
    if(back){
      add('¡Hola de nuevo! 👋'+(S.prefs.comuna?' ¿Seguimos buscando en <b>'+esc(S.prefs.comuna)+'</b>?':' ¿Seguimos donde quedamos?'));
      return chips([S.prefs.comuna?{t:'Sí, seguir buscando',q:'busco arriendo en '+S.prefs.comuna}:{t:'Ver mi cálculo',q:'cuanto puedo comprar'},{t:'Empezar de nuevo',act:'reset'}]);
    }
    if(!again&&ctxT){add(ctxT);if(ctxC)chips(ctxC);block('<div class="zw-sep">o elige otra opción</div>');}
    else{
    const t=(()=>{const p=decodeURIComponent(location.pathname);if(/Ficha|Proyecto /.test(p))return '¡Hola! Soy <b>Zumi</b>. Veo que estás revisando esta propiedad. ¿Quieres que te cuente los requisitos o coordinemos una visita?';if(/arriendos/i.test(p))return '¡Hola! Soy <b>Zumi</b>. Te ayudo a encontrar tu arriendo ideal. ¿En qué comuna buscas?';return again?'¿En qué más te puedo ayudar?':'¡Hola! Soy <b>Zumi</b>, tu asistente inmobiliario de Corretaje Guzmán. Cuéntame, ¿en qué te puedo ayudar hoy?';})();
    add(t);
    }
    block('<div class="zw-acts">'+[['rent','search','Busco arriendo','Deptos y casas'],['buy','home','Comprar','Venta y proyectos nuevos'],['parcel','tree','Parcelas','5.000 m² en Villarrica'],['owner','key','Arrendar mi propiedad','Publícala con nosotros'],['others','grid','Otros servicios','Administración y corredores']].map(([id,ic,tt,sb])=>'<button class="zw-act" data-act="start" data-id="'+id+'" data-label="'+tt+'"><span class="ic">'+I(IC[ic],17)+'</span>'+tt+'<small>'+sb+'</small></button>').join('')+'</div>');
    block('<div class="zw-chips"><button data-q="cuanto puedo comprar" class="pri">💰 ¿Cuánto puedo comprar?</button></div>');
  }

  /* ---------- abrir / cerrar ---------- */
  function showHomeLauncher(){return homePage&&!homeMinimized&&!S.open;}
  function syncLauncher(){root.classList.toggle('home-mascot',showHomeLauncher());}
  function setPanelOpen(value){
    root.classList.toggle('open',value);root.classList.remove('gone');
    S.open=value;S.hidden=false;syncLauncher();
    const panel=g('#zwPanel');panel.inert=!value;panel.setAttribute('aria-hidden',String(!value));
    g('#zwPeek').setAttribute('aria-expanded',String(value));
  }
  function open(direct=false){
    if(homePage)homeMinimized=true;
    setPanelOpen(true);
    pose('point',1800);chime();
    void restoreCards();
    const sectionKey=section+':'+sectionFocus();
    if(!S.started){S.started=true;if(!pagePropertyId())menu(false);}
    else if(S.sectionKey!==sectionKey&&!pagePropertyId()&&SECTION_UI[section]){S.sectionHist=[];S.flow=null;S.await=null;sectionMenu();}
    S.sectionKey=sectionKey;
    if(section==='ventas')S.voiceOperation='buy';
    if(pagePropertyId())void contextVisit(direct===true);
    save();scroll();
    setTimeout(()=>{if(matchMedia('(min-width:641px)').matches)g('#zwInput').focus({preventScroll:true});},460);
  }
  function close(){stopSpeech();endCall();if(rec?.state==='recording'){recCancelled=true;rec.stop();}setPanelOpen(false);g('#zwMenu').classList.remove('on');pose('idle');save();try{speechSynthesis.cancel();}catch(e){}}
  g('#zwClose').onclick=close;
  g('#zwPeek').onclick=()=>open(false);
  if(homePage){
    g('#zwOpen').onclick=()=>open(false);
    g('#zwHit').onclick=()=>open(false);
    g('#zwHit').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(false);}};
    g('#zwHide').onclick=e=>{
      e.stopPropagation();homeMinimized=true;syncLauncher();pose('idle');
      g('#zwPeek').focus({preventScroll:true});
    };
  }
  g('#zwSound').onclick=()=>{S.sound=!S.sound;g('#zwSound').innerHTML=I(S.sound?IC.vol:IC.mute,17);g('#zwSound').setAttribute('aria-label',S.sound?'Silenciar':'Activar sonido');if(!S.sound)stopSpeech();save();};
  g('#zwMore').onclick=e=>{e.stopPropagation();g('#zwMenu').classList.toggle('on');};
  document.addEventListener('click',e=>{if(!e.target.closest('#zwMenu,#zwMore'))g('#zwMenu').classList.remove('on');});
  g('#zwMenu').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;g('#zwMenu').classList.remove('on');act(b.dataset.act,b.dataset.id,b);});
  document.getElementById('zwKnow').addEventListener('click',e=>{
    const b=e.target.closest('.kc');if(!b)return;const k=b.dataset.k;
    if(k==='calc')S.calc=null;else delete S.prefs[k];if(call){call.filters=voiceFilters();voiceContext(call,'Filtros actualizados manualmente: '+JSON.stringify(call.filters));}save();
    add('Listo, olvidé ese dato. ¿Quieres que vuelva a buscar?','sys');
  });
  msgs.addEventListener('click',e=>{
    const fb=e.target.closest('[data-fb]');
    if(fb){const m=fb.closest('.zw-m'),v=fb.dataset.fb;fb.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===fb));
      S.fb=S.fb||[];S.fb.push({mid:m.dataset.mid,v,t:m.textContent.slice(0,140),at:new Date().toISOString()});save();
      try{window.ZUMI_ON_FEEDBACK&&window.ZUMI_ON_FEEDBACK({value:v,text:m.textContent,prefs:S.prefs});}catch(err){}
      if(v==='down')add('Gracias, lo tomo en cuenta. ¿Prefieres que te atienda un ejecutivo?','sys');return;}
    const b=e.target.closest('[data-act],[data-q]');if(!b)return;
    if(b.dataset.q){e.preventDefault();return ask(b.dataset.q);}
    if(b.tagName==='A'&&b.dataset.act==='view'){
      if(call&&byId(b.dataset.id)){e.preventDefault();call.known.add(b.dataset.id);openVoiceProperty(call,byId(b.dataset.id));return;}
      // Text chat: navigate normally in this tab and leave the launcher closed.
      act('view',b.dataset.id);return;
    }
    e.preventDefault();act(b.dataset.act,b.dataset.id,b);
  });
  msgs.addEventListener('submit',async e=>{
    const owner=e.target.closest('form[data-owner-form]');if(owner){e.preventDefault();return submitOwnerForm(owner);}
    const form=e.target.closest('form[data-visit-form]');if(!form)return;
    e.preventDefault();if(!form.reportValidity()||form.dataset.submitting==='1')return;
    const d=new FormData(form),nombre=String(d.get('nombre')||'').trim(),tel=String(d.get('tel')||'').trim();
    if(!nombre||tel.replace(/\D/g,'').length<8){add('Revisa tu nombre y teléfono antes de continuar.','sys');return;}
    form.dataset.submitting='1';form.querySelector('button').disabled=true;
    const id=form.dataset.visitForm,x=byId(id);
    if(!x){form.dataset.submitting='0';form.querySelector('button').disabled=false;add('No pude verificar esta propiedad. Inténtalo otra vez.','sys');return;}
    S.visit={id,nombre,tel,dia:String(d.get('dia')),hora:String(d.get('hora'))};S.viewing=id;
    form.parentElement.remove();save();
    const registering=submitVisit();
    // This explicit submit is a user gesture: open WhatsApp without waiting for the
    // lead request, which would risk losing browser popup permission on mobile.
    window.open(visitWhatsAppUrl(S.visit,x),'_blank','noopener,noreferrer');
    await registering;
  });
  g('#zwForm').onsubmit=e=>{e.preventDefault();const v=g('#zwInput').value;g('#zwInput').value='';ask(v);};

  let rec=null,recStream=null,recTimer=null,recSeconds=0,recCancelled=false;
  function recCleanup(){clearInterval(recTimer);recStream?.getTracks().forEach(t=>t.stop());recStream=null;g('#zwRec').classList.remove('on');g('#zwForm').style.display='';pose('wait');}
  g('#zwMic').onclick=async()=>{if(call){add('Termina la llamada para enviar una nota de voz.','sys');return;}if(rec?.state==='recording')return;stopSpeech();try{recStream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];rec=new MediaRecorder(recStream);recCancelled=false;rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=async()=>{const cancel=recCancelled;const blob=new Blob(chunks,{type:rec.mimeType});recCleanup();if(cancel)return;try{const mime=blob.type.split(';')[0];const r=await fetch('/.netlify/functions/zumi-conversar',{method:'POST',headers:{'Content-Type':mime},body:blob});const j=await r.json();if(!r.ok||!j.text)throw Error();ask(j.text);}catch{add('No pude transcribir el audio. Intenta otra vez o escribe tu mensaje.','sys');}};rec.start();recSeconds=0;g('#zwRecT').textContent='0:00';g('#zwRec').classList.add('on');g('#zwForm').style.display='none';pose('listen');recTimer=setInterval(()=>{g('#zwRecT').textContent='0:'+String(++recSeconds).padStart(2,'0');if(recSeconds>=30&&rec.state==='recording')rec.stop();},1000);}catch{recCleanup();add('No pude acceder al micrófono. Revisa los permisos del navegador.','sys');}};
  g('#zwRecX').onclick=()=>{recCancelled=true;if(rec?.state==='recording')rec.stop();else recCleanup();};
  g('#zwRecOk').onclick=()=>{if(rec?.state==='recording')rec.stop();};
  // Voice tools share the same catalog, cards and filters as the text widget.
  let call=null;
  const communeKey=s=>norm(s).trim().replace(/^santiago centro$/,'santiago');
  const voiceType=s=>{
    const t=norm(s).trim();
    if(/\b(departamentos?|deptos?|dptos?|apartamentos?)\b/.test(t))return 'departamento';
    if(/\b(casas?|townhouses?)\b/.test(t))return 'casa';
    if(/\b(oficinas?)\b/.test(t))return 'oficina';
    if(/\b(local(?:es)?|comercial)\b/.test(t))return 'local';
    if(/\b(parcelas?|terrenos?)\b/.test(t))return 'parcela';
    if(/\b(estudios?|studios?)\b/.test(t))return 'estudio';
    return ''; // "propiedad", "inmueble" and unknown labels are not property types.
  };
  function userSearchCriteria(text,rows=ALL){
    const t=norm(text||''), out={};
    const communes=Array.from(new Set([...COMUNAS,...rows.map(x=>x.c).filter(Boolean)])).sort((a,b)=>b.length-a.length);
    const commune=communes.find(v=>(' '+t.replace(/[^a-z0-9 ]/g,' ')+' ').includes(' '+norm(v)+' '));
    if(commune)out.comuna=commune;
    const w={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9};
    const m=t.match(/\b(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s*(?:dormitorios?|dorms?|habitaciones?|piezas?)\b/);
    if(m)out.dormitorios=w[m[1]]??Number(m[1]);
    const b=t.match(/\b(\d+|un|una|uno|dos|tres|cuatro|cinco|seis)\s*banos?\b/);
    if(b)out.banos=w[b[1]]??Number(b[1]);
    const uf=t.match(/\b(\d+(?:[.,]\d+)?)\s*uf\b|\buf\s*(\d+(?:[.,]\d+)?)/);
    const amount=t.match(/(?:\$\s*|\b)(\d{1,3}(?:\.\d{3})+|\d{5,})(?!\d)/);
    const scaled=t.match(/\b(\d+(?:[.,]\d+)?|un|uno|medio|dos|tres|cuatro|cinco)\s*(millones?|millon|palos?|mil|lucas?)\b/);
    if(uf){out.maximo=Number((uf[1]||uf[2]).replace(/\.(?=\d{3}\b)/g,'').replace(',','.'));out.moneda='UF';}
    else if(amount){out.maximo=Number(amount[1].replace(/\./g,''));out.moneda='CLP';}
    else if(scaled){out.maximo=(scaled[1]==='medio'?.5:w[scaled[1]]??Number(scaled[1].replace(',','.')))*(/mil$|luca/.test(scaled[2])?1000:1000000);out.moneda='CLP';}
    if(/\b(arriendo|arrendar|alquiler)\b/.test(t))out.operacion='rent';
    if(/\b(comprar|compra|en venta)\b/.test(t))out.operacion='buy';
    if(/\b(?:sin|no necesito|no quiero)\s+estacionamiento\b/.test(t))out.estacionamiento=false;
    else if(/\bestacionamiento\b/.test(t))out.estacionamiento=true;
    const type=voiceType(t);if(type)out.tipo=type;
    return out;
  }
  function voiceMatches(rows,f){
    const type=voiceType(f.tipo);
    return rows.filter(x=>x.op===(f.operacion==='buy'?'venta':'arriendo')
      &&(!f.comuna||communeKey(x.c)===communeKey(f.comuna))
      &&(f.dormitorios==null||(x.d!=null&&Number(x.d)===f.dormitorios))
      &&(f.banos==null||(x.b!=null&&Number(x.b)===f.banos))
      &&(!f.estacionamiento||x.e>0)
      &&(!type||voiceType(x.type||x.t)===type)
      &&(!f.maximo||(f.moneda==='UF'?x.uf!=null&&x.uf<=f.maximo:x.p!=null&&x.p<=f.maximo)))
      .sort((a,b)=>(a.p!=null&&b.p!=null?a.p-b.p:a.uf!=null&&b.uf!=null?a.uf-b.uf:0));
  }
  function voiceFilters(){
    const p=S.prefs||{};return {operacion:S.voiceOperation==='buy'?'buy':'rent',comuna:p.comuna||'',dormitorios:p.dorm,banos:p.banos,maximo:p.uf||p.budget,moneda:p.uf?'UF':'CLP',estacionamiento:!!p.est,tipo:p.tipo||''};
  }
  function applyVoiceFilters(f){
    const p=S.prefs;S.voiceOperation=f.operacion;
    if(f.comuna)p.comuna=f.comuna;else delete p.comuna;
    if(f.dormitorios!=null)p.dorm=f.dormitorios;else delete p.dorm;
    if(f.banos!=null)p.banos=f.banos;else delete p.banos;
    delete p.budget;delete p.uf;
    if(f.maximo>0)p[f.moneda==='UF'?'uf':'budget']=f.maximo;
    if(f.estacionamiento)p.est=true;else delete p.est;
    if(f.tipo)p.tipo=f.tipo;else delete p.tipo;
    save();
  }
  function mergedSearchFilters(previous,a,utterance=''){
    const u=userSearchCriteria(utterance), f={...previous}, t=norm(utterance);
    const nextCommune=u.comuna??a.comuna;
    const nextOp=u.operacion??a.operacion;
    const changed=nextCommune&&communeKey(nextCommune)!==communeKey(f.comuna);
    const opChanged=['rent','buy'].includes(nextOp)&&nextOp!==f.operacion;
    const retain=/\b(?:mismos?|mismas?|manteniendo|mantener|igual que|con los mismos filtros|como antes)\b/.test(t);
    const fresh=!retain&&(changed||opChanged||(u.comuna&&u.maximo>0)||
      (!utterance&&a.comuna&&a.maximo>0&&changed));
    if(fresh){
      delete f.dormitorios;delete f.banos;delete f.estacionamiento;delete f.tipo;
      if(opChanged){delete f.maximo;delete f.moneda;}
    }
    if(['rent','buy'].includes(nextOp))f.operacion=nextOp;
    if(typeof nextCommune==='string')f.comuna=nextCommune.trim().slice(0,80);
    // For a new search, do not reintroduce constraints carried by the AI
    // from previous turns. The current transcript takes precedence.
    const dorm=u.dormitorios??(!fresh?a.dormitorios:(!utterance&&a.dormitorios!==previous.dormitorios?a.dormitorios:undefined));
    if(Number.isInteger(dorm)&&dorm>=0&&dorm<=30)f.dormitorios=dorm;
    if(/\b(?:cualquier cantidad de dormitorios|cualquier numero de dormitorios|sin importar los dormitorios|da lo mismo cuantos dormitorios|sin filtro de dormitorios)\b/.test(t))delete f.dormitorios;
    const max=u.maximo??a.maximo;
    if(Number.isFinite(max)&&max>0){f.maximo=max;f.moneda=(u.moneda??a.moneda)==='UF'?'UF':'CLP';}
    for(const k of ['banos','estacionamiento','tipo']){
      const v=u[k]??(!fresh?a[k]:undefined);
      if(k==='banos'&&Number.isInteger(v)&&v>=0&&v<=30)f.banos=v;
      if(k==='estacionamiento'&&typeof v==='boolean')f.estacionamiento=v;
      if(k==='tipo'&&typeof v==='string'){const type=voiceType(v);if(type)f.tipo=type;else delete f.tipo;}
    }
    return f;
  }
  function mergeVoiceFilters(c,a){
    const f=mergedSearchFilters(c.filters,a,c.lastUser||'');
    c.filters=f;applyVoiceFilters(f);return f;
  }
  function compactVoice(){if(call){
    setPanelOpen(true);
    g('#zwVoice').classList.add('compact');save();scroll();requestAnimationFrame(scroll);
  }}
  const VOICE_STYLE='Habla como una asesora chilena de Santiago, con tuteo natural. Usa «ya», «te muestro», «arriendo», «gastos comunes». No uses voseo rioplatense («querés», «tenés»). Pronuncia cien mil pesos (nunca ciento mil), novecientos cincuenta mil pesos y cuatrocientos mil pesos. Nunca digas «cuatrocientos pesos» por 400.000. Respeta literalmente los montos en palabras proporcionados; no leas dígitos ni el símbolo de moneda.';
  function spokenNumber(n){
    if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(n))return '';
    const small=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
    const tens=['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
    const hundreds=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
    const apocope=v=>v.replace(/veintiuno$/,'veintiún').replace(/ y uno$/,' y un').replace(/(^| )uno$/,'$1un');
    if(n<30)return small[n];
    if(n<100)return tens[Math.floor(n/10)]+(n%10?' y '+small[n%10]:'');
    if(n===100)return 'cien';
    if(n<1000)return hundreds[Math.floor(n/100)]+(n%100?' '+spokenNumber(n%100):'');
    if(n<1000000){const q=Math.floor(n/1000);return (q===1?'mil':apocope(spokenNumber(q))+' mil')+(n%1000?' '+spokenNumber(n%1000):'');}
    if(n<1000000000000){const q=Math.floor(n/1000000);return (q===1?'un millón':apocope(spokenNumber(q))+' millones')+(n%1000000?' '+spokenNumber(n%1000000):'');}
    return '';
  }
  function spokenPrice(n,currency='CLP'){
    if(n==null||!Number.isFinite(n))return 'por confirmar';
    if(currency==='UF'){
      const whole=Math.floor(n), fraction=String(n).split('.')[1];
      return (spokenNumber(whole)||String(whole))+(fraction?' coma '+fraction.split('').map(v=>spokenNumber(Number(v))).join(' '):'')+' unidades de fomento';
    }
    const words=spokenNumber(Math.round(n));
    return words?words.replace(/veintiuno$/,'veintiún').replace(/ y uno$/,' y un').replace(/(^| )uno$/,'$1un')+(Math.round(n)%1000000===0&&n>=1000000?' de pesos':n===1?' peso':' pesos'):'por confirmar';
  }
  function voiceRow(x){const currency=x.uf!=null?'UF':'CLP';return {id:x.id,name:x.t,commune:x.c,beds:x.d,baths:x.b,price:x.uf??x.p,currency,precioHablado:spokenPrice(x.uf??x.p,currency),parking:x.e?'Sí':'Por confirmar',commonExpensesCLP:x.gc??null,gastosComunesHablados:spokenPrice(x.gc),kind:x.op==='venta'?'buy':'rent',url:x.href};}
  function spokenSearchResult(list,total){
    if(!total)return 'No encontré propiedades con esos filtros. ¿Quieres que revisemos otras opciones?';
    const count=total===1?'una':spokenNumber(total);
    if(total===1){const x=list[0],r=voiceRow(x);return 'Ya, encontré una opción '+(x.op==='arriendo'?'de arriendo ':'')+'por '+r.precioHablado+'. '+(x.op==='arriendo'?'Los gastos comunes '+(x.gc!=null?'son de '+r.gastosComunesHablados:'están por confirmar')+'. ':'')+'Te dejé la ficha en pantalla. ¿Quieres revisarla?';}
    const prices=list.map(voiceRow),same=prices.every(x=>x.currency===prices[0].currency);
    const range=same&&total===list.length?' Los valores '+(prices[0].price===prices.at(-1).price?'son de '+prices[0].precioHablado:'van desde '+prices[0].precioHablado+' hasta '+prices.at(-1).precioHablado)+'.':'';
    return 'Ya, encontré '+count+' opciones.'+range+' Te dejé las fichas en pantalla. ¿Quieres revisar alguna?';
  }
  function awaitCurrentTranscript(c){
    if(!c.transcriptionPending)return Promise.resolve();
    return new Promise(resolve=>{
      let finished=false;
      const done=()=>{if(finished)return;finished=true;clearTimeout(timer);if(c.transcriptReady===done)c.transcriptReady=null;resolve();};
      const timer=setTimeout(done,2000);c.transcriptReady=done;
    });
  }
  const VOICE_GREETING='Hola, ¿cómo estás? Cuéntame, ¿qué estás buscando? ¿Arrendar, comprar o quizás una parcela?';
  function greetingLine(onProperty){return onProperty?'Hola, ¿cómo estás? ¿Te gustaría conocer más sobre esta propiedad o coordinar una visita?':SECTION_UI[section]?'Hola, ¿cómo estás? '+SECTION_UI[section].hello:VOICE_GREETING;}
  function sendGreeting(c){
    if(call!==c||c.greetingSent)return;
    c.greetingSent=true;clearTimeout(c.configTimer);
    const text=greetingLine(!!pagePropertyId());
    g('#zwVst').textContent='Zumi te saluda…';g('#zwVsub').textContent='En un momento te escucho.';pose('speak');
    voiceSend(c,{type:'response.create',response:{tool_choice:'none',max_output_tokens:100,instructions:'Solo pronuncia exactamente la siguiente frase, con voz cálida, natural y chilena. No agregues ninguna otra palabra, explicación, información del catálogo ni pregunta. Termina inmediatamente después de la frase y espera la intervención del usuario. Frase: '+JSON.stringify(text)}});
    c.greetingTimer=setTimeout(()=>finishGreeting(c),18000);
  }
  function syncCallMic(c){
    const track=c.stream?.getAudioTracks()[0];if(track)track.enabled=!c.intro&&!c.muted;
    g('#zwVmute').classList.toggle('on',!!c.muted);
  }
  function finishGreeting(c){
    if(call!==c||!c.intro)return;
    clearTimeout(c.greetingTimer);clearTimeout(c.configTimer);c.intro=false;syncCallMic(c);
    g('#zwVst').textContent='Te escucho…';g('#zwVsub').textContent='Habla cuando quieras.';g('#zwBars').style.visibility='visible';pose('listen');
    continueVoice(c);
  }
  function voiceSend(c,event){if(call===c&&c.dc?.readyState==='open'){c.dc.send(JSON.stringify(event));return true;}return false;}
  function continueVoice(c){if(call===c&&!c.intro&&c.needsResponse&&!c.generating&&!c.pending){
    c.needsResponse=false;
    const line=c.nextSpokenSearch;c.nextSpokenSearch=null;
    voiceSend(c,line?{type:'response.create',response:{tool_choice:'none',instructions:VOICE_STYLE+' Lee únicamente este resultado verificado, con naturalidad, sin modificar los números: '+JSON.stringify(line)}}:{type:'response.create'});
  }}
  function voiceContext(c,text){voiceSend(c,{type:'conversation.item.create',item:{type:'message',role:'system',content:[{type:'input_text',text}]}});}
  function voiceHistory(role,content){S.hist=(S.hist||[]).concat({role,content:String(content).slice(0,750)}).slice(-16);save();}
  function openVoiceProperty(c,x){
    if(!x||!c.known.has(x.id)||!sameSite(x.href))return false;
    S.viewing=x.id;c.selected=x.id;compactVoice();save();
    if(c.viewer){c.viewer.remove();c.viewer=null;}
    const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Ficha de propiedad');dialog.style.cssText='position:fixed;inset:0;width:100%;height:100%;max-width:100%;max-height:100%;margin:0;padding:0;border:0;background:white;color:#33214d;';
    const bar=document.createElement('div');bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#f3ecff';
    for(const [label,fn] of [['Volver a Zumi',()=>dialog.close()],['Finalizar llamada',()=>endCall('Llamada finalizada')]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:10px 14px;border:0;border-radius:20px;background:#7138c8;color:white;font:600 14px system-ui';b.onclick=fn;bar.append(b);}
    const frame=document.createElement('iframe');frame.title=x.t;frame.src=x.href;frame.style.cssText='width:100%;flex:1;min-height:0;border:0';
    dialog.append(bar,frame);document.body.append(dialog);c.viewer=dialog;
    dialog.addEventListener('close',()=>{dialog.remove();if(c.viewer===dialog)c.viewer=null;});
    try{dialog.showModal();dialog.style.display='flex';dialog.style.flexDirection='column';}catch{dialog.remove();c.viewer=null;return false;}
    return true;
  }
  async function runVoiceTool(c,j){
    if(!j.call_id||c.calls.has(j.call_id)||call!==c)return;c.calls.add(j.call_id);c.pending++;
    let out;
    try{
      const a=JSON.parse(j.arguments||'{}');
      if(j.name==='buscar_propiedades'){
        c.viewer?.close();compactVoice();
        await awaitCurrentTranscript(c);if(call!==c)return;
        const f=mergeVoiceFilters(c,a);
        if(!await ensureCatalog()){out={error:'catalogo_temporalmente_no_disponible',mensaje:'No se pudo verificar el inventario. No inventes resultados.'};}
        else if(call===c){
          const matches=voiceMatches(ALL,f),list=matches.slice(0,6);
          if(list.length){list.forEach(x=>c.known.add(x.id));add('Encontré <b>'+matches.length+' '+(matches.length===1?'propiedad':'propiedades')+'</b> que cumplen tus filtros.');showCards(list);compactVoice();}
          else{S.last=[];save();compactVoice();}
          c.nextSpokenSearch=spokenSearchResult(list,matches.length);
          out={total:matches.length,propiedades:list.map(voiceRow),filtros:f,fraseRecomendada:c.nextSpokenSearch,nota:'Resultado verificado. Si total es positivo, informa las propiedades encontradas y sus precios; nunca digas que no hay resultados. El presupuesto de arriendo es el canon sin gastos comunes. Si total es cero, pregunta qué filtro flexibilizar.'};
        }
      }else if(j.name==='mostrar_seccion'){
        const requested=String(a.seccion||section);
        if(!SECTION_UI[requested]){out={error:'seccion_desconocida'};}
        else{
          switchSection(requested);compactVoice();
          if(a.accion==='contacto'){sectionContact();out={mostrado:true,nota:'Se mostró el contacto, no se ha confirmado ninguna visita.'};}
          else if(a.accion==='formulario'){sectionFormChips();out={mostrado:true,nota:section==='propietario'?'Se abrió el formulario dentro del chat. El cliente debe completarlo y enviarlo.':'Se mostró el acceso al formulario.'};}
          else if(requested==='propietario'){showOwnerPlans();out={mostrado:true,nota:'Comparativa visual de planes mostrada con botones para inscribir la propiedad.'};}
          else{await ensureCatalog();await knowledgeReady;const rows=sectionRows();const selected=Array.isArray(a.ids)&&a.ids.length?rows.filter(x=>a.ids.includes(x.id)):rows.slice(0,6);
            if(selected.length)showCards(selected);
            out={total:selected.length,mostrado:!!selected.length,proyectos:selected.map(x=>({id:x.id,nombre:x.t,comuna:x.c,desdeUF:x.uf,precioCLP:x.p,datos:[...(knowledge?.parcelas||[]),...(knowledge?.proyectos||[])].find(k=>k.id===x.id)||null}))};
          }
        }
      }else if(j.name==='abrir_ficha'||j.name==='consultar_ficha'||j.name==='preparar_visita'){
        const id=String(a.id||c.selected||S.viewing||'');const x=byId(id);
        if(!x||!c.known.has(id))out={error:'ficha_no_identificada',mensaje:'Pregunta cuál de las propiedades mostradas desea.'};
        else if(j.name==='abrir_ficha')out={fichaAbierta:openVoiceProperty(c,x),propiedad:voiceRow(x)};
        else if(j.name==='consultar_ficha'){
          out=voiceRow(x);
          try{const res=await fetch('/api/properties?id='+encodeURIComponent(id),{signal:c.abort.signal});if(res.ok){const detail=(await res.json()).properties?.find(v=>v.id===id);if(detail)out={...out,superficieUtil:detail.usableArea,descripcion:String(detail.description||'').slice(0,1000)};}}catch{}
        }else{
          c.viewer?.close();compactVoice();c.selected=id;S.viewing=id;
          showVisitForm(x,typeof a.horario==='string'?a.horario.trim():'');
          out={formularioAbierto:true,propiedad:voiceRow(x),mensaje:'Solicita completar y confirmar la solicitud en el chat; no se ha reservado ni enviado aún.'};
        }
      }else out={error:'accion_desconocida'};
    }catch{out={error:'consulta_no_disponible',mensaje:'No se pudo completar la consulta. No inventes datos.'};}
    finally{
      c.pending--;if(call!==c)return;
      voiceSend(c,{type:'conversation.item.create',item:{type:'function_call_output',call_id:j.call_id,output:JSON.stringify(out||{error:'consulta_cancelada'})}});
      c.needsResponse=true;continueVoice(c);
    }
  }
  function endCall(msg){
    const c=call;call=null;if(c){clearInterval(c.timer);clearTimeout(c.timeout);clearTimeout(c.configTimer);clearTimeout(c.greetingTimer);c.abort.abort();c.viewer?.remove();c.dc?.close();c.pc?.close();c.stream?.getTracks().forEach(t=>t.stop());c.audio?.remove();}
    g('#zwVoice').classList.remove('on','compact');g('#zwVmute').classList.remove('on');pose('wait');if(msg)add(msg,'sys');
  }
  g('#zwVsee').onclick=compactVoice;
  g('#zwCall').onclick=async()=>{
    if(call){g('#zwVoice').classList.toggle('compact');return;}stopSpeech();
    const c={abort:new AbortController(),secs:0,calls:new Set(),known:new Set(),filters:voiceFilters(),pending:0,generating:false,needsResponse:false,intro:true,muted:false,manualTurns:false,greetingSent:false};
    call=c;g('#zwVoice').classList.remove('compact');g('#zwVoice').classList.add('on');g('#zwVst').textContent='Conectando…';g('#zwVsub').textContent='Preparando la conversación';g('#zwBars').style.visibility='hidden';g('#zwVt').textContent='00:00 / 05:00';
    c.timeout=setTimeout(()=>{if(call===c)endCall('No pude conectar la llamada. Inténtalo nuevamente.');},35000);
    try{
      c.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(call!==c){c.stream.getTracks().forEach(t=>t.stop());return;}
      c.pc=new RTCPeerConnection();c.audio=document.createElement('audio');c.audio.autoplay=true;document.body.append(c.audio);
      c.pc.ontrack=e=>{if(call!==c)return;c.audio.srcObject=e.streams[0]||new MediaStream([e.track]);c.audio.play().catch(()=>{if(call===c)endCall('El navegador bloqueó la reproducción de audio.');});};
      c.pc.onconnectionstatechange=()=>{if(call===c&&c.pc.connectionState==='failed')endCall('Se perdió la conexión de voz.');};
      syncCallMic(c); // Keep the mic quiet while Zumi delivers the opening line.
      c.stream.getTracks().forEach(t=>c.pc.addTrack(t,c.stream));
      const dc=c.dc=c.pc.createDataChannel('oai-events');
      dc.onopen=()=>{
        if(call!==c)return;clearTimeout(c.timeout);
        // Explicitly control the next turn: silence is never a user request.
        voiceSend(c,{type:'session.update',session:{type:'realtime',audio:{input:{turn_detection:{type:'server_vad',threshold:0.65,silence_duration_ms:700,create_response:false,interrupt_response:true}}}}});
        // Older session implementations can fall back to the original VAD behavior.
        c.configTimer=setTimeout(()=>sendGreeting(c),1800);
        c.timer=setInterval(()=>{if(call!==c)return;c.secs++;g('#zwVt').textContent=String(Math.floor(c.secs/60)).padStart(2,'0')+':'+String(c.secs%60).padStart(2,'0')+' / 05:00';if(c.secs>=300)endCall('Llamada finalizada');},1000);
        void ensureCatalog().then(()=>{
          if(call!==c)return;
          const recent=(S.last||[]).map(byId).filter(Boolean).slice(0,3);recent.forEach(x=>c.known.add(x.id));
          const selected=byId(pagePropertyId()||S.viewing);if(selected){c.known.add(selected.id);c.selected=selected.id;}
          const context='Contexto guardado, no es una solicitud nueva: '+JSON.stringify({seccion:section,filtros:c.filters,propiedadesMostradas:recent.map(voiceRow),ficha:selected?voiceRow(selected):null})+'. Después del saludo espera una intervención real del cliente. Nunca expliques limitaciones del catálogo sin que el cliente haya solicitado buscar. Para buscar usa buscar_propiedades y sus resultados verificados. Si cambia de comuna o hace una nueva búsqueda con comuna y precio, elimina los dormitorios anteriores salvo que pida conservarlos. No apliques requisitos no pedidos. Si dice propiedad o inmueble no es un tipo. '+VOICE_STYLE;
          voiceContext(c,context);
        });
        void knowledgeReady.then(k=>{
          if(call!==c||!k)return;
          const focus=sectionFocus();
          const projectSummaries=(k.proyectos||[]).map(x=>({id:x.id,nombre:x.nombre,comuna:x.comuna,desdeUF:x.desdeUF,entrega:x.entrega,especificaciones:x.especificaciones}));
          const data={seccion:section,parcelas:k.parcelas,proyectos:projectSummaries,proyectoEnPantalla:(k.proyectos||[]).find(x=>x.id===focus)||null,servicios:k.servicios};
          voiceContext(c,'Información comercial pública del sitio: '+JSON.stringify(data)+'. En secciones de parcelas, proyectos o servicios responde usando estos datos, no la búsqueda de arriendos. Para mostrar tarjetas o derivar a formulario usa mostrar_seccion. Si un propietario pide comparar planes usa mostrar_seccion con seccion propietario y accion listar. Si quiere inscribir la propiedad usa accion formulario; nunca pidas los datos personales por voz, deja que el cliente complete el formulario dentro del chat. Nunca inventes disponibilidad, tasas, precios o confirmaciones. Si falta un dato ofrece consultar al equipo.');
        });
      };
      dc.onmessage=e=>{try{if(call!==c)return;const j=JSON.parse(e.data);
        if(j.type==='session.updated'){
          const vad=j.session?.audio?.input?.turn_detection;
          if(vad?.create_response===false){c.manualTurns=true;sendGreeting(c);}
        }
        if(j.type==='input_audio_buffer.speech_started'&&!c.intro){c.lastUser='';c.transcriptionPending=true;}
        if(j.type==='conversation.item.input_audio_transcription.failed'){c.transcriptionPending=false;c.transcriptReady?.();if(!c.intro&&c.manualTurns)add('No alcancé a entenderte. ¿Puedes repetirlo?','sys');}
        if(j.type==='conversation.item.input_audio_transcription.completed'){
          c.transcriptionPending=false;c.transcriptReady?.();
          const words=String(j.transcript||'').trim();
          if(!c.intro&&/[\p{L}\p{N}]/u.test(words)){
            c.lastUser=words;add(esc(words),'me');voiceHistory('user',words);
            if(c.manualTurns){c.needsResponse=true;continueVoice(c);}
          }
        }
        if(j.type==='response.output_audio_transcript.done'&&j.transcript){add(esc(j.transcript),'bot');voiceHistory('assistant',j.transcript);}
        if(j.type==='response.created'){c.generating=true;if(c.intro&&c.greetingSent)c.greetingResponseId=j.response?.id;pose('speak');}
        if(j.type==='response.done'){c.generating=false;if(c.intro){if(j.response?.status==='failed'||j.response?.status==='cancelled')finishGreeting(c);}else{pose('listen');continueVoice(c);}}
        if(j.type==='output_audio_buffer.stopped'&&c.intro&&(!c.greetingResponseId||j.response_id===c.greetingResponseId))finishGreeting(c);
        if(j.type==='response.function_call_arguments.done'&&!c.intro)void runVoiceTool(c,j);
        if(j.type==='error'){c.generating=false;if(c.intro&&!c.greetingSent)sendGreeting(c);else if(c.intro)finishGreeting(c);else continueVoice(c);}
      }catch{}};
      dc.onclose=()=>{if(call===c)endCall('Se cerró la conexión de voz.');};
      const offer=await c.pc.createOffer();await c.pc.setLocalDescription(offer);
      const r=await fetch('/.netlify/functions/zumi-voz',{method:'POST',headers:{'Content-Type':'application/sdp'},body:offer.sdp,signal:c.abort.signal});
      if(!r.ok)throw Error();if(call===c)await c.pc.setRemoteDescription({type:'answer',sdp:await r.text()});
    }catch{if(call===c)endCall('No pude iniciar la llamada. Puedes usar el chat de texto.');}
  };
  g('#zwVend').onclick=()=>endCall('Llamada finalizada');g('#zwVtxt').onclick=()=>endCall('Seguimos por texto');g('#zwVmute').onclick=()=>{if(call){call.muted=!call.muted;syncCallMic(call);}};
  window.addEventListener('pagehide',()=>{close();});
  window.addEventListener('pageshow',e=>{if(e.persisted){setPanelOpen(false);save();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))close();});

  /* ---------- restore chat history, but never auto-open on navigation ---------- */
  async function restoreCards(){
    const groups=Array.from(msgs.querySelectorAll('.zw-cards[data-restore]'));
    if(!groups.length)return;
    if(!await ensureCatalog())return;
    for(const group of groups){
      if(!group.isConnected)continue;
      const ids=Array.from(group.querySelectorAll('a[data-act="view"]')).map(a=>a.dataset.id);
      const list=ids.map(id=>byId(id)||PROJ.find(p=>p.id===id)).filter(Boolean);
      if(!list.length){group.remove();continue;}
      group.innerHTML=list.map(card).join('');group.removeAttribute('data-restore');group.hidden=false;
    }
    save();if(S.open)scroll();
  }
  if(S.html){
    msgs.innerHTML=S.html.split('/assets/zumi-planes-propietarios.svg').join('/assets/planes-propietarios-original.jpg');
    msgs.querySelectorAll('.zw-typing').forEach(t=>t.parentElement.remove());
    // Rebuild saved cards from the current public catalog before showing them.
    msgs.querySelectorAll('.zw-cards').forEach(el=>{el.hidden=true;el.setAttribute('data-restore','1');});
    msgs.querySelectorAll('.zw-cmp').forEach(el=>el.remove());
    msgs.querySelectorAll('form[data-visit-form]').forEach(f=>{delete f.dataset.submitting;f.querySelector('button').disabled=false;});
    msgs.querySelectorAll('form[data-owner-form]').forEach(f=>{delete f.dataset.submitting;f.querySelector('button[type=submit]').disabled=false;f.querySelector('button[type=submit]').textContent='Enviar e inscribir mi propiedad';f.querySelector('.zw-owner-status').textContent='';});
  }
  setPanelOpen(false);save();
  void restoreCards();
})();
