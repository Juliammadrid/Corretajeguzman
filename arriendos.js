/* ============================================================
   Corretaje Guzmán — Página de resultados (Arriendos / Venta)
   ============================================================ */
const FICHA_URL = "Ficha Propiedad - Corretaje Guzman v2.html";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let ALL = [], OP = 'arriendo', gmap = null, markers = [], geocoder = null, mapRenderRun = 0;
const GEO_CACHE = new Map();
const STATE = { q: '', tipo: '', condicion: '', prMin: null, prMax: null, prMoneda: 'CLP', dorm: 0, banos: 0, areaMin: null, areaMax: null, eq: [], sort: 'rel' };

async function init() {
  await GZ.loadConfig();
  const params = new URLSearchParams(location.search);
  OP = (params.get('op') === 'venta' || window.GUZMAN_OP === 'venta') ? 'venta' : 'arriendo';
  if (params.get('comuna')) { STATE.q = params.get('comuna'); $('#qInput').value = STATE.q; }
  setOpLabels();
  const { data, live } = await GZ.loadProperties();
  ALL = data.filter(p => p.operation === OP);
  GZ.banner(live, ALL.length);
  buildEvents();
  buildMobile();
  apply();
  if (window.lucide) lucide.createIcons();
}

function setOpLabels() {
  const isVenta = OP === 'venta';
  document.title = (isVenta ? 'En Venta' : 'Arriendos') + ' · Corretaje Guzmán';
  $$('.nav-links a').forEach(a => a.classList.remove('active'));
  const sel = isVenta ? 'Ventas - Corretaje Guzman.html' : 'Arriendos - Corretaje Guzman.html';
  const link = $(`.nav-links a[href="${sel}"]`);
  if (link) link.classList.add('active');
}

/* ---------- filtros ---------- */
function matches(p) {
  if (STATE.q) { const hay = `${p.commune || ''} ${p.address || ''} ${p.title || ''}`.toLowerCase(); if (!hay.includes(STATE.q.toLowerCase())) return false; }
  if (STATE.tipo && (p.propertyType || '') !== STATE.tipo) return false;
  if (STATE.condicion && (p.condition || '') !== STATE.condicion) return false;
  if (STATE.dorm && (p.bedrooms || 0) < STATE.dorm) return false;
  if (STATE.banos && (p.bathrooms || 0) < STATE.banos) return false;
  if (STATE.areaMin != null && (p.usableArea == null || p.usableArea < STATE.areaMin)) return false;
  if (STATE.areaMax != null && (p.usableArea == null || p.usableArea > STATE.areaMax)) return false;
  if (STATE.prMin != null || STATE.prMax != null) {
    const v = priceInMoneda(p, STATE.prMoneda);
    if (v == null) return false;
    if (STATE.prMin != null && v < STATE.prMin) return false;
    if (STATE.prMax != null && v > STATE.prMax) return false;
  }
  if (STATE.eq.length) {
    const blob = ((p.features || []).join(' ') + ' ' + (p.description || '')).toLowerCase();
    const flags = { estacionamiento: p.parking > 0, bodega: !!p.storage };
    for (const e of STATE.eq) { const ok = flags[e] || blob.includes(e); if (!ok) return false; }
  }
  return true;
}
function priceInMoneda(p, m) {
  const uf = GZ.CFG.ufValueClp || 39200;
  if (m === 'UF') return p.currency === 'UF' ? p.priceValue : (p.priceValue / uf);
  return p.currency === 'UF' ? (p.priceValue * uf) : p.priceValue;
}
function sortList(list) {
  const s = STATE.sort;
  const cl = (p) => priceInMoneda(p, 'CLP') || 0;
  if (s === 'priceAsc') list.sort((a, b) => cl(a) - cl(b));
  else if (s === 'priceDesc') list.sort((a, b) => cl(b) - cl(a));
  else if (s === 'areaDesc') list.sort((a, b) => (b.usableArea || 0) - (a.usableArea || 0));
  else if (s === 'recent') list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return list;
}

function apply() {
  const list = sortList(ALL.filter(matches));
  renderList(list);
  renderMap(list);
  const label = OP === 'venta' ? 'en Venta' : 'de Arriendo';
  $('#count').innerHTML = `<b>${list.length}</b> resultado${list.length === 1 ? '' : 's'} ${label}`;
  const mc = $('#mapCount'); if (mc) mc.innerHTML = `<b>${list.length}</b> propiedad${list.length === 1 ? '' : 'es'} en esta vista`;
  syncChips();
  reflectAll();
  updateMobileMeta(list.length);
  if (window.lucide) lucide.createIcons();
}

/* nº de filtros activos (para el badge "Filtrar") */
function activeFilterCount() {
  let n = 0;
  if (STATE.tipo) n++;
  if (STATE.condicion) n++;
  if (STATE.prMin != null || STATE.prMax != null) n++;
  if (STATE.dorm) n++;
  if (STATE.banos) n++;
  if (STATE.areaMin != null || STATE.areaMax != null) n++;
  n += STATE.eq.length;
  return n;
}
function updateMobileMeta(listLen) {
  const dot = $('#mbCount'); if (dot) { const n = activeFilterCount(); dot.textContent = n; dot.style.display = n ? '' : 'none'; }
  const fa = $('#mFApply'); if (fa) fa.textContent = `Ver ${listLen} propiedad${listLen === 1 ? '' : 'es'}`;
}

/* sincroniza TODOS los controles (escritorio + móvil) con STATE */
function setPillOn(sel, val) { $$(sel + ' .pill').forEach(b => b.classList.toggle('on', b.dataset.v === String(val))); }
function reflectAll() {
  setPillOn('#tipoPills', STATE.tipo); setPillOn('#mTipoPills', STATE.tipo);
  setPillOn('#condPills', STATE.condicion); setPillOn('#mCondPills', STATE.condicion);
  setPillOn('#dormPills', STATE.dorm); setPillOn('#mDormPills', STATE.dorm);
  setPillOn('#banosPills', STATE.banos); setPillOn('#mBanosPills', STATE.banos);
  $$('#monedaSeg button, #mMonedaSeg button').forEach(b => b.classList.toggle('on', b.dataset.m === STATE.prMoneda));
  const setVal = (id, v) => { const e = $(id); if (e && document.activeElement !== e) e.value = (v == null ? '' : v); };
  setVal('#prMin', STATE.prMin); setVal('#prMax', STATE.prMax);
  setVal('#mPrMin', STATE.prMin); setVal('#mPrMax', STATE.prMax);
  setVal('#arMin', STATE.areaMin); setVal('#arMax', STATE.areaMax);
  setVal('#mArMin', STATE.areaMin); setVal('#mArMax', STATE.areaMax);
  $$('#eqGrid input, #mEqGrid input').forEach(i => i.checked = STATE.eq.includes(i.value));
  const q = $('#qInput'), mq = $('#mQInput');
  if (q && document.activeElement !== q) q.value = STATE.q;
  if (mq && document.activeElement !== mq) mq.value = STATE.q;
}

/* ---------- cards ---------- */
function card(p) {
  const ft = [
    p.bedrooms != null && `<span class="f"><i data-lucide="bed-double" class="ico"></i>${p.bedrooms}</span>`,
    p.bathrooms != null && `<span class="f"><i data-lucide="bath" class="ico"></i>${p.bathrooms}</span>`,
    p.usableArea != null && `<span class="f"><i data-lucide="ruler" class="ico"></i>${p.usableArea} m²</span>`,
    p.parking ? `<span class="f"><i data-lucide="car" class="ico"></i>${p.parking}</span>` : ''
  ].filter(Boolean).join('');
  const a = el('a', 'pcardm'); a.href = FICHA_URL + '?id=' + encodeURIComponent(p.id); a.dataset.id = p.id;
  a.innerHTML = `
    <div class="ph">
      <img src="${p.coverPhoto || (p.photos || [])[0] || ''}" alt="${p.title}" loading="lazy">
      <span class="tag">${GZ.opLabel(p)}</span>
    </div>
    <div class="bd">
      <div class="pr">${GZ.priceHTML(p)}</div>
      <div class="ti">${p.title}</div>
      <div class="ad"><i data-lucide="map-pin" class="ico"></i>${p.address || p.commune || ''}</div>
      <div class="ft">${ft}</div>
    </div>`;
  a.addEventListener('mouseenter', () => highlight(p.id, true));
  a.addEventListener('mouseleave', () => highlight(p.id, false));
  return a;
}
function renderList(list) {
  const wrap = $('#plist'); wrap.innerHTML = '';
  if (!list.length) {
    wrap.appendChild(el('div', 'empty', `<i data-lucide="search-x" class="ico"></i><div>No encontramos propiedades con estos filtros.<br>Prueba ampliando el precio o la ubicación.</div>`));
    return;
  }
  list.forEach(p => wrap.appendChild(card(p)));
}

/* ---------- mapa ---------- */
const PIN = { path: "M12 0C6.5 0 2 4.5 2 10c0 7 10 16 10 16s10-9 10-16C22 4.5 17.5 0 12 0z", fillColor: "#7c3aed", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1.25, anchor: { x: 12, y: 26 }, labelOrigin: { x: 12, y: 10 } };
function loadGMaps(cb) {
  if (window.google && window.google.maps) return cb();
  if (!GZ.CFG.mapsKey) return cb();
  if (document.getElementById('gmaps-sdk')) { document.getElementById('gmaps-sdk').addEventListener('load', cb); return; }
  const s = document.createElement('script'); s.id = 'gmaps-sdk';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GZ.CFG.mapsKey)}&v=quarterly`;
  s.async = true; s.onload = cb; s.onerror = cb; document.head.appendChild(s);
}
function normText(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function publicAddressFor(p) { return String(p.fullAddress || [p.address, p.commune, 'Chile'].filter(Boolean).join(', ')).replace(/,\s*,/g, ',').trim(); }
async function geocodeProperty(p) {
  if (p.latitude != null && p.longitude != null) return { lat: +p.latitude, lng: +p.longitude };
  const address = publicAddressFor(p);
  if (!address || !(window.google && google.maps)) return null;
  const key = normText(address);
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  try {
    geocoder = geocoder || new google.maps.Geocoder();
    const pos = await new Promise(resolve => {
      geocoder.geocode({ address, componentRestrictions: { country: 'CL' } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    });
    GEO_CACHE.set(key, pos);
    return pos;
  } catch (e) {
    GEO_CACHE.set(key, null);
    return null;
  }
}
let infow = null;
function renderMap(list) {
  const panel = $('#map');
  const run = ++mapRenderRun;
  loadGMaps(async () => {
    if (!(window.google && window.google.maps) || !GZ.CFG.mapsKey) { placeholderMap(panel, list); return; }
    if (!gmap) { gmap = new google.maps.Map(panel, { center: { lat: -33.45, lng: -70.66 }, zoom: 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, styles: MAP_STYLE }); infow = new google.maps.InfoWindow(); }
    markers.forEach(m => m.setMap(null)); markers = [];
    const bounds = new google.maps.LatLngBounds(); let n = 0;
    for (const p of list) {
      if (run !== mapRenderRun) return;
      const pos = await geocodeProperty(p);
      if (!pos) continue;
      const m = new google.maps.Marker({ position: pos, map: gmap, title: p.title, icon: PIN });
      m.addListener('click', () => { infow.setContent(`<div style="font-family:sans-serif;max-width:210px"><b>${p.title}</b><br>${GZ.priceText(p)}<br><small style="color:#6b6280">Ubicación calculada desde dirección pública</small><br><a href="${FICHA_URL}?id=${encodeURIComponent(p.id)}" style="color:#7c3aed;font-weight:600">Ver ficha →</a></div>`); infow.open(gmap, m); highlightCard(p.id); });
      m._pid = p.id; markers.push(m); bounds.extend(pos); n++;
    }
    if (n) gmap.fitBounds(bounds, 50);
  });
}
function shortPrice(p) { const uf = GZ.CFG.ufValueClp || 39200; const clp = p.currency === 'UF' ? p.priceValue * uf : p.priceValue; return '$' + Math.round(clp / 1000) + 'k'; }
function placeholderMap(panel, list) {
  let html = `<div class="map-ph"><div class="map-ph-grid"></div><div class="map-hint"><i data-lucide="map-pin" class="ico" style="width:14px;height:14px;display:inline;vertical-align:-2px"></i> ${list.length} propiedades listas para geocodificar por dirección</div>`;
  list.slice(0, 14).forEach((p, i) => {
    const left = 18 + ((i * 53) % 64) + (i % 3) * 6;
    const top = 22 + ((i * 37) % 56);
    html += `<div class="mk" data-id="${p.id}" style="left:${left}%;top:${top}%"><b>${shortPrice(p)}</b></div>`;
  });
  html += `<div class="map-ph-card"><i data-lucide="map" class="ico" style="width:30px;height:30px"></i><b>Vista de mapa</b><span>Activa tu <b>Google Maps API key</b> restringida por dominio para calcular pines desde Dirección pública.</span></div></div>`;
  panel.innerHTML = html;
  $$('.mk', panel).forEach(mk => {
    mk.addEventListener('mouseenter', () => highlightCard(mk.dataset.id));
    mk.addEventListener('click', () => { location.href = FICHA_URL + '?id=' + encodeURIComponent(mk.dataset.id); });
  });
  if (window.lucide) lucide.createIcons();
}
const MAP_STYLE = [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "simplified" }] }];

/* ---------- highlight sync ---------- */
function highlight(id, on) {
  if (gmap) { const m = markers.find(x => x._pid === id); if (m) m.setIcon(on ? { ...PIN, fillColor: '#4c1d95', scale: 1.5 } : PIN); }
  const mk = $(`.mk[data-id="${id}"]`); if (mk) mk.classList.toggle('hl', on);
}
function highlightCard(id) {
  $$('.pcardm').forEach(c => c.classList.toggle('hl', c.dataset.id === id));
  const c = $(`.pcardm[data-id="${id}"]`); if (c) c.scrollIntoView ? c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : null;
}

/* ---------- chips / eventos ---------- */
function syncChips() {
  $('#cvTipo').textContent = STATE.tipo ? `· ${STATE.tipo}` : '';
  if ($('#cvCond')) $('#cvCond').textContent = STATE.condicion ? `· ${STATE.condicion}` : '';
  $('#cvDorm').textContent = STATE.dorm ? `· ${STATE.dorm}+` : '';
  $('#cvBanos').textContent = STATE.banos ? `· ${STATE.banos}+` : '';
  const masN = STATE.eq.length + ((STATE.areaMin != null || STATE.areaMax != null) ? 1 : 0);
  $('#cvMas').textContent = masN ? `· ${masN}` : '';
  let pr = '';
  if (STATE.prMin != null || STATE.prMax != null) { const u = STATE.prMoneda === 'UF' ? 'UF' : '$'; pr = `· ${STATE.prMin != null ? u + GZ.nf.format(STATE.prMin) : ''}${STATE.prMin != null && STATE.prMax != null ? '–' : ''}${STATE.prMax != null ? (STATE.prMin == null ? 'hasta ' : '') + u + GZ.nf.format(STATE.prMax) : '+'}`; }
  $('#cvPrecio').textContent = pr;
  $$('.chip').forEach(ch => { const k = ch.dataset.pop; const active = (k === 'tipo' && STATE.tipo) || (k === 'condicion' && STATE.condicion) || (k === 'precio' && pr) || (k === 'dorm' && STATE.dorm) || (k === 'banos' && STATE.banos) || (k === 'mas' && STATE.eq.length); ch.classList.toggle('active', !!active); });
}

function buildEvents() {
  // abrir/cerrar popovers
  $$('.chip>button').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const chip = b.closest('.chip'); const wasOpen = chip.classList.contains('open');
    $$('.chip').forEach(c => c.classList.remove('open'));
    if (!wasOpen) chip.classList.add('open');
  }));
  document.addEventListener('click', e => { if (!e.target.closest('.chip')) $$('.chip').forEach(c => c.classList.remove('open')); });
  $$('.pop').forEach(p => p.addEventListener('click', e => e.stopPropagation()));

  // tipo
  pillGroup('#tipoPills', v => { STATE.tipo = v; apply(); closeChip('tipo'); });
  // condicion (Nuevo/Usado) — solo en Ventas
  if ($('#condPills')) pillGroup('#condPills', v => { STATE.condicion = v; apply(); closeChip('condicion'); });
  // banner de proyecto (cerrar)
  if ($('#projBannerClose')) $('#projBannerClose').addEventListener('click', () => { const b = $('#projBanner'); if (b) b.style.display = 'none'; });
  // dorm
  pillGroup('#dormPills', v => { STATE.dorm = +v; apply(); closeChip('dorm'); });
  // banos
  pillGroup('#banosPills', v => { STATE.banos = +v; apply(); closeChip('banos'); });
  // moneda
  $$('#monedaSeg button').forEach(b => b.addEventListener('click', () => { $$('#monedaSeg button').forEach(x => x.classList.remove('on')); b.classList.add('on'); STATE.prMoneda = b.dataset.m; }));
  // precio aplicar
  $('[data-pop="precio"] [data-apply]').addEventListener('click', () => { STATE.prMin = numOrNull($('#prMin').value); STATE.prMax = numOrNull($('#prMax').value); apply(); closeChip('precio'); });
  $('[data-clear="precio"]').addEventListener('click', () => { $('#prMin').value = ''; $('#prMax').value = ''; STATE.prMin = STATE.prMax = null; apply(); });
  // mas
  $('[data-pop="mas"] [data-apply]').addEventListener('click', () => { STATE.eq = $$('#eqGrid input:checked').map(i => i.value); STATE.areaMin = numOrNull($('#arMin').value); STATE.areaMax = numOrNull($('#arMax').value); apply(); closeChip('mas'); });
  $('[data-clear="mas"]').addEventListener('click', () => { $$('#eqGrid input').forEach(i => i.checked = false); STATE.eq = []; $('#arMin').value = ''; $('#arMax').value = ''; STATE.areaMin = STATE.areaMax = null; apply(); });

  // búsqueda
  let t; $('#qInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { STATE.q = e.target.value.trim(); apply(); }, 200); });
  // orden
  $('#sortSel').addEventListener('change', e => { STATE.sort = e.target.value; apply(); });
  // toggle lista/mapa (móvil)
  $$('#viewtoggle button').forEach(b => b.addEventListener('click', () => { $$('#viewtoggle button').forEach(x => x.classList.remove('on')); b.classList.add('on'); document.body.classList.toggle('show-map', b.dataset.view === 'mapa'); if (b.dataset.view === 'mapa' && gmap) setTimeout(() => google.maps.event.trigger(gmap, 'resize'), 100); }));
}
function pillGroup(sel, cb) { $$(sel + ' .pill').forEach(b => b.addEventListener('click', () => { $$(sel + ' .pill').forEach(x => x.classList.remove('on')); b.classList.add('on'); cb(b.dataset.v); })); }
function closeChip(k) { const c = $(`.chip[data-pop="${k}"]`); if (c) c.classList.remove('open'); }
function numOrNull(v) { v = String(v).replace(/[^\d]/g, ''); return v === '' ? null : +v; }

/* ============================================================
   MÓVIL — barra de acciones + bottom sheets (estilo Portal)
   ============================================================ */
function openSheet(id) { const s = $('#' + id); if (!s) return; s.classList.add('open'); document.body.style.overflow = 'hidden'; if (window.lucide) lucide.createIcons(); }
function closeSheet(s) { s.classList.remove('open'); if (!$$('.sheet.open').length) document.body.style.overflow = ''; }

function buildMobile() {
  // barra de acciones
  $('#mbViewBtn').addEventListener('click', () => toggleMap());
  $('#mbSearchBtn').addEventListener('click', () => { openSheet('searchSheet'); setTimeout(() => $('#mQInput').focus(), 120); });
  $('#mbFilterBtn').addEventListener('click', () => openSheet('filterSheet'));

  // cerrar sheets (fondo, X, botón)
  $$('.sheet [data-close]').forEach(b => b.addEventListener('click', () => closeSheet(b.closest('.sheet'))));

  // pills móviles → STATE en vivo
  pillGroup('#mTipoPills', v => { STATE.tipo = v; apply(); });
  if ($('#mCondPills')) pillGroup('#mCondPills', v => { STATE.condicion = v; apply(); });
  pillGroup('#mDormPills', v => { STATE.dorm = +v; apply(); });
  pillGroup('#mBanosPills', v => { STATE.banos = +v; apply(); });
  $$('#mMonedaSeg button').forEach(b => b.addEventListener('click', () => { STATE.prMoneda = b.dataset.m; reflectAll(); if (STATE.prMin != null || STATE.prMax != null) apply(); }));
  const onPr = () => { STATE.prMin = numOrNull($('#mPrMin').value); STATE.prMax = numOrNull($('#mPrMax').value); apply(); };
  let pt; $('#mPrMin').addEventListener('input', () => { clearTimeout(pt); pt = setTimeout(onPr, 250); });
  $('#mPrMax').addEventListener('input', () => { clearTimeout(pt); pt = setTimeout(onPr, 250); });
  $$('#mEqGrid input').forEach(i => i.addEventListener('change', () => { STATE.eq = $$('#mEqGrid input:checked').map(x => x.value); apply(); }));
  if ($('#mArMin')) { let at; const onAr = () => { STATE.areaMin = numOrNull($('#mArMin').value); STATE.areaMax = numOrNull($('#mArMax').value); apply(); }; $('#mArMin').addEventListener('input', () => { clearTimeout(at); at = setTimeout(onAr, 250); }); $('#mArMax').addEventListener('input', () => { clearTimeout(at); at = setTimeout(onAr, 250); }); }

  // pie del filtro
  $('#mFClear').addEventListener('click', () => { STATE.tipo = ''; STATE.condicion = ''; STATE.prMin = STATE.prMax = null; STATE.dorm = 0; STATE.banos = 0; STATE.areaMin = STATE.areaMax = null; STATE.eq = []; apply(); });
  $('#mFApply').addEventListener('click', () => closeSheet($('#filterSheet')));

  // búsqueda móvil
  let qt; $('#mQInput').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { STATE.q = e.target.value.trim(); markQuick(); apply(); }, 200); });
  $('#mQClear').addEventListener('click', () => { STATE.q = ''; markQuick(); apply(); });
  $('#mQApply').addEventListener('click', () => closeSheet($('#searchSheet')));

  buildQuickComunas();
}

function toggleMap() {
  const show = !document.body.classList.contains('show-map');
  document.body.classList.toggle('show-map', show);
  $('#mbViewLbl').textContent = show ? 'Ver listado' : 'Ver mapa';
  $('#mbViewBtn').querySelector('.ico').setAttribute('data-lucide', show ? 'layout-list' : 'map');
  if (window.lucide) lucide.createIcons();
  if (show && gmap) setTimeout(() => google.maps.event.trigger(gmap, 'resize'), 120);
}

function buildQuickComunas() {
  const wrap = $('#quickComunas'); if (!wrap) return;
  const counts = {};
  ALL.forEach(p => { if (p.commune) counts[p.commune] = (counts[p.commune] || 0) + 1; });
  const comunas = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  wrap.innerHTML = '';
  comunas.forEach(c => {
    const b = el('button', 'qc', `${c} <span style="opacity:.6">${counts[c]}</span>`);
    b.dataset.c = c;
    b.addEventListener('click', () => { STATE.q = (STATE.q.toLowerCase() === c.toLowerCase()) ? '' : c; markQuick(); apply(); });
    wrap.appendChild(b);
  });
  markQuick();
}
function markQuick() { $$('#quickComunas .qc').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === STATE.q.toLowerCase())); }

init();