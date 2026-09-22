/* ============================================================
   Corretaje Guzman — Home
   ============================================================ */
const FICHA_URL = "Ficha Propiedad - Corretaje Guzman v2.html";
const $ = (s) => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const HOME_FEATURED_LIMIT = 12;

let ALL = [], filterOp = 'todos', view = 'lista', gmap = null, markers = [], geocoder = null, mapRenderRun = 0;
const GEO_CACHE = new Map();

const COMMUNE_COORDS = {
  santiago: [-33.4489, -70.6693],
  'santiago centro': [-33.4489, -70.6693],
  independencia: [-33.4159, -70.6659],
  nunoa: [-33.4569, -70.5986],
  'ñuñoa': [-33.4569, -70.5986],
  providencia: [-33.4314, -70.6093],
  'las condes': [-33.4088, -70.5671],
  'la reina': [-33.4469, -70.5340],
  macul: [-33.4866, -70.5992],
  'la florida': [-33.5225, -70.5983],
  'san miguel': [-33.5008, -70.6510],
  'estacion central': [-33.4622, -70.6985],
  'estación central': [-33.4622, -70.6985],
  'quinta normal': [-33.4284, -70.6992],
  maipu: [-33.5100, -70.7569],
  'maipú': [-33.5100, -70.7569],
  'puente alto': [-33.6117, -70.5758],
  'san bernardo': [-33.5922, -70.6996],
  colina: [-33.2047, -70.6744],
  lampa: [-33.2863, -70.8756],
  buin: [-33.7306, -70.7428],
  curacavi: [-33.4007, -71.1276],
  villarica: [-39.2857, -72.2279],
  villarrica: [-39.2857, -72.2279]
};

async function init() {
  await GZ.loadConfig();
  const { data, live } = await GZ.loadProperties();
  ALL = data;
  GZ.banner(live, data.length);
  cleanHeroStats();
  stats();
  renderReviews(await GZ.loadReviews());
  bindLiveCatalog();
  render(); renderHomeProjectExtras(); bind();
  if (window.lucide) lucide.createIcons();
}

function bindLiveCatalog() {
  window.addEventListener('guzman:properties-updated', function (event) {
    const data = event && event.detail && Array.isArray(event.detail.data) ? event.detail.data : null;
    if (!data || !data.length) return;
    if (data.length <= ALL.length && ALL.some(p => p.operation === 'venta')) return;
    ALL = data;
    stats();
    render();
    if (window.lucide) lucide.createIcons();
  });
}

function cleanHeroStats() {
  const statsBox = document.querySelector('.hero-stats');
  if (statsBox) statsBox.removeAttribute('style');
  document.querySelectorAll('.hero-stats [style]').forEach(n => n.removeAttribute('style'));
}

function stats() {
  $('#stTotal').textContent = ALL.length;
  $('#stArr').textContent = ALL.filter(p => p.operation === 'arriendo').length;
  $('#stVen').textContent = ALL.filter(p => p.operation === 'venta').length;
}
function heroBg() { /* el fondo del hero es el departamento (CSS); no se sobreescribe */ }

function normText(v) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function approxCoordsFor(p, index) {
  const key = normText(`${p.commune || ''} ${p.fullAddress || ''} ${p.address || ''}`) || 'santiago';
  let found = Object.keys(COMMUNE_COORDS).find(k => key.includes(k));
  let pair = found ? COMMUNE_COORDS[found] : COMMUNE_COORDS.santiago;
  const spread = 0.012;
  const angle = (index * 137.5) * Math.PI / 180;
  const radius = spread * (0.35 + (index % 7) / 8);
  return { lat: pair[0] + Math.sin(angle) * radius, lng: pair[1] + Math.cos(angle) * radius, exact: false };
}
function publicAddressFor(p) {
  const address = p.fullAddress || [p.address, p.commune, 'Chile'].filter(Boolean).join(', ');
  return String(address || '').replace(/,\s*,/g, ',').trim();
}
async function coordsFor(p, index) {
  if (p.latitude != null && p.longitude != null) return { lat: +p.latitude, lng: +p.longitude, exact: true, source: 'airtable' };
  const address = publicAddressFor(p);
  if (!address || !(window.google && google.maps)) return approxCoordsFor(p, index);
  const cacheKey = normText(address);
  if (GEO_CACHE.has(cacheKey)) return GEO_CACHE.get(cacheKey);
  try {
    geocoder = geocoder || new google.maps.Geocoder();
    const result = await new Promise(resolve => {
      geocoder.geocode({ address, componentRestrictions: { country: 'CL' } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng(), exact: true, source: 'google' });
        } else {
          resolve(null);
        }
      });
    });
    const pos = result || approxCoordsFor(p, index);
    GEO_CACHE.set(cacheKey, pos);
    return pos;
  } catch (e) {
    const pos = approxCoordsFor(p, index);
    GEO_CACHE.set(cacheKey, pos);
    return pos;
  }
}

function matches(p) {
  if (filterOp !== 'todos' && p.operation !== filterOp) return false;
  const tipo = $('#fTipo').value, com = normText($('#fComuna').value);
  if (tipo && normText(p.propertyType) !== normText(tipo)) return false;
  if (com) {
    const hay = normText(`${p.commune || ''} ${p.address || ''} ${p.fullAddress || ''} ${p.title || ''}`);
    if (!hay.includes(com)) return false;
  }
  return true;
}

function isVillarrica(p) {
  return normText(`${p.commune || ''} ${p.address || ''} ${p.fullAddress || ''} ${p.title || ''}`).includes('villarrica') ||
         normText(`${p.commune || ''} ${p.address || ''} ${p.fullAddress || ''} ${p.title || ''}`).includes('villarica');
}

function featuredScore(p) {
  const text = normText(`${p.commune || ''} ${p.address || ''} ${p.fullAddress || ''} ${p.title || ''} ${p.propertyType || ''}`);
  let score = 0;

  if (isVillarrica(p)) score += 1000;
  if (p.operation === 'arriendo') score -= 20;

  // Prioridad comercial solicitada: casa La Florida $580.000 o alternativas de Santiago/RM.
  if (text.includes('la florida') && Number(p.priceValue) === 580000) score -= 220;
  if (text.includes('casa') && text.includes('la florida')) score -= 170;
  if (text.includes('santiago')) score -= 140;
  if (text.includes('la florida')) score -= 120;
  if (text.includes('nunoa') || text.includes('ñuñoa')) score -= 100;
  if (text.includes('san miguel') || text.includes('providencia') || text.includes('macul') || text.includes('estacion central') || text.includes('estación central') || text.includes('quinta normal') || text.includes('puente alto')) score -= 70;

  return score;
}

function orderFeatured(list) {
  return list.map((p, i) => ({ p, i, score: featuredScore(p) }))
    .sort((a, b) => (a.score - b.score) || (a.i - b.i))
    .map(x => x.p);
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
function compactCard(p) {
  const a = el('a', 'pcardm map-compact');
  a.href = FICHA_URL + '?id=' + encodeURIComponent(p.id);
  a.innerHTML = `
    <div class="bd">
      <div class="pr">${GZ.priceHTML(p)}</div>
      <div class="ti">${p.title}</div>
      <div class="ad"><i data-lucide="map-pin" class="ico"></i>${p.address || p.commune || ''}</div>
    </div>`;
  return a;
}

function render() {
  const list = ALL.filter(matches);
  const ordered = orderFeatured(list);
  const visible = ordered.slice(0, HOME_FEATURED_LIMIT);
  $('#listView').style.display = view === 'lista' ? '' : 'none';
  $('#mapView').style.display = view === 'mapa' ? '' : 'none';
  document.querySelectorAll('.vtab').forEach(b => b.classList.toggle('on', b.dataset.v === view));

  if (view === 'lista') {
    const grid = $('#grid'); grid.innerHTML = '';
    if (!list.length) grid.appendChild(el('div', 'empty', 'No encontramos propiedades con esos filtros. Prueba con otra búsqueda.'));
    else visible.forEach(p => grid.appendChild(card(p)));
  } else {
    const ml = $('#mapList'); ml.innerHTML = '';
    visible.forEach(p => ml.appendChild(compactCard(p)));
    if (list.length > visible.length) ml.appendChild(el('div', 'empty', `Mostrando ${visible.length} de ${list.length}. Usa filtros para acotar la búsqueda.`));
    $('#mapCount').textContent = `${list.length} propiedad${list.length === 1 ? '' : 'es'}`;
    drawMap(ordered);
  }
  if (window.lucide) lucide.createIcons();
}


function renderHomeProjectExtras() {
  if (document.getElementById('home-projects-extras')) return;
  const featured = document.getElementById('destacados');
  if (!featured) return;

  const section = document.createElement('section');
  section.id = 'home-projects-extras';
  section.className = 'home-projects-extras';
  section.innerHTML = \`
    <style>
      .home-projects-extras{padding:78px 0;background:linear-gradient(180deg,#f3f0f8 0%,#ece6f6 100%)}
      .home-extras-head{max-width:720px;margin-bottom:26px}.home-extras-head p{color:var(--ink-2);margin-top:10px;font-size:17px}
      .home-extras-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
      .home-extras-card{min-width:0;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff;box-shadow:var(--shadow-sm);text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s}
      .home-extras-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
      .home-extras-card img{display:block;width:100%;height:205px;object-fit:cover;background:#e6dfef}
      .home-extras-card-body{padding:18px}.home-extras-tag{display:inline-flex;background:var(--violet-tint);color:var(--violet-d);border-radius:99px;padding:5px 9px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      .home-extras-card h3{font-size:20px;margin:10px 0 6px}.home-extras-card p{color:var(--ink-2);font-size:15px}.home-extras-price{color:var(--violet);font-weight:800;font-size:18px;margin-top:12px}.home-extras-cta{display:flex;align-items:center;gap:7px;color:var(--violet);font-weight:800;margin-top:14px}
      .home-calc-band{margin-top:26px;border-radius:18px;padding:26px 28px;color:#fff;background:linear-gradient(115deg,#1d1630,#512495 60%,#7c3aed);display:flex;align-items:center;justify-content:space-between;gap:24px}
      .home-calc-band h3{font-size:24px}.home-calc-band p{margin-top:5px;opacity:.86}.home-calc-band a{display:inline-flex;white-space:nowrap;align-items:center;justify-content:center;padding:12px 17px;border-radius:10px;background:#fff;color:#5427a4;text-decoration:none;font-weight:800}
      .home-parcel-band{margin-top:20px;min-height:240px;border-radius:18px;overflow:hidden;background:linear-gradient(90deg,rgba(19,39,30,.92),rgba(19,39,30,.42)),url('/assets/parc/car-hero.jpg') center/cover;display:flex;align-items:end;padding:28px;color:#fff}
      .home-parcel-band h3{font-size:27px}.home-parcel-band p{margin:5px 0 14px;max-width:580px}.home-parcel-band a{display:inline-flex;padding:11px 16px;border-radius:9px;background:#fff;color:#163528;text-decoration:none;font-weight:800}
      @media(max-width:780px){.home-projects-extras{padding:54px 0}.home-extras-grid{grid-template-columns:1fr}.home-extras-card img{height:190px}.home-calc-band{padding:22px;align-items:flex-start;flex-direction:column}.home-calc-band h3{font-size:22px}.home-parcel-band{min-height:225px;padding:22px}.home-parcel-band h3{font-size:24px}}
    </style>
    <div class="wrap">
      <div class="home-extras-head">
        <span class="eyebrow">Proyectos nuevos</span>
        <h2>Encuentra tu próximo hogar</h2>
        <p>Conoce nuestros proyectos inmobiliarios disponibles para compra en Ñuñoa.</p>
      </div>
      <div class="home-extras-grid">
        <a class="home-extras-card" href="/proyectos/metropolitan-park-nunoa/">
          <img src="/assets/proy/metropolitan-park-nunoa/proyecto-metropolitan-park-nunoa.jpg" alt="Proyecto Metropolitan Park Ñuñoa">
          <div class="home-extras-card-body"><span class="home-extras-tag">Entrega futura</span><h3>Metropolitan Park Ñuñoa</h3><p>Ñuñoa, Santiago</p><div class="home-extras-price">Desde UF 3.919</div><span class="home-extras-cta">Ver proyecto →</span></div>
        </a>
        <a class="home-extras-card" href="/proyectos/smart-too/">
          <img src="/assets/proy/smart-too/smart-too-banner-hd.jpg" alt="Proyecto Smart Too Ñuñoa">
          <div class="home-extras-card-body"><span class="home-extras-tag">Entrega inmediata</span><h3>Smart Too Ñuñoa</h3><p>Ñuñoa, Santiago</p><div class="home-extras-price">Desde UF 3.528</div><span class="home-extras-cta">Ver proyecto →</span></div>
        </a>
        <a class="home-extras-card" href="/proyectos/all-nunoa-2/">
          <img src="/assets/proy/all-nunoa-2/all-nunoa-2-hero.jpg" alt="Proyecto All Ñuñoa II">
          <div class="home-extras-card-body"><span class="home-extras-tag">Entrega inmediata</span><h3>All Ñuñoa II</h3><p>Ñuñoa, Santiago</p><div class="home-extras-price">Desde UF 7.689</div><span class="home-extras-cta">Ver proyecto →</span></div>
        </a>
      </div>
      <div class="home-calc-band">
        <div><h3>Calcula tu capacidad de compra</h3><p>Obtén una estimación referencial y conoce los proyectos que calzan con tu presupuesto.</p></div>
        <a href="/simulador-capacidad/">Calcular ahora →</a>
      </div>
      <div class="home-parcel-band">
        <div><span class="home-extras-tag">Campo Alto Roble</span><h3>Parcelas con naturaleza y conectividad</h3><p>36 parcelas disponibles en Villarrica, desde UF 2.400.</p><a href="/parcelas/campo-alto-roble">Ver parcelas →</a></div>
      </div>
    </div>\`;
  featured.insertAdjacentElement('afterend', section);
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
  const run = ++mapRenderRun;
  loadGMaps(async () => {
    if (!(window.google && window.google.maps) || !GZ.CFG.mapsKey) { panel.innerHTML = placeholderMap(list); if (window.lucide) lucide.createIcons(); return; }
    if (!gmap) {
      gmap = new google.maps.Map(panel, { center: { lat: -33.45, lng: -70.66 }, zoom: 11, mapTypeControl: false, streetViewControl: false, styles: MAP_STYLE });
    }
    markers.forEach(m => m.setMap(null)); markers = [];
    const bounds = new google.maps.LatLngBounds();
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      if (run !== mapRenderRun) return;
      const p = list[i];
      const c = await coordsFor(p, i);
      const pos = { lat: c.lat, lng: c.lng };
      const m = new google.maps.Marker({ position: pos, map: gmap, title: p.title, icon: c.exact ? PIN : APPROX_PIN });
      const precision = c.exact ? 'Ubicación calculada desde dirección pública' : 'Ubicación aproximada por comuna';
      const iw = new google.maps.InfoWindow({ content: `<div style="font-family:sans-serif;max-width:220px"><b>${p.title}</b><br>${GZ.priceText(p)}<br><small style="color:#6b6280">${precision}</small><br><a href="${FICHA_URL}?id=${encodeURIComponent(p.id)}" style="color:#7c3aed;font-weight:700">Ver ficha →</a></div>` });
      m.addListener('click', () => iw.open(gmap, m));
      markers.push(m); bounds.extend(pos); n++;
    }
    if (n) gmap.fitBounds(bounds, 60);
  });
}
function placeholderMap(list) {
  const conPin = list.length;
  return `<div class="map-ph">
    <div class="map-ph-grid"></div>
    <div class="map-ph-card">
      <i data-lucide="map" class="ico" style="width:34px;height:34px"></i>
      <b>Vista de mapa</b>
      <span>${conPin} propiedades listas para mapa. El sitio puede calcular pines automáticamente desde Dirección pública usando Google Maps.</span>
    </div>
  </div>`;
}
const PIN = {
  path: "M12 0C6.5 0 2 4.5 2 10c0 7 10 16 10 16s10-9 10-16C22 4.5 17.5 0 12 0z",
  fillColor: "#7c3aed", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2, scale: 1.3, anchor: { x: 12, y: 26 }
};
const APPROX_PIN = { ...PIN, fillColor: '#9b7cf0', fillOpacity: .9 };
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
