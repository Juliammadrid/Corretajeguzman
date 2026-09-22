/* ============================================================
   Corretaje Guzmán — Ficha de proyecto de PARCELAS (loteo)
   Reutilizable: lee window.PARCELA_SLUG o ?slug=
   ============================================================ */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const nf=new Intl.NumberFormat('es-CL');
  const P=window.PARCELA_PROYECTOS||{};
  const slug=window.PARCELA_SLUG||new URLSearchParams(location.search).get('slug')||Object.keys(P)[0];
  const p=P[slug]||{};
  const fallbackImage=(src)=>/\.webp(?:[?#].*)?$/i.test(src||'')?String(src).replace(/\.webp(?=([?#].*)?$)/i,'.jpg'):src;
  const toWebp=(src)=>/\.(?:jpe?g|png|webp)(?:[?#].*)?$/i.test(src||'')?String(src).replace(/\.(?:jpe?g|png|webp)(?=([?#].*)?$)/i,'.webp'):src;
  const imageMarkup=(src,alt,attrs)=>'<picture><source srcset="'+toWebp(src)+'" type="image/webp"><img src="'+fallbackImage(src)+'" alt="'+alt+'" width="1600" height="900" decoding="async" '+(attrs||'')+'></picture>';
  const setResponsiveImage=(selector,src,alt,priority)=>{
    const image=$(selector); if(!image||!src) return;
    const source=image.closest('picture')&&image.closest('picture').querySelector('source[type="image/webp"]');
    if(source){ source.srcset=toWebp(src); image.src=fallbackImage(src); }
    else {
      const identity=(image.id?'id="'+image.id+'" ':'')+(image.className?'class="'+image.className+'" ':'');
      image.outerHTML=imageMarkup(src,alt||image.alt,identity+(priority?'loading="eager" fetchpriority="high"':'loading="lazy"'));
    }
  };
  const WAS=(p.whatsapps&&p.whatsapps.length)?p.whatsapps:[p.wa||'56944637680'];
  const WA=WAS[0];
  const KEY='cg_wa_turno';
  function nextWa(){
    let i=0;
    try{ i=parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){}
    const n=WAS[i%WAS.length];
    try{ localStorage.setItem(KEY,String((i+1)%WAS.length)); }catch(e){}
    return n;
  }
  const waLink=(txt)=>'https://wa.me/'+WA+'?text='+encodeURIComponent(txt);
  /* reparte cada clic entre los números disponibles */
  document.addEventListener('click',function(ev){
    const a=ev.target.closest('a[href*="wa.me/"]');
    if(!a) return;
    a.href=a.href.replace(/wa\.me\/\d+/, 'wa.me/'+nextWa());
  }, true);

  document.title=(p.name||'Parcelas')+' · Corretaje Guzmán';
  $('#pName').textContent=p.name||'';
  $('#pAddr').textContent=p.address||[p.sector,p.region].filter(Boolean).join(', ');
  $('#pLead').textContent=p.lead||'';
  if(p.heroImg) setResponsiveImage('#heroImg',p.heroImg,p.name||'Campo Alto Roble',true);
  if(p.masterplan){
    setResponsiveImage('#mpImg',p.masterplan,'Masterplan del loteo');
    const masterplan=$('#mpImg');
    if(masterplan){ masterplan.width=1238; masterplan.height=2048; }
  }

  /* chips del hero */
  const disp=(p.parcelas||[]).filter(x=>(x.status||'disponible')==='disponible');
  const tags=[
    {t:'Parcelas de '+nf.format(p.supParcela||5000)+' m²',ic:'ruler',hl:true},
    {t:'100% urbanizadas',ic:'check'},
    {t:disp.length+' disponibles',ic:'badge-check'}
  ];
  $('#phTags').innerHTML=tags.map(t=>'<span class="ph-chip'+(t.hl?' hl':'')+'"><i data-lucide="'+t.ic+'" class="ico"></i>'+t.t+'</span>').join('');

  /* barra de stats */
  const ufMin=Math.min(...(p.parcelas||[{uf:0}]).map(x=>x.uf));
  const ufMax=Math.max(...(p.parcelas||[{uf:0}]).map(x=>x.uf));
  $('#pstats').innerHTML=[
    {k:'Superficie por parcela',v:nf.format(p.supParcela||5000)+' m²'},
    {k:'Valores',v:'UF '+nf.format(ufMin)+' – '+nf.format(ufMax),hl:true},
    {k:'Parcelas disponibles',v:disp.length},
    {k:'Sector',v:(p.sector||'')+', '+(p.region||'')},
    {k:'Urbanización',v:'Alto estándar'}
  ].map(s=>'<div class="ps'+(s.hl?' hl':'')+'"><div class="k">'+s.k+'</div><div class="v">'+s.v+'</div></div>').join('');

  /* entorno + urbanización */
  const fc=(a)=>'<div class="fcard"><span class="ic"><i data-lucide="'+a.ic+'" class="ico"></i></span><span>'+a.t+'</span></div>';
  const eg=$('#entornoGrid');
  if(eg){ const L=p.entorno||[]; if(L.length) eg.innerHTML=L.map(fc).join(''); else eg.remove(); }
  $('#urbGrid').innerHTML=(p.urbanizacion||[]).map(a=>'<div class="ucard"><span class="ic"><i data-lucide="'+a.ic+'" class="ico"></i></span><span>'+a.t+'</span></div>').join('');

  /* entorno Villarrica */
  if(p.entornoTitulo) $('#entTitulo').textContent=p.entornoTitulo;
  if(p.entornoLead) $('#entLead').textContent=p.entornoLead;
  const er=$('#entRazones');
  if(er){ const R=p.entornoRazones||[]; if(R.length) er.innerHTML=R.map(r=>'<div class="vcard"><span class="ic"><i data-lucide="'+r.ic+'" class="ico"></i></span><div><h3>'+r.t+'</h3><p>'+r.d+'</p></div></div>').join(''); else er.remove(); }
  const enf=$('#enfoque');
  if(enf){ const E=p.proyectoEnfoque||[]; if(E.length) enf.innerHTML=E.map(t=>'<span>'+t+'</span>').join(''); else enf.remove(); }

  /* tour 360 embebido */
  const tf=$('#tourFrame');
  if(tf){ if(p.tour360) tf.src=p.tour360; else { const s=$('#recorrido'); if(s) s.style.display='none'; } }

  /* tabla de parcelas */
  const body=$('#ptBody');
  body.innerHTML=(p.parcelas||[]).map(x=>{
    const st=x.status||'disponible';
    const label=st==='reservada'?'Reservada':(st==='vendida'?'Vendida':'Disponible');
    return '<div class="pt-row" data-n="'+x.n+'" data-uf="'+x.uf+'">'+
      '<span class="num">'+x.n+'</span>'+
      '<span class="sup">'+nf.format(x.sup||p.supParcela||5000)+' m²</span>'+
      '<span class="uf">UF '+nf.format(x.uf)+'</span>'+
      '<span class="st '+st+'">'+label+'</span>'+
      '<span class="clp">$'+nf.format(x.clp)+'</span>'+
    '</div>';
  }).join('');
  body.querySelectorAll('.pt-row').forEach(r=>r.addEventListener('click',()=>{
    window.open(waLink('Hola, me interesa la parcela N° '+r.dataset.n+' de '+p.name+' (UF '+nf.format(+r.dataset.uf)+', '+nf.format(p.supParcela||5000)+' m²). ¿Sigue disponible?'),'_blank');
  }));
  $('#ptNote').textContent='Valores referenciales calculados con UF de $'+nf.format(p.ufRef||0)+'. Sujetos a cambio según el valor de la UF del día y a disponibilidad. Superficies aproximadas.';

  /* carrusel de fotos deslizable */
  const G=p.galeria||[];
  const track=$('#carTrack'), dots=$('#carDots');
  if(G.length && track && dots){
    track.innerHTML=G.map((g,i)=>'<figure class="cslide2" data-i="'+i+'">'+
      imageMarkup(g.src,g.t,'loading="lazy"')+
      '<button class="zoom" aria-label="Ampliar"><i data-lucide="expand" class="ico"></i></button>'+
      '<figcaption class="cap"><b>'+g.t+'</b><span class="no">'+(i+1)+' / '+G.length+'</span></figcaption>'+
    '</figure>').join('');
    dots.innerHTML=G.map((_,i)=>'<i data-i="'+i+'"'+(i===0?' class="on"':'')+'></i>').join('');
    const slides=[...track.querySelectorAll('.cslide2')];
    let cur=0;
    const goTo=(i)=>{
      cur=(i+G.length)%G.length;
      const s=slides[cur]; if(!s) return;
      [...dots.children].forEach((d,j)=>d.classList.toggle('on',j===cur));
      s.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
    };
    const sync=()=>{
      const c=track.scrollLeft+track.clientWidth/2;
      let best=0,bd=Infinity;
      slides.forEach((s,i)=>{const sc=s.offsetLeft-track.offsetLeft+s.clientWidth/2;const d=Math.abs(sc-c);if(d<bd){bd=d;best=i;}});
      cur=best;
      [...dots.children].forEach((d,i)=>d.classList.toggle('on',i===best));
    };
    let raf; track.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sync);});
    $('#carPrev').addEventListener('click',()=>goTo(cur-1));
    $('#carNext').addEventListener('click',()=>goTo(cur+1));
    [...dots.children].forEach(d=>d.addEventListener('click',()=>goTo(+d.dataset.i)));
    slides.forEach(s=>s.querySelector('.zoom').addEventListener('click',e=>{e.stopPropagation();openLb(toWebp(s.querySelector('img').currentSrc||s.querySelector('img').src));}));
    /* arrastre con mouse */
    let down=false,sx=0,sl=0,moved=0;
    track.addEventListener('mousedown',e=>{down=true;moved=0;sx=e.pageX;sl=track.scrollLeft;track.classList.add('drag');});
    window.addEventListener('mouseup',()=>{if(!down)return;down=false;track.classList.remove('drag');sync();});
    track.addEventListener('mousemove',e=>{if(!down)return;e.preventDefault();const d=e.pageX-sx;moved=Math.abs(d);track.scrollLeft=sl-d;});
    slides.forEach(s=>s.addEventListener('click',()=>{if(moved<6) openLb(toWebp(s.querySelector('img').currentSrc||s.querySelector('img').src));}));
    sync();
  }

  /* distancias */
  const dg=$('#distGrid');
  if(dg) dg.innerHTML=(p.distancias||[]).map(d=>'<div class="d"><div class="k">'+d.k+'</div><div class="v">'+d.v+'</div></div>').join('');

  /* enlaces */
  const waMsg=waLink('Hola, quiero información de las parcelas de '+p.name+' ('+(p.sector||'')+'), desde UF '+nf.format(ufMin)+'. ¿Me pueden asesorar?');
  $('#ctaWa').href=waMsg; $('#barWa').href=waMsg;
  const vw=$('#visitaWa');
  if(vw) vw.href=waLink('Hola, quiero agendar una visita a '+p.name+' en '+(p.sector||'')+'. ¿Qué días tienen disponibles?');
  $('#pbDesde').textContent='UF '+nf.format(ufMin);
  $('#pbDisp').textContent=disp.length+' parcelas';


  /* simulador de crédito directo */
  (function(){
    const C=p.credito; const sel=$('#crParcela');
    if(!C || !sel){ const s=$('#credito'); if(s) s.remove(); return; }
    const uf=p.ufSim||p.ufRef||0;
    const disponibles=(p.parcelas||[]).filter(x=>(x.status||'disponible')==='disponible');
    sel.innerHTML=disponibles.map(x=>'<option value="'+x.uf+'" data-n="'+x.n+'">Parcela '+x.n+' · UF '+nf.format(x.uf)+' · '+nf.format(p.supParcela||5000)+' m²</option>').join('');
    const plazosWrap=$('#crPlazos');
    let plazo=(C.plazos&&C.plazos[C.plazos.length-1])||36;
    plazosWrap.innerHTML=(C.plazos||[36]).map(m=>'<button type="button" data-m="'+m+'"'+(m===plazo?' class="on"':'')+'>'+m+' cuotas</button>').join('');
    const pieEl=$('#crPie'); pieEl.min=C.pieMin||40; pieEl.value=C.pieDefault||50;
    const note=$('#crNota');
    const baseNote=C.nota||'';
    if(note) note.textContent=baseNote;
    const money=(n)=>'$'+nf.format(Math.round(n));
    function calc(){
      const opt=sel.options[sel.selectedIndex]||{};
      const ufVal=+sel.value||0;
      const piePct=+pieEl.value;
      const valor=ufVal*uf;
      const valorFin=valor*(1+(C.recargo||0)/100);
      const pie=valorFin*piePct/100;
      const fin=valorFin-pie;
      const i=(C.tasaMes||1)/100;
      const cuota=i>0 ? fin*i/(1-Math.pow(1+i,-plazo)) : fin/plazo;
      $('#crPieVal').textContent=piePct+'%';
      $('#crValor').textContent=money(valor)+' \u00b7 UF '+nf.format(ufVal);
      $('#crValorFin').textContent=money(valorFin);
      $('#crPieMonto').textContent=money(pie);
      $('#crFinanciar').textContent=money(fin);
      $('#crCuota').textContent=money(cuota);
      $('#crCuotaDet').textContent=plazo+' cuotas \u00b7 tasa '+String(C.tasaMes).replace('.',',')+'% mensual';
      $('#crTotal').textContent=money(pie+cuota*plazo);
      const nParc=opt.dataset?opt.dataset.n:'';
      $('#crWa').href=waLink('Hola, quiero cotizar la Parcela N\u00b0 '+nParc+' de '+p.name+' con cr\u00e9dito directo.\nPie '+piePct+'% ('+money(pie)+') \u00b7 '+plazo+' cuotas de '+money(cuota)+'. \u00bfMe pueden confirmar?');
    }
    sel.addEventListener('change',calc);
    pieEl.addEventListener('input',calc);
    plazosWrap.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      plazo=+b.dataset.m;
      plazosWrap.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
      calc();
    }));
    calc();
    fetch('/api/uf-actual')
      .then(r=>r.ok?r.json():Promise.reject(new Error('UF no disponible')))
      .then(info=>{
        const value=Number(info.value);
        if(!Number.isFinite(value)||value<=0) throw new Error('UF inválida');
        uf=value;
        const date=info.date ? new Date(info.date).toLocaleDateString('es-CL') : '';
        if(note) note.textContent=baseNote+' UF actualizada: $'+nf.format(Math.round(uf))+(date?' ('+date+')':'')+'.';
        calc();
      })
      .catch(()=>{ if(note) note.textContent=baseNote+' Se usó el valor referencial mientras se actualiza la UF.'; });
  })();

  const lb=$('#lb');
  function openLb(src){$('#lbImg').src=src;lb.classList.add('open');document.body.style.overflow='hidden';if(window.lucide)lucide.createIcons();}
  function closeLb(){lb.classList.remove('open');document.body.style.overflow='';}
  $('#lbX').addEventListener('click',closeLb);
  lb.addEventListener('click',e=>{if(e.target===lb)closeLb();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLb();});
  $('#mpImg').addEventListener('click',()=>openLb(p.masterplan));

  /* nav móvil */
  const b=$('#navBurger'), mm=$('#mobileMenu');
  if(b&&mm){
    b.addEventListener('click',e=>{e.stopPropagation();mm.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!mm.contains(e.target)&&!b.contains(e.target))mm.classList.remove('open');});
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mm.classList.remove('open')));
  }


  if(window.lucide) lucide.createIcons();
})();
