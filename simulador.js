/* ============================================================
   Corretaje Guzmán — Asesor de Capacidad de Compra
   Calcula capacidad crediticia y cruza con los proyectos
   disponibles (window.PROYECTOS) para mostrar oportunidades.
   ============================================================ */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const nf=new Intl.NumberFormat('es-CL');
  const FICHAS=window.PROYECTO_FICHAS||{};
  const CATALOGO=Array.isArray(window.PROYECTOS)?window.PROYECTOS:[];
  const normalizaProyecto=(base)=>{
    const ficha=FICHAS[base.slug]||{};
    return {
      slug:base.slug,
      name:base.name||ficha.name||'Proyecto',
      commune:base.commune||ficha.commune||'',
      desdeUF:Number(base.desdeUF||ficha.desdeUF)||0,
      entrega:base.entrega||ficha.entrega||'',
      detalle:base.detalle||ficha.ficha||('/proyectos/'+base.slug+'/'),
      specs:base.specs||(ficha.detallesStats||[]).map(x=>x&&x.v).filter(Boolean).slice(0,2).join(' · ')
    };
  };
  const P=(CATALOGO.length?CATALOGO:Object.keys(FICHAS).map(slug=>({slug})))
    .map(normalizaProyecto)
    .filter(p=>p.desdeUF>0&&p.detalle);
  const CFG=window.SIM_CONFIG||{};
  const UFLIVE={v:CFG.uf||40983.58};
  const UF_=()=>UFLIVE.v;
  const WAS=CFG.whatsapps||['56944637680','56944717233'];
  const KEY='cg_wa_turno';
  function nextWa(){let i=0;try{i=parseInt(localStorage.getItem(KEY)||'0',10)||0;}catch(e){}
    const n=WAS[i%WAS.length];try{localStorage.setItem(KEY,String((i+1)%WAS.length));}catch(e){}return n;}

  const money=(n)=>'$'+nf.format(Math.round(n));
  const uf=(n)=>'UF '+nf.format(Math.round(n));
  const num=(v)=>Number(String(v).replace(/\D/g,''))||0;

  /* formato miles al escribir */
  ['renta','rentaComp','ahorro'].forEach(id=>{
    const e=$('#'+id); if(!e) return;
    e.addEventListener('input',()=>{const d=e.value.replace(/\D/g,'');e.value=d?nf.format(+d):'';calc();});
  });

  /* mostrar/ocultar renta del complemento */
  $('#compSi').addEventListener('change',()=>{$('#compBox').classList.add('show');calc();});
  $('#compNo').addEventListener('change',()=>{$('#compBox').classList.remove('show');calc();});

  /* plazo */
  let plazo=25;
  $('#plazos').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    plazo=+b.dataset.a;
    $('#plazos').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    calc();
  });

  /* destino de compra (afecta el % que financia el banco) */
  let destino='primera';
  $('#destinos').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    destino=b.dataset.d;
    $('#destinos').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    calc();
  });

  /* ---------- cálculo ---------- */
  function dividendoMax(ingreso){ return ingreso*(CFG.cargaMax||0.25); }
  function capacidadCredito(div, tasaAnual, anios){
    const i=tasaAnual/12/100, n=anios*12;
    return i>0 ? div*(1-Math.pow(1+i,-n))/i : div*n;
  }
  function dividendoDe(monto, tasaAnual, anios){
    const i=tasaAnual/12/100, n=anios*12;
    return i>0 ? monto*i/(1-Math.pow(1+i,-n)) : monto/n;
  }

  let ultimo=null;

  function calc(){
    const r1=num($('#renta').value);
    const r2=$('#compSi').checked ? num($('#rentaComp').value) : 0;
    const ingreso=r1+r2;
    const ahorro=num($('#ahorro').value);
    const pct=(CFG.financiaBanco||{})[destino]||0.8;   // % que financia el banco
    const tasa=CFG.tasaAnual||4.7;

    if(ingreso<=0){ $('#resultado').classList.remove('show'); $('#vacio').classList.add('show'); return; }
    $('#vacio').classList.remove('show'); $('#resultado').classList.add('show');

    const div=dividendoMax(ingreso);
    const credito=capacidadCredito(div, tasa, plazo);
    const topePorCredito=credito/pct;                  // tope si el pie estuviera cubierto
    const topePorPie=ahorro>0 ? ahorro/(1-pct) : 0;    // tope que cubre su ahorro como pie
    /* HOY necesita el pie en efectivo: sin ahorro no puede pagarlo al contado */
    const tope=Math.min(topePorCredito, topePorPie);
    const topeUF=tope/UF_();
    const limitante = ahorro<=0 ? 'sinpie' : (topePorPie<topePorCredito ? 'pie' : 'credito');

    /* CON PIE FINANCIADO: para clasificar alternativas se usa la
       capacidad hipotecaria ya calculada; la cuota de pie se informa en cada ficha. */
    const mp=CFG.mesesPie||24;
    const topeConPieFin=topePorCredito;
    const topeConPieFinUF=topeConPieFin/UF_();
    const cuotaPieDe=(v)=>Math.max(0, v*UF_()*(1-pct)-ahorro)/mp;
    const sinPiePropio=ahorro<=0;
    const capacidadMostrada=sinPiePropio ? topeConPieFin : tope;
    const capacidadMostradaUF=sinPiePropio ? topeConPieFinUF : topeUF;

    $('#rIngreso').textContent=money(ingreso);
    $('#rDiv').textContent=money(div);
    $('#rCredito').textContent=money(credito)+' · '+uf(credito/UF_());
    $('#rCapLabel').textContent=sinPiePropio ? 'Capacidad con pie financiado' : 'Tu capacidad de compra estimada';
    $('#rTope').textContent=uf(capacidadMostradaUF);
    $('#rTopeClp').textContent=money(capacidadMostrada);
    $('#rPieLabel').textContent=sinPiePropio ? 'Pie propio disponible' : 'Pie requerido';
    $('#rPie').textContent=sinPiePropio ? money(ahorro)+' · financiable en cuotas' : money(tope*(1-pct))+' ('+Math.round((1-pct)*100)+'%)';
    $('#rPlazoTxt').textContent=plazo+' años · tasa '+String(tasa).replace('.',',')+'% anual';
    const ePF=$('#rPieFin'); if(ePF) ePF.textContent=uf(topeConPieFinUF);

    /* clasificar proyectos */
    const alcanza=[], conPie=[], cerca=[];
    P.forEach(p=>{
      const v=p.desdeUF||0; if(!v) return;
      const pieNec=v*UF_()*(1-pct);
      const item={...p, pieNec, div:dividendoDe(v*UF_()*pct, tasa, plazo), cuotaPie:cuotaPieDe(v)};
      if(topeUF>0 && v<=topeUF) alcanza.push(item);
      else if(v<=topeConPieFinUF) conPie.push(item);
      else if(v<=topeConPieFinUF*1.25) cerca.push(item);
    });
    alcanza.sort((a,b)=>b.desdeUF-a.desdeUF);
    conPie.sort((a,b)=>a.desdeUF-b.desdeUF);
    cerca.sort((a,b)=>a.desdeUF-b.desdeUF);

    $('#rLimit').textContent = limitante==='sinpie'
      ? (conPie.length
        ? 'Con pie financiado, tu renta alcanza '+conPie.length+' '+(conPie.length===1?'proyecto':'proyectos')+' hasta '+uf(topeConPieFinUF)+'. Revisa las alternativas a continuación.'
        : 'Sin ahorro para el pie propio. Revisa las alternativas con pie financiado más abajo.')
      : limitante==='pie'
        ? 'Tu tope hoy lo define el ahorro para el pie, no tu renta.'
        : 'Tu tope hoy lo define tu capacidad de crédito.';

    ultimo={ingreso,div,credito,tope,topeUF,ahorro,plazo,destino,pct,alcanza:alcanza.length,conPie:conPie.length};

    $('#nAlcanza').textContent=alcanza.length;
    $('#nConPie').textContent=conPie.length;

    render('#listaAlcanza', alcanza, 'alcanza');
    render('#listaConPie', conPie, 'conpie');
    render('#listaCerca', cerca, 'cerca');

    $('#blkAlcanza').style.display=alcanza.length?'block':'none';
    $('#blkConPie').style.display=conPie.length?'flex':'none';
    $('#listaConPie').style.display=conPie.length?'grid':'none';
    $('#blkCerca').style.display=cerca.length?'block':'none';
    $('#sinResultados').style.display=(!alcanza.length&&!conPie.length&&!cerca.length)?'block':'none';

    /* CTA con el perfil completo */
    const det=[
      'Hola, simulé mi capacidad de compra en el sitio:',
      '• Ingreso considerado: '+money(ingreso),
      '• Ahorro para pie: '+(ahorro?money(ahorro):'por definir'),
      '• Plazo: '+plazo+' años · Destino: '+({primera:'primera vivienda',inversion:'inversión',segunda:'segunda vivienda'}[destino]),
      '• Capacidad estimada: '+uf(capacidadMostradaUF)+' ('+money(capacidadMostrada)+')'+(sinPiePropio?' con pie financiado':''),
      '• Dividendo estimado: '+money(div),
      alcanza.length?('Me interesan: '+alcanza.slice(0,3).map(x=>x.name).join(', ')):'Quiero saber qué alternativas tengo.',
      '¿Me pueden asesorar?'
    ].join('\n');
    const link='https://wa.me/'+WAS[0]+'?text='+encodeURIComponent(det);
    $('#ctaWa').href=link; $('#ctaWa2').href=link;
  }

  const ESTADO={
    inmediata:{t:'Entrega inmediata',c:'est-inm'},
    verde:{t:'Venta en verde',c:'est-verde'},
    futura:{t:'Entrega futura',c:'est-fut'},
    ultimas:{t:'Últimas unidades',c:'est-ult'}
  };

  function render(sel, arr, tipo){
    const wrap=$(sel); if(!wrap) return;
    wrap.innerHTML=arr.map(p=>{
      const f=FICHAS[p.slug];
      const href=p.detalle||(f?f.ficha:null);
      const cot=f?('/cotizacion.html?slug='+p.slug):null;
      const badge = tipo==='alcanza' ? '<span class="pb ok"><i data-lucide="check" class="ico"></i>Alcanzas</span>'
        : tipo==='conpie' ? '<span class="pb fin"><i data-lucide="sparkles" class="ico"></i>Con pie financiado</span>'
        : '<span class="pb near"><i data-lucide="trending-up" class="ico"></i>Cerca</span>';
      return `<article class="pcard2">
        <div class="pc-top">
          <div>
            <h3>${p.name}</h3>
            <span class="pc-com"><i data-lucide="map-pin" class="ico"></i>${p.commune||''}</span>
            ${(function(){var e=ESTADO[p.entrega]; return e?'<span class="est '+e.c+'">'+e.t+'</span>':'';})()}
          </div>
          ${badge}
        </div>
        <div class="pc-nums">
          <div><span class="k">Desde</span><b>${uf(p.desdeUF)}</b></div>
          <div><span class="k">Dividendo aprox.</span><b>${money(p.div)}</b></div>
          <div><span class="k">${tipo==='conpie'?'Cuota de pie':'Pie estimado'}</span><b>${tipo==='conpie'?money(p.cuotaPie)+'/mes':money(p.pieNec)}</b></div>
        </div>
        ${p.specs?`<p class="pc-specs">${p.specs}</p>`:''}
        <div class="pc-btns">
          ${href?`<a class="btn btn-violet" href="${href}">Ver proyecto</a>`:''}
          <a class="btn btn-soft" href="https://wa.me/${WAS[0]}?text=${encodeURIComponent('Hola, quiero consultar por '+p.name+' ('+(p.commune||'')+'), desde UF '+nf.format(p.desdeUF)+'. '+(ESTADO[p.entrega]?ESTADO[p.entrega].t+'. ':'')+'¿Me pueden dar más información?')}" target="_blank" rel="noopener">Consultar</a>
        </div>
      </article>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
  }

  /* reparte los clics de WhatsApp entre los dos números */
  document.addEventListener('click',function(ev){
    const a=ev.target.closest('a[href*="wa.me/"]'); if(!a) return;
    a.href=a.href.replace(/wa\.me\/\d+/,'wa.me/'+nextWa());
  },true);

  /* nav móvil */
  const b=$('#navBurger'), mm=$('#mobileMenu');
  if(b&&mm){
    b.addEventListener('click',e=>{e.stopPropagation();mm.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!mm.contains(e.target)&&!b.contains(e.target))mm.classList.remove('open');});
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mm.classList.remove('open')));
  }

  $('#ufRef').textContent=money(UF_());
  const eT=$('#tasaRef'); if(eT) eT.textContent=String(CFG.tasaAnual||4.3).replace('.',',')+'%';
  /* UF vigente: usa el endpoint del sitio, con respaldo en la configuración. */
  (async()=>{
    try{
      const r=await fetch('/api/uf-actual',{headers:{accept:'application/json'},cache:'no-store'});
      if(!r.ok) return;
      const j=await r.json();
      const v=Number(j&&j.value);
      if(v>30000&&v<80000){ CFG.uf=v; UFLIVE.v=v; $('#ufRef').textContent=money(v); calc(); }
    }catch(e){}
  })();
  if(window.lucide) lucide.createIcons();
  calc();
})();
