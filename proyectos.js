/* ============================================================
   Corretaje Guzmán — Proyectos en venta (Imagina) · render
   ============================================================ */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const nf = new Intl.NumberFormat('es-CL');
  const ALL = (window.PROYECTOS||[]).filter(p=>p.activa!==false);
  let comuna='todas', entrega='todas', sort='destacados';

  const BADGE = {
    inmediata:{t:'Entrega inmediata',c:'#1f8a5b'},
    verde:{t:'Venta en verde',c:'#7c3aed'},
    futura:{t:'Entrega futura',c:'#5b7088'},
    ultimas:{t:'Últimas unidades',c:'#c0182a'}
  };

  function card(p){
    const a=document.createElement('a');
    a.className='pcard';
    const hasFicha = window.PROYECTO_FICHAS && window.PROYECTO_FICHAS[p.slug];
    if(p.detalle) a.href=p.detalle;
    else if(hasFicha) a.href='/proyectos/'+p.slug+'/';
    else { a.href='https://wa.me/56944637680?text='+encodeURIComponent('Hola, quiero información del proyecto '+p.name+' ('+p.address+'). Desde UF '+nf.format(p.desdeUF)+'.'); a.target='_blank'; a.rel='noopener'; }
    const b=BADGE[p.entrega];
    a.innerHTML=`
      <div class="ph">
        <div class="ph-fallback"><i data-lucide="building-2" class="ico"></i><b>${p.name}</b><span>${p.commune}</span></div>
        <img src="${p.image}" alt="${p.name}" loading="eager" fetchpriority="high" decoding="async" onload="this.style.opacity=1" style="opacity:0;transition:opacity .35s ease" onerror="this.style.display='none'">
        ${b?`<span class="badge" style="background:${b.c}">${b.t}</span>`:''}
      </div>
      <div class="bd">
        <h3>${p.name}</h3>
        <div class="addr"><i data-lucide="map-pin" class="ico"></i>${p.address}</div>
        ${p.specs?`<div class="specs">${p.specs}</div>`:''}
        <div class="foot">
          <div><span class="dl">Desde</span><span class="uf">UF ${nf.format(p.desdeUF)}</span></div>
          <span class="go">Ver proyecto <i data-lucide="arrow-right" class="ico"></i></span>
        </div>
      </div>`;
    return a;
  }

  function apply(){
    let list=ALL.slice();
    if(comuna!=='todas') list=list.filter(p=>p.commune===comuna);
    if(entrega!=='todas') list=list.filter(p=>p.entrega===entrega);
    if(sort==='priceAsc') list.sort((a,b)=>a.desdeUF-b.desdeUF);
    else if(sort==='priceDesc') list.sort((a,b)=>b.desdeUF-a.desdeUF);
    else if(sort==='comuna') list.sort((a,b)=>a.commune.localeCompare(b.commune)||a.desdeUF-b.desdeUF);

    const wrap=$('#grid'); wrap.innerHTML='';
    if(sort==='destacados' || sort==='comuna'){
      // agrupar por comuna
      const order=['Ñuñoa','Providencia','Las Condes','Santiago Centro','San Joaquín','Macul','La Florida','Concón'];
      const groups={};
      list.forEach(p=>{(groups[p.commune]=groups[p.commune]||[]).push(p);});
      const comunas=Object.keys(groups).sort((a,b)=>{
        const ia=order.indexOf(a), ib=order.indexOf(b);
        return (ia<0?99:ia)-(ib<0?99:ib);
      });
      comunas.forEach(cm=>{
        const sec=document.createElement('div'); sec.className='cgroup';
        sec.innerHTML=`<div class="cghead"><h2>${cm}</h2><span>${groups[cm].length} ${groups[cm].length===1?'proyecto':'proyectos'}</span></div>`;
        const g=document.createElement('div'); g.className='cgrid';
        groups[cm].forEach(p=>g.appendChild(card(p)));
        sec.appendChild(g); wrap.appendChild(sec);
      });
    } else {
      const g=document.createElement('div'); g.className='cgrid';
      list.forEach(p=>g.appendChild(card(p)));
      wrap.appendChild(g);
    }
    $('#count').innerHTML=`<b>${list.length}</b> proyecto${list.length===1?'':'s'} en venta`;
    if(window.lucide) lucide.createIcons();
  }

  // poblar filtro de comunas
  const comunas=[...new Set(ALL.map(p=>p.commune))];
  const order=['Ñuñoa','Providencia','Las Condes','Santiago Centro','San Joaquín','Macul','La Florida','Concón'];
  comunas.sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
  const csel=$('#comunaSel');
  comunas.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;csel.appendChild(o);});

  csel.addEventListener('change',e=>{comuna=e.target.value;apply();});
  $('#sortSel').addEventListener('change',e=>{sort=e.target.value;apply();});
  document.querySelectorAll('#entregaChips .chip').forEach(c=>c.addEventListener('click',()=>{
    document.querySelectorAll('#entregaChips .chip').forEach(x=>x.classList.remove('on'));
    c.classList.add('on'); entrega=c.dataset.e; apply();
  }));

  $('#hbCount').textContent=ALL.length;
  apply();
})();
