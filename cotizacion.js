/* ============================================================
   Corretaje Guzmán — Cotización (v2)
   Paso 1: catálogo de todos los proyectos de data-proyectos.js
   Paso 2: tipologías desde data-proyectos-detalle.js
   Paso 3: formulario + resumen + "lo que podrías financiar"
   Acepta ?slug=<proyecto>&tipo=<índice> (desde las fichas).
   Los proyectos nuevos se suman solos al agregarlos a los datos.
   ============================================================ */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const nf=new Intl.NumberFormat('es-CL');
  const CFG=window.COT_CONFIG||{};
  const GRID=(window.PROYECTOS||[]).filter(p=>p.activa!==false);
  const FICHAS=window.PROYECTO_FICHAS||{};
  const FKEYS=Object.keys(FICHAS);
  let UF=CFG.uf||40983.58;

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  function fichaKey(g){
    if(FICHAS[g.slug]) return g.slug;
    const pre=FKEYS.find(k=>k.indexOf(g.slug)===0);
    if(pre) return pre;
    const n=norm(g.name);
    return FKEYS.find(k=>norm(FICHAS[k].name)===n) || FKEYS.find(k=>n.indexOf(norm(FICHAS[k].name))===0) || null;
  }
  GRID.forEach(g=>{ g._fk=fichaKey(g); g._f=g._fk?FICHAS[g._fk]:{}; });

  const BADGE={inmediata:['Entrega inmediata','#1f8a5b'],futura:['Entrega futura','#5b7088'],verde:['Venta en verde','#7c3aed'],ultimas:['Últimas unidades','#c0182a']};
  const money=n=>'$'+nf.format(Math.round(n));
  const ufTxt=n=>'UF '+nf.format(Math.round(n));
  const thumb=g=>'assets/opt/proyecto-'+g.slug+'.jpg';
  const heroOf=g=>(g._f&&g._f.heroImg)||thumb(g);
  const fichaUrl=g=>g.detalle||(g._f&&g._f.ficha)||('proyecto.html?slug='+(g._fk||g.slug));

  function tiposOf(g){
    const f=g._f||{};
    if(f.tipologiasDisponibles&&f.tipologiasDisponibles.length) return f.tipologiasDisponibles.map(t=>({
      nombre:t.nombre, planta:t.planta?String(t.planta).split(':')[0].trim():'', plano:t.plano,
      m2:(t.m2tot||t.m2int||'').replace(' aprox',''), orient:t.orientacion||'', uf:t.desdeUF||0
    }));
    if(f.tipologias&&f.tipologias.length) return f.tipologias.map(t=>({nombre:t.nombre, planta:'', plano:'', m2:(t.m2tot||t.m2int||'').replace(' aprox',''), orient:'', uf:t.desdeUF||0}));
    return [];
  }

  /* ---------- estado ---------- */
  let cur=null, curTipo=-1, destino='primera';

  /* ---------- selector de proyecto (los 21) ---------- */
  const pSel=$('#czProj');
  [...GRID].sort((x,y)=>x.name.localeCompare(y.name)).forEach(g=>pSel.insertAdjacentHTML('beforeend','<option value="'+g.slug+'">'+g.name+' · '+g.commune+'</option>'));
  pSel.addEventListener('change',()=>pick(GRID.find(g=>g.slug===pSel.value),-1));

  /* ---------- portada del proyecto ---------- */
  function renderHero(){
    const f=cur._f||{}, bd=BADGE[cur.entrega];
    $('#czHeroBg').style.backgroundImage="url('"+heroOf(cur)+"')";
    $('#czName').textContent=cur.name;
    $('#czAddr').textContent=cur.address||cur.commune;
    $('#czDesde').textContent=ufTxt(cur.desdeUF);
    $('#czDesdeClp').textContent='≈ '+money(cur.desdeUF*UF);
    const b=$('#czBadge'); if(bd){ b.textContent=bd[0]; b.style.background=bd[1]; b.style.display=''; } else b.style.display='none';
    $('#czBack').href=fichaUrl(cur);
    $('#lkFicha').href=fichaUrl(cur);
    const br=$('#lkBroch'); if(f.brochure){ br.href=f.brochure; br.style.display=''; } else br.style.display='none';
    pSel.value=cur.slug;
    document.title='Cotizar '+cur.name+' · Corretaje Guzmán';
  }

  /* ---------- tipologías ---------- */
  function renderTipos(){
    const box=$('#czTipos'), T=tiposOf(cur);
    if(!T.length){ box.innerHTML='<div class="cz-locked"><i data-lucide="info" class="ico"></i>Este proyecto aún no tiene tipologías publicadas. Envía tus datos y te mandamos las disponibles.</div>'; return; }
    box.innerHTML='<div class="cz-tipos">'+T.map((t,i)=>
      '<button type="button" class="cz-tipo'+(i===curTipo?' on':'')+'" data-i="'+i+'">'+
      '<div class="pl">'+(t.plano?'<img src="'+t.plano+'" alt="" loading="lazy">':'<i data-lucide="layout" class="ico"></i>')+'</div>'+
      '<b>'+t.nombre+(t.planta?' · Planta '+t.planta:'')+'</b>'+
      '<span class="meta">'+[t.m2,t.orient].filter(Boolean).join(' · ')+'</span>'+
      (t.uf?'<span class="uf">'+ufTxt(t.uf)+'</span>':'<span class="meta">Precio a consultar</span>')+
      '</button>').join('')+'</div>';
    box.querySelectorAll('.cz-tipo').forEach(b=>b.addEventListener('click',()=>{
      curTipo=+b.dataset.i;
      box.querySelectorAll('.cz-tipo').forEach(x=>x.classList.toggle('on',x===b));
      renderSide(); syncUrl();
    }));
  }

  /* ---------- resumen + financiamiento ---------- */
  function precioActual(){
    const T=tiposOf(cur);
    return (curTipo>=0&&T[curTipo]&&T[curTipo].uf)||cur.desdeUF||0;
  }
  function dividendo(monto){
    const i=(CFG.tasaAnual||4.3)/12/100, n=(CFG.plazoAnios||25)*12;
    return monto*i/(1-Math.pow(1+i,-n));
  }
  function renderSide(){
    const T=tiposOf(cur), t=curTipo>=0?T[curTipo]:null, pUF=precioActual();
    $('#sumPlan').innerHTML=t&&t.plano?'<img src="'+t.plano+'" alt="Planta">':'<img src="'+heroOf(cur)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
    const rows=[
      ['Proyecto',cur.name],
      ['Tipología',t?(t.nombre+(t.planta?' · Planta '+t.planta:'')):'Elige una tipología'],
      t&&t.m2?['Superficie',t.m2]:null,
      t&&t.orient?['Orientación',t.orient]:null,
      ['Estado',(BADGE[cur.entrega]||['—'])[0]],
      ['Precio'+(t?'':' desde'),pUF?ufTxt(pUF)+' · '+money(pUF*UF):'—','pr']
    ].filter(Boolean);
    $('#sumRows').innerHTML=rows.map(r=>'<div class="r'+(r[2]?' '+r[2]:'')+'"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('');
    const acc=$('#czAcc');
    if(!pUF){ acc.style.display='none'; return; }
    acc.style.display='';
    const pct=(CFG.financiaBanco||{})[destino]||0.8;
    const valor=pUF*UF, credito=valor*pct, pie=valor-credito;
    const div=dividendo(credito), renta=div/(CFG.cargaMax||0.25);
    const meses=CFG.mesesPie||24;
    $('#accRows').innerHTML=[
      ['Pie ('+Math.round((1-pct)*100)+'%)',money(pie)+' · '+ufTxt(pie/UF)],
      ['Crédito hipotecario ('+Math.round(pct*100)+'%)',money(credito)],
      ['Dividendo estimado',money(div)+' /mes'],
      ['Renta mínima sugerida',money(renta)],
      ['Reserva',money(CFG.reserva||100000)]
    ].map(r=>'<div class="l"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('');
    $('#accHl').innerHTML='<b>Pie financiado:</b> paga el pie en hasta '+meses+' cuotas de <b>'+money(pie/meses)+'</b> directamente con la inmobiliaria.'+((cur._f&&cur._f.subsidioTasa)?' Además tiene <b>subsidio a la tasa</b>.':'');
    $('#accNt').textContent='Referencial: UF '+money(UF)+', tasa '+String(CFG.tasaAnual||4.3).replace('.',',')+'% anual a '+(CFG.plazoAnios||25)+' años y dividendo máximo del '+Math.round((CFG.cargaMax||0.25)*100)+'% de la renta. Sujeto a evaluación bancaria.';
    if(window.lucide) lucide.createIcons();
  }
  $('#czDest').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    destino=b.dataset.d;
    $('#czDest').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    renderSide();
  }));

  function syncUrl(){
    const u=new URL(location.href);
    u.searchParams.set('slug',cur._fk||cur.slug);
    if(curTipo>=0) u.searchParams.set('tipo',curTipo); else u.searchParams.delete('tipo');
    try{ history.replaceState(null,'',u); }catch(e){}
  }
  function pick(g,tipo){
    if(!g) return;
    cur=g; curTipo=(tipo>=0&&tipo<tiposOf(g).length)?tipo:-1;
    renderHero(); renderTipos(); renderSide(); syncUrl();
    if(window.lucide) lucide.createIcons();
  }

  /* ---------- formulario ---------- */
  const form=$('#czForm');
  const mark=(el,bad)=>{const f=el.closest('.cz-f'); if(f) f.classList.toggle('bad',bad);};
  form.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',()=>mark(el,false));el.addEventListener('change',()=>mark(el,false));});
  const WAS=CFG.whatsapps&&CFG.whatsapps.length?CFG.whatsapps:['56944637680'];
  function nextWa(){
    let i=0; try{ i=parseInt(localStorage.getItem('cg_wa_turno')||'0',10)||0; }catch(e){}
    const n=WAS[i%WAS.length];
    try{ localStorage.setItem('cg_wa_turno',String((i+1)%WAS.length)); }catch(e){}
    return n;
  }
  function rutOk(v){
    const c=String(v).replace(/[^0-9kK]/g,'').toUpperCase();
    if(c.length<8||c.length>9) return false;
    const cuerpo=c.slice(0,-1), dv=c.slice(-1);
    let s=0,m=2; for(let i=cuerpo.length-1;i>=0;i--){ s+=(+cuerpo[i])*m; m=m===7?2:m+1; }
    const r=11-(s%11), esp=r===11?'0':r===10?'K':String(r);
    return esp===dv;
  }
  function rutFmt(v){
    const c=String(v).replace(/[^0-9kK]/g,'').toUpperCase(); const cu=c.slice(0,-1), dv=c.slice(-1);
    return cu.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+'-'+dv;
  }
  function telNorm(v){
    let d=String(v).replace(/\D/g,'');
    if(d.indexOf('56')===0) d=d.slice(2);
    if(d.length===8) d='9'+d;
    return d.length===9?'+56'+d:'';
  }
  const errBox=document.createElement('p');
  errBox.className='cz-err'; errBox.style.cssText='display:none;margin-top:14px;padding:12px 14px;border-radius:11px;background:#fdecf2;color:#b0285c;font-size:14px;font-weight:600';
  $('#czSubmit').insertAdjacentElement('afterend',errBox);
  let enviando=false;
  const reqId=()=>'cot-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  let requestId=reqId();
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(enviando) return;
    errBox.style.display='none';
    let first=null;
    const need=(el,ok)=>{ mark(el,!ok); if(!ok&&!first) first=el; };
    form.querySelectorAll('[required]').forEach(el=>{
      let ok=!!String(el.value||'').trim();
      if(ok&&el.type==='email') ok=/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(el.value.trim());
      if(ok&&el.name==='telefono') ok=!!telNorm(el.value);
      if(ok&&el.name==='rut') ok=rutOk(el.value);
      need(el,ok);
    });
    ['complementa','credito','contacto'].forEach(n=>{
      const any=form.querySelector('input[name="'+n+'"]:checked');
      const f=form.querySelector('input[name="'+n+'"]').closest('.cz-f'); if(f) f.classList.toggle('bad',!any);
      if(!any&&!first) first=form.querySelector('input[name="'+n+'"]');
    });
    if(first){ first.scrollIntoView({block:'center',behavior:'smooth'}); if(first.focus) first.focus(); return; }

    const fd=Object.fromEntries(new FormData(form).entries());
    const t=curTipo>=0?tiposOf(cur)[curTipo]:null, pUF=precioActual();
    const data={
      nombre:fd.nombre.trim(), apellido:fd.apellido.trim(), rut:rutFmt(fd.rut),
      telefono:telNorm(fd.telefono), email:fd.email.trim().toLowerCase(),
      renta:fd.renta, periodo:fd.periodo, complementa:fd.complementa, credito:fd.credito, contacto:fd.contacto,
      proyecto:cur.name, slug:cur._fk||cur.slug, comuna:cur.commune,
      tipologia:t?(t.nombre+(t.planta?' — Planta '+t.planta:'')):'Por definir',
      precio:pUF?String(Math.round(pUF)):'',
      destino:destino==='inversion'?'inversion':'primera',
      origen:'Web - Cotizador', fecha_envio:new Date().toISOString(), requestId
    };
    enviando=true;
    const btn=$('#czSubmit'), btnHtml=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<i data-lucide="loader" class="ico"></i>Enviando…';
    let ok=false;
    try{
      const r=await fetch(CFG.endpoint||'/api/lead-cotizacion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const j=await r.json().catch(()=>({}));
      ok=r.ok&&j&&j.ok===true;
    }catch(err){ ok=false; }
    enviando=false;
    if(!ok){
      btn.disabled=false; btn.innerHTML=btnHtml;
      errBox.textContent='No pudimos enviar tu cotización. Inténtalo nuevamente en unos segundos.';
      errBox.style.display='block';
      if(window.lucide) lucide.createIcons();
      return;
    }
    requestId=reqId();
    form.style.display='none'; $('#okProy').textContent=cur.name; $('#czOk').classList.add('show');
    const msg='Hola, acabo de cotizar '+data.proyecto+' ('+data.comuna+') — '+data.tipologia+(data.precio?' · UF '+nf.format(+data.precio):'')+'. Mi nombre es '+data.nombre+' '+data.apellido+'.';
    const okBox=$('#czOk');
    if(!okBox.querySelector('.cz-okwa')){
      okBox.insertAdjacentHTML('beforeend','<a class="btn btn-violet cz-okwa" style="margin-top:22px;display:inline-flex" target="_blank" rel="noopener"><i data-lucide="message-circle" class="ico"></i>Escribir por WhatsApp</a>');
    }
    okBox.querySelector('.cz-okwa').href='https://wa.me/'+nextWa()+'?text='+encodeURIComponent(msg);
    okBox.scrollIntoView({block:'center',behavior:'smooth'});
    if(window.lucide) lucide.createIcons();
  });

  /* ---------- nav móvil + menú Comprar ---------- */
  const bg=$('#navBurger'), mm=$('#mobileMenu');
  if(bg&&mm){
    bg.addEventListener('click',e=>{e.stopPropagation();mm.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!mm.contains(e.target)&&!bg.contains(e.target))mm.classList.remove('open');});
  }
  document.querySelectorAll('[data-navdd]').forEach(dd=>{
    const b=dd.querySelector('button');
    if(b) b.addEventListener('click',e=>{e.stopPropagation();dd.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!dd.contains(e.target))dd.classList.remove('open');});
  });

  /* ---------- UF del día ---------- */
  (async()=>{
    try{
      const c=new AbortController(); setTimeout(()=>c.abort(),3500);
      const r=await fetch('https://mindicador.cl/api/uf',{signal:c.signal}); const j=await r.json();
      const v=j&&j.serie&&j.serie[0]&&j.serie[0].valor; if(v){ UF=v; renderSide(); }
    }catch(e){}
  })();

  /* ---------- inicio ---------- */
  const qs=new URLSearchParams(location.search), qSlug=qs.get('slug');
  const start=(qSlug&&GRID.find(x=>x._fk===qSlug||x.slug===qSlug))||GRID.find(x=>tiposOf(x).length)||GRID[0];
  pick(start,parseInt(qs.get('tipo')||'-1',10));
  if(window.lucide) lucide.createIcons();
})();
