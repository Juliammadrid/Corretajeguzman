/* ============================================================
   Corretaje Guzmán — Ficha de proyecto (plantilla data-driven)
   Lee ?slug= y rellena con PROYECTO_FICHAS[slug].
   ============================================================ */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const nf = new Intl.NumberFormat('es-CL');
  const FICHAS = window.PROYECTO_FICHAS || {};
  const slug = window.FICHA_SLUG || new URLSearchParams(location.search).get('slug') || (location.hash||'').replace(/^#\/?/,'') || Object.keys(FICHAS)[0];
  const p = FICHAS[slug];
  const BADGE = { inmediata:{t:'Entrega inmediata',c:'#1f8a5b'}, verde:{t:'Venta en verde',c:'#7c3aed'}, futura:{t:'Entrega futura',c:'#5b7088'}, ultimas:{t:'Últimas unidades',c:'#c0182a'} };

  if(!p){
    document.body.innerHTML = '<div style="max-width:600px;margin:120px auto;text-align:center;font-family:sans-serif;padding:0 20px"><h1 style="font-size:26px">Proyecto no encontrado</h1><p style="color:#666;margin-top:12px">Vuelve a <a href="Proyectos en Venta - Corretaje Guzman.html" style="color:#7c3aed;font-weight:600">Proyectos en venta</a>.</p></div>';
    return;
  }

  /* cg_og_share: banner al compartir por WhatsApp / redes */
  (function(){
    const abs=(u)=>u?new URL(u,location.href).href:'';
    const img=abs(p.bannerImg||p.heroImg||'');
    const t=(p.name||'Proyecto')+' · '+(p.commune||'')+(p.desdeUF?' · Desde UF '+nf.format(p.desdeUF):'');
    const desc=(p.lead||'').slice(0,180);
    const set=(id,v)=>{const e=document.getElementById(id); if(e&&v) e.setAttribute('content',v);};
    set('ogTitle',t); set('twTitle',t);
    set('ogDesc',desc); set('twDesc',desc); set('metaDesc',desc);
    set('ogImg',img); set('twImg',img);
  })();

  document.title = p.name + ' · Corretaje Guzmán';
  $('#pName').textContent = p.name;
  $('#pAddr').textContent = p.address || p.commune || '';
  if(p.sinTituloDesc){ const dt=$('#descTitle'); if(dt) dt.remove(); } else $('#descTitle').textContent = p.descTitulo || (p.heroFull ? 'El proyecto' : p.name);
  $('#pLead').textContent = p.lead || '';
  if(p.bannerHero){
    const phero=document.querySelector('.phero');
    const st=document.createElement('style');
    st.textContent='.phero.bannermode{height:auto!important;min-height:0!important;background:#fff!important}.phero.bannermode::after{display:none!important}.phero.bannermode .ph-body,.phero.bannermode #phTags{display:none!important}.proj-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border-bottom:1px solid var(--line)}.proj-stats .ps{background:#fff;padding:24px 16px;text-align:center}.proj-stats .ps .v{font-family:\'Sora\';font-weight:700;font-size:clamp(15px,1.7vw,20px);letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}.proj-stats .ps .k{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-top:5px}.proj-ctas{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;max-width:900px;margin:20px auto 4px;padding:0 26px}.proj-ctas .pcta{font-family:\'Sora\';font-weight:700;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:var(--violet-d)}.proj-ctas .psep{color:var(--ink-3);font-weight:700}@media(max-width:680px){.proj-stats{grid-template-columns:1fr 1fr}.proj-stats .ps{padding:18px 12px}}';
    document.head.appendChild(st);
    phero.classList.add('bannermode');
    const bs=phero.querySelector('.bgslot');
    bs.style.position='relative';
    bs.innerHTML='<img src="'+p.bannerHero+'" alt="'+p.name+'" style="display:block;width:100%;height:auto">';
    if(p.stats && p.stats.length){
      const bar=document.createElement('div'); bar.className='proj-stats';
      bar.innerHTML=p.stats.map(function(s){return '<div class="ps"><div class="v">'+s.v+'</div><div class="k">'+s.k+'</div></div>';}).join('');
      phero.insertAdjacentElement('afterend', bar);
      if(p.ctas && p.ctas.length){
        const cr=document.createElement('div'); cr.className='proj-ctas';
        cr.innerHTML=p.ctas.map(function(c){return '<span class="pcta">'+c+'</span>';}).join('<span class="psep">·</span>');
        bar.insertAdjacentElement('afterend', cr);
      }
    }
    // sección Solución Integra (texto izq + imagen der). Reemplaza la descripción para evitar redundancia.
    if(p.solucionImg){
      const desc=document.getElementById('descripcion');
      if(desc){
        desc.id='solucion';
        desc.querySelector('.wrap').innerHTML=
          '<div class="sol-grid"><div class="sol-tx"><h2>'+(p.solucionTitulo||('¿Qué es '+p.name+'?'))+'</h2>'+
          (p.solucionLead?'<p class="lead">'+p.solucionLead+'</p>':'')+
          (p.solucionLead2?'<p class="lead" style="margin-top:14px">'+p.solucionLead2+'</p>':'')+'</div>'+
          '<div class="sol-img"><img src="'+p.solucionImg+'" alt="Solución integra '+p.name+'" loading="lazy"></div></div>';
        const st2=document.createElement('style');
        st2.textContent='.sol-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.sol-tx h2{text-align:left}.sol-tx .lead{text-align:left;margin-left:0;margin-right:0;max-width:none}.sol-img img{display:block;width:100%;height:auto}@media(max-width:860px){.sol-grid{grid-template-columns:1fr;gap:26px}.sol-tx h2{text-align:center}.sol-tx .lead{text-align:center}.sol-img{max-width:520px;margin:0 auto}}';
        document.head.appendChild(st2);
      }
    }
  if(p.heroAlto){ const ph=document.querySelector('.phero'); if(ph){ ph.style.height=p.heroAlto; ph.style.minHeight='min(360px, calc(100vh - 154px))'; } }
  } else if(p.heroImg){ const bs=document.querySelector('.phero .bgslot'); const fb=document.querySelector('.phero .bgfallback'); if(fb) fb.style.display='none'; const h=$('#heroImg'); if(h) h.style.display='none';
    if(bs && p.heroBanner){
      document.querySelector('.phero').classList.add('is-banner');
      bs.insertAdjacentHTML('beforeend','<img class="banner-img" src="'+p.heroImg+'" alt="'+(p.name||'')+'" loading="eager">');
      const stBn=document.createElement('style');
      stBn.textContent='.phero.is-banner{height:auto!important;min-height:0!important;background:var(--dark)}.phero.is-banner::after{display:none}.phero.is-banner .bgslot{position:relative!important;inset:auto!important;height:auto}.phero.is-banner .banner-img{position:relative;width:100%;height:auto;display:block}.phero.is-banner .ph-tag{position:static!important;padding:20px 26px 0;justify-content:center}.phero.is-banner .ph-body{position:static!important;padding:14px 26px 34px;text-align:center}@media(max-width:680px){.phero.is-banner .ph-tag{padding:16px 18px 0;gap:8px}.phero.is-banner .ph-body{padding:12px 18px 26px}}';
      document.head.appendChild(stBn);
    } else if(bs){ bs.style.backgroundImage="url('"+p.heroImg+"')"; bs.style.backgroundSize="cover"; bs.style.backgroundPosition="center"; }
  }

  if(p.heroFull){ const ph=document.querySelector('.phero'); if(ph){ ph.style.height='calc(100vh - 76px - 78px)'; ph.style.minHeight='min(360px, calc(100vh - 154px))'; ph.style.maxHeight='none'; } const t=document.getElementById('pName'); if(t && !p.sinKicker && !document.getElementById('pKicker')) t.insertAdjacentHTML('beforebegin','<div id="pKicker" class="ph-kicker">Concepto</div>'); const heroFullCss=document.createElement('style'); heroFullCss.textContent='.phero .ph-tag{display:none!important}.phero .ph-body{padding-bottom:56px!important}.phero .ph-kicker{font-family:Sora,sans-serif;font-weight:300;font-size:clamp(15px,1.6vw,22px);letter-spacing:.08em;text-transform:uppercase;color:#d9ccff;margin-bottom:6px}.phero h1{font-size:clamp(34px,4.6vw,66px)!important;line-height:1.05!important}.phero .ph-addr{display:flex!important;font-size:clamp(15px,1.7vw,24px)!important;margin-top:12px!important}'; document.head.appendChild(heroFullCss); }
  // banner promocional inicial (antes del hero)
  if(p.bannerImg){
    const hero=document.querySelector('.phero');
    if(hero){
      hero.insertAdjacentHTML('beforebegin','<div class="proj-banner"><img src="'+p.bannerImg+'" alt="'+p.name+' — oferta" loading="eager"></div>');
      const stB=document.createElement('style');
      stB.textContent='.proj-banner{width:100%;background:var(--dark);line-height:0}.proj-banner img{width:100%;height:auto;display:block;max-height:520px;object-fit:cover;object-position:center}@media(max-width:680px){.proj-banner img{max-height:none}}';
      document.head.appendChild(stB);
    }
  }

  // tags
  const tags = $('#phTags');
  if(p.off) tags.insertAdjacentHTML('beforeend', `<span class="ph-chip off"><i data-lucide="tag" class="ico"></i>${p.off}% OFF</span>`);
  const b = BADGE[p.entrega];
  if(b) tags.insertAdjacentHTML('beforeend', `<span class="ph-chip"><i data-lucide="check" class="ico"></i>${b.t}</span>`);
  if(p.subsidioTasa) tags.insertAdjacentHTML('beforeend', `<span class="ph-chip"><i data-lucide="percent" class="ico"></i>Subsidio Tasa</span>`);

  // secciones extra (premios + parque interior), tras solución/descripción
  (function(){
    const anchor=document.getElementById('solucion')||document.getElementById('descripcion');
    if(!anchor) return;
    let html='';
    if(p.premiosImg){
      html+='<section class="sec" id="premios" style="padding-top:0">'+
        '<img src="'+p.premiosImg+'" alt="Premios de arquitectura" loading="lazy" style="display:block;width:100%;height:auto">'+
        (p.premiosLead?'<div class="wrap"><p class="lead" style="margin-top:30px">'+p.premiosLead+'</p></div>':'')+
        '</section>';
    }
    if(p.parqueImg){
      html+='<section class="sec" id="parque"><div class="wrap"><div class="px-grid">'+
        '<div class="px-tx"><h2>'+(p.parqueTitulo||'Único con un gran parque interior')+'</h2>'+
        (p.parqueLead?'<p class="lead">'+p.parqueLead+'</p>':'')+'</div>'+
        '<div class="px-img"><img src="'+p.parqueImg+'" alt="'+(p.parqueTitulo||p.name)+'" loading="lazy"></div>'+
        '</div></div></section>';
    }
    if(p.parqueRender){
      html+='<section class="sec" id="parque-render" style="padding-top:0">'+
        '<img src="'+p.parqueRender+'" alt="Parque interior '+p.name+'" loading="lazy" style="display:block;width:100%;height:auto">'+
        (p.caminataTitulo?'<div class="wrap"><div class="cam-grid"><div class="cam-tx"><h3>'+p.caminataTitulo+'</h3>'+(p.caminataLead?'<p class="lead">'+p.caminataLead+'</p>':'')+'</div>'+(p.caminataImg?'<div class="cam-img"><img src="'+p.caminataImg+'" alt="Sendero" loading="lazy"></div>':'')+'</div></div>':'')+
        '</section>';
    }
    if(html){
      anchor.insertAdjacentHTML('afterend', html);
      const st3=document.createElement('style');
      st3.textContent='.px-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.px-tx h2{text-align:left}.px-tx .lead{text-align:left;margin:18px 0 0;max-width:none}.px-img img{display:block;width:100%;height:auto;border-radius:16px}.cam-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;margin-top:34px}.cam-tx h3{font-family:\'Sora\';font-weight:700;font-size:clamp(20px,2.4vw,28px);letter-spacing:.06em;text-transform:uppercase}.cam-tx .lead{text-align:left;margin:14px 0 0;max-width:none}.cam-img img{display:block;width:100%;height:auto}@media(max-width:860px){.px-grid{grid-template-columns:1fr;gap:24px}.px-tx h2{text-align:center}.px-tx .lead{text-align:center}.cam-grid{grid-template-columns:1fr;gap:20px}.cam-tx h3{text-align:center}.cam-tx .lead{text-align:center}.cam-img{max-width:420px;margin:0 auto}}';
      document.head.appendChild(st3);
    }
  })();

  // sección "Departamento" destacado (foto grande + tag + bloque de texto), estilo Imagina
  (function(){
    if(!p.deptoImg) return;
    const tipos=document.getElementById('tipologias');
    if(!tipos) return;
    const html =
      '<section class="sec depto-hero" style="padding:0">'+
        '<div class="depto-media">'+
          '<img src="'+p.deptoImg+'" alt="Departamento '+p.name+'" loading="lazy">'+
          (p.deptoTag?'<span class="depto-tag">'+p.deptoTag+'</span>':'')+
        '</div>'+
        (p.deptoTitulo?'<div class="depto-band"><div class="wrap"><h2>'+p.deptoTitulo+'</h2>'+(p.deptoLead?'<p class="lead" style="text-align:left;margin:14px 0 0;max-width:66ch">'+p.deptoLead+'</p>':'')+'</div></div>':'')+
      '</section>';
    document.getElementById('comodidades').insertAdjacentHTML('beforebegin', html);
    const st4=document.createElement('style');
    st4.textContent='.depto-media{position:relative;width:100%;line-height:0}.depto-media img{display:block;width:100%;height:auto;max-height:640px;object-fit:cover}.depto-tag{position:absolute;left:0;bottom:0;background:rgba(255,255,255,.94);color:var(--ink);font-family:\'Sora\';font-weight:700;font-size:15px;letter-spacing:.14em;padding:14px 26px}.depto-band{background:linear-gradient(160deg,var(--violet-dd),var(--violet));color:#fff;padding:44px 0}.depto-band h2{font-family:\'Sora\';font-weight:800;font-size:clamp(20px,2.6vw,30px);letter-spacing:.03em;text-transform:uppercase;color:#fff}.depto-band h2 b{color:#e7dcfc}.depto-band .lead{color:rgba(255,255,255,.88)}.depto-band .lead i{opacity:.75;font-size:13.5px;display:block;margin-top:10px}@media(max-width:680px){.depto-media img{max-height:340px}.depto-tag{font-size:12.5px;padding:11px 18px}.depto-band{padding:30px 0}}';
    document.head.appendChild(st4);
  })();

  // bloques imagen + texto (alternados)
  if(p.bloques && p.bloques.length){
    const anc=document.getElementById('comodidades');
    if(anc){
  (function(){var st=document.createElement('style');st.textContent='.bq-mas{margin-top:22px;border-top:1px solid var(--line)}.bq-mas summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;padding:16px 0 4px;font-family:Sora,sans-serif;font-weight:700;font-size:15px;color:var(--violet-d)}.bq-mas summary::-webkit-details-marker{display:none}.bq-mas summary::after{content:"";width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-top:-4px;transition:transform .2s}.bq-mas[open] summary::after{transform:rotate(-135deg);margin-top:4px}.bq-mas-in{background:var(--bg);border-radius:14px;padding:18px 20px;margin-top:10px}.bq-mas-in h4{font-family:Sora,sans-serif;font-weight:700;font-size:14.5px;color:var(--ink);margin-top:14px}.bq-mas-in h4:first-child{margin-top:0}.bq-mas-in p{font-size:14px;margin-top:5px;line-height:1.6}';document.head.appendChild(st);})();

      anc.insertAdjacentHTML('beforebegin', p.bloques.map((b,i)=>'<section class="sec bloque'+(i%2?' rev':'')+'"><div class="wrap bq-grid"><div class="bq-img'+(b.recorte?' cut':'')+'"><img src="'+b.img+'" alt="'+b.t+'" loading="lazy"></div><div class="bq-tx"><h2>'+b.t+'</h2><p>'+b.d+'</p>'+(b.mas&&b.mas.length?'<details class="bq-mas"><summary>Más información</summary><div class="bq-mas-in">'+b.mas.map(m=>'<h4>'+m.t+'</h4><p>'+m.d+'</p>').join('')+'</div></details>':'')+'</div></div></section>').join(''));
      const sb=document.createElement('style');
      sb.textContent='.bq-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.bloque.rev .bq-img{order:2}.bq-img img{width:100%;height:auto;display:block;border-radius:18px}.bq-img.cut img{border-radius:0;max-width:520px;margin:0 auto}.bq-tx h2{text-align:left}.bq-tx p{font-size:16.5px;color:var(--ink-2);line-height:1.7;margin-top:16px}@media(max-width:860px){.bq-grid{grid-template-columns:1fr;gap:24px}.bloque.rev .bq-img{order:0}.bq-img.cut img{max-width:320px}}';
      document.head.appendChild(sb);
    }
  }

  // tipologías
  const tip = $('#tipos');
  if(p.renderImg){
    const detHtml =
      '<section class="sec" id="detalles-proy"><div class="wrap detalles-grid">'+
        '<div class="detalles-stats"><h2 style="text-align:left">Detalles del proyecto</h2>'+
        (p.detallesStats||[]).map(function(d){return '<div class="dstat"><span class="dk">'+d.k+'</span><span class="dv">'+d.v+'</span></div>';}).join('')+
        '</div>'+
        '<div class="detalles-img"><img src="'+p.renderImg+'" alt="'+p.name+' render" loading="lazy"></div>'+
      '</div></section>';
    document.getElementById('comodidades').insertAdjacentHTML('beforebegin', detHtml);
    const st5=document.createElement('style');
    st5.textContent='.detalles-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.detalles-stats h2{margin-bottom:26px}.dstat{padding:16px 0;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:4px}.dstat:first-of-type{border-top:none}.dk{font-size:13px;color:var(--ink-3);font-weight:600}.dv{font-family:\'Sora\';font-weight:700;font-size:20px}.detalles-img img{display:block;width:100%;height:auto;border-radius:16px}@media(max-width:860px){.detalles-grid{grid-template-columns:1fr;gap:24px}.detalles-img{order:-1}}';
    document.head.appendChild(st5);
  }
  if(p.disenoImgs && p.disenoImgs.length){
    const disImgs = p.disenoImgs;
    const big = disImgs[0], tr = disImgs[1], br = disImgs[2];
    const disHtml =
      '<section class="sec" id="diseno-proy"><div class="wrap">'+
        '<span class="eyebrow">'+(p.disenoEyebrow||'Diseño')+'</span>'+
        '<h2 style="text-align:left;margin-top:8px">'+(p.disenoTitulo||'Innovación en tu departamento')+'</h2>'+
        '<div class="diseno-grid">'+
          '<div class="diseno-big"><img src="'+big+'" alt="'+p.name+' living" loading="lazy"></div>'+
          '<div class="diseno-stack">'+
            (tr?'<img src="'+tr+'" alt="'+p.name+' cocina" loading="lazy">':'')+
            (br?'<img src="'+br+'" alt="'+p.name+' dormitorio" loading="lazy">':'')+
          '</div>'+
        '</div>'+
        (p.disenoSubtitulo?'<h3 class="diseno-sub">'+p.disenoSubtitulo+'</h3>':'')+
        (p.disenoLead?'<p class="lead" style="text-align:left;margin-left:0;max-width:70ch">'+p.disenoLead+'</p>':'')+
      '</div></section>';
    document.getElementById('comodidades').insertAdjacentHTML('beforebegin', disHtml);
    if(p.disenoTabs && p.disenoTabs.length){
      const DT = p.disenoTabs;
      const wrapD = document.querySelector('#diseno-proy .wrap');
      wrapD.insertAdjacentHTML('beforeend',
        '<div class="dtabs">'+
          '<div class="dtabs-top">'+
            '<div class="dtabs-nav">'+DT.map((t,i)=>'<button class="dtab'+(i===0?' on':'')+'" data-i="'+i+'">'+t.t+'</button>').join('')+'</div>'+
            '<div class="dtabs-arrows"><button class="dt-arrow" id="dtPrev"><i data-lucide="chevron-left" class="ico"></i></button><button class="dt-arrow" id="dtNext"><i data-lucide="chevron-right" class="ico"></i></button></div>'+
          '</div>'+
          '<div class="dtabs-stage">'+DT.map((t,i)=>'<div class="dslide'+(i===0?' on':'')+'" data-i="'+i+'"><img src="'+t.src+'" alt="'+t.t+'" loading="lazy"></div>').join('')+'</div>'+
        '</div>');
      const stD=document.createElement('style');
      stD.textContent='.dtabs{margin-top:52px}.dtabs-top{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);flex-wrap:wrap}.dtabs-nav{display:flex;gap:30px;flex-wrap:wrap}.dtab{font-family:\'Sora\';font-weight:700;font-size:17px;color:var(--ink-3);padding:0 2px 14px;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s}.dtab.on{color:var(--ink);border-color:var(--violet)}.dtabs-arrows{display:flex;gap:10px;padding-bottom:10px}.dt-arrow{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--ink-2)}.dt-arrow:hover{border-color:var(--violet);color:var(--violet-d)}.dt-arrow .ico{width:17px;height:17px}.dtabs-stage{position:relative;width:100%;margin-top:24px;border-radius:18px;overflow:hidden;aspect-ratio:16/8;min-height:420px;background:var(--bg)}.dslide{position:absolute;inset:0;opacity:0;transition:opacity .3s}.dslide.on{opacity:1}.dslide img{width:100%;height:100%;object-fit:cover;display:block}@media(max-width:680px){.dtabs-nav{gap:16px}.dtab{font-size:14px}.dtabs-stage{aspect-ratio:4/3.2;min-height:0}}';
      document.head.appendChild(stD);
      let dCur=0;
      const dTabs=[...document.querySelectorAll('.dtab')], dSlides=[...document.querySelectorAll('.dslide')];
      const showD=(i)=>{dCur=(i+DT.length)%DT.length;dTabs.forEach((t,j)=>t.classList.toggle('on',j===dCur));dSlides.forEach((s,j)=>s.classList.toggle('on',j===dCur));};
      dTabs.forEach(t=>t.addEventListener('click',()=>showD(+t.dataset.i)));
      document.getElementById('dtPrev').addEventListener('click',()=>showD(dCur-1));
      document.getElementById('dtNext').addEventListener('click',()=>showD(dCur+1));
    }
    const st6=document.createElement('style');
    st6.textContent='.diseno-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-top:28px}.diseno-big img{width:100%;height:100%;object-fit:cover;border-radius:14px;display:block}.diseno-stack{display:grid;grid-template-rows:1fr 1fr;gap:18px}.diseno-stack img{width:100%;height:100%;object-fit:cover;border-radius:14px;display:block}.diseno-sub{text-align:left;margin-top:30px;font-size:22px}@media(max-width:860px){.diseno-grid{grid-template-columns:1fr}.diseno-stack{grid-template-columns:1fr 1fr;grid-template-rows:auto}}';
    document.head.appendChild(st6);
  }
  if(p.disenoStack && p.disenoImgs && p.disenoImgs.length){
    const w=document.querySelector('#diseno-proy .wrap');
    if(w){
      [...w.children].forEach(ch=>{ if(ch.querySelector('img')||ch.classList.contains('dtabs')) ch.remove(); });
      const I=p.disenoImgs;
      w.insertAdjacentHTML('beforeend','<div class="dstack"><img class="ds-big" src="'+I[0]+'" alt="'+p.name+'"><div class="ds-row">'+I.slice(1).map(s=>'<img src="'+s+'" alt="'+p.name+'" loading="lazy">').join('')+'</div></div>');
      const sd=document.createElement('style');
      sd.textContent='.dstack{margin-top:36px;display:flex;flex-direction:column;gap:18px}.dstack img{width:100%;display:block;border-radius:16px;object-fit:cover}.ds-big{aspect-ratio:16/8}.ds-row{display:grid;grid-template-columns:1fr 1fr;gap:18px}.ds-row img{aspect-ratio:4/3.4}@media(max-width:680px){.ds-row{grid-template-columns:1fr}}';
      document.head.appendChild(sd);
    }
  }
  if(p.tipologiasDisponibles && p.tipologiasDisponibles.length){
    const TD = p.tipologiasDisponibles;
    tip.classList.add('tipos-planta');
    const opts = TD.map((t,i)=>`<option value="${i}">${t.planta||t.nombre}</option>`).join('');
    const tipoNames = [...new Set(TD.map(t=>t.nombre))].map(n=>`<option>${n}</option>`).join('');
    tip.innerHTML = `
      <div class="tsel">
        <span class="tsel-label">Selecciona una tipología</span>
        <div class="tsel-fields">
          <select id="tselTipo" class="tsel-input">${tipoNames}</select>
          <select id="tselPlanta" class="tsel-input">${opts}</select>
        </div>
      </div>
      <div class="tplanta">
        <div class="tplanta-img"><img id="tpImg" src="" alt="" loading="lazy"></div>
        <div class="tplanta-info">
          <div class="tplanta-grid">
            <div class="tp"><span class="tk">Planta</span><span class="tv" id="tpPlanta"></span></div>
            <div class="tp"><span class="tk">Superficie interior</span><span class="tv" id="tpInt"></span></div>
            <div class="tp"><span class="tk">Dorm + Baño</span><span class="tv" id="tpDorm"></span></div>
            <div class="tp"><span class="tk">Terraza</span><span class="tv" id="tpTerr"></span></div>
            <div class="tp"><span class="tk">Orientación</span><span class="tv" id="tpOri"></span></div>
            <div class="tp"><span class="tk">Superficie total</span><span class="tv" id="tpTot"></span></div>
          </div>
          <div class="tplanta-price"><span class="tk">Precio desde</span><b id="tpPrice"></b></div>
          <div class="tplanta-actions"><a class="btn btn-violet tplanta-cta" id="tpCta" href="#">Cotizar esta tipología</a><a class="btn tplanta-broch" id="tpBroch" href="#" target="_blank" rel="noopener"><i data-lucide="download" class="ico" style="width:17px;height:17px"></i>Descargar brochure</a></div>
        </div>
      </div>`;
    function setPlanta(i){
      const t = TD[i]; if(!t) return;
      const g=(id)=>document.getElementById(id);
      g('tpImg').src = t.plano; g('tpImg').alt = 'Planta '+(t.planta||'')+' '+p.name;
      g('tpPlanta').textContent = t.planta||'—';
      g('tpInt').textContent = t.m2int||'—';
      g('tpDorm').textContent = t.dormBano||'—';
      g('tpTerr').textContent = t.terraza||'—';
      g('tpOri').textContent = t.orientacion||'—';
      g('tpTot').textContent = t.m2tot||'—';
      g('tpPrice').textContent = t.desdeUF ? 'UF '+nf.format(t.desdeUF) : '—';
      g('tpCta').href = 'Cotizacion - Corretaje Guzman.html?slug='+encodeURIComponent(slug)+'&tipo='+i;
      const br=g('tpBroch');
      if(br){ if(p.brochure){ br.href=p.brochure; br.style.display=''; } else br.style.display='none'; }
    }
    document.getElementById('tselPlanta').addEventListener('change',e=>setPlanta(+e.target.value));
    const tsT=document.getElementById('tselTipo'), tsP=document.getElementById('tselPlanta');
    if(tsT && tsP){
      const fill=()=>{const nm=tsT.value;const idx=TD.map((t,i)=>i).filter(i=>TD[i].nombre===nm);tsP.innerHTML=idx.map(i=>'<option value="'+i+'">Planta '+(TD[i].planta||'')+'</option>').join('');if(idx.length) setPlanta(idx[0]);};
      tsT.addEventListener('change',fill); fill();
    }
    setPlanta(0);
    const stP=document.createElement('style');
    stP.textContent='.tipos-planta{display:block!important;margin-top:36px}.tsel{border:1px solid var(--line);border-radius:16px;padding:22px 26px;display:flex;align-items:center;gap:26px;flex-wrap:wrap;margin-bottom:38px}.tsel-label{font-family:\'Sora\';font-weight:600;font-size:19px;color:var(--ink)}.tsel-fields{display:flex;gap:26px;flex-wrap:wrap;flex:1}.tsel-input{appearance:none;border:0;border-bottom:1px solid var(--ink-3);background:transparent url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' fill=\'none\' stroke=\'%23574f6b\' stroke-width=\'2\'><path d=\'M3 5l4 4 4-4\'/></svg>") right center no-repeat;padding:8px 26px 8px 0;font-family:inherit;font-size:15.5px;font-weight:600;color:var(--ink);cursor:pointer;min-width:220px}.tsel-input:focus{outline:none;border-color:var(--violet)}.tplanta{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center}.tplanta-img img{width:100%;height:auto;display:block}.tplanta-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 26px}.tp{display:flex;flex-direction:column;gap:3px}.tk{font-size:12.5px;color:var(--ink-3);font-weight:600}.tv{font-family:\'Sora\';font-weight:700;font-size:18px}.tplanta-price{margin-top:28px;display:flex;flex-direction:column;gap:2px}.tplanta-price b{font-family:\'Sora\';font-weight:800;font-size:36px;color:var(--violet-d)}.tplanta-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.tplanta-cta{display:inline-flex;width:fit-content}.tplanta-broch{display:inline-flex;align-items:center;gap:9px;padding:16px 22px;font-size:14.5px;font-weight:700;border-radius:12px;background:var(--ink);color:#fff}.tplanta-broch:hover{background:#2a2438}@media(max-width:860px){.tplanta{grid-template-columns:1fr;gap:24px}.tsel{flex-direction:column;align-items:flex-start;gap:14px}.tsel-input{min-width:0;width:100%}}';
    document.head.appendChild(stP);
  } else {
  (p.tipologias||[]).forEach(t=>{
    let priceHtml = '';
    if(t.hastaUF){
      priceHtml = `<div class="tprice">UF ${nf.format(t.desdeUF)} <span>–</span> UF ${nf.format(t.hastaUF)}</div>`;
    } else if(t.desdeUF){
      priceHtml = `<div class="tprice">UF ${nf.format(t.desdeUF)} <span>desde</span></div>`;
    }
    tip.insertAdjacentHTML('beforeend', `
      <div class="tcard">
        <div class="tn">${t.nombre}</div>
        ${t.m2int?`<div class="trow"><span>Superficie interior</span><b>${t.m2int}</b></div>`:''}
        ${t.m2tot?`<div class="trow"><span>Superficie total</span><b>${t.m2tot}</b></div>`:''}
        ${priceHtml}
      </div>`);
  });
  }
  if(!(p.tipologias||[]).length && !(p.tipologiasDisponibles||[]).length) $('#tipologias').style.display='none';

  // galería
  const fotos = (p.fotos||[]).map(f=> f.indexOf('/')>=0 ? f : (/^assets\//.test(f)? f : 'assets/proy/'+f));
  if(p.heroImg && !fotos.length) fotos.push(p.heroImg);
  const gal = $('#gal'); let GAL=[];
  if(gal && !p.noGaleria){
    fotos.forEach((src,i)=>{
      GAL.push(src);
      const g=document.createElement('div'); g.className='g';
      g.innerHTML=`<div class="gfall"><i data-lucide="image" class="ico"></i></div><img src="${src}" alt="${p.name} ${i+1}" loading="lazy" decoding="async" onload="this.style.opacity=1" onerror="this.style.display='none'">`;
      g.addEventListener('click',()=>openLb(i));
      gal.appendChild(g);
    });
    const galSec=$('#galeria'); if(!fotos.length && galSec) galSec.style.display='none';
  } else {
    fotos.forEach(src=>GAL.push(src));
    const galSec=$('#galeria'); if(galSec) galSec.style.display='none';
    const galLink=document.querySelector('.subnav-in a[href="#galeria"]'); if(galLink) galLink.style.display='none';
  }

  // recorrido 3D (Matterport)
  if(p.matterport){
    $('#recorrido').style.display='';
    $('#mpWrap').innerHTML = `<iframe width="100%" height="100%" style="border:0;display:block" src="${p.matterport}" frameborder="0" allowfullscreen allow="xr-spatial-tracking" loading="lazy"></iframe>`;
  } else {
    const rlink=document.querySelector('.subnav-in a[href="#recorrido"]');
    if(rlink) rlink.style.display='none';
  }

  // características
  const fl=$('#featList');
  if(fl) (p.caracteristicas||[]).forEach(c=> fl.insertAdjacentHTML('beforeend', `<div class="f"><span class="ic"><i data-lucide="check" class="ico"></i></span>${c}</div>`));
  // comunes
  const ag=$('#amenGrid');
  if(ag) (p.comunes||[]).forEach(c=> ag.insertAdjacentHTML('beforeend', `<div class="a"><i data-lucide="${c.ic||'check'}" class="ico"></i>${c.t}</div>`));
  if(!(p.caracteristicas||[]).length && !(p.comunes||[]).length && $('#comodidades')) $('#comodidades').style.display='none';

  // galería de espacios comunes — acordeón expansible al pasar el cursor (estilo Imagina)
  const cg=$('#comunesGal');
  if(p.comunesTitulo || p.comunesLead){
    const band=document.createElement('div'); band.className='comunes-band';
    band.innerHTML='<div class="cb-tx">'+(p.comunesTitulo?'<h2>'+p.comunesTitulo+'</h2>':'')+'</div>'+
      (p.comunesLead?'<div class="cb-desc"><p>'+p.comunesLead+'</p></div>':'');
    cg.parentElement.insertBefore(band, cg);
    const stB=document.createElement('style');
    stB.textContent='.comunes-band{background:var(--dark);color:#fff;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:52px 44px;border-radius:18px;margin-top:10px}.comunes-band h2{font-family:\'Sora\';font-weight:800;font-size:clamp(24px,3vw,34px);letter-spacing:.02em;text-transform:uppercase;line-height:1.15;color:#fff}.comunes-band .cb-desc p{font-size:15.5px;line-height:1.7;color:rgba(255,255,255,.82)}@media(max-width:860px){.comunes-band{grid-template-columns:1fr;gap:18px;padding:34px 24px;text-align:center;border-radius:0;margin-left:-26px;margin-right:-26px;width:calc(100% + 52px)}}';
    document.head.appendChild(stB);
  }
  cg.classList.add('comunes-accordion');
  if(p.comunesSide && p.comunesSide.length){
    const CS = p.comunesSide;
    cg.classList.remove('comunes-accordion');
    cg.classList.add('comunes-side-wrap');
    cg.innerHTML = '<div class="cs-list">'+CS.map((t,i)=>'<button class="cs-item'+(i===0?' on':'')+'" data-i="'+i+'"><span class="cs-n">'+String(i+1).padStart(2,'0')+'</span><span class="cs-t">'+t.t+'</span><i data-lucide="arrow-right" class="ico cs-ar"></i></button>').join('')+'</div>'+
      '<div class="cs-stage">'+CS.map((t,i)=>{const src=t.src.indexOf('/')>=0?t.src:'assets/proy/'+t.src; GAL.push(src); return '<div class="cs-slide'+(i===0?' on':'')+'" data-i="'+i+'"><img src="'+src+'" alt="'+t.t+'" loading="lazy"><span class="cs-cap">'+t.t+'</span></div>';}).join('')+'</div>';
    const stS=document.createElement('style');
    stS.textContent='.comunes-side-wrap{display:grid!important;grid-template-columns:.72fr 1.28fr;gap:34px;margin-top:40px;align-items:start}.cs-list{display:flex;flex-direction:column;border-top:1px solid var(--line)}.cs-item{display:flex;align-items:center;gap:14px;padding:18px 6px;border-bottom:1px solid var(--line);text-align:left;transition:color .15s,padding .2s}.cs-n{font-family:\'Sora\';font-weight:700;font-size:12px;color:var(--violet-tint-2);letter-spacing:.06em}.cs-t{font-family:\'Sora\';font-weight:700;font-size:17px;color:var(--ink-3);flex:1;transition:color .15s}.cs-ar{width:17px;height:17px;color:var(--violet);opacity:0;transform:translateX(-6px);transition:all .2s}.cs-item:hover .cs-t{color:var(--ink-2)}.cs-item.on{padding-left:14px}.cs-item.on .cs-n{color:var(--violet)}.cs-item.on .cs-t{color:var(--ink)}.cs-item.on .cs-ar{opacity:1;transform:none}.cs-stage{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:16/11;min-height:440px;background:var(--bg)}.cs-slide{position:absolute;inset:0;opacity:0;transform:scale(1.02);transition:opacity .35s,transform .5s}.cs-slide.on{opacity:1;transform:none}.cs-slide img{width:100%;height:100%;object-fit:cover;display:block}.cs-slide::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 62%,rgba(20,15,30,.72))}.cs-cap{position:absolute;z-index:2;left:26px;bottom:24px;color:#fff;font-family:\'Sora\';font-weight:700;font-size:20px}@media(max-width:860px){.comunes-side-wrap{grid-template-columns:1fr;gap:22px}.cs-stage{aspect-ratio:4/3;min-height:0;order:-1}.cs-t{font-size:15px}.cs-item{padding:14px 4px}}';
    document.head.appendChild(stS);
    const items=[...cg.querySelectorAll('.cs-item')], slides=[...cg.querySelectorAll('.cs-slide')];
    const showCS=(i)=>{items.forEach((b,j)=>b.classList.toggle('on',j===i));slides.forEach((s,j)=>s.classList.toggle('on',j===i));};
    items.forEach(b=>{const i=+b.dataset.i;b.addEventListener('click',()=>showCS(i));b.addEventListener('mouseenter',()=>showCS(i));});
    if(window.lucide) lucide.createIcons();
  } else if(p.comunesTabs && p.comunesTabs.length){
    cg.classList.remove('comunes-accordion');
    cg.classList.add('comunes-tabs-wrap');
    const tabsNav=document.createElement('div'); tabsNav.className='ctabs-nav';
    const stage=document.createElement('div'); stage.className='ctabs-stage';
    p.comunesTabs.forEach((t,i)=>{
      const src = t.src.indexOf('/')>=0 ? t.src : 'assets/proy/'+t.src;
      GAL.push(src);
      const gi = GAL.length-1;
      const btn=document.createElement('button'); btn.className='ctab'+(i===0?' on':''); btn.textContent=t.t;
      btn.addEventListener('click',()=>showTab(i));
      tabsNav.appendChild(btn);
      const sl=document.createElement('div'); sl.className='cslide'+(i===0?' on':'');
      sl.innerHTML=`<img src="${src}" alt="${t.t}" loading="lazy">`;
      sl.addEventListener('click',()=>openLb(gi));
      stage.appendChild(sl);
    });
    const prevBtn=document.createElement('button'); prevBtn.className='ctab-arrow ctab-prev'; prevBtn.innerHTML='<i data-lucide="chevron-left" class="ico"></i>';
    const nextBtn=document.createElement('button'); nextBtn.className='ctab-arrow ctab-next'; nextBtn.innerHTML='<i data-lucide="chevron-right" class="ico"></i>';
    stage.appendChild(prevBtn); stage.appendChild(nextBtn);
    let cur=0;
    function showTab(i){
      cur=(i+p.comunesTabs.length)%p.comunesTabs.length;
      tabsNav.querySelectorAll('.ctab').forEach((b,j)=>b.classList.toggle('on',j===cur));
      stage.querySelectorAll('.cslide').forEach((s,j)=>s.classList.toggle('on',j===cur));
    }
    prevBtn.addEventListener('click',()=>showTab(cur-1));
    nextBtn.addEventListener('click',()=>showTab(cur+1));
    cg.appendChild(tabsNav); cg.appendChild(stage);
    const stT=document.createElement('style');
    stT.textContent='.ctabs-nav{display:flex;gap:30px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-top:36px;padding-bottom:0}.ctab{font-family:\'Sora\';font-weight:700;font-size:17px;color:var(--ink-3);padding:0 2px 14px;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s}.ctab.on{color:var(--ink);border-color:var(--violet)}.ctabs-stage{position:relative;width:100%;margin-top:24px;border-radius:18px;overflow:hidden;aspect-ratio:16/8;min-height:420px;background:var(--bg)}.cslide{position:absolute;inset:0;opacity:0;transition:opacity .3s;cursor:pointer}.cslide.on{opacity:1}.cslide img{width:100%;height:100%;object-fit:cover;display:block}.ctab-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.94);box-shadow:var(--shadow-md);display:grid;place-items:center;color:var(--ink)}.ctab-arrow:hover{background:#fff;color:var(--violet-d)}.ctab-prev{left:18px}.ctab-next{right:18px}@media(max-width:680px){.ctabs-nav{gap:16px}.ctab{font-size:14px}.ctabs-stage{aspect-ratio:4/3.2;min-height:0}}';
    document.head.appendChild(stT);
    if(window.lucide) lucide.createIcons();
  } else {
  (p.comunesFotos||[]).forEach((cf,i)=>{
    const src = cf.src.indexOf('/')>=0 ? cf.src : 'assets/proy/'+cf.src;
    GAL.push(src);
    const gi = GAL.length-1;
    const d=document.createElement('div'); d.className='cacc'+(i===0?' on':'');
    d.style.backgroundImage=`url('${src}')`;
    d.innerHTML=`<span class="cacc-cap"><b>${cf.t}</b></span>`;
    d.addEventListener('mouseenter',()=>{ cg.querySelectorAll('.cacc').forEach(x=>x.classList.remove('on')); d.classList.add('on'); });
    d.addEventListener('click',()=>openLb(gi));
    cg.appendChild(d);
  });
  }
  // sección Seguridad (tabs con ícono + lista)
  if(p.seguridad && p.seguridad.length){
    const SG = p.seguridad;
    const secHtml = '<section class="sec" id="seguridad"><div class="wrap">'+
      '<h2 style="text-align:left">'+(p.seguridadTitulo||'Seguridad con la mejor tecnología')+'</h2>'+
      '<div class="sg-top"><div class="sg-nav">'+SG.map((s,i)=>'<button class="sg-tab'+(i===0?' on':'')+'" data-i="'+i+'">'+s.t+'</button>').join('')+'</div>'+
      '<div class="sg-arrows"><button class="sg-arrow" id="sgPrev"><i data-lucide="chevron-left" class="ico"></i></button><button class="sg-arrow" id="sgNext"><i data-lucide="chevron-right" class="ico"></i></button></div></div>'+
      '<div class="sg-stage">'+SG.map((s,i)=>'<div class="sg-panel'+(i===0?' on':'')+'" data-i="'+i+'"><div class="sg-ic"><img src="'+s.img+'" alt="'+s.t+'" loading="lazy"></div><div class="sg-tx"><h3>'+s.t+'</h3><ul>'+s.items.map(it=>'<li>'+it+'</li>').join('')+'</ul></div></div>').join('')+'</div>'+
      '</div></section>';
    const ub=document.getElementById('ubicacion');
    if(ub) ub.insertAdjacentHTML('beforebegin', secHtml);
    const stSg=document.createElement('style');
    stSg.textContent='.sg-top{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-top:26px}.sg-nav{display:flex;gap:30px;flex-wrap:wrap}.sg-tab{font-family:\'Sora\';font-weight:700;font-size:16px;color:var(--ink-3);padding:0 2px 14px;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s}.sg-tab.on{color:var(--ink);border-color:var(--violet)}.sg-arrows{display:flex;gap:10px;padding-bottom:10px}.sg-arrow{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--ink-2)}.sg-arrow:hover{border-color:var(--violet);color:var(--violet-d)}.sg-arrow .ico{width:17px;height:17px}.sg-stage{position:relative;margin-top:20px;background:var(--bg);border-radius:18px;min-height:0}.sg-panel{display:none;grid-template-columns:.55fr 1.45fr;gap:30px;align-items:center;padding:26px 32px}.sg-panel.on{display:grid}.sg-ic{display:grid;place-items:center}.sg-ic img{width:100%;max-width:140px;height:auto;display:block;opacity:.9}.sg-tx h3{font-family:\'Sora\';font-weight:700;font-size:18px;margin-bottom:12px}.sg-tx ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:7px}.sg-tx li{font-size:14.5px;color:var(--ink-2);line-height:1.5}@media(max-width:860px){.sg-panel{grid-template-columns:1fr;gap:14px;padding:22px 18px}.sg-ic img{max-width:100px}.sg-nav{gap:16px}.sg-tab{font-size:14px}.sg-stage{min-height:0}}';
    document.head.appendChild(stSg);
    let sgCur=0;
    const sgTabs=[...document.querySelectorAll('.sg-tab')], sgPanels=[...document.querySelectorAll('.sg-panel')];
    const showSg=(i)=>{sgCur=(i+SG.length)%SG.length;sgTabs.forEach((t,j)=>t.classList.toggle('on',j===sgCur));sgPanels.forEach((s,j)=>s.classList.toggle('on',j===sgCur));};
    sgTabs.forEach(t=>t.addEventListener('click',()=>showSg(+t.dataset.i)));
    document.getElementById('sgPrev').addEventListener('click',()=>showSg(sgCur-1));
    document.getElementById('sgNext').addEventListener('click',()=>showSg(sgCur+1));
    if(window.lucide) lucide.createIcons();
  }

  if(p.videoMp4){
    const vHtml='<section class="sec" id="video-proy"><div class="wrap"><h2>'+(p.videoTitulo||'Video del proyecto')+'</h2><div style="margin-top:28px;border-radius:18px;overflow:hidden;background:#000;box-shadow:var(--shadow-md)"><video src="'+p.videoMp4+'" controls playsinline preload="metadata" poster="'+(p.heroImg||'')+'" style="width:100%;display:block;max-height:78vh"></video></div></div></section>';
    const anc=document.getElementById('comodidades');
    if(anc) anc.insertAdjacentHTML('beforebegin', vHtml);
  }
  $('#ubicLead').textContent = p.ubicLead || `${p.name} se ubica en ${p.address||p.commune}.`;
  if(p.ubicTitulo && $('#ubicTitulo')) $('#ubicTitulo').textContent = p.ubicTitulo;
  const near=$('#near');
  (p.cerca||[]).forEach(n=> near.insertAdjacentHTML('beforeend', `<div class="n"><i data-lucide="map-pin" class="ico"></i>${n}</div>`));
  if(!(p.cerca||[]).length) near.style.display='none';
  (function(){
    const mapEl=$('#ubicMap'); if(!mapEl) return;
    if(!p.lat || !p.lng){ mapEl.style.display='none'; return; }
    const q=`${p.lat},${p.lng}`;
    mapEl.innerHTML=`<div class="ubic-map-inner">
        <iframe src="https://maps.google.com/maps?ll=${q}&amp;z=16&amp;hl=es&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa ${p.name}"></iframe>
        <span class="ubic-pin"><i data-lucide="map-pin" class="ico"></i></span>
      </div>`;
    const lk=$('#ubicLinks');
    if(lk) lk.innerHTML=`<a href="https://www.google.es/maps?q=${q}" target="_blank" rel="noopener">Ver en Google Maps</a><a href="https://waze.com/ul?ll=${q}&navigate=yes" target="_blank" rel="noopener">Ir con Waze</a>`;
    const stU=document.createElement('style');
    stU.textContent='.ubic-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:44px;align-items:start;margin-top:30px}.ubic-tx .lead{text-align:left;margin:0;max-width:54ch}.ubic-tx .near{justify-content:flex-start;margin-top:26px}.ubic-links{display:flex;gap:26px;margin-top:28px;flex-wrap:wrap}.ubic-links a{font-family:\'Sora\';font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--violet-d);border-bottom:2px solid var(--violet-tint-2);padding-bottom:4px}.ubic-links a:hover{border-color:var(--violet)}.ubic-map-inner{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);aspect-ratio:16/12;background:var(--bg)}.ubic-map-inner iframe{width:100%;height:100%;border:0;display:block;filter:saturate(.9)}.ubic-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:2;width:44px;height:44px;border-radius:50% 50% 50% 6px;background:var(--violet);rotate:-45deg;display:grid;place-items:center;box-shadow:0 10px 22px rgba(124,58,237,.45);pointer-events:none}.ubic-pin .ico{rotate:45deg;color:#fff;width:22px;height:22px}@media(max-width:860px){.ubic-grid{grid-template-columns:1fr;gap:26px}.ubic-map-inner{aspect-ratio:4/3.4}}';
    document.head.appendChild(stU);
    if(window.lucide) lucide.createIcons();
  })();
  if(p.mapaImg){
    const ubic=document.getElementById('ubicacion');
    if(ubic){
      const wrap=ubic.querySelector('.wrap');
      const mapEl=document.createElement('div'); mapEl.className='ubic-map';
      mapEl.innerHTML='<img src="'+p.mapaImg+'" alt="Ubicación '+p.name+'" loading="lazy">';
      const um=document.getElementById('ubicMap');
      if(um){ um.style.display=''; um.innerHTML=''; um.appendChild(mapEl); mapEl.style.margin='0'; }
      else { const near=document.getElementById('near'); if(near && near.parentNode===wrap) wrap.insertBefore(mapEl, near); else wrap.appendChild(mapEl); }
      const stM=document.createElement('style');
      stM.textContent='.ubic-map{border-radius:18px;overflow:hidden;margin:30px auto 0;max-width:900px;box-shadow:var(--shadow-md)}.ubic-map img{display:block;width:100%;height:auto}';
      document.head.appendChild(stM);
    }
  }

  // price bar
  if(p.cercaFotos && p.cercaFotos.length){
    const ub=document.querySelector('#ubicacion .wrap');
    if(ub){
      ub.insertAdjacentHTML('beforeend','<div class="cf-grid">'+p.cercaFotos.map(c=>'<figure class="cf"><img src="'+c.src+'" alt="'+c.t+'" loading="lazy"><figcaption>'+c.t+'</figcaption></figure>').join('')+'</div>');
      const sc=document.createElement('style');
      sc.textContent='.cf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:34px}.cf{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:4/3;margin:0}.cf img{width:100%;height:100%;object-fit:cover;display:block}.cf::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 50%,rgba(20,15,30,.75))}.cf figcaption{position:absolute;z-index:2;left:14px;right:14px;bottom:12px;color:#fff;font-family:Sora;font-weight:700;font-size:14px}@media(max-width:860px){.cf-grid{grid-template-columns:1fr 1fr;gap:10px}.cf figcaption{font-size:12.5px}}';
      document.head.appendChild(sc);
    }
  }
  if(p.ubicSplit){
    const sec=document.getElementById('ubicacion');
    if(sec){
      const U=p.ubicSplit;
      sec.classList.add('ubic-split');
      sec.innerHTML='<div class="us-media"><img class="us-bg" src="'+U.img+'" alt="Entorno '+p.name+'">'+(U.persona?'<img class="us-persona" src="'+U.persona+'" alt="">':'')+'</div>'+
        '<div class="us-tx"><h2><span>'+U.t1+'</span><b>'+U.t2+'</b></h2>'+
        (U.lead?'<p class="us-lead">'+U.lead+'</p>':'')+(U.parrafos||[]).map(x=>'<p>'+x+'</p>').join('')+
        '<div class="us-grid">'+(p.cercaFotos||[]).map(c=>'<figure><img src="'+c.src+'" alt="'+c.t+'" loading="lazy"><figcaption>'+c.t+'</figcaption></figure>').join('')+'</div></div>';
      const su=document.createElement('style');
      su.textContent='#ubicacion.ubic-split{display:grid;grid-template-columns:.62fr 1fr;gap:56px;padding:0;background:#ede9e6;overflow:hidden;align-items:stretch}.us-media{position:relative;min-height:640px}.us-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:left top}.us-persona{position:absolute;right:4%;bottom:0;height:78%;width:auto;max-width:none;object-fit:contain;z-index:2}.us-tx{padding:64px 56px 64px 0}.us-tx h2{text-align:left;text-transform:uppercase;line-height:1.1}.us-tx h2 span{display:block;font-weight:300;font-size:clamp(26px,3vw,40px)}.us-tx h2 b{display:block;font-weight:800;font-size:clamp(26px,3vw,40px)}.us-lead{font-weight:700;color:var(--ink);margin-top:26px}.us-tx p{font-size:16px;color:var(--ink-2);line-height:1.7;margin-top:16px}.us-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px 24px;margin-top:40px}.us-grid figure{margin:0}.us-grid img{width:100%;aspect-ratio:1.9/1;object-fit:cover;display:block}.us-grid figcaption{text-align:center;font-size:12.5px;font-weight:700;color:var(--ink);margin-top:8px}@media(max-width:900px){#ubicacion.ubic-split{grid-template-columns:1fr;gap:0}.us-media{min-height:420px}.us-persona{height:72%;right:6%}.us-tx{padding:36px 20px 44px}.us-grid{grid-template-columns:1fr 1fr;gap:14px}}';
      document.head.appendChild(su);
    }
  }
  $('#pbPrice').textContent = 'UF ' + nf.format(p.desdeUF||0);
  $('#pbReserva').textContent = p.reserva || '$100.000';
  if(p.off){ $('#pbOff').textContent = p.off+'%'; const bd=$('#pbBadge'); bd.textContent=p.off+'% OFF'; bd.style.display=''; } else { $('#pbOffWrap').style.display='none'; }

  // WhatsApp
  const wa = p.wa || '56944637680';
  const msg = encodeURIComponent(`Hola, me interesa el proyecto ${p.name} (${p.address||p.commune}), desde UF ${nf.format(p.desdeUF||0)}. ¿Me pueden dar más información?`);
  const href = 'https://wa.me/'+wa+'?text='+msg;
  const cotHref='Cotizacion - Corretaje Guzman.html?slug='+encodeURIComponent(slug);
  const cta=$('#ctaWa'); if(cta){cta.href=href;cta.setAttribute('target','_blank');
    if(!document.getElementById('ctaCot')){
      const b=document.createElement('a');
      b.id='ctaCot'; b.className='btn btn-violet'; b.href=cotHref;
      b.innerHTML='<i data-lucide="file-text" class="ico"></i>Cotizar proyecto';
      cta.className='btn btn-dark'; cta.insertAdjacentElement('beforebegin', b);
      const row=cta.parentElement; if(row) row.style.cssText='display:flex;gap:12px;justify-content:center;flex-wrap:wrap';
    }
  }
  const bar=$('#barWa'); if(bar){bar.href=cotHref;bar.removeAttribute('target');bar.textContent='Cotizar proyecto';}
  const waAlt=document.getElementById('ctaWaAlt'); if(waAlt) waAlt.href=href;

  /* cg_wa_rotador: reparte los clics entre los WhatsApp del proyecto */
  (function(){
    const WAS=(p.whatsapps&&p.whatsapps.length)?p.whatsapps:[wa];
    if(WAS.length<2) return;
    const KEY='cg_wa_turno';
    document.addEventListener('click',function(ev){
      const a=ev.target.closest('a[href*="wa.me/"]'); if(!a) return;
      let i=0; try{ i=parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){}
      a.href=a.href.replace(/wa\.me\/\d+/, 'wa.me/'+WAS[i%WAS.length]);
      try{ localStorage.setItem(KEY,String((i+1)%WAS.length)); }catch(e){}
    }, true);
  })();

  // lightbox
  const lb=$('#lb'), lbImg=$('#lbImg'); let cur=0;
  window.openLb=function(i){cur=i;show();lb.classList.add('open');document.body.style.overflow='hidden';};
  function show(){cur=(cur+GAL.length)%GAL.length;lbImg.src=GAL[cur];}
  $('#lbClose').onclick=()=>{lb.classList.remove('open');document.body.style.overflow='';};
  $('#lbPrev').onclick=()=>{cur--;show();};
  $('#lbNext').onclick=()=>{cur++;show();};
  lb.addEventListener('click',e=>{if(e.target===lb){lb.classList.remove('open');document.body.style.overflow='';}});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')$('#lbClose').click();if(e.key==='ArrowLeft'){cur--;show();}if(e.key==='ArrowRight'){cur++;show();}});

  // subnav scroll-spy
  const links=[...document.querySelectorAll('.subnav-in a')];
  const ids=links.map(l=>l.getAttribute('href').slice(1));
  window.addEventListener('scroll',()=>{
    const y=scrollY+150; let best=links[0];
    ids.forEach((id,i)=>{const el=document.getElementById(id);if(el&&el.offsetTop<=y)best=links[i];});
    links.forEach(l=>l.classList.toggle('on',l===best));
  });

  if(window.lucide) lucide.createIcons();
})();
