import {esc, propertyPath, isPublic, isAvailable, priceText} from '/seo-core.mjs';
/* Home v2 — Corretaje Guzmán (arriendos primero) */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const nf=new Intl.NumberFormat('es-CL');
  let ARR=[];
  const PRO=(window.PROYECTOS||[]).filter(p=>p.activa!==false);
  let REV=[];
  async function getJSON(url){
    try{
      const ctrl=new AbortController(); const tm=setTimeout(()=>ctrl.abort(),20000);
      const r=await fetch(url,{headers:{accept:'application/json'},signal:ctrl.signal}); clearTimeout(tm);
      if(!r.ok) return null; return await r.json();
    }catch(e){ return null; }
  }


  /* hero + arriendos (Airtable) */
  let fc='Todas', VEN=0;
  function setupArr(){
    const comunas=[...new Set(ARR.map(p=>p.commune).filter(Boolean))].sort();
    $('#stTotal').textContent=ARR.length+VEN;
    $('#stArr').textContent=ARR.length;
    $('#stVen').textContent=VEN;
    const chips=['Todas'].concat(comunas.slice(0,6));
    $('#arrChips').innerHTML=chips.length>1?chips.map((c,i)=>'<button class="chip'+(i===0?' on':'')+'" data-c="'+esc(c)+'">'+esc(c)+'</button>').join(''):'';
    $('#arrChips').querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
      fc=b.dataset.c; $('#arrChips').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b)); renderArr();
    }));
    renderArr();
  }
  const isPromo=p=>/50\s*%/.test(p.promo||'');
  function card(p,ft){
    const img=(p.photos&&p.photos[0])||p.coverPhoto||'/assets/home-v2/hero.jpg';
    const promo=isPromo(p);
    const precio=promo?p.priceValue/2:p.priceValue;
    const banos=p.bathrooms||0;
    return '<a class="ac'+(ft?' ft':'')+'" href="'+esc(propertyPath(p))+'">'+
      '<div class="ph"><img src="'+esc(img)+'" alt="'+esc(p.title)+'" loading="lazy">'+(promo?'<span class="promo">50% primer mes</span>':'')+'</div>'+
      (ft?'<span class="lbl">Destacado</span>':'')+
      '<div class="bd"><div class="pr">'+priceText({...p,priceValue:precio})+' <small>'+(promo?'1er mes':'/ mes')+'</small></div>'+
      '<h3>'+esc(p.title)+'</h3><span class="cm"><i data-lucide="map-pin" class="ico"></i>' +esc(p.commune||'')+'</span>'+
      '<div class="sp"><span><i data-lucide="bed-double" class="ico"></i>'+esc(p.bedrooms||'—')+' dorm</span><span><i data-lucide="bath" class="ico"></i>'+esc(banos||'—')+' baño'+(banos>1?'s':'')+'</span>'+(p.usableArea?'<span><i data-lucide="ruler" class="ico"></i>' +esc(p.usableArea)+' m²</span>':'')+'</div></div></a>';
  }
  function renderArr(){
    const all=ARR.filter(p=>fc==='Todas'||p.commune===fc);
    const ordered=[...all].sort((a,b)=>(isPromo(b)?1:0)-(isPromo(a)?1:0));
    const L=ordered.slice(0,6);
    $('#arrGrid').innerHTML=L.length?L.map(p=>card(p,false)).join(''):'<div class="arr-empty"><i data-lucide="home" class="ico"></i><b>Estamos actualizando nuestras propiedades</b><span>Escríbenos por WhatsApp y te contamos qué tenemos disponible hoy.</span><a class="btn btn-violet" href="https://wa.me/56944637680">Consultar por WhatsApp</a></div>';
    const cnt=$('#arrCount');
    if(cnt) cnt.textContent=all.length+(all.length===1?' propiedad':' propiedades')+(fc==='Todas'?' disponibles':' en '+fc);
    if(window.lucide) lucide.createIcons();
  }
  $('#arrGrid').innerHTML='<div class="arr-empty"><span class="spin"></span><b>Cargando propiedades…</b></div>';

  /* búsqueda (igual al original) */
  function goSearch(mapa){
    const op=$('#fOp').value, tipo=$('#fTipo').value, com=$('#fComuna').value.trim(), q=new URLSearchParams();
    if(tipo) q.set('tipo',tipo); if(com) q.set('comuna',com); if(mapa) q.set('vista','mapa');
    const page=mapa?'/arriendos':(tipo==='Parcela'?'/parcelas':(op==='venta'?'/comprar':'/arriendos'));
    location.href=page+(q.toString()?'?'+q:'');
  }
  $('#srch').addEventListener('submit',e=>{e.preventDefault();goSearch(false);});
  $('#searchMap').addEventListener('click',()=>goSearch(true));

  /* proyectos */
  const projectImage=p=>p.image||'/assets/opt/proyecto-'+({'best-too-santiago':'best-too','hometown-santiago':'hometown','onetown-santiago':'onetown','residential-park-santiago':'residential-park-stgo'}[p.slug]||p.slug)+'.jpg';
  const BADGE={inmediata:['Entrega inmediata','#1f8a5b'],futura:['Entrega futura','#5b7088'],verde:['Venta en verde','#7c3aed'],ultimas:['Últimas unidades','#c0182a']};
  const minUF=Math.min(...PRO.map(p=>p.desdeUF||Infinity));
  $('#projSub').textContent=PRO.length+' proyectos desde UF '+nf.format(minUF)+', con pie financiado y subsidio a la tasa.';
  const pick=[...PRO].sort((a,b)=>(a.entrega==='inmediata'?0:1)-(b.entrega==='inmediata'?0:1)||a.desdeUF-b.desdeUF).slice(0,10);
  $('#projGrid').innerHTML=pick.map(p=>{
    const b=BADGE[p.entrega];
    return '<a class="pc" href="'+esc(p.detalle||'/proyectos/')+'">'+
      '<div class="ph"><img src="'+esc(projectImage(p))+'" alt="'+esc(p.name)+'" loading="lazy">'+(b?'<span class="bdg" style="background:'+b[1]+'">'+b[0]+'</span>':'')+'</div>'+
      '<div class="bd"><h3>'+esc(p.name)+'</h3><span class="cm">'+esc(p.commune)+'</span><div class="uf">Desde UF '+nf.format(p.desdeUF)+'</div></div></a>';
  }).join('');

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
    getJSON('/api/reviews').then(revs=>{REV=revs?(Array.isArray(revs)?revs:(revs.reviews||[])):[];renderRev();});
    const props=await getJSON('/api/properties')||await getJSON('/api/properties');
    if(!props){
      $('#arrGrid').innerHTML='<div class="arr-empty"><b>No pudimos cargar las propiedades en este momento.</b><a class="btn btn-violet" href="/arriendos">Ver arriendos disponibles</a></div>';
      return;
    }
    const records=props?(Array.isArray(props)?props:(props.propiedades||props.properties||props.records||[])):[];
    const P=records.filter(p=>isPublic(p)&&isAvailable(p)&&p.activa!==false&&!/rentando/i.test(p.source||''));
    ARR=P.filter(p=>String(p.operation||'').toLowerCase()==='arriendo' && p.activa!==false && !/rentando/i.test(p.source||''));
    VEN=P.filter(p=>String(p.operation||'').toLowerCase()==='venta').length;
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
