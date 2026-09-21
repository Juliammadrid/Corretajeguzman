/* ============================================================
   Corretaje Guzmán — Cotización (reutilizable para todos los proyectos)
   Lee ?slug=<proyecto>&tipo=<índice de tipología> y arma el resumen
   lateral desde window.PROYECTO_FICHAS. Sirve para cualquier
   proyecto que exista en data-proyectos-detalle.js
   ============================================================ */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const nf = new Intl.NumberFormat('es-CL');
  const FICHAS = window.PROYECTO_FICHAS || {};
  const qs = new URLSearchParams(location.search);
  const slug = qs.get('slug') || Object.keys(FICHAS)[0];
  const p = FICHAS[slug] || {};
  const TD = p.tipologiasDisponibles || [];
  const WAS = (p.whatsapps && p.whatsapps.length) ? p.whatsapps : [p.wa || '56944637680'];
  const KEY = 'cg_wa_turno';
  function nextWa(){
    let i=0; try{ i=parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){}
    const n=WAS[i%WAS.length];
    try{ localStorage.setItem(KEY,String((i+1)%WAS.length)); }catch(e){}
    return n;
  }
  const ENDPOINT = '/api/lead-cotizacion';

  /* volver a la ficha del proyecto (cada proyecto declara su archivo) */
  $('#backLink').href = p.ficha || ('/proyectos/'+slug+'/');

  $('#sideName').textContent = p.name || 'Proyecto';
  document.title = 'Cotizar ' + (p.name||'departamento') + ' · Corretaje Guzmán';

  /* opciones de tipología */
  const sel = $('#tipoSel');
  if(TD.length){
    TD.forEach((t,i)=>{
      const label = `Planta ${t.planta ? t.planta.split(':')[0].trim() : (i+1)} - ${t.nombre}${t.m2tot?' - '+t.m2tot.replace(' aprox',''):''}`;
      sel.insertAdjacentHTML('beforeend', `<option value="${i}">${label}</option>`);
    });
  } else {
    (p.tipologias||[]).forEach((t,i)=> sel.insertAdjacentHTML('beforeend', `<option value="${i}">${t.nombre}</option>`));
    if(!(p.tipologias||[]).length) sel.insertAdjacentHTML('beforeend', '<option value="0">Consultar disponibilidad</option>');
  }

  function renderSide(i){
    const t = TD[i];
    const img = $('#sideImg'), wrap = $('#sideImgWrap'), grid = $('#sideGrid');
    if(t && t.plano){ img.src = t.plano; img.alt = 'Planta '+(t.planta||''); wrap.style.display=''; }
    else if(p.heroImg){ img.src = p.heroImg; img.alt = p.name||''; wrap.style.display=''; }
    else wrap.style.display='none';

    const rows = t ? [
      ['Planta', (t.planta||'').split(':')[0].trim() || '—'],
      ['Superficie Total', (t.m2tot||'—').replace(' aprox','')],
      ['Dormitorios + Baños', t.dormBano||'—'],
      ['Orientación', t.orientacion||'—'],
      ['Precio', t.desdeUF ? 'UF '+nf.format(t.desdeUF) : (p.desdeUF?'Desde UF '+nf.format(p.desdeUF):'—')]
    ] : [
      ['Comuna', p.commune||'—'],
      ['Dirección', p.address||'—'],
      ['Precio', p.desdeUF ? 'Desde UF '+nf.format(p.desdeUF) : '—']
    ];
    grid.innerHTML = rows.map(([k,v],idx)=>`<div class="sg${/precio/i.test(k)?' price':''}"${/precio|direcci/i.test(k)?' style="grid-column:1/-1"':''}><span class="k">${k}</span><div class="v">${v}</div></div>`).join('');
  }

  const startIdx = Math.max(0, Math.min(TD.length-1, parseInt(qs.get('tipo')||'0',10) || 0));
  sel.value = String(startIdx);
  renderSide(startIdx);
  sel.addEventListener('change', e=> renderSide(+e.target.value));

  /* validación + envío */
  const form = $('#cotForm');
  const mark = (el, bad)=>{ const f = el.closest('.f'); if(f) f.classList.toggle('bad', bad); };
  form.querySelectorAll('input,select').forEach(el=> el.addEventListener('input', ()=> mark(el,false)));

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll('[required]').forEach(el=>{
      let ok = !!String(el.value||'').trim();
      if(ok && el.type==='email') ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim());
      if(ok && el.name==='telefono') ok = el.value.replace(/\D/g,'').length >= 8;
      mark(el, !ok);
      if(!ok && !firstBad) firstBad = el;
    });
    if(firstBad){ firstBad.scrollIntoView({block:'center',behavior:'smooth'}); firstBad.focus(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    const t = TD[+sel.value];
    data.proyecto = p.name || slug;
    data.slug = slug;
    data.tipologia = t ? `${t.nombre} — Planta ${t.planta||''}` : (sel.options[sel.selectedIndex]||{}).text;
    data.precio = t && t.desdeUF ? 'UF '+nf.format(t.desdeUF) : (p.desdeUF?'UF '+nf.format(p.desdeUF):'');
    data.origen = 'Cotización proyecto';
    data.fecha_envio = new Date().toISOString();

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try{ await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); }catch(err){}

    form.style.display='none';
    $('#okBox').classList.add('show');
    window.scrollTo({top:0,behavior:'smooth'});
    if(window.lucide) lucide.createIcons();

    /* respaldo: abrir WhatsApp con el detalle de la cotización */
    const msg = encodeURIComponent(`Hola, quiero cotizar ${data.proyecto} — ${data.tipologia}${data.precio?' ('+data.precio+')':''}.\nNombre: ${data.nombre} ${data.apellido}\nTeléfono: ${data.telefono}\nEmail: ${data.email}`);
    setTimeout(()=>{ window.open('https://wa.me/'+nextWa()+'?text='+msg, '_blank'); }, 600);
  });

  if(window.lucide) lucide.createIcons();
})();
