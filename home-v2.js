import {esc} from '/seo-core.mjs';
import {homeProperties,rentalCard,projectCards,selectHomeRentals} from '/home-render.mjs';
/* Home v2 — Corretaje Guzmán (arriendos primero) */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const nf=new Intl.NumberFormat('es-CL');
  let initial={};try{initial=JSON.parse(document.getElementById('home-catalog-data')?.textContent||'{}');}catch{}
  let ARR=homeProperties(initial.properties).filter(p=>p.operation==='arriendo');
  let ufValue=Number(initial.uf?.value);
  const PRO=(initial.projects||window.PROYECTOS||[]).filter(p=>p.activa!==false);
  let REV=[];
  async function getJSON(url){
    try{
      const ctrl=new AbortController(); const tm=setTimeout(()=>ctrl.abort(),20000);
      const r=await fetch(url,{headers:{accept:'application/json'},signal:ctrl.signal}); clearTimeout(tm);
      if(!r.ok) return null; return await r.json();
    }catch(e){ return null; }
  }


  /* hero + arriendos (Airtable) */
  let fc='Todas', refreshing=true, refreshFailed=false, VEN=homeProperties(initial.properties).filter(p=>p.operation==='venta').length;
  function setupArr(){
    const comunas=[...new Set(ARR.map(p=>p.commune).filter(Boolean))].sort();
    $('#stTotal').textContent=ARR.length+VEN;
    $('#stArr').textContent=ARR.length;
    $('#stVen').textContent=VEN;
    const chips=['Todas'].concat(comunas.slice(0,6));
    if(!chips.includes(fc)) fc='Todas';
    $('#arrChips').innerHTML=chips.length>1?chips.map(c=>'<button class="chip'+(c===fc?' on':'')+'" data-c="'+esc(c)+'">'+esc(c)+'</button>').join(''):'';
    $('#arrChips').querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
      fc=b.dataset.c; $('#arrChips').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b)); renderArr();
    }));
    renderArr();
  }
  function renderArr(){
    const all=ARR.filter(p=>fc==='Todas'||p.commune===fc);
    const L=selectHomeRentals(all,ufValue);
    $('#arrGrid').innerHTML=L.length?L.map((p,i)=>rentalCard(p,i)).join(''):'<div class="arr-empty"><i data-lucide="home" class="ico"></i><b>Estamos actualizando nuestras propiedades</b><span>Escríbenos por WhatsApp y te contamos qué tenemos disponible hoy.</span><a class="btn btn-violet" href="https://wa.me/56944637680">Consultar por WhatsApp</a></div>';
    const cnt=$('#arrCount');
    if(cnt) cnt.textContent='Mostrando '+L.length+' de '+all.length+' arriendos'+(fc==='Todas'?'':' en '+fc)+(refreshing?' · verificando disponibilidad':refreshFailed?' · disponibilidad por confirmar':'');
    if(window.lucide) lucide.createIcons();
  }
  if(ARR.length) setupArr();

  /* búsqueda (igual al original) */
  function goSearch(mapa){
    const op=$('#fOp').value, tipo=$('#fTipo').value, com=$('#fComuna').value.trim(), q=new URLSearchParams();
    if(tipo) q.set('tipo',tipo); if(com) q.set('comuna',com); if(mapa) q.set('vista','mapa');
    const page=mapa?'/arriendos':(tipo==='Parcela'?'/parcelas':(op==='venta'?'/comprar':'/arriendos'));
    location.href=page+(q.toString()?'?'+q:'');
  }
  $('#srch').addEventListener('submit',e=>{e.preventDefault();goSearch(false);});
  $('#searchMap').addEventListener('click',()=>goSearch(true));

  if(!$('#projGrid').children.length) $('#projGrid').innerHTML=projectCards(PRO);

  /* carrusel proyectos */
  (function(){
    const t=$('#projGrid'); if(!t) return;
    const wrap=t.parentElement;
    if(!$('#pNav')){
      t.insertAdjacentHTML('afterend','<div class="pnav" id="pNav"><div class="pdots" id="pDots"></div><div class="parr"><button type="button" id="pPrev" aria-label="Anterior"><i data-lucide="chevron-left" class="ico"></i></button><button type="button" id="pNext" aria-label="Siguiente"><i data-lucide="chevron-right" class="ico"></i></button></div></div>');
    }
    const cards=[...t.children], dots=$('#pDots');
    const step=()=>{const c=cards[0];return c?c.getBoundingClientRect().width+16:300;};
    const pages=()=>Math.max(1,Math.ceil((t.scrollWidth-t.clientWidth)/step())+1);
    function drawDots(){ const n=pages(); dots.innerHTML=Array.from({length:n},(_,i)=>'<i data-i="'+i+'"></i>').join(''); dots.querySelectorAll('i').forEach(d=>d.addEventListener('click',()=>goTo(+d.dataset.i))); sync(); }
    function sync(){ const i=Math.round(t.scrollLeft/step()); if(t.style.scrollSnapType!=='none') curI=i; [...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i)); $('#pPrev').disabled=t.scrollLeft<4; $('#pNext').disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4; }
    let curI=0;
    const idx=()=>curI;
    let anim;
    const goTo=(i)=>{
      const max=Math.max(0,cards.length-1); curI=Math.min(max,Math.max(0,i));
      const c=cards[curI]; if(!c) return;
      const to=Math.min(c.offsetLeft-cards[0].offsetLeft, t.scrollWidth-t.clientWidth);
      const from=t.scrollLeft, dist=to-from, dur=420, t0=performance.now();
      cancelAnimationFrame(anim);
      t.style.scrollSnapType='none';
      const ease=x=>1-Math.pow(1-x,3);
      const tick=now=>{
        const k=Math.min(1,(now-t0)/dur);
        t.scrollLeft=from+dist*ease(k);
        if(k<1) anim=requestAnimationFrame(tick);
        else { t.scrollLeft=to; t.style.scrollSnapType=''; sync(); }
      };
      anim=requestAnimationFrame(tick);
    };
    $('#pPrev').addEventListener('click',()=>goTo(curI-1));
    $('#pNext').addEventListener('click',()=>goTo(curI+1));
    let raf; t.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sync);},{passive:true});
    let down=false,sx=0,sl=0,moved=0;
    t.addEventListener('mousedown',e=>{down=true;moved=0;sx=e.pageX;sl=t.scrollLeft;t.classList.add('drag');});
    window.addEventListener('mouseup',()=>{if(!down)return;down=false;t.classList.remove('drag');});
    t.addEventListener('mousemove',e=>{if(!down)return;e.preventDefault();moved=Math.abs(e.pageX-sx);t.scrollLeft=sl-(e.pageX-sx);});
    t.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation();}},true);
    window.addEventListener('resize',drawDots);
    drawDots();
  })();

  /* reseñas (Airtable) */
  function renderRev(){
    const g=$('#revGrid'); if(!g) return;
    const L=REV.filter(r=>r&&r.text).slice(0,3);
    if(!L.length){ const s=g.closest('section'); if(s) s.style.display='none'; return; }
    const ini=n=>String(n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
    g.innerHTML=L.map(r=>{
      const n=Math.max(1,Math.min(5,Math.round(Number(r.rating)||5)));
      const av='<span class="av">'+esc(ini(r.name))+'</span>'+(r.photo?'<img src="'+esc(r.photo)+'" alt="'+esc(r.name)+'" loading="lazy">':'');
      return '<div class="rc"><div class="st">'+'★'.repeat(n)+'</div><p>“'+esc(r.text)+'”</p><div class="who">'+av+'<b>'+esc(r.name)+'</b></div></div>';
    }).join('');
    g.querySelectorAll('.who img').forEach(img=>{img.previousElementSibling.style.display='none';img.addEventListener('error',()=>{img.previousElementSibling.style.display='';img.remove();});});
  }
  $('#revGrid').innerHTML='';

  /* carga de datos */
  (async function(){
    getJSON('/api/uf-actual').then(uf=>{if(Number.isFinite(Number(uf?.value))&&Number(uf.value)>0){ufValue=Number(uf.value);if(ARR.length)renderArr();}});
    getJSON('/api/reviews').then(revs=>{REV=revs?(Array.isArray(revs)?revs:(revs.reviews||[])):[];renderRev();});
    const props=await getJSON('/api/properties?summary=home')||await getJSON('/api/properties?summary=home');
    if(!props || props.complete===false || !Array.isArray(props.properties)){
      refreshing=false; refreshFailed=true;
      if(ARR.length) renderArr();
      if(!ARR.length) $('#arrGrid').innerHTML='<div class="arr-empty"><b>No pudimos cargar las propiedades en este momento.</b><a class="btn btn-violet" href="/arriendos">Ver arriendos disponibles</a></div>';
      return;
    }
    const records=props?(Array.isArray(props)?props:(props.propiedades||props.properties||props.records||[])):[];
    const P=homeProperties(records);
    const cached=new Map((initial.properties||[]).map(p=>[p.id,p]));
    for(const p of P){const old=cached.get(p.id);if(old?.photoKey && old.photoKey===p.photoKey)p.coverPhoto=old.coverPhoto;}
    ARR=P.filter(p=>String(p.operation||'').toLowerCase()==='arriendo' && p.activa!==false && !/rentando/i.test(p.source||''));
    VEN=P.filter(p=>String(p.operation||'').toLowerCase()==='venta').length;
    refreshing=false;
    setupArr();
    if(window.lucide) lucide.createIcons();
  })();

  if(window.lucide) lucide.createIcons();
})();

// Alternate the two existing advisors without changing the shared header.
document.addEventListener('click',ev=>{
 const a=ev.target.closest('a[href*="wa.me/"]');if(!a)return;
 const nums=['56944637680','56944717233'];let i=0;
 try{i=Number(localStorage.getItem('cg_wa_turno'))||0;localStorage.setItem('cg_wa_turno',String((i+1)%2));}catch{}
 a.href=a.href.replace(/wa\.me\/\d+/,'wa.me/'+nums[i%2]);
},true);
