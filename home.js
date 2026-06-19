/* ============================================================
   Corretaje Guzmán — Home
   ============================================================ */
const FICHA_URL = "Ficha Propiedad - Corretaje Guzman v2.html";
const $ = (s) => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

let ALL = [], filterOp = 'todos', view = 'lista', gmap = null, markers = [];

async function init() {
  await GZ.loadConfig();
  const { data, live } = await GZ.loadProperties();
  ALL = data;
  GZ.banner(live, data.length);
  stats();
  renderReviews(await GZ.loadReviews());
  render(); bind();
  if (window.lucide) lucide.createIcons();
}

function stats() {
  $('#stTotal').textContent = ALL.length;
  $('#stArr').textContent = ALL.filter(p => p.operation === 'arriendo').length;
  $('#stVen').textContent = ALL.filter(p => p.operation === 'venta').length;
}
function heroBg() { /* el fondo del hero es el departamento (CSS); no se sobreescribe */ }

function matches(p) {
  if (filterOp !== 'todos' && p.operation !== filterOp) return false;
  const tipo = $('#fTipo').value, com = $('#fComuna').value.trim().toLowerCase();
  if (tipo && (p.propertyType || '') !== tipo) return false;
  if (com) { const hay = `${p.commune || ''} ${p.address || ''} ${p.title || ''}`.toLowerCase(); if (!hay.includes(com)) return false; }
  return true;
}

function featRow(p) {
  return [
    p.bedrooms != null && `<span class="f"><i data-lucide="bed-double" class="ico"></i>${p.bedrooms}</span>`,
    p.bathrooms != null && `<span class="f"><i data-lucide="bath" class="ico"></i>${p.bathrooms}</span>`,
    p.usableArea != null && `<span class="f"><i data-lucide="ruler" class="ico"></i>${p.usableArea} m²</span>`,
    p.parking ? `<span class="f"><i data-lucide="car" class="ico"></i>${p.parking}</span>` : ''
  ].filter(Boolean).join('');
}
function card(p) {
  const a = el('a', 'pcardm');
  a.href = FICHA_URL + '?id=' + encodeURIComponent(p.id);
  a.innerHTML = `
    <div class="ph">
      <img src="${p.coverPhoto || (p.photos || [])[0] || ''}" alt="${p.title}" loading="lazy">
      <span class="tag">${GZ.opLabel(p)}</span>
    </div>
    <div class="bd">
      <div class="pr">${GZ.priceHTML(p)}</div>
      <div class="ti">${p.title}</div>
      <div class="ad"><i data-lucide="map-pin" class="ico"></i>${p.address || p.commune || ''}</div>
      <div class="ft">${featRow(p)}</div>
    </div>`;
  return a;
}

function render() {
  const list = ALL.filter(matches);
  $('#listView').style.display = view === 'lista' ? '' : 'none';
  $('#mapView').style.display = view === 'mapa' ? '' : 'none';
  document.querySelectorAll('.vtab').forEach(b => b.classList.toggle('on', b.dataset.v === view));

  if (view === 'lista') {
    const grid = $('#grid'); grid.innerHTML = '';
    if (!list.length) grid.appendChild(el('div', 'empty', 'No encontramos propiedades con esos filtros. Prueba con otra búsqueda.'));
    else list.forEach(p => grid.appendChild(card(p)));
  } else {
    const ml = $('#mapList'); ml.innerHTML = '';
    list.forEach(p => ml.appendChild(card(p)));
    $('#mapCount').textContent = `${list.length} propiedad${list.length === 1 ? '' : 'es'}`;
    drawMap(list);
  }
  if (window.lucide) lucide.createIcons();
}

/* ---------- mapa ---------- */
function loadGMaps(cb) {
  if (window.google && window.google.maps) return cb();
  if (!GZ.CFG.mapsKey) return cb();
  if (document.getElementById('gmaps-sdk')) { document.getElementById('gmaps-sdk').addEventListener('load', cb); return; }
  const s = document.createElement('script'); s.id = 'gmaps-sdk';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GZ.CFG.mapsKey)}&v=quarterly`;
  s.async = true; s.onload = cb; s.onerror = cb; document.head.appendChild(s);
}
function drawMap(list) {
  const panel = $('#map');
  loadGMaps(() => {
    if (!(window.google && window.google.maps) || !GZ.CFG.mapsKey) { panel.innerHTML = placeholderMap(list); if (window.lucide) lucide.createIcons(); return; }
    if (!gmap) {
      gmap = new google.maps.Map(panel, { center: { lat: -33.45, lng: -70.66 }, zoom: 11, mapTypeControl: false, streetViewControl: false, styles: MAP_STYLE });
    }
    markers.forEach(m => m.setMap(null)); markers = [];
    const bounds = new google.maps.LatLngBounds();
    list.forEach(p => {
      if (p.latitude == null || p.longitude == null) return;
      const pos = { lat: +p.latitude, lng: +p.longitude };
      const m = new google.maps.Marker({ position: pos, map: gmap, title: p.title, icon: PIN });
      const iw = new google.maps.InfoWindow({ content: `<div style="font-family:sans-serif;max-width:200px"><b>${p.title}</b><br>${GZ.priceText(p)}<br><a href="${FICHA_URL}?id=${encodeURIComponent(p.id)}">Ver ficha →</a></div>` });
      m.addListener('click', () => iw.open(gmap, m));
      markers.push(m); bounds.extend(pos);
    });
    if (markers.length) gmap.fitBounds(bounds, 60);
  });
}
function placeholderMap(list) {
  const conPin = list.filter(p => p.latitude != null).length;
  return `<div class="map-ph">
    <div class="map-ph-grid"></div>
    <div class="map-ph-card">
      <i data-lucide="map" class="ico" style="width:34px;height:34px"></i>
      <b>Vista de mapa</b>
      <span>${conPin} de ${list.length} propiedades con ubicación exacta. Activa tu <b>Google Maps API key</b> (restringida por dominio) para ver los pines en vivo.</span>
    </div>
  </div>`;
}
const PIN = {
  path: "M12 0C6.5 0 2 4.5 2 10c0 7 10 16 10 16s10-9 10-16C22 4.5 17.5 0 12 0z",
  fillColor: "#7c3aed", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2, scale: 1.3, anchor: { x: 12, y: 26 }
};
const MAP_STYLE = [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "simplified" }] }];

/* ---------- reseñas ---------- */
function stars(n) { return '<span class="stars">' + Array.from({ length: 5 }, (_, i) => `<i data-lucide="star" class="ico" style="width:17px;height:17px;${i < n ? 'fill:currentColor' : 'opacity:.25'}"></i>`).join('') + '</span>'; }
function renderReviews(list) {
  const wrap = $('#reviews'); if (!wrap) return;
  wrap.innerHTML = '';
  const items = list.slice(0, 6);
  items.forEach(r => {
    wrap.appendChild(el('div', 'review', `
      <div class="rv-quote"><i data-lucide="quote" class="ico"></i></div>
      <p>${r.text}</p>
      <div class="rv-top">
        <img src="${r.photo || 'https://i.pravatar.cc/120'}" alt="${r.name}" loading="lazy">
        <div><b>${r.name}</b>${stars(r.rating || 5)}</div>
        <span class="rv-src"><i data-lucide="facebook" class="ico" style="width:14px;height:14px"></i>Facebook</span>
      </div>`));
  });
  // dots / carrusel
  const dotsWrap = $('#reviewsDots');
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    items.forEach((_, i) => {
      const d = el('div', 'dot' + (i === 0 ? ' on' : ''));
      d.addEventListener('click', () => { const card = wrap.children[i]; if (card) wrap.scrollTo({ left: card.offsetLeft - wrap.offsetLeft, behavior: 'smooth' }); });
      dotsWrap.appendChild(d);
    });
    let raf;
    wrap.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = wrap.scrollLeft + wrap.clientWidth / 2;
        let best = 0, bestD = Infinity;
        [...wrap.children].forEach((c, i) => { const cc = c.offsetLeft - wrap.offsetLeft + c.clientWidth / 2; const dd = Math.abs(cc - center); if (dd < bestD) { bestD = dd; best = i; } });
        [...dotsWrap.children].forEach((d, i) => d.classList.toggle('on', i === best));
      });
    });
  }
  const link = $('#reviewsLink'); if (link) link.href = GZ.CFG.facebookReviews || '#';
}

/* ---------- eventos ---------- */
function bind() {
  $('#ftabs').addEventListener('click', e => { const b = e.target.closest('.ftab'); if (!b) return; filterOp = b.dataset.f; document.querySelectorAll('.ftab').forEach(x => x.classList.toggle('on', x === b)); render(); });
  $('#vtabs').addEventListener('click', e => { const b = e.target.closest('.vtab'); if (!b) return; view = b.dataset.v; render(); });
  $('#search').addEventListener('submit', e => { e.preventDefault(); applySearch('lista'); });
  $('#searchMap').addEventListener('click', () => applySearch('mapa'));
}
function applySearch(v) {
  const op = $('#fOp').value; filterOp = op || 'todos'; view = v;
  document.querySelectorAll('.ftab').forEach(x => x.classList.toggle('on', x.dataset.f === filterOp));
  render();
  const dest = document.getElementById('destacados');
  if (dest) window.scrollTo({ top: dest.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
}

init();
