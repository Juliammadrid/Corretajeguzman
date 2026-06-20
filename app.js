/* ============================================================
   Corretaje Guzmán — ficha de propiedad
   ============================================================ */
const $ = (s) => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const FICHA_URL = "/ficha";
let PHOTOS = [], cur = 0, CURRENT = null;

async function init() {
  await GZ.loadConfig();
  const { data, live } = await GZ.loadProperties();
  GZ.banner(live, data.length);
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || (GZ.propertyIdFromPath && GZ.propertyIdFromPath(location.pathname));
  let p = id && data.find(x => String(x.id) === String(id));
  if (!p) p = data[0];
  CURRENT = p;
  renderFicha(p);
  renderSimilares(data.filter(x => x.id !== p.id), p);
  interactions(p);
  if (window.lucide) lucide.createIcons();
}

function setMeta(name, content, property) {
  if (!content) return;
  const attr = property ? 'property' : 'name';
  let node = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!node) { node = document.createElement('meta'); node.setAttribute(attr, name); document.head.appendChild(node); }
  node.setAttribute('content', content);
}

function updateSeo(p) {
  const canonical = GZ.propertyCanonicalUrl ? GZ.propertyCanonicalUrl(p) : location.href;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = canonical;
  const locationText = [p.address, p.commune].filter(Boolean).join(', ');
  const desc = `${GZ.opLabel(p)}: ${p.title}${locationText ? ' en ' + locationText : ''}${p.priceValue ? ' por ' + GZ.priceText(p) : ''}. Revisa fotos, precio, ubicación y detalles con Corretaje Guzmán.`;
  setMeta('description', desc);
  setMeta('og:title', `${p.title} · Corretaje Guzmán`, true);
  setMeta('og:description', desc, true);
  setMeta('og:url', canonical, true);
  setMeta('og:type', 'product', true);
  if (p.coverPhoto) setMeta('og:image', p.coverPhoto, true);
  setMeta('twitter:card', 'summary_large_image');
}

function renderFicha(p) {
  document.title = `${p.title} · Corretaje Guzmán`;
  updateSeo(p);
  $('#crumbOp').textContent = p.operation === 'venta' ? 'En Venta' : 'Arriendos';
  $('#crumbCom').textContent = p.commune || 'Propiedades';
  $('#crumbTitle').textContent = p.title;
  $('#addr').textContent = [p.address, p.commune].filter(Boolean).join(' · ');
  $('#title').textContent = p.title;

  const badges = $('#badges'); badges.innerHTML = '';
  badges.appendChild(el('span', 'badge badge-op', GZ.opLabel(p)));
  if (p.propertyType) badges.appendChild(el('span', 'badge badge-tipo', p.propertyType));

  const stats = $('#stats'); stats.innerHTML = '';
  [
    p.bedrooms != null && { ic: 'bed-double', b: p.bedrooms, s: p.bedrooms === 1 ? 'Dormitorio' : 'Dormitorios' },
    p.bathrooms != null && { ic: 'bath', b: p.bathrooms, s: p.bathrooms === 1 ? 'Baño' : 'Baños' },
    p.usableArea != null && { ic: 'ruler', b: p.usableArea, s: 'm² útiles' },
    p.parking ? { ic: 'car', b: p.parking, s: 'Estac.' } : null,
    p.storage ? { ic: 'package', b: 'Sí', s: 'Bodega' } : null
  ].filter(Boolean).forEach(s => stats.appendChild(el('div', 'stat', `<i data-lucide="${s.ic}" class="ico"></i><b>${s.b}</b><span>${s.s}</span>`)));

  gallery(p);

  const dg = $('#detgrid'); dg.innerHTML = '';
  [
    p.propertyType && ['Tipo', p.propertyType],
    ['Operación', GZ.opLabel(p)],
    p.usableArea != null && ['Sup. útil', p.usableArea + ' m²'],
    p.totalArea != null && ['Sup. total', p.totalArea + ' m²'],
    p.bedrooms != null && ['Dormitorios', String(p.bedrooms)],
    p.bathrooms != null && ['Baños', String(p.bathrooms)],
    p.parking != null && ['Estacionamientos', String(p.parking)],
    ['Bodega', p.storage ? 'Sí' : 'No'],
    p.terraceArea != null && ['Terraza', p.terraceArea + ' m²'],
    p.status && ['Estado', p.status],
    p.updatedAt && ['Actualizado', p.updatedAt]
  ].filter(Boolean).forEach(([k, v]) => dg.appendChild(el('div', 'd', `<span class="k">${k}</span><span class="v">${v}</span>`)));

  const desc = $('#desc'); desc.innerHTML = '';
  const paras = (p.description || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  paras.forEach((t, i) => desc.appendChild(el('p', i === 0 ? 'lead' : '', t)));
  $('#readmore').style.display = paras.length > 1 ? '' : 'none';

  const amen = $('#amen'); amen.innerHTML = '';
  (p.features || []).forEach(t => amen.appendChild(el('div', 'a', `<span class="ic"><i data-lucide="${GZ.iconFor(t)}" class="ico"></i></span>${t}`)));
  $('#caractBlock').style.display = (p.features && p.features.length) ? '' : 'none';

  drawMap(p);
  $('#nearAddr').textContent = [p.address, p.commune].filter(Boolean).join(', ');

  $('#opPillTxt').textContent = GZ.opLabel(p);
  const uf = GZ.ufApprox(p);
  $('#price').innerHTML = GZ.priceText(p) + (uf ? ` <span class="uf-approx">${uf}</span>` : '');
  $('#pricePer').textContent = GZ.perLabel(p);
  if (p.commonExpenses) {
    $('#gc').textContent = '$' + GZ.nf.format(p.commonExpenses);
    $('#gcRow').style.display = '';
    if (p.currency === 'CLP' && p.operation === 'arriendo') {
      $('#total').textContent = '$' + GZ.nf.format(p.priceValue + p.commonExpenses);
      $('#totalRow').style.display = '';
    } else $('#totalRow').style.display = 'none';
  } else { $('#gcRow').style.display = 'none'; $('#totalRow').style.display = 'none'; }

  const sel = $('#broker'); sel.innerHTML = '';
  sel.appendChild(el('option', null, 'Vi la empresa en internet')); sel.firstChild.value = '';
  (window.GUZMAN_BROKERS || []).filter(b => b !== 'Vi la empresa en internet').forEach(b => { const o = el('option', null, b); o.value = b; sel.appendChild(o); });
  const updateWa = () => { const link = GZ.waLink(p, sel.value); $('#waBtn').href = link; $('#mWa').href = link; };
  sel.addEventListener('change', updateWa); updateWa();

  $('#agentAv').textContent = 'CG';
  $('#refNote').textContent = `Cód. referencia · ${p.id}` + (p.status ? ` · ${p.status}` : '');
  $('#cmsg').value = `Hola, me interesa la propiedad "${p.title}". ¿Podrían darme más información?`;

  $('#mPrice').innerHTML = GZ.priceText(p) + `<span style="font-size:12px;color:var(--ink-3);font-family:'Hanken Grotesk'"> ${GZ.perLabel(p)}</span>`;
  $('#mGc').textContent = p.commonExpenses ? `+ $${GZ.nf.format(p.commonExpenses)} gastos comunes` : (p.commune || '');
}

function gallery(p) {
  PHOTOS = (p.photos && p.photos.length) ? p.photos : (p.coverPhoto ? [p.coverPhoto] : []);
  const g = $('#gallery');
  g.querySelectorAll('.g').forEach(n => n.remove());
  g.classList.toggle('single', PHOTOS.length <= 1);
  const cells = Math.min(5, PHOTOS.length || 1);
  for (let i = 0; i < cells; i++) {
    const cell = el('div', 'g' + (i === 0 ? ' g-main' : '')); cell.dataset.i = i;
    const im = el('img'); im.src = PHOTOS[i] || ''; im.alt = p.title; im.loading = 'lazy'; cell.appendChild(im);
    if (i === cells - 1 && PHOTOS.length > 1) { const sa = el('button', 'see-all', `<i data-lucide="images" class="ico"></i>Ver las ${PHOTOS.length} fotos`); sa.id = 'seeAll'; cell.appendChild(sa); }
    cell.addEventListener('click', (e) => { if (e.target.closest('#seeAll')) return; openLb(i); });
    g.appendChild(cell);
  }
  const pc = $('#photoCount'); pc.querySelector('span').textContent = `1 / ${PHOTOS.length}`;
  const strip = $('#lbStrip'); strip.innerHTML = '';
  PHOTOS.forEach((src, i) => { const im = el('img'); im.src = src; im.onclick = () => show(i); strip.appendChild(im); });
}

const PIN = { path: "M12 0C6.5 0 2 4.5 2 10c0 7 10 16 10 16s10-9 10-16C22 4.5 17.5 0 12 0z", fillColor: "#7c3aed", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1.3, anchor: { x: 12, y: 26 } };
function loadGMaps(cb) {
  if (window.google && window.google.maps) return cb();
  if (!GZ.CFG.mapsKey) return cb();
  if (document.getElementById('gmaps-sdk')) { document.getElementById('gmaps-sdk').addEventListener('load', cb); return; }
  const s = document.createElement('script'); s.id = 'gmaps-sdk';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GZ.CFG.mapsKey)}&v=quarterly`;
  s.async = true; s.onload = cb; s.onerror = cb; document.head.appendChild(s);
}
function stylizedCanvas() {
  return `<div class="map-canvas"><div class="road r1"></div><div class="road r2"></div><div class="road r3"></div><div class="map-pin"><div class="dot"><i data-lucide="home" class="ico"></i></div></div></div>`;
}
function drawMap(p) {
  const box = $('#mapbox');
  const link = 'https://maps.google.com/?q=' + encodeURIComponent([p.address, p.commune].filter(Boolean).join(', '));
  const meta = `<div class="map-meta"><div class="pin-line"><i data-lucide="map-pin" class="ico"></i><span>${[p.address, p.commune].filter(Boolean).join(', ')}</span></div><a class="btn btn-ghost" href="${link}" target="_blank"><i data-lucide="external-link" class="ico"></i>Ver en Google Maps</a></div>`;
  if (GZ.CFG.mapsKey && p.latitude != null && p.longitude != null) {
    box.innerHTML = '<div id="map"></div>' + meta;
    loadGMaps(() => {
      if (window.google && window.google.maps) {
        const m = new google.maps.Map(document.getElementById('map'), { center: { lat: +p.latitude, lng: +p.longitude }, zoom: 15, mapTypeControl: false, streetViewControl: false });
        new google.maps.Marker({ position: { lat: +p.latitude, lng: +p.longitude }, map: m, icon: PIN, title: p.title });
      } else { box.innerHTML = stylizedCanvas() + meta; if (window.lucide) lucide.createIcons(); }
    });
  } else { box.innerHTML = stylizedCanvas() + meta; }
}

function renderSimilares(list, p) {
  const grid = $('#simGrid'); grid.innerHTML = '';
  const sorted = list.slice().sort((a, b) => (a.commune === p.commune ? -1 : 0) - (b.commune === p.commune ? -1 : 0)).slice(0, 3);
  if (!sorted.length) { grid.closest('.sim-sec').style.display = 'none'; return; }
  sorted.forEach(q => {
    const ft = [
      q.bedrooms != null && `<span class="f"><i data-lucide="bed-double" class="ico"></i>${q.bedrooms}</span>`,
      q.bathrooms != null && `<span class="f"><i data-lucide="bath" class="ico"></i>${q.bathrooms}</span>`,
      q.usableArea != null && `<span class="f"><i data-lucide="ruler" class="ico"></i>${q.usableArea} m²</span>`,
      q.parking ? `<span class="f"><i data-lucide="car" class="ico"></i>${q.parking}</span>` : ''
    ].filter(Boolean).join('');
    const a = el('a', 'pcardm'); a.href = GZ.propertyPath ? GZ.propertyPath(q) : FICHA_URL + '?id=' + encodeURIComponent(q.id);
    a.innerHTML = `<div class="ph"><img src="${q.coverPhoto || (q.photos || [])[0] || ''}" alt="${q.title}" loading="lazy"><span class="tag">${GZ.opLabel(q)}</span></div>
      <div class="bd"><div class="pr">${GZ.priceHTML(q)}</div><div class="ti">${q.title}</div>
      <div class="ad"><i data-lucide="map-pin" class="ico"></i>${q.address || q.commune || ''}</div><div class="ft">${ft}</div></div>`;
    grid.appendChild(a);
  });
}

function contactPayload(form, p) {
  const fields = form.querySelectorAll('input, textarea');
  return {
    nombre: (fields[0] && fields[0].value || '').trim(),
    telefono: (fields[1] && fields[1].value || '').trim(),
    mensaje: ($('#cmsg') && $('#cmsg').value || '').trim(),
    propiedad: p.title,
    codigo: p.id,
    operacion: GZ.opLabel(p),
    comuna: p.commune || '',
    precio: GZ.priceText(p) + (GZ.perLabel(p) ? ' ' + GZ.perLabel(p) : ''),
    url: location.href,
    fecha_envio: new Date().toISOString()
  };
}

async function sendPropertyLead(data) {
  const r = await fetch('/api/lead-propiedad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const text = await r.text();
  let json = {};
  try { json = JSON.parse(text); } catch (e) {}
  if (!r.ok || json.ok === false) throw new Error(json.error || text || 'No se pudo enviar la solicitud');
  return json;
}

function interactions(p) {
  $('#readmore').addEventListener('click', function () { const d = $('#desc'); d.classList.toggle('clamped'); this.firstChild.textContent = d.classList.contains('clamped') ? 'Leer descripción completa ' : 'Ver menos '; });
  $('#cform').addEventListener('submit', async function (e) {
    e.preventDefault();
    const payload = contactPayload(this, p);
    if (!payload.nombre || !payload.telefono) return;
    const btn = this.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="ico"></i>Enviando...';
    if (window.lucide) lucide.createIcons();
    try {
      await sendPropertyLead(payload);
      $('#formOk').style.display = 'flex';
      this.style.display = 'none';
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      alert('No se pudo enviar la solicitud. Por favor intenta nuevamente o escríbenos por WhatsApp.');
      btn.disabled = false;
      btn.innerHTML = original;
      if (window.lucide) lucide.createIcons();
    }
  });
  const seeAll = $('#seeAll'); if (seeAll) seeAll.addEventListener('click', e => { e.stopPropagation(); openLb(0); });
  $('#lbClose').onclick = closeLb; $('#lbPrev').onclick = () => show(cur - 1); $('#lbNext').onclick = () => show(cur + 1);
  $('#lb').addEventListener('click', e => { if (e.target.id === 'lb') closeLb(); });
  document.addEventListener('keydown', e => { if (!$('#lb').classList.contains('open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
}
function openLb(i) { if (!PHOTOS.length) return; cur = i; show(i); $('#lb').classList.add('open'); document.body.style.overflow = 'hidden'; if (window.lucide) lucide.createIcons(); }
function closeLb() { $('#lb').classList.remove('open'); document.body.style.overflow = ''; }
function show(i) { cur = (i + PHOTOS.length) % PHOTOS.length; $('#lbImg').src = PHOTOS[cur]; $('#lbCount').textContent = `${cur + 1} / ${PHOTOS.length}`; [...$('#lbStrip').children].forEach((c, j) => c.classList.toggle('on', j === cur)); }

init();
