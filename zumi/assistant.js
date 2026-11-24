window.ZUMI_ASSETS={"torso": "torso.webp", "armLeft": "armLeft.webp", "mouth": "mouth.webp"};
/* Zumi Peluche / Laboratorio local v1.2 | Canvas2D rig | no network, no storage. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ease=(v)=>v*v*(3-2*v);
const sceneCanvas=$('zumiCanvas');
const context=sceneCanvas.getContext('2d',{alpha:true});
const imgs={};
const assets=window.ZUMI_ASSETS||{};
const posture={
  // Exactly one articulated image per side. No native/alternate arm cross-fades.
  greeting:{left:0,right:-1.93,body:-.005,pitch:-.008,mouth:0},
  idle:{left:0,right:0,body:.005,pitch:.008,mouth:0},
  listening:{left:.02,right:-2.29,body:.014,pitch:.016,mouth:0},
  speaking:{left:.02,right:-.20,body:.010,pitch:0,mouth:.32},
  pointing:{left:1.08,right:.015,body:.004,pitch:-.012,mouth:0},
  happy:{left:.55,right:-1.45,body:-.020,pitch:0,mouth:.12}
};
const copy={
  greeting:['¡Holaaa! 👋','Levanto mi brazo suavemente, saludo tres veces y vuelvo a descansar.'],
  idle:['¿Necesitas ayuda?','Espero cerca por si quieres conversar conmigo.'],
  listening:['Te escucho 👂','Me acerco un poquito y presto atención.'],
  speaking:['¡Me encantará ayudarte!','Hablo con la mirada y la boca; los brazos permanecen relajados y acompaño con gestos mínimos.'],
  pointing:['¡Mira por aquí!','Extiendo un brazo hacia las opciones del chat mientras el otro descansa.'],
  happy:['¡Qué buena noticia! ✨','Celebro contigo con una reacción amistosa.']
};
const pos={};const vel={};
let mode='lab', state='greeting',stateAt=performance.now(),loop=true, energy=1.08,last=0,t=0,faceBlink=0,nextBlink=1.8,blinkStart=-99,frame=0,sequence=[],chatOpen=false,disposed=false,look={x:0,y:0},orientation='left',speakerOn=false,raf=null;
const poses=['greeting','idle','listening','speaking','pointing','happy'];
let imageCount=0;let pointDirection='left';let pointingTimer=null;const fineMotion={pace:.90,detail:.70};
let greetingEmphasis=1.0,replyPulseUntil=0;
const WAVE={raiseMs:1650,begin:1.45,end:4.35,finish:4.7,cycles:3};
Object.entries(assets).forEach(([k,src])=>{const im=new Image();im.onload=()=>{imageCount++;};im.src=src;imgs[k]=im;});
const assetReady=k=>imgs[k]?.complete&&imgs[k]?.naturalWidth>0;
const motionPref=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let motion=!motionPref;

function spring(k,target,dt,kp=11,kd=6,speed=1.5){
  const x=pos[k]??target,v=vel[k]??0;
  // Semi-implicit integration with an explicit per-second velocity cap.
  let vv=(v+(target-x)*kp*dt)/(1+kd*dt);
  vv=clamp(vv,-speed,speed);
  const xx=x+vv*dt;
  pos[k]=xx;vel[k]=vv;return xx;
}
// Motion tracks interpolate between the CURRENT position and the new pose, even
// if a visitor clicks again before the first transition finishes. No sudden jumps.
const arms={left:{from:0,to:0,start:0,duration:2400,delay:0},
            right:{from:0,to:0,start:0,duration:2400,delay:0}};
function smootherStep(q){q=clamp(q,0,1);return q*q*q*(q*(q*6-15)+10);}
function targetArm(side,s){
  if(s==='pointing'&&pointDirection==='right')return side==='left'?.03:-1.15;
  return posture[s][side];
}
function armValue(side,now){
  const a=arms[side];
  if(!motion)return a.to;
  const u=clamp((now-a.start-a.delay)/a.duration,0,1);
  return a.from+(a.to-a.from)*smootherStep(u);
}
function armProgress(side,now){const a=arms[side];return clamp((now-a.start-a.delay)/a.duration,0,1);}
function animateArms(s,now=performance.now()){
  for(const side of ['left','right']){
    const a=arms[side], current=armValue(side,now), to=targetArm(side,s);
    if(Math.abs(to-current)<.006){a.from=to;a.to=to;a.start=now;a.delay=0;continue;}
    a.from=current;a.to=to;a.start=now;
    // Full gestures take roughly 2.4–3.2 s; small corrections stay gentle.
    a.duration=clamp((2500+Math.abs(to-current)*420)/fineMotion.pace,2500,4500);
    // The entering wave raises the same right-arm sprite, faster but still soft.
    // All other gestures retain the approved slow interpolation.
    if(s==='greeting' && side==='right' && motion)a.duration=WAVE.raiseMs;
    a.delay=side==='right'?95:15;
  }
}
function setState(s,{silent=false}={}){
  if(!posture[s])return;
  animateArms(s);state=s;stateAt=performance.now();
  document.querySelectorAll('[data-state]').forEach(b=>{b.classList.toggle('active',b.dataset.state===s);b.setAttribute('aria-pressed',String(b.dataset.state===s));});
}
function pointAtChat(){
  // The conversational panel is physically LEFT of Zumi in this web layout.
  // When layout changes, read actual element positions rather than hardcode the gesture.
  if(mode==='web'&&!$('chatPanel').hidden){
    const a=$('chatPanel').getBoundingClientRect(), b=$('webFigure').getBoundingClientRect();
    pointDirection=(a.left+a.right)/2 < (b.left+b.right)/2 ? 'left' : 'right';
  } else pointDirection='left';
  setState('pointing');
}
function cancelDemo(){sequence.forEach(clearTimeout);sequence=[];}
function playDemo(){cancelDemo();const events=[['greeting',0],['idle',5000],['listening',10500],['speaking',16200],['pointing',22000],['happy',27800],['idle',33800]];events.forEach(([p,ms])=>sequence.push(setTimeout(()=>p==='pointing'?pointAtChat():setState(p),ms)));}
function stopDemo(){cancelDemo();window.speechSynthesis?.cancel?.();speakerOn=false;setState('idle');}
function moveCanvasTo(target){const host=$(target);host.prepend(sceneCanvas);}
function setMode(){mode='web';moveCanvasTo('webFigure');}
// Zumi 3.3 — property-specific WhatsApp handoff, used-property photo URLs and project cross-sell. Lab only.
const catalog=window.ZUMI_CATALOG||{rent:[],buy:[],projects:[]};
const ROOT='https://corretajeguzman.com';
const U={rent:ROOT+'/arriendos',buy:ROOT+'/comprar',projects:ROOT+'/proyectos/',owner:ROOT+'/propietarios',admin:ROOT+'/administracion',finance:ROOT+'/simulador-capacidad/',rentForm:ROOT+'/solicitud',wa:'https://wa.me/56944637680',parcel:'https://corretajeguzman.com/parcelas/campo-alto-roble'};
const normalize=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const formatMoney=(n,m='CLP')=>m==='UF'?'UF '+Number(n).toLocaleString('es-CL'):'$'+Number(n).toLocaleString('es-CL');
const chat=$('chatHistory');let dialog={intent:null,step:0,answers:{},steps:[],done:false},queued=0,liveSearch=false;
// Zumi 5.1 — preference memory is voluntary, per-tab, and never stores names,
// phones, emails, income, savings or free text. Nothing is sent to a server.
const CRITERIA_KEY='zumi-51-search-preferences';
const STATS_KEY='zumi-51-session-metrics';
let rememberCriteria=false, savedCriteria=null, contextualProperty=null, catalogOrigin='copia referencial';
try{const prior=JSON.parse(sessionStorage.getItem(CRITERIA_KEY)||'null');if(prior && ['rent','used'].includes(prior.intent) && typeof prior.commune==='string'){savedCriteria=prior;rememberCriteria=true;}}catch(_e){}
let metrics={open:0,search:0,results:0,property:0,visit:0,whatsapp:0,owner:0};
function trackMetric(key){if(!(key in metrics))return;metrics[key]++;paintMetrics();
 if(window.ZUMI_ANALYTICS_CONSENT===true && Array.isArray(window.dataLayer))window.dataLayer.push({event:'zumi_'+key});}
function paintMetrics(){const target=$('zumi51Metrics');if(target)target.textContent=Object.entries(metrics).map(([k,v])=>k+': '+v).join(' · ');}
function saveSearchPrefs(){if(!rememberCriteria)return;const answers=dialog.answers||{};
 const safe={intent:dialog.intent==='used'?'used':dialog.intent==='rent'?'rent':null,commune:String(answers.commune||'').slice(0,65),beds:String(answers.beds||'').slice(0,8),budget:String(answers.budget||'').slice(0,40)};
 if(!safe.intent)return; savedCriteria=safe;try{sessionStorage.setItem(CRITERIA_KEY,JSON.stringify(safe));}catch(_e){}
}
function forgetSearchPrefs(){rememberCriteria=false;savedCriteria=null;try{sessionStorage.removeItem(CRITERIA_KEY)}catch(_e){} const c=$('zumi51Remember');if(c)c.checked=false;}
function setRemember(on){rememberCriteria=!!on;if(on){saveSearchPrefs();}else forgetSearchPrefs();}
function validPublicURL(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname.replace(/^www\./,'')==='corretajeguzman.com';}catch{return false;}}
function setPageContext(info){const id=String(info?.propertyId||info?.id||'');const url=String(info?.url||'');
 const p=[...catalog.rent,...catalog.buy].find(x=>x.id===id||(url&&x.url===url));
 contextualProperty=p||null;
 const label=$('zumi51ContextLabel');if(label)label.textContent=p?('Ficha seleccionada: '+p.name):'Sin ficha seleccionada';
 return Boolean(p);
}
function contextualFromURL(){const qp=new URLSearchParams(location.search);const explicit=window.ZUMI_PAGE_CONTEXT||{};
 const guessedId=String(explicit.propertyId||qp.get('zumi_property_id')||(location.pathname.match(/(rec[A-Za-z0-9]{14})/)||[])[1]||'');
 const u=explicit.url||((location.hostname.endsWith('corretajeguzman.com')&&location.pathname.startsWith('/propiedad/'))?location.href:'');
 setPageContext({propertyId:guessedId,url:u});
}
function showContextualIntro(){if(!contextualProperty)return false;const p=contextualProperty;
 bubble('💜 Veo que estás mirando '+p.name+'. ¿Qué te gustaría saber?');
 const pic=node('div','zumi51-context-card');
  const photoLink=()=>{const link=node('a','zumi51-photo-link','📷 Ver fotos en ficha ↗');link.href=validPublicURL(p.url)?p.url:U.rent;link.target='_blank';link.rel='noopener noreferrer';return link;};
  if(zumi53Photos(p).length){pic.appendChild(zumi53PhotoBlock(p));}else{pic.appendChild(photoLink());}
  const info=node('div','');info.append(node('strong','',p.name),node('small','',p.commune+' · '+formatMoney(p.price,p.currency)),node('small','',(p.beds||'?')+' dorm. · '+(p.baths||'?')+' baños · Est.: '+(p.parking||'consultar')));
  pic.append(info);chat.append(pic);
 choice(['📋 Ver información','📅 Coordinar visita','🔎 Buscar parecidas','↩ Ver servicios'],v=>{
  if(v.includes('información')){renderCards([p]);}
  else if(v.includes('visita')){showPropertyInterest(p);}
  else if(v.includes('parecidas')){begin(p.kind==='rent'?'rent':'used');}
  else{contextualProperty=null;welcome();}
 });return true;
}
function parseChange(s){const n=normalize(s);const candidates=[...new Set([...catalog.rent,...catalog.buy,...catalog.projects].map(x=>x.commune).filter(Boolean))];
 const commune=candidates.find(c=>{const co=normCommune(c);return co.length>3&&new RegExp('(?:^|\\b)'+co.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\b|$)').test(normCommune(n));});
 const bedsMatch=n.match(/(\d+)\s*(?:dormitorios?|dorm\.?|habitaciones?)/);
 const budgetMatch=s.match(/(?:\$|uf\s*)([\d.]+(?:,\d+)?)/i);
 const budget=budgetMatch?(budgetMatch[0].toUpperCase().startsWith('UF')?'UF ':'$')+budgetMatch[1]:null;
 return {commune,beds:bedsMatch?bedsMatch[1]:null,budget};
}
function smartMessage(text){const clean=normalize(text);
 // Control global, even when the conversation was waiting for another field.
 if(/^(volver (?:al )?inicio|volver|inicio|menu|men[uú] principal|empezar de nuevo|reiniciar|partamos de nuevo)$/i.test(clean)){welcome();return true;}
 if(/^(?:cambi[eé] de opini[oó]n.*|mejor quiero .*|ahora quiero .*|prefiero comprar.*|prefiero arrendar.*)$/.test(clean)){
   const kind=parseIntent(text);if(kind){bubble(text,'user');deliverAfterPause(()=>begin(kind));return true;}
 }
 if(dialog.done && (dialog.intent==='rent'||dialog.intent==='used') &&
    /(otra comuna|en (?:la |el )?|mas barato|m[aá]s dormitorios|presupuesto|hasta |dormitorios?)/i.test(clean)){
   const update=parseChange(text);let changed=false;
   for(const key of ['commune','beds','budget'])if(update[key]){dialog.answers[key]=update[key];changed=true;}
   if(changed){bubble(text,'user');saveSearchPrefs();deliverAfterPause(()=>{bubble('Mantengo tus otros filtros y actualizo la búsqueda.');findProperties();});return true;}
 }
 return false;
}
async function refreshPublicCatalog(){
 try{const r=await fetch('/.netlify/functions/zumi-catalog',{cache:'no-store'});if(!r.ok)throw Error('offline');
 const json=await r.json();if(!json.available||!Array.isArray(json.rent)||!Array.isArray(json.buy))throw Error('disabled');
 catalog.rent.splice(0,catalog.rent.length,...json.rent);catalog.buy.splice(0,catalog.buy.length,...json.buy);
 catalogOrigin='Airtable: lectura pública filtrada';
 const safety=document.querySelector('#chatPanel .chatSafety');if(safety)safety.textContent='● Consulta de catálogo público de Airtable · precios y disponibilidad sujetos a confirmación';
 const badge=$('zumi51Catalog');if(badge)badge.textContent='Catálogo: Airtable · última consulta '+new Date(json.fetchedAt).toLocaleTimeString('es-CL');
 contextualFromURL();return true;
 }catch(_e){const badge=$('zumi51Catalog');if(badge)badge.textContent='Catálogo: referencia de prueba (no sincronizado con Airtable)';return false;}
}

// Pacing only affects replies after a visitor interacts. It never delays typing or a real navigation.
let responseTimer=null,responseNonce=0,responding=false,responseIndicator=null;
function cancelResponse(){responseNonce++;if(responseTimer!==null)clearTimeout(responseTimer);responseTimer=null;responding=false;if(responseIndicator){responseIndicator.remove();responseIndicator=null;}}
function deliverAfterPause(callback){
  cancelResponse();const token=responseNonce;
  responding=true;goState('listening');
  const indicator=node('div','zumi-is-preparing');indicator.setAttribute('role','status');indicator.setAttribute('aria-label','Zumi está preparando su respuesta');
  indicator.innerHTML='<span class="thinking-label">Zumi está preparando tu respuesta</span><span class="dot-wave" aria-hidden="true"><i></i><i></i><i></i></span>';
  responseIndicator=indicator;chat.appendChild(indicator);scrollBottom();
  const delay=2200+Math.floor(Math.random()*601);
  responseTimer=setTimeout(()=>{if(token!==responseNonce||!chatOpen)return;responseTimer=null;responding=false;responseIndicator?.remove();responseIndicator=null;callback();},delay);
}

const nearMap={
 'santiago':['nunoa','san miguel','estacion central','independencia','san joaquin','quinta normal'],
 'nunoa':['providencia','macul','san joaquin','la reina','santiago'],
 'providencia':['nunoa','las condes','santiago','la reina','macul'],
 'la florida':['macul','puente alto','san joaquin','la reina'],
 'macul':['nunoa','san joaquin','la florida'],
 'las condes':['providencia','la reina','nunoa'],
 'san miguel':['santiago','san joaquin','macul'],
 'puente alto':['la florida','la pintana','san jose de maipo'],
 'buin':['paine','san bernardo'],
 'independencia':['santiago','quinta normal','recoleta','estacion central'],
 'estacion central':['santiago','quinta normal','independencia'],
 'la reina':['nunoa','las condes','la florida'],
 'san joaquin':['macul','santiago','nunoa','san miguel']
};
const normCommune=s=>{let x=normalize(s).replace(/\b(santiago centro|centro de santiago)\b/g,'santiago');return x;};
function bubble(content,who='zumi'){
 const e=document.createElement('div');e.className='message '+(who==='user'?'from-user':'from-zumi');e.textContent=content;chat.appendChild(e);chat.scrollTop=chat.scrollHeight;
 // Subtle breathing/face cue as Zumi responds; no extra arm layers.
 if(who!=='user'&&chatOpen)replyPulseUntil=performance.now()+1350;
 return e;
}
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function clearChoice(){chat.querySelectorAll('.chips,.welcome-grid,.more-intents,.subchoices,.stepHint').forEach(e=>e.remove());}
function btn(label,callback,primary=false){const b=node('button',primary?'zchoice active':'zchoice',label);b.type='button';b.addEventListener('click',callback);return b;}
function scrollBottom(){chat.scrollTop=chat.scrollHeight;}
function goState(st){setState(st);}
function welcome(){
 cancelResponse();queued++;dialog={intent:null,step:0,answers:{},steps:[],done:false};chat.replaceChildren();goState('greeting');
 if(showContextualIntro())return;
 bubble('¡Hola! Soy Zumi 💜 ¿Cómo puedo ayudarte hoy?');
 const grid=node('div','welcome-grid');
 for(const [icon,label,intent] of [['🔑','Busco arrendar','rent'],['🏠','Busco comprar','buy'],['💜','Arrendar mi propiedad','owner'],['🛠️','Administrar mi propiedad','admin']]){
   const b=node('button','welcome-option');b.type='button';b.innerHTML='<span>'+icon+'</span><strong>'+label+'</strong><small>Continuar →</small>';
   b.addEventListener('click',()=>{if(responding)return;clearChoice();bubble(label,'user');deliverAfterPause(()=>begin(intent))});grid.appendChild(b);
 }
 chat.appendChild(grid);
 const more=node('div','more-intents');more.append(btn('Ver proyectos nuevos',()=>{clearChoice();deliverAfterPause(()=>begin('projects'))}),btn('Otros servicios',()=>{clearChoice();deliverAfterPause(otherServices)}));chat.appendChild(more);
 if(savedCriteria?.intent){const recent=node('div','zumi51-recent');recent.append(node('span','',`Tu búsqueda anterior: ${savedCriteria.commune||'Comuna pendiente'} · ${savedCriteria.beds||'?'} dormitorios · ${savedCriteria.budget||'presupuesto pendiente'}`));recent.append(btn('Retomar',()=>{begin(savedCriteria.intent);dialog.answers={commune:savedCriteria.commune,beds:savedCriteria.beds,budget:savedCriteria.budget};dialog.step=dialog.steps.length;finish();}));chat.append(recent);}
 scrollBottom();
}
function otherServices(){bubble('También puedo ayudarte con parcelas, postulación de corredores o una asesoría.');choice(['🌿 Parcelas','🤝 Ser corredor','💬 Hablar con asesor','↩ Volver al inicio'],v=>{
 if(v.startsWith('↩'))welcome();else if(v.includes('Parcelas')){begin('parcel');}
 else if(v.includes('corredor')){bubble('Conoce cómo trabajar con Corretaje Guzmán.');externalLinks([['Ver programa de corredores',ROOT+'/se-corredor']]);}
 else externalLinks([['WhatsApp Corretaje Guzmán',U.wa]]);
 });}
function choice(labels,cb){clearChoice();const c=node('div','chips');for(const label of labels){const b=btn(label,()=>{if(responding)return;c.remove();if(dialog.steps.length&&!dialog.done){cb(label);}else{deliverAfterPause(()=>cb(label));}});c.appendChild(b)}chat.appendChild(c);scrollBottom();}
function externalLinks(rows){const r=node('div','mini-actions');for(const [txt,href] of rows){const a=node('a','zchoice',txt+' ↗');a.href=href;a.target='_blank';a.rel='noopener noreferrer';r.appendChild(a);}chat.appendChild(r);scrollBottom();}
function begin(intent){queued++;dialog={intent,step:0,answers:{},steps:[],done:false};
 if(intent==='buy'){bubble('¿Qué tipo de propiedad quieres comprar?');choice(['Propiedad usada','Proyecto nuevo','Parcela en el sur'],v=>{bubble(v,'user');begin(v==='Proyecto nuevo'?'projects':v==='Parcela en el sur'?'parcel':'used')});return;}
 if(intent==='rent'){dialog.steps=[{key:'commune',q:'¿En qué comuna te gustaría arrendar?',opts:['Santiago Centro','Ñuñoa','Providencia','La Florida','Buin','Otra comuna']},{key:'budget',q:'¿Cuál es tu presupuesto mensual máximo?',opts:['$400.000','$550.000','$700.000','$950.000','Otro monto']},{key:'beds',q:'¿Cuántos dormitorios necesitas?',opts:['1','2','3','4 o más']}];}
 if(intent==='used'){dialog.steps=[{key:'commune',q:'¿En qué comuna quieres comprar?',opts:['Santiago Centro','Ñuñoa','Buin','San Miguel','Independencia','Otra comuna']},{key:'budget',q:'¿Cuál es tu presupuesto? Indícame UF o pesos.',opts:['2.500 UF','4.000 UF','5.000 UF','$90.000.000','Otro monto']},{key:'beds',q:'¿Cuántos dormitorios buscas?',opts:['1','2','3','4 o más']}];}
 if(intent==='projects'){dialog.steps=[{key:'commune',q:'¿En qué comuna prefieres un proyecto nuevo?',opts:['Ñuñoa','Santiago Centro','La Florida','Macul','San Joaquín','Otra comuna']},{key:'beds',q:'¿Cuántos dormitorios te gustaría tener?',opts:['1','2','3','Cualquiera']},{key:'destination',q:'¿Para qué comprarías el departamento?',opts:['Primera vivienda','Inversión','Segunda vivienda']},{key:'income',q:'¿Cuál es tu renta líquida mensual? (CLP)',opts:['$1.500.000','$2.500.000','$3.500.000','Otro monto']},{key:'complement',q:'¿Complementarías renta con otra persona?',opts:['No','Sí']},{key:'savings',q:'¿Cuánto tienes ahorrado para el pie?',opts:['$0','$5.000.000','$20.000.000','Otro monto']},{key:'term',q:'¿Qué plazo de crédito quieres explorar?',opts:['20 años','25 años','30 años']}];}
 if(intent==='parcel'){dialog.steps=[{key:'budgetUF',q:'🌿 Campo Alto Roble tiene parcelas desde UF 2.400. ¿Cuál es tu presupuesto máximo en UF?',opts:['UF 2.400','UF 2.600','UF 2.900','UF 3.100','Otro monto']},{key:'payMode',q:'¿Cómo te gustaría comprar?',opts:['Con crédito directo','Pago al contado','Quiero asesoría'] }];}
 if(intent==='owner'){dialog.steps=[{key:'commune',q:'¿Dónde está ubicada tu propiedad?',opts:['Santiago','Ñuñoa','Providencia','La Florida','Otra comuna']},{key:'propertyType',q:'¿Qué tipo de propiedad quieres arrendar?',opts:['Departamento','Casa','Oficina','Local comercial']},{key:'beds',q:'¿Cuántos dormitorios tiene?',opts:['1','2','3','4 o más']},{key:'budget',q:'¿Cuál es tu arriendo mensual estimado?',opts:['$400.000','$550.000','$700.000','No lo sé']}];}
 if(intent==='admin'){dialog.steps=[{key:'commune',q:'¿En qué comuna está la propiedad?',opts:['Santiago','Ñuñoa','Providencia','Las Condes','Otra comuna']},{key:'leased',q:'¿Está arrendada actualmente?',opts:['Sí','No']},{key:'budget',q:'¿Cuánto se arrienda o esperas arrendarla?',opts:['$450.000','$650.000','$900.000','No lo sé']}];}
 if(intent==='parcel')showParcelIntro();
 goState('listening');ask();
}
function ask(){const step=dialog.steps[dialog.step];if(!step){finish();return;}
 const p=node('div','stepHint',`${dialog.step+1} de ${dialog.steps.length} · Puedes escribir tu respuesta`);chat.appendChild(p);
 bubble(step.q);choice(step.opts,v=>handle(v));goState('listening');}
function numberFrom(s){const raw=String(s||'').replace(/[^\d]/g,'');return raw?Number(raw):0;}
function handle(input){const s=dialog.steps[dialog.step];if(!s)return;const value=String(input).trim().slice(0,160);if(!value)return;
 if(/^(otra comuna|otro monto|otro presupuesto|otra zona)$/i.test(value)){clearChoice();bubble(s.key==='commune'?'¡Por supuesto! Escribe el nombre de la comuna en el campo inferior.':'Claro, escribe tu monto exacto en el campo inferior.');$('answer').placeholder=s.key==='commune'?'Escribe la comuna…':'Ejemplo: $625.000 o 3.500 UF';$('answer').focus();return;}
 clearChoice();bubble(value,'user');dialog.answers[s.key]=value;dialog.step++;if(dialog.intent==='rent'||dialog.intent==='used')saveSearchPrefs();
 if(dialog.intent==='projects'&&s.key==='complement'&&normalize(value).startsWith('si')){dialog.steps.splice(dialog.step,0,{key:'income2',q:'¿Cuál es la renta líquida de la persona que complementa?',opts:['$800.000','$1.200.000','$2.000.000','Otro monto']});}
 const nonce=queued;deliverAfterPause(()=>{if(queued===nonce&&dialog.intent)ask();});
}
function parseBudget(str){let value=numberFrom(str);if(!value)return null;let currency=/uf/i.test(str)?'UF':'CLP';return {value,currency};}
function reqBeds(){const n=parseInt(dialog.answers.beds||'',10);return Number.isFinite(n)?n:0;}
function bedsInProject(x,n){if(!n)return true;const s=normalize(x.specs||'');if(n===3)return /3 dorm/.test(s);if(n===2)return /2d|2 dorm/.test(s);if(n===1)return /1 dorm|1 y|estudio/.test(s);return true;}
function validCardLink(x){return x.url&&(/\/propiedad\//.test(x.url)&&x.url.includes(x.id) || /\/proyectos\//.test(x.url));}
function zumi53Photos(x){const urls=Array.isArray(x.images)?x.images.filter(u=>typeof u==='string' && (u.startsWith('https://corretajeguzman.com/assets/')||/^\/\.netlify\/functions\/zumi-photo\?/.test(u))).slice(0,4):[];
 if(!urls.length&&typeof x.image==='string'&&(x.image.startsWith('https://corretajeguzman.com/assets/')||/^\/\.netlify\/functions\/zumi-photo\?/.test(x.image)))urls.push(x.image);
 return urls;}
function zumi53PhotoBlock(x){const photos=zumi53Photos(x);const wrap=node('div','zumi-photo-gallery');
 const fallback=()=>{wrap.replaceChildren();const ph=node('a','recommend-placeholder','📷 Ver fotos en ficha ↗');ph.href=validCardLink(x)?x.url:U[x.kind==='buy'?'buy':'rent'];ph.target='_blank';ph.rel='noopener noreferrer';wrap.append(ph);};
 if(!photos.length){fallback();return wrap;}
 let index=0;const img=node('img','recommend-img');img.loading='lazy';img.decoding='async';
 const control=node('div','zumi-photo-controls');const prev=node('button','','‹');prev.type='button';prev.setAttribute('aria-label','Foto anterior');const next=node('button','','›');next.type='button';next.setAttribute('aria-label','Foto siguiente');const count=node('span');
 const render=()=>{img.src=photos[index];img.alt=`Foto ${index+1} de ${photos.length} de ${x.name}`;count.textContent=`${index+1}/${photos.length}`;};
 let failed=0;img.onerror=()=>{if(++failed<photos.length){index=(index+1)%photos.length;render();}else fallback();};
 prev.addEventListener('click',()=>{failed=0;index=(index+photos.length-1)%photos.length;render();});next.addEventListener('click',()=>{failed=0;index=(index+1)%photos.length;render();});
 wrap.append(img);if(photos.length>1){control.append(prev,count,next);wrap.append(control);}render();return wrap;}
function renderCards(list,opts={}){if(!list.length)return;trackMetric('results');
 const results=node('div','cards-stack');
 for(const x of list){const card=node('article','recommend-card');
  const top=node('div','recommend-top');
  top.appendChild(zumi53PhotoBlock(x));
  const intro=node('div','recommend-intro');intro.append(node('small','recommend-label',(x.kind==='projects'?'Proyecto nuevo':'Propiedad')+' · '+x.commune),node('strong','recommend-name',x.name),node('b','recommend-price',(x.kind==='projects'?'Desde ':'')+formatMoney(x.price,x.currency)));
  top.appendChild(intro);card.appendChild(top);
  const meta=node('div','recommend-meta');
  if(x.kind==='projects'){meta.append(node('span','',x.specs||'Tipologías por consultar'),node('span','','🚘 Est.: consultar tipología'));}
  else {meta.append(node('span','',x.beds?`${x.beds} dorm.`:'Dorm.: consultar'),node('span','',x.baths?`${x.baths} baños`:'Baños: consultar'),node('span','','🚘 Est.: '+(x.parking==='—'?'consultar':x.parking)));}
  card.appendChild(meta);
  const links=node('div','recommend-actions');
  if(validCardLink(x)){const a=node('a','recommend-primary','Ver '+(x.kind==='projects'?'proyecto':'propiedad')+' ↗');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';links.appendChild(a);}else{links.append(node('span','broken-link','Ficha individual pendiente de corregir'));}
  if(x.kind==='projects'){const a=node('a','recommend-secondary','Cotizar ↗');a.href=x.quote;a.target='_blank';a.rel='noopener noreferrer';links.appendChild(a);}
  else links.append(btn('Me interesa',()=>{bubble('Me interesa: '+x.name,'user');deliverAfterPause(()=>showPropertyInterest(x));}));
  card.appendChild(links);
  if(x.status==='por confirmar')card.appendChild(node('div','confirmation','Disponibilidad por confirmar con un ejecutivo'));
  results.appendChild(card);
 }
 chat.appendChild(results);scrollBottom();setTimeout(()=>{const c=chat.getBoundingClientRect(),r=results.getBoundingClientRect();chat.scrollTo({top:chat.scrollTop+r.top-c.top-8,behavior:'smooth'});},320);goState('pointing');setTimeout(()=>{if(chatOpen&&state==='pointing')goState('idle');},3200);
}
function matches(source,commune,budget,beds){return source.filter(p=>p.status!=='Reservada').filter(p=>p.currency===budget.currency&&p.price<=budget.value).filter(p=>!beds||!p.beds||p.beds>=beds).filter(p=>normCommune(p.commune)===normCommune(commune)).sort((a,b)=>a.price-b.price);}
function showNearby(source,commune,budget,beds){const adjacent=nearMap[normCommune(commune)]||[];
 const options=source.filter(x=>x.status!=='Reservada').filter(x=>adjacent.includes(normCommune(x.commune))&&x.currency===budget.currency&&x.price<=budget.value&&(!beds||!x.beds||x.beds>=beds));
 options.sort((a,b)=>adjacent.indexOf(normCommune(a.commune))-adjacent.indexOf(normCommune(b.commune))||a.price-b.price);
 return options;}
// Collect interest with a short, specific form. No data is saved or transmitted by the preview;
// WhatsApp is opened only when the visitor explicitly confirms the handoff.
function showPropertyInterest(property){
 trackMetric('property');clearChoice();goState('listening');
 const renting=property.kind==='rent';
 bubble(renting?'¡Excelente! Te ayudo a consultar por este arriendo.':'¡Buena elección! Te ayudo a consultar por esta propiedad en venta.');
 const panel=node('section','interest-detail');
 panel.append(node('small','interest-eyebrow',renting?'ARRENDAR ESTA PROPIEDAD':'CONSULTAR POR ESTA PROPIEDAD'),node('strong','interest-address',property.name),node('span','interest-place',property.commune+' · '+formatMoney(property.price,property.currency)));
 chat.append(panel);
 const form=node('form','interest-panel');form.setAttribute('novalidate','');
 form.innerHTML=`<h4>¿Cómo te llamas?</h4><p>Prepararé un WhatsApp para Corretaje Guzmán con esta propiedad y los datos de tu búsqueda.</p>
  <label>Tu nombre <input name="name" required maxlength="70" autocomplete="name" placeholder="Tu nombre y apellido"></label>
  <label>Teléfono (opcional) <input name="phone" type="tel" maxlength="22" autocomplete="tel" inputmode="tel" placeholder="9 1234 5678"></label>
  <label>¿Cuándo te gustaría visitar? <select name="visit"><option value="Por coordinar">Por coordinar</option><option value="Día de semana, mañana">Día de semana, mañana</option><option value="Día de semana, tarde">Día de semana, tarde</option><option value="Fin de semana">Fin de semana</option></select></label>
  <label class="interest-consent"><input type="checkbox" name="consent" required><span>Quiero abrir WhatsApp y compartir estos datos con Corretaje Guzmán para solicitar información.</span></label>
  <button type="submit">Abrir WhatsApp con esta propiedad ↗</button>
  <div class="interest-error" role="status" aria-live="polite"></div>
  <div class="interest-link-slot"></div>
  <small class="interest-foot">El mensaje quedará preparado en WhatsApp; solo se enviará si tú presionas Enviar.</small>`;
 form.addEventListener('submit',event=>{
   event.preventDefault();
   const data=new FormData(form),name=String(data.get('name')||'').trim().replace(/\s+/g,' ').slice(0,70);
   const phone=String(data.get('phone')||'').trim().slice(0,22);
   const error=form.querySelector('.interest-error');
   if(name.length<2){error.textContent='Escribe tu nombre para continuar.';form.querySelector('[name="name"]').focus();return;}
   if(phone&&phone.replace(/\D/g,'').length<8){error.textContent='Revisa el teléfono o déjalo vacío.';return;}
   if(!data.get('consent')){error.textContent='Marca la casilla para abrir WhatsApp.';return;}
   error.textContent='';
   const lines=[
     'Hola, soy '+name+'. Me interesa '+(renting?'arrendar':'comprar')+' esta propiedad de Corretaje Guzmán:',
     '🏡 '+property.name,
     '📍 Comuna: '+property.commune,
     '💰 Precio publicado: '+formatMoney(property.price,property.currency),
     '🛏️ Dormitorios: '+(property.beds||'por confirmar'),
     '🚿 Baños: '+(property.baths||'por confirmar'),
     '🚘 Estacionamiento: '+((property.parking&&property.parking!=='—')?property.parking:'por confirmar')
   ];
   if(dialog.answers.commune)lines.push('Mi comuna de búsqueda: '+dialog.answers.commune);
   if(dialog.answers.budget)lines.push('Mi presupuesto: '+dialog.answers.budget);
   if(dialog.answers.beds)lines.push('Dormitorios que busco: '+dialog.answers.beds);
   if(phone)lines.push('Mi teléfono: '+phone);lines.push('Horario preferido para visita: '+String(data.get('visit')||'Por coordinar')+' (sujeto a confirmación)');
   if(validCardLink(property))lines.push('🔗 Ficha: '+property.url);
   else lines.push('Ficha individual: pendiente de verificar');
   lines.push('¿Me pueden confirmar disponibilidad y ayudar a coordinar una visita?');
   const href='https://wa.me/56944637680?text='+encodeURIComponent(lines.join('\n'));trackMetric('visit');trackMetric('whatsapp');
   const slot=form.querySelector('.interest-link-slot');slot.replaceChildren();
   const a=node('a','interest-direct-link','Continuar a WhatsApp ↗');a.href=href;a.target='_blank';a.rel='noopener noreferrer';slot.append(a);
   // Directly follow the user-initiated submission, without a timer or backend write.
   const popup=window.open(href,'_blank','noopener,noreferrer');
   if(!popup){error.textContent='Si tu navegador bloqueó la ventana, utiliza el enlace «Continuar a WhatsApp».';}
   goState('happy');
 });
 chat.append(form);scrollBottom();
}
function offerNewProjects(){
 // The user browsing used properties can consider a new project without starting over.
 const c=node('div','new-projects-cta');
 c.append(node('strong','','🏙️ ¿Y si también ves proyectos nuevos?'),node('p','','Tenemos departamentos nuevos en varias comunas y podemos estimar tu capacidad de compra.'));
 c.append(btn('Ver proyectos nuevos ↗',()=>{if(responding)return;bubble('Quiero conocer proyectos nuevos','user');deliverAfterPause(()=>begin('projects'));},true));
 chat.append(c);scrollBottom();
}
// If an exact rental search has no results, hand off to the real rental request form.
// Do not guess form field names or append unsupported query parameters.
function rentalRequestForm(){
 const a=dialog.answers;
 const summary=`Comuna: ${a.commune||'Por definir'} · Presupuesto: ${a.budget||'Por definir'} · Dormitorios: ${a.beds||'Por definir'}`;
 const panel=node('section','rental-fallback');
 panel.append(node('strong','fallback-title','¿Todavía no aparece tu arriendo ideal?'),node('p','fallback-copy','Déjanos tu solicitud y nuestro equipo podrá ayudarte a buscar otras opciones.'));
 panel.append(node('div','fallback-summary',summary));
 const actions=node('div','fallback-actions');
 const link=node('a','fallback-primary','Completar solicitud de arriendo ↗');link.href=U.rentForm;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
 panel.append(actions);chat.append(panel);scrollBottom();
}
function rentFormHandoff(){
 bubble('Para ayudarte con tu búsqueda, puedes completar nuestro formulario de arriendo oficial.');
 rentalRequestForm();
}
function findProperties(){trackMetric('search');const type=dialog.intent==='rent'?'rent':'buy',ans=dialog.answers;const budget=parseBudget(ans.budget),beds=reqBeds(),commune=ans.commune;
 if(!budget){bubble('Para comparar opciones necesito un presupuesto numérico. Puedes volver a intentarlo o revisar el catálogo oficial.');externalLinks([['Ver catálogo',U[type]]]);if(type==='rent')rentalRequestForm();return;}
 const list=matches(catalog[type],commune,budget,beds);
 if(list.length){bubble('¡Encontré '+list.length+' '+(list.length===1?'alternativa':'alternativas')+' en '+commune+'! Te muestro hasta tres:');renderCards(list.slice(0,3));
  choice(['Ver más de esta búsqueda','Cambiar comuna','Quiero que me contacten'],s=>{if(s.startsWith('Ver'))renderCards(list.slice(3,6));else if(s.startsWith('Cambiar'))begin(type==='rent'?'rent':'used');else showLead(type);});if(type==='buy')offerNewProjects();return;}
 bubble('Por ahora no encontré coincidencias exactas en '+commune+' con '+beds+' dormitorios y hasta '+formatMoney(budget.value,budget.currency)+' en el catálogo.');
 if(type==='rent')rentalRequestForm();else offerNewProjects();
 const nearby=showNearby(catalog[type],commune,budget,beds);
 if(nearby.length){bubble('Pero encontré alternativas en comunas cercanas. ¿Quieres verlas?');choice(['Sí, muéstramelas','Buscar otra comuna','Dejar mi búsqueda'],s=>{if(s.startsWith('Sí')){renderCards(nearby.slice(0,3));choice(['Me interesa una alternativa','Buscar de nuevo'],x=>x.startsWith('Me')?showLead(type):begin(type==='rent'?'rent':'used'));}else if(s.startsWith('Buscar'))begin(type==='rent'?'rent':'used');else type==='rent'?rentFormHandoff():showLead(type);});return;}
 const more=catalog[type].filter(p=>p.status!=='Reservada'&&p.currency===budget.currency&&p.price>budget.value&&p.price<=budget.value*1.2&&(!beds||!p.beds||p.beds>=beds)).sort((a,b)=>a.price-b.price);
 if(more.length){bubble('También hay algunas alternativas un poco por encima de tu presupuesto. Solo te las mostraré si te parece bien.');choice(['Ver hasta 20% más','Cambiar búsqueda','Dejar mis datos'],s=>{if(s.startsWith('Ver'))renderCards(more.slice(0,3));else if(s.startsWith('Cambiar'))begin(type==='rent'?'rent':'used');else type==='rent'?rentFormHandoff():showLead(type);});}
 else{bubble('Puedo ayudarte a dejar tus preferencias para que un ejecutivo te contacte cuando exista una alternativa.');choice(['Solicitar aviso','Buscar de nuevo'],s=>s==='Solicitar aviso'?(type==='rent'?rentFormHandoff():showLead(type)):begin(type==='rent'?'rent':'used'));}
}
// Same structure as the published financial simulator, with a clearly marked demo UF fallback.
// Do NOT market these figures as confirmed banking conditions or current official quotations.
const DEMO_UF=40983.58, DEMO_RATE=4.3, LOAD=.25, DOWN_MONTHS=24;
function monthly(cap, rate, years){const r=rate/1200,n=years*12;return cap*(r/(1-Math.pow(1+r,-n)));}
function principal(payment,rate,years){const r=rate/1200,n=years*12;return payment*(1-Math.pow(1+r,-n))/r;}
function projectsFlow(){trackMetric('search');const a=dialog.answers;
 const income=numberFrom(a.income),income2=numberFrom(a.income2),savings=numberFrom(a.savings),years=parseInt(a.term)||25;
 const dest=normalize(a.destination),fin=dest.includes('inversion')?.75:dest.includes('segunda')?.70:.80;
 const divMax=(income+income2)*LOAD;const cap=principal(divMax,DEMO_RATE,years);const topCreditUF=cap/fin/DEMO_UF;const topCashUF=savings/(1-fin)/DEMO_UF;
 const bed=reqBeds();const same=catalog.projects.filter(p=>normCommune(p.commune)===normCommune(a.commune)).filter(p=>bedsInProject(p,bed));
 let affordable=same.filter(p=>p.price<=topCreditUF&&p.price<=topCashUF);
 let financed=same.filter(p=>p.price<=topCreditUF&&p.price>topCashUF);
 const summary=node('div','financial-card');
 summary.append(node('small','','Simulación referencial — no constituye aprobación'),node('strong','','Dividendo máximo referencial: '+formatMoney(divMax)),node('span','','Capacidad estimada por renta: UF '+Math.floor(topCreditUF).toLocaleString('es-CL')));
 summary.append(node('span','','Pie propio disponible: '+formatMoney(savings)+' · financiación bancaria asumida: '+Math.round(fin*100)+'%'));
 summary.append(node('small','','Estimación referencial: UF '+formatMoney(DEMO_UF)+' · tasa '+DEMO_RATE+'% · '+years+' años · dividendo máximo 25% de la renta. Confirma las condiciones en el simulador oficial.'));chat.appendChild(summary);
 if(affordable.length){bubble('Según estos supuestos, estos proyectos en '+a.commune+' tienen precios desde dentro del escenario con pie propio:');renderCards(affordable.sort((x,y)=>x.price-y.price).slice(0,3));}
 if(financed.length){bubble('Además, estos proyectos podrían entrar por renta, pero requieren evaluar financiación del saldo del pie. No es una condición garantizada.');renderCards(financed.sort((x,y)=>x.price-y.price).slice(0,2));}
 if(!affordable.length&&!financed.length){bubble('No encontré proyectos con esta combinación de comuna, dormitorios y capacidad estimada en la muestra.');const adj=nearMap[normCommune(a.commune)]||[];const alt=catalog.projects.filter(p=>adj.includes(normCommune(p.commune))&&p.price<=topCreditUF&&bedsInProject(p,bed));
  if(alt.length){bubble('Sí encontré alternativas en comunas cercanas que podríamos revisar:');renderCards(alt.sort((x,y)=>x.price-y.price).slice(0,3));}else bubble('Podemos ampliar la búsqueda, complementar renta o modificar el plazo en el simulador oficial.');}
 externalLinks([['Recalcular en el simulador oficial',U.finance],['Ver los 21 proyectos',U.projects]]);
 choice(['Dejar mis datos para asesoría','Ver catálogo completo','Iniciar otra búsqueda'],s=>{if(s.startsWith('Dejar'))showLead('projects');else if(s.startsWith('Ver'))showAllProjects();else welcome();});
}
function showAllProjects(){bubble('Estos son los '+catalog.projects.length+' proyectos del catálogo de la web. Los precios son desde y las tipologías se confirman en la ficha.');renderCards(catalog.projects.slice().sort((x,y)=>x.price-y.price));choice(['Volver al inicio','Nueva búsqueda de proyectos'],s=>s.startsWith('Volver')?welcome():begin('projects'));}
function showLead(kind,context=''){
 if(kind==='owner')trackMetric('owner');clearChoice();goState('listening');bubble('Si quieres, puedo preparar tu solicitud para el equipo. La solicitud se prepara para que tú decidas si la envías por WhatsApp. No guardamos tus datos automáticamente.');
 const form=node('form','lead-panel');form.innerHTML=`<h4>Solicitud de contacto · ${kind==='owner'?'Propietario':kind==='admin'?'Administración':kind==='rent'?'Búsqueda de arriendo':kind==='projects'?'Proyecto nuevo':'Asesoría'}</h4><p>Tus datos solo se compartirán si abres WhatsApp y confirmas el envío.</p><div class="lead-grid"><label>Tu nombre<input name="name" maxlength="70" required placeholder="Nombre y apellido" autocomplete="name"></label><label>WhatsApp<input name="phone" maxlength="20" required placeholder="9 1234 5678" inputmode="tel" autocomplete="tel"></label><label class="span2">Correo (opcional)<input name="email" type="email" maxlength="120" placeholder="nombre@ejemplo.cl"></label><label class="span2">Comuna<input name="commune" required maxlength="70" value="${String(dialog.answers.commune||'').replace(/["<>]/g,'')}" placeholder="Comuna"></label></div><label class="consentRow"><input type="checkbox" name="consent" required> Autorizo a Corretaje Guzmán a contactarme para atender esta consulta.</label><button type="submit">Preparar solicitud para WhatsApp</button><div class="leadError" role="status"></div>`;
 form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const phone=String(data.get('phone')||'').replace(/\D/g,'');const name=String(data.get('name')||'').trim();const err=form.querySelector('.leadError');if(name.length<2){err.textContent='Ingresa tu nombre.';return;}if(!/^(?:56)?9\d{8}$/.test(phone)){err.textContent='WhatsApp inválido, usa 9 dígitos comenzando en 9.';return;}if(!data.get('consent')){err.textContent='Necesitamos consentimiento para el contacto.';return;}const summary=['Hola, soy '+name+'. Quisiera asesoría de Corretaje Guzmán.',
 'Servicio: '+kind,'Comuna: '+String(data.get('commune')||dialog.answers.commune||''),
 dialog.answers.propertyType?'Tipo propiedad: '+dialog.answers.propertyType:'',
 dialog.answers.budget?'Monto referencial: '+dialog.answers.budget:'',
 dialog.answers.beds?'Dormitorios: '+dialog.answers.beds:'',
 'WhatsApp: '+String(data.get('phone')||''),data.get('email')?'Correo: '+String(data.get('email')):'',
 'Solicito que me contacten para continuar.'].filter(Boolean).join('\n');
 const url='https://wa.me/56944637680?text='+encodeURIComponent(summary);
 form.remove();bubble('¡Gracias, '+name.split(' ')[0]+'! 💜 Preparé tu solicitud para WhatsApp. No se envió ni guardó automáticamente.');
 externalLinks([['Abrir WhatsApp y revisar mi solicitud',url],['Conocer el servicio',kind==='owner'?U.owner:kind==='rent'?U.rentForm:kind==='admin'?U.admin:kind==='projects'?U.finance:U.buy]]);trackMetric('whatsapp');choice(['Volver al inicio'],()=>welcome());});
 chat.appendChild(form);scrollBottom();
}

// Campo Alto Roble — official commercial content and direct-credit formula from data-parcelas-proyectos.js / parcela-ficha.js.
function showParcelIntro(){
 const p=catalog.parcelProject;if(!p)return;
 const pane=node('div','parcel-hero');const img=node('img');img.src=p.image;img.alt='Imagen del proyecto Campo Alto Roble, Villarrica';img.loading='lazy';img.onerror=()=>{img.remove();pane.classList.add('parcel-no-photo');};
 const info=node('div','parcel-info');info.append(node('strong','','🌿 Campo Alto Roble · Villarrica'),node('span','parcel-features','Parcelas de 5.000 m² aprox. · Desde UF 2.400 · A 4 km de Villarrica. Agua, luz, fibra óptica y caminos consolidados.'));
 pane.append(img,info);chat.append(pane);scrollBottom();
}
function parcelFlow(){
 const p=catalog.parcelProject;if(!p){externalLinks([['Ver parcelas',U.parcel]]);return;}
 const maxUF=numberFrom(dialog.answers.budgetUF),how=normalize(dialog.answers.payMode);
 const available=p.lots.filter(l=>l.status==='Disponible');
 const selected=available.filter(l=>l.priceUF<=maxUF).sort((a,b)=>a.priceUF-b.priceUF||a.number-b.number);
 if(!selected.length){bubble('En el catálogo del proyecto no encontré parcelas dentro de ese presupuesto. El valor publicado parte en UF 2.400.');externalLinks([['Ver disponibilidad actual en Campo Alto Roble',U.parcel+'#parcelas']]);choice(['Probar otro presupuesto','Hablar con un asesor','Volver al inicio'],v=>v.startsWith('Probar')?begin('parcel'):v.startsWith('Hablar')?externalLinks([['WhatsApp',U.wa]]):welcome());return;}
 bubble('¡Encontré '+selected.length+' parcelas publicadas hasta UF '+maxUF.toLocaleString('es-CL')+'! Te muestro algunas opciones:');
 const box=node('div','parcel-results');
 for(const lot of selected.slice(0,4)){
  const el=node('div','parcel-lot'),txt=node('div');txt.append(node('strong','','Parcela N° '+lot.number),node('small','','5.000 m² aprox. · Estado publicado: disponible'));
  const rhs=node('div','lot-right');rhs.append(node('b','','UF '+lot.priceUF.toLocaleString('es-CL')));el.append(txt,rhs);box.append(el);
 }
 chat.append(box);
 externalLinks([['Ver todas las parcelas y fotografías',U.parcel+'#parcelas']]);
 if(how.includes('credito')){
  const cheapest=selected[0];dialog.answers.parcelLot=cheapest.number;dialog.answers.parcelUF=cheapest.priceUF;
  bubble('Podemos estimar el crédito directo para la parcela N° '+cheapest.number+'. ¿Qué porcentaje de pie aportarías? (mínimo 40%)');
  choice(['40%','50%','60%','70%'],label=>{
   const down=parseInt(label,10);dialog.answers.parcelDown=down;
   bubble('¿En cuántas cuotas quieres estimar el saldo?');
   choice(['12 cuotas','24 cuotas','36 cuotas'],v=>showParcelFinancing(cheapest,down,parseInt(v,10)));
  });
 }else if(how.includes('contado')){
  bubble('Perfecto. El valor publicado está expresado en UF. Podemos ayudarte a confirmar el precio vigente de la parcela elegida y agendar una visita.');
  choice(['Agendar visita','Cotizar una parcela','Volver al inicio'],v=>v.startsWith('Agendar')?parcelHandoff('visita',selected[0]):v.startsWith('Cotizar')?parcelHandoff('cotizacion',selected[0]):welcome());
 }else{
  bubble('Te podemos ayudar a elegir la parcela, confirmar disponibilidad y revisar el financiamiento directamente con el proyecto.');
  choice(['Agendar visita','Hablar con asesor','Volver al inicio'],v=>v.startsWith('Agendar')?parcelHandoff('visita',selected[0]):v.startsWith('Hablar')?parcelHandoff('cotizacion',selected[0]):welcome());
 }
 scrollBottom();goState('pointing');
}
function showParcelFinancing(lot,piePct,months){
 // Same annuity math as public calculator, computed directly in UF to avoid an outdated CLP/UF reference.
 const base=lot.priceUF,down=base*piePct/100,capital=base-down,r=.01;
 const cuota=capital*r/(1-Math.pow(1+r,-months));const total=down+cuota*months;
 const uf=n=>'UF '+Number(n).toLocaleString('es-CL',{minimumFractionDigits:1,maximumFractionDigits:1});
 const panel=node('div','parcel-estimate');panel.append(node('strong','','Simulación referencial · Parcela N° '+lot.number),node('span','','Precio: '+uf(base)+' · Pie '+piePct+'%: '+uf(down)),node('span','','Saldo financiado: '+uf(capital)),node('strong','','Cuota estimada: '+uf(cuota)+' / mes × '+months),node('span','','Total proyectado: '+uf(total)));
 panel.append(node('small','','Tasa 1% mensual. Cifras en UF (no pesos). Precio, cupos y condiciones sujetos a confirmación; la UF en pesos se calculará al valor vigente el día de la operación. No es una aprobación de crédito.'));
 chat.append(panel);externalLinks([['Simular en la web oficial',U.parcel+'#credito']]);
 choice(['Consultar esta parcela','Cambiar condiciones','Volver al inicio'],v=>{if(v.startsWith('Consultar'))parcelHandoff('cotizacion',lot);else if(v.startsWith('Cambiar'))begin('parcel');else welcome()});scrollBottom();
}
function parcelHandoff(why,lot){
 const subject=lot?'Parcela N° '+lot.number+' de Campo Alto Roble':'Campo Alto Roble';
 const msg='Hola, quiero '+(why==='visita'?'agendar una visita para ': 'recibir una cotización para ')+subject+' en Villarrica. ¿Me pueden orientar?';
 bubble('¡Claro! Puedes conversar con nuestro equipo para '+(why==='visita'?'coordinar tu visita':'confirmar la cotización y disponibilidad')+'.');
 externalLinks([[why==='visita'?'Solicitar visita por WhatsApp':'Consultar por WhatsApp','https://wa.me/56944637680?text='+encodeURIComponent(msg)],['Ver proyecto',U.parcel]]);
}

function finish(){dialog.done=true;goState('happy');
 switch(dialog.intent){case 'rent':case 'used':findProperties();break;
 case 'projects':projectsFlow();break;
 case 'parcel':parcelFlow();break;
 case 'owner':bubble('Te ayudamos con difusión, visitas, evaluación de interesados y contrato. El Plan Prioridad contempla una comisión del 50% de un mes para el propietario cuando se concreta el arriendo; también existe un plan 0% para propietarios.');externalLinks([['Conocer los planes',U.owner]]);choice(['Solicitar evaluación de mi propiedad','Volver al inicio'],s=>s.startsWith('Solicitar')?showLead('owner'):welcome());break;
 case 'admin':bubble('Podemos apoyarte en la administración de tu propiedad. Un ejecutivo podrá orientarte según ubicación, renta y situación del contrato.');externalLinks([['Conocer administración',U.admin]]);choice(['Solicitar administración','Volver al inicio'],s=>s.startsWith('Solicitar')?showLead('admin'):welcome());break;
 }
}
function parseIntent(txt){const s=normalize(txt);
 if(/arriendo|arrendar/.test(s))return /mi propiedad|soy propietari|publicar/.test(s)?'owner':'rent';
 if(/propietario|publicar/.test(s))return 'owner';
 if(/parcela|terreno|campo alto roble|villarrica/.test(s))return 'parcel';
 if(/proyecto|departamento nuevo|inmobiliaria/.test(s))return 'projects';
 if(/compr|venta|buscar casa/.test(s))return 'buy';
 if(/administr/.test(s))return 'admin';return null;
}
function toggleChat(open){if(open)trackMetric('open');if(open)dismissWelcomePopup();cancelResponse();chatOpen=open;$('chatPanel').hidden=!open;$('openChat').setAttribute('aria-expanded',String(open));$('webHint').hidden=open;
 if(open){if(!chat.children.length)welcome();else{chat.scrollTop=chat.scrollHeight;goState('listening');}}else{goState('idle');}}

// Use an exact reference image; independent soft limbs rotate over the unchanged original fur.
function drawRotated(img,pivotX,pivotY,angle,shorten=1){
  if(!assetReady(img))return;
  const I=imgs[img];
  context.save();context.translate(pivotX,pivotY);context.rotate(angle);
  context.scale(1,shorten);context.translate(-pivotX,-pivotY);
  context.drawImage(I,0,0,865,931);context.restore();
}
function drawFace(blink,mouth){
  const c=context;
  if(blink>.18){
    const eyes=[[342,239],[525,223]];
    for(const [ex,ey] of eyes){
      c.save();const closing=ease(clamp(blink,0,1));
      c.fillStyle='#f5dcda';c.globalAlpha=.94;
      c.beginPath();c.ellipse(ex,ey,21,25*closing,0,0,Math.PI*2);c.fill();
      if(closing>.85){
        c.strokeStyle='#2b1f29';c.lineWidth=3;c.lineCap='round';c.beginPath();
        c.moveTo(ex-16,ey+2);c.quadraticCurveTo(ex,ey+10,ex+16,ey+1);c.stroke();
      }c.restore();
    }
  }
  const speaking=clamp(mouth,0,1);
  if(speaking>.04&&assetReady('mouth')){
    c.save();c.globalAlpha=ease(Math.min(1,speaking*2.4));
    c.drawImage(imgs.mouth,378,226,124,85);
    // A small smiling mouth, widened slightly while speaking; no black dot or sticker patch.
    const opening=5+speaking*10;
    c.fillStyle='#33222d';c.beginPath();c.moveTo(414,260);
    c.quadraticCurveTo(439,271,461,259);
    c.quadraticCurveTo(439,273+opening*1.8,414,260);c.closePath();c.fill();
    c.fillStyle='#ed8da6';c.beginPath();c.ellipse(439,276+speaking*4,10,3+speaking*2,0,0,Math.PI);c.fill();
    c.restore();
  }
}
function drawRightArm(angle,shorten=1){
  // Mirror the SAME arm texture instead of cross-fading against a second sprite.
  if(!assetReady('armLeft'))return;
  context.save();context.translate(865,0);context.scale(-1,1);
  drawRotated('armLeft',237,424,-angle,shorten);
  context.restore();
}
function render(now){
  if(disposed)return;
  raf=requestAnimationFrame(render);
  const dt=clamp((now-(last||now))/1000,.001,.045);last=now;t+=dt;
  if(!context||!assetReady('torso')||!assetReady('armLeft'))return;
  const c=context;c.clearRect(0,0,1185,931);c.save();c.translate(160,0);
  const elapsed=(now-stateAt)/1000;
  // Greeting is a one-shot: 1.65 s raise + 3 gentle waves + natural return.
  // Always finish, even when the chat was opened during the greeting.
  if(state==='greeting'&&elapsed>WAVE.finish&&!sequence.length)setState('idle');
  const p=posture[state], factor=motion?energy:0;
  // Smooth 3-cycle wave, using the ONLY right-arm sprite. The raised arm
  // never cross-fades with a resting sprite, preventing a third-arm illusion.
  let wave=0;
  if(state==='greeting' && motion && elapsed>=WAVE.begin && elapsed<WAVE.end){
    const u=clamp((elapsed-WAVE.begin)/(WAVE.end-WAVE.begin),0,1);
    const envelope=Math.pow(Math.sin(Math.PI*u),1.25);
    wave=Math.sin(2*Math.PI*WAVE.cycles*u)*envelope*.28*greetingEmphasis*factor*fineMotion.detail;
  }
  const talkGesture=state==='speaking'?(Math.sin(t*1.15)*.025+Math.sin(t*1.95+1)*.008)*factor*fineMotion.detail:0;
  const left=armValue('left',now)+(state==='happy'?Math.sin(t*1.5)*.016*factor*fineMotion.detail:0);
  const right=armValue('right',now)+(wave+talkGesture)*smootherStep(armProgress('right',now));
  const talkShorten=spring('talkShorten',state==='speaking'?.96:1,dt,7.5,5.5,.24);
  const helloNod=state==='greeting'&&motion ? Math.sin(Math.PI*clamp(elapsed/WAVE.finish,0,1))*Math.sin(elapsed*2.4)*.0055:0;
  const replyNod=now<replyPulseUntil&&motion ? .004*Math.sin((replyPulseUntil-now)*.012):0;
  const torsoLean=spring('body',p.body+(Math.sin(t*.53)*.004+look.x*.006)*factor*fineMotion.detail+helloNod+replyNod,dt,8,5.2,.026);
  const breath=spring('breath',(Math.sin(t*.91)*3.1+(state==='happy'?Math.abs(Math.sin(t*1.6))*1.8:0))*factor*fineMotion.detail,dt,10,7.6,17);
  const squish=spring('squish',1+Math.sin(t*.91+.7)*.0042*factor*fineMotion.detail,dt,9,6,.012);
  const activeTalking=(speakerOn||state==='speaking')?(0.12+.29*Math.abs(Math.sin(t*4.0))):(now<replyPulseUntil?.12+.09*Math.abs(Math.sin(t*3.5)):0);
  const mouth=spring('talk',activeTalking,dt,14,7,.80);
  // Low-energy occasional blinking; no rapid synchronized repeating movement.
  if(t>nextBlink){blinkStart=t;nextBlink=t+4.8+(Math.sin(t*.97)+1)*1.18;}
  let b=0;const phase=t-blinkStart;
  if(phase>=0&&phase<.27)b=phase<.10?phase/.10:1-(phase-.10)/.17;
  const blink=spring('blink',b,dt,55,12,9);
  // Anchor body at feet; draw the original approved fur and head without redesigning it.
  c.save();c.translate(432.5,931);c.scale(.93,.93);c.translate(-432.5,-931);c.translate(440,868);c.rotate(torsoLean);c.scale(squish,1/squish);c.translate(-440,-868+breath);
  if(assetReady('torso'))c.drawImage(imgs.torso,0,0,865,931);
  // Invariant: exactly one arm sprite on each side (no ghost arm or extra limb).
  drawRotated('armLeft',237,424,left);
  drawRightArm(right,talkShorten);
  drawFace(blink,mouth);
  c.restore();
  if(state==='listening'&&motion){const a=(Math.sin(t*1.35)+1)/2;c.save();c.globalAlpha=.16+.13*a;c.strokeStyle='#b980cb';c.lineWidth=3;c.lineCap='round';for(let i=0;i<2;i++){c.beginPath();c.arc(700,240,22+i*12,-1.08,-.23);c.stroke();}c.restore();}
  c.restore();
}

// Trial controls: contextual property, metrics, and opt-in lightweight memory.
const contextSelect=$('zumi51DemoContext');
if(contextSelect){
 for(const p of [...catalog.rent.slice(0,12),...catalog.buy.slice(0,12)]){
  if(!validCardLink(p))continue;
  const op=node('option','',p.name+' · '+p.commune);op.value=p.id;contextSelect.append(op);
 }
 contextSelect.addEventListener('change',()=>{setPageContext({propertyId:contextSelect.value});if(chatOpen)welcome();});
}
window.addEventListener('message',e=>{
 if(e.origin!=='https://corretajeguzman.com'&&e.origin!=='https://www.corretajeguzman.com')return;
 if(!e.data||e.data.type!=='ZUMI_PAGE_CONTEXT')return;
 const valid=setPageContext(e.data);if(valid&&chatOpen)welcome();
});
if($('zumi51Remember'))$('zumi51Remember').checked=rememberCriteria;
$('zumi51Remember')?.addEventListener('change',e=>setRemember(e.target.checked));
$('zumi51Forget')?.addEventListener('click',()=>{forgetSearchPrefs();bubble('Olvidé tus filtros de esta pestaña.');});
$('zumi51ContextOpen')?.addEventListener('click',()=>{if(!chatOpen)toggleChat(true);else welcome();});
paintMetrics();contextualFromURL();refreshPublicCatalog();
// For integration with the real website, its page code may set
// window.ZUMI_PAGE_CONTEXT={propertyId:'rec...',url:'https://...'} before loading the widget,
// or call window.ZumiPelucheLab.setPageContext(...) after page navigation.

// Controls
// Tarjeta contextual: se muestra una sola vez por sesión y nunca obliga a conversar.
let introClosedInMemory=false;
const INTRO_KEY='zumi-4-6-welcome-seen';
function hasSeenWelcome(){
  try{return sessionStorage.getItem(INTRO_KEY)==='1'||introClosedInMemory;}catch(e){return introClosedInMemory;}
}
function markWelcomeSeen(){
  introClosedInMemory=true;
  try{sessionStorage.setItem(INTRO_KEY,'1');}catch(e){}
}
function dismissWelcomePopup(){
  const p=$('zumiWelcomePopup');if(p)p.hidden=true;
  if(!chatOpen&&$('webHint'))$('webHint').hidden=false;
  markWelcomeSeen();
}
function openQuickIntent(intent){
  dismissWelcomePopup();
  if(mode!=='web')setMode('web');
  if(!chatOpen)toggleChat(true);
  else clearChoice();
  // El recorrido seleccionado reemplaza la bienvenida, sin menú adicional.
  deliverAfterPause(()=>begin(intent));
}
function initWelcomePopup(){
  $('zumiWelcomeClose').addEventListener('click',dismissWelcomePopup);
  document.querySelectorAll('[data-zumi-quick]').forEach(b=>b.addEventListener('click',()=>openQuickIntent(b.dataset.zumiQuick)));
  $('zumiWelcomeProjects').addEventListener('click',()=>openQuickIntent('projects'));
  if(!hasSeenWelcome()){
    setTimeout(()=>{
      if(hasSeenWelcome()||chatOpen||mode!=='web'||document.hidden)return;
      const mini=$('zumiWelcomePopup');const p=mini.querySelector('p');
      if(contextualProperty&&p)p.textContent='¿Quieres saber más sobre '+contextualProperty.name+' o coordinar una visita?';
      mini.hidden=false;
      $('webHint').hidden=true;
      markWelcomeSeen();
    },3000);
  }
}
$('openChat').addEventListener('click',()=>toggleChat(!chatOpen));$('closeChat').addEventListener('click',()=>toggleChat(false));
$('resetChat').addEventListener('click',welcome);
$('webFigure').addEventListener('click',()=>{if(!chatOpen)toggleChat(true)});
$('webFigure').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!chatOpen)toggleChat(true)}});
$('chatForm').addEventListener('submit',e=>{
 e.preventDefault();if(responding)return;const val=$('answer').value.trim().slice(0,160);if(!val)return;$('answer').value='';
 if(smartMessage(val))return;
 if(dialog.steps.length&&dialog.step<dialog.steps.length){handle(val);return;}
 if(val==='volver'||val==='inicio'){welcome();return;}
 const intent=parseIntent(val);if(intent){clearChoice();bubble(val,'user');deliverAfterPause(()=>begin(intent));return;}
 bubble(val,'user');deliverAfterPause(()=>{bubble('¿Te parece que empecemos por alguna de estas opciones?');welcome();});
});
document.querySelectorAll('[data-start-intent]').forEach(b=>b.addEventListener('click',()=>{if(mode!=='web')setMode('web');if(!chatOpen)toggleChat(true);else clearChoice();deliverAfterPause(()=>begin(b.dataset.startIntent==='buy'?'buy':b.dataset.startIntent==='finance'?'projects':b.dataset.startIntent));}));
sceneCanvas.width=1185;sceneCanvas.height=931;setMode('web');setState('greeting');initWelcomePopup();raf=requestAnimationFrame(render);
window.ZumiPelucheLab={version:'5.2-saludo-y-motor-hibrido',renderer:'Canvas2D',catalogSnapshot:true,connected:false,noWrites:true,mode:()=>mode,state:()=>state,setState,setMode,playDemo,getDialog:()=>({...dialog}),getAnimation:()=>({left:{...arms.left},right:{...arms.right}}),getMotionTuning:()=>({...fineMotion}),
 replayGreeting:()=>setState('greeting'),
 setSpeechActive:(active)=>{speakerOn=Boolean(active);if(active){replyPulseUntil=0;if(state==='idle'||state==='listening')setState('speaking',{silent:true});}else if(state==='speaking'){setState('idle',{silent:true});}},
 shouldUseGuided:(text)=>{const n=normalize(text);return Boolean(parseIntent(text)||/^(volver|inicio|ir al inicio|reiniciar|partamos de nuevo|menu principal|volver al inicio)/.test(n)||(dialog.steps.length&&!dialog.done)||(dialog.done&&['rent','used'].includes(dialog.intent)&&/(otra comuna|en |mas barato|dormitorios?|presupuesto|hasta )/.test(n)));},
 setPageContext:(obj)=>{const ok=setPageContext(obj);if(ok&&chatOpen)welcome();return ok},getCatalogSource:()=>catalogOrigin,forgetSearchPrefs};

})();


/* Zumi 5.0 — Sonido original tipo campanilla de peluche.
   Dos notas suaves (Sol4 / Do5) con ataque redondo y cola corta.
   No se reproduce antes de interacción humana ni en la bienvenida automática. */
(()=>{'use strict';
 const history=document.getElementById('chatHistory');
 const toggle=document.getElementById('zumiReplySoundToggle');
 const preview=document.getElementById('zumiTestChime');
 if(!history || !toggle)return;
 const Ctx=window.AudioContext||window.webkitAudioContext;
 let context=null, pendingVisitorMessage=false, lastChimeAt=0;
 let enabled=true;
 try{enabled=localStorage.getItem('zumi-reply-sound')!=='off';}catch(_e){}
 function updateToggle(){
   toggle.textContent=enabled?'🔉':'🔇';
   toggle.setAttribute('aria-pressed',String(enabled));
   const action=enabled?'Silenciar':'Activar';
   toggle.setAttribute('aria-label',action+' sonido de Zumi');
   toggle.title=action+' sonido de Zumi';
 }
 function unlock(){
   if(!Ctx||!enabled)return Promise.resolve(false);
   try{
     if(!context)context=new Ctx();
     if(context.state==='suspended')return context.resume().then(()=>true).catch(()=>false);
     return Promise.resolve(true);
   }catch(_e){context=null;return Promise.resolve(false);}
 }
 function playWarmTone(at,frequency,level,duration){
   const osc=context.createOscillator();
   const envelope=context.createGain();
   osc.type='sine';
   osc.frequency.setValueAtTime(frequency,at);
   // Afinación apenas descendente para un sonido cálido, no de alerta.
   osc.frequency.exponentialRampToValueAtTime(frequency*.991,at+duration);
   envelope.gain.setValueAtTime(0.00001,at);
   envelope.gain.linearRampToValueAtTime(level,at+.026);
   envelope.gain.exponentialRampToValueAtTime(level*.55,at+.09);
   envelope.gain.exponentialRampToValueAtTime(0.00001,at+duration);
   osc.connect(envelope);envelope.connect(context.destination);
   osc.start(at);osc.stop(at+duration+.01);
   osc.onended=()=>{try{osc.disconnect();envelope.disconnect();}catch(_e){}};
 }
 function chime(force=false){
   if(!enabled||!context||context.state!=='running')return;
   const now=performance.now();
   if(!force&&now-lastChimeAt<1600)return;
   lastChimeAt=now;
   try{
     const t=context.currentTime+.012;
     // Conjunto consonante y de volumen muy bajo (≈ -35 dB por voz).
     playWarmTone(t,392.0,.011,.37);
     playWarmTone(t+.095,523.25,.009,.39);
   }catch(_e){}
 }
 updateToggle();
 toggle.addEventListener('click',()=>{
   enabled=!enabled;
   try{localStorage.setItem('zumi-reply-sound',enabled?'on':'off');}catch(_e){}
   updateToggle();
   if(enabled)unlock();
 });
 if(preview)preview.addEventListener('click',()=>{if(!enabled){enabled=true;updateToggle();try{localStorage.setItem('zumi-reply-sound','on');}catch(_e){}}unlock().then(ok=>{if(ok)chime(true)});});
 const eligibleGesture=e=>e.target instanceof Element && !!e.target.closest('#chatPanel,#zumiWelcomePopup,#zumiFloatingDock,[data-start-intent]');
 document.addEventListener('pointerdown',e=>{if(eligibleGesture(e))unlock();},{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(eligibleGesture(e)&&(e.key==='Enter'||e.key===' '||e.key.length===1))unlock();},true);
 const mo=new MutationObserver(records=>{
   for(const record of records){
     for(const node of record.addedNodes){
       if(!(node instanceof Element))continue;
       const messages=node.matches('.message')?[node]:Array.from(node.querySelectorAll('.message'));
       for(const msg of messages){
         if(msg.classList.contains('from-user'))pendingVisitorMessage=true;
         else if(msg.classList.contains('from-zumi')&&pendingVisitorMessage){
           pendingVisitorMessage=false;
           chime();
         }
       }
     }
   }
 });
 mo.observe(history,{childList:true,subtree:true});
})();


/* Zumi 5.2 — optional local speech synthesis. Off by default; no API. */
(()=>{'use strict';const sound=document.getElementById('zumiReplySoundToggle');const history=document.getElementById('chatHistory');if(!sound||!history||!('speechSynthesis' in window))return;
 const toggle=document.createElement('button');toggle.type='button';toggle.className='zumi-browser-voice';toggle.title='Leer respuestas en voz alta (voz del navegador)';toggle.setAttribute('aria-label','Activar lectura de respuestas de Zumi');toggle.setAttribute('aria-pressed','false');toggle.textContent='🗣️';sound.insertAdjacentElement('afterend',toggle);
 let enabled=false,unlocked=false;toggle.addEventListener('click',()=>{enabled=!enabled;unlocked=true;toggle.setAttribute('aria-pressed',String(enabled));toggle.title=enabled?'Desactivar lectura en voz alta':'Leer respuestas con la voz del navegador';toggle.textContent=enabled?'🗣️✓':'🗣️';if(!enabled){speechSynthesis.cancel();window.ZumiPelucheLab?.setSpeechActive?.(false);}});
 const observer=new MutationObserver(records=>{if(!enabled||!unlocked)return;for(const r of records){for(const n of r.addedNodes){if(n.nodeType!==1||!n.classList?.contains('from-zumi'))continue;
 const txt=String(n.textContent||'').slice(0,310);if(!txt.trim())continue;
 const u=new SpeechSynthesisUtterance(txt);u.lang='es-CL';u.rate=.94;u.pitch=1.11;u.volume=.56;
 u.onstart=()=>window.ZumiPelucheLab?.setSpeechActive?.(true);
 u.onend=()=>window.ZumiPelucheLab?.setSpeechActive?.(false);
 u.onerror=()=>window.ZumiPelucheLab?.setSpeechActive?.(false);
 const voices=speechSynthesis.getVoices();const match=voices.find(v=>v.lang.toLowerCase()==='es-cl')||voices.find(v=>v.lang.toLowerCase().startsWith('es'));if(match)u.voice=match;
 try{speechSynthesis.cancel();speechSynthesis.speak(u)}catch(_){};
 }}});observer.observe(history,{childList:true});
 document.getElementById('closeChat')?.addEventListener('click',()=>{speechSynthesis.cancel();window.ZumiPelucheLab?.setSpeechActive?.(false);});
})();
