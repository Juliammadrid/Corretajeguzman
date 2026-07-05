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

  document.title = p.name + ' · Corretaje Guzmán';
  $('#pName').textContent = p.name;
  $('#pAddr').textContent = p.address || p.commune || '';
  $('#descTitle').textContent = p.name;
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
  } else if(p.heroImg){ const bs=document.querySelector('.phero .bgslot'); if(bs){ bs.style.backgroundImage="url('"+p.heroImg+"')"; bs.style.backgroundSize="cover"; bs.style.backgroundPosition="center"; } const fb=document.querySelector('.phero .bgfallback'); if(fb) fb.style.display='none'; const h=$('#heroImg'); if(h) h.style.display='none'; }

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
    tipos.insertAdjacentHTML('beforebegin', html);
    const st4=document.createElement('style');
    st4.textContent='.depto-media{position:relative;width:100%;line-height:0}.depto-media img{display:block;width:100%;height:auto;max-height:640px;object-fit:cover}.depto-tag{position:absolute;left:0;bottom:0;background:rgba(255,255,255,.94);color:var(--ink);font-family:\'Sora\';font-weight:700;font-size:15px;letter-spacing:.14em;padding:14px 26px}.depto-band{background:linear-gradient(160deg,var(--violet-dd),var(--violet));color:#fff;padding:44px 0}.depto-band h2{font-family:\'Sora\';font-weight:800;font-size:clamp(20px,2.6vw,30px);letter-spacing:.03em;text-transform:uppercase;color:#fff}.depto-band h2 b{color:#e7dcfc}.depto-band .lead{color:rgba(255,255,255,.88)}.depto-band .lead i{opacity:.75;font-size:13.5px;display:block;margin-top:10px}@media(max-width:680px){.depto-media img{max-height:340px}.depto-tag{font-size:12.5px;padding:11px 18px}.depto-band{padding:30px 0}}';
    document.head.appendChild(st4);
  })();

  // tipologías
  const tip = $('#tipos');
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
  if(!(p.tipologias||[]).length) $('#tipologias').style.display='none';

  // galería
  const fotos = (p.fotos||[]).map(f=> f.indexOf('/')>=0 ? f : (/^assets\//.test(f)? f : 'assets/proy/'+f));
  if(p.heroImg && !fotos.length) fotos.push(p.heroImg);
  const gal = $('#gal'); let GAL=[];
  if(gal && !p.noGaleria){
    fotos.forEach((src,i)=>{
      GAL.push(src);
      const g=document.createElement('div'); g.className='g';
      g.innerHTML=`<div class="gfall"><i data-lucide="image" class="ico"></i></div><img src="${src}" alt="${p.name} ${i+1}" loading="eager" decoding="async" onload="this.style.opacity=1" onerror="this.style.display='none'">`;
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
  }

  // características
  const fl=$('#featList');
  (p.caracteristicas||[]).forEach(c=> fl.insertAdjacentHTML('beforeend', `<div class="f"><span class="ic"><i data-lucide="check" class="ico"></i></span>${c}</div>`));
  // comunes
  const ag=$('#amenGrid');
  (p.comunes||[]).forEach(c=> ag.insertAdjacentHTML('beforeend', `<div class="a"><i data-lucide="${c.ic||'check'}" class="ico"></i>${c.t}</div>`));
  if(!(p.caracteristicas||[]).length && !(p.comunes||[]).length) $('#comodidades').style.display='none';

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

  // ubicación
  $('#ubicLead').textContent = `${p.name} se ubica en ${p.address||p.commune}.`;
  const near=$('#near');
  (p.cerca||[]).forEach(n=> near.insertAdjacentHTML('beforeend', `<div class="n"><i data-lucide="map-pin" class="ico"></i>${n}</div>`));
  if(!(p.cerca||[]).length) near.style.display='none';
  if(p.mapaImg){
    const ubic=document.getElementById('ubicacion');
    if(ubic){
      const wrap=ubic.querySelector('.wrap');
      const mapEl=document.createElement('div'); mapEl.className='ubic-map';
      mapEl.innerHTML='<img src="'+p.mapaImg+'" alt="Ubicación '+p.name+'" loading="lazy">';
      wrap.insertBefore(mapEl, document.getElementById('near'));
      const stM=document.createElement('style');
      stM.textContent='.ubic-map{border-radius:18px;overflow:hidden;margin:30px auto 0;max-width:900px;box-shadow:var(--shadow-md)}.ubic-map img{display:block;width:100%;height:auto}';
      document.head.appendChild(stM);
    }
  }

  // price bar
  $('#pbPrice').textContent = 'UF ' + nf.format(p.desdeUF||0);
  $('#pbReserva').textContent = p.reserva || '$100.000';
  if(p.off){ $('#pbOff').textContent = p.off+'%'; const bd=$('#pbBadge'); bd.textContent=p.off+'% OFF'; bd.style.display=''; } else { $('#pbOffWrap').style.display='none'; }

  // WhatsApp
  const wa = p.wa || '56944637680';
  const msg = encodeURIComponent(`Hola, me interesa el proyecto ${p.name} (${p.address||p.commune}), desde UF ${nf.format(p.desdeUF||0)}. ¿Me pueden dar más información?`);
  const href = 'https://wa.me/'+wa+'?text='+msg;
  $('#ctaWa').href=href; $('#barWa').href=href;

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
