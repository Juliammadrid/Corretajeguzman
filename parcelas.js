/* ============================================================
   Corretaje Guzmán — Parcelas (presentación natural, sin mapa)
   ============================================================ */
const FICHA_URL = "Ficha Propiedad - Corretaje Guzman v2.html";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const nf = new Intl.NumberFormat('es-CL');

const STATIC_PROJECTS = [{
  id: 'campo-alto-roble',
  title: 'Campo Alto Roble',
  project: 'Proyecto de parcelas',
  commune: 'Villarrica',
  address: 'Camino Villarrica–Pucón, 2ª faja',
  operation: 'parcela',
  currency: 'UF',
  priceValue: 2400,
  surfaceTotal: 5000,
  coverPhoto: 'assets/parc/car-hero.jpg',
  photos: ['assets/parc/car-hero.jpg'],
  features: ['5.000 m²', 'Urbanizado', 'Agua', 'Electricidad', 'Fibra óptica'],
  detailUrl: '/parcelas/campo-alto-roble',
  featuredProject: true,
  projectLead: 'Parcelas urbanizadas de 5.000 m² con agua, electricidad y fibra óptica, a minutos de Villarrica.',
  coverPhoto: '/.netlify/images?url=/assets/parc/car-hero.jpg&w=1600&h=900&fit=cover&q=82'
}];

let ALL = [];
const STATE = { q: '', supMin: 0, supMax: null, prMin: null, prMax: null, prMoneda: 'UF', sector: '', carac: [], sort: 'rel' };

async function init() {
  await GZ.loadConfig();

  // El proyecto propio se muestra sin esperar la respuesta de Airtable.
  const propertiesPromise = GZ.loadProperties();
  ALL = [...STATIC_PROJECTS];
  buildSectorPills();
  buildEvents();
  updateSummary();
  apply();

  const { data, live } = await propertiesPromise;
  ALL = [...STATIC_PROJECTS, ...data.filter(p => p.operation === 'parcela')];
  GZ.banner(live, ALL.length);
  buildSectorPills();
  updateSummary();
  apply();
  if (window.lucide) lucide.createIcons();
}

function updateSummary() {
  $('#hsTotal').textContent = ALL.length;
  $('#hsSectores').textContent = new Set(ALL.map(p => p.commune).filter(Boolean)).size || '—';
}

/* ---------- precio helpers ---------- */
function priceInMoneda(p, m) {
  const uf = GZ.CFG.ufValueClp || 39200;
  if (m === 'UF') return p.currency === 'UF' ? p.priceValue : (p.priceValue / uf);
  return p.currency === 'UF' ? (p.priceValue * uf) : p.priceValue;
}
function priceText(p) { return p.currency === 'UF' ? 'UF ' + nf.format(p.priceValue) : '$' + nf.format(p.priceValue); }
function approxText(p) {
  const uf = GZ.CFG.ufValueClp || 39200;
  if (p.currency === 'UF') return '≈ $' + nf.format(Math.round(p.priceValue * uf));
  return '≈ UF ' + nf.format(Math.round(p.priceValue / uf));
}
function surfText(p) {
  const m = p.surfaceTotal || 0;
  if (m >= 10000) return (m / 10000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ha';
  return nf.format(m) + ' m²';
}
function detailHref(p) {
  return p.detailUrl || (FICHA_URL + '?id=' + encodeURIComponent(p.id));
}

/* ---------- filtros ---------- */
function matches(p) {
  if (STATE.q) { const hay = `${p.commune || ''} ${p.address || ''} ${p.title || ''} ${p.project || ''}`.toLowerCase(); if (!hay.includes(STATE.q.toLowerCase())) return false; }
  const s = p.surfaceTotal || 0;
  if (STATE.supMin && s < STATE.supMin) return false;
  if (STATE.supMax != null && s > STATE.supMax) return false;
  if (STATE.sector && (p.commune || '') !== STATE.sector) return false;
  if (STATE.prMin != null || STATE.prMax != null) {
    const v = priceInMoneda(p, STATE.prMoneda);
    if (STATE.prMin != null && v < STATE.prMin) return false;
    if (STATE.prMax != null && v > STATE.prMax) return false;
  }
  if (STATE.carac.length) {
    const f = (p.features || []).map(x => x.toLowerCase());
    for (const c of STATE.carac) if (!f.some(x => x.includes(c.toLowerCase()))) return false;
  }
  return true;
}
function sortList(list) {
  const s = STATE.sort, cl = (p) => priceInMoneda(p, 'CLP') || 0;
  if (s === 'priceAsc') list.sort((a, b) => cl(a) - cl(b));
  else if (s === 'priceDesc') list.sort((a, b) => cl(b) - cl(a));
  else if (s === 'surfDesc') list.sort((a, b) => (b.surfaceTotal || 0) - (a.surfaceTotal || 0));
  return list;
}

function apply() {
  const list = sortList(ALL.filter(matches));
  render(list);
  $('#count').innerHTML = `<b>${list.length}</b> parcela${list.length === 1 ? '' : 's'} disponible${list.length === 1 ? '' : 's'}`;
  syncChips();
  if (window.lucide) lucide.createIcons();
}

/* ---------- render: destacada + grid ---------- */
function render(list) {
  const featWrap = $('#featWrap'), grid = $('#grid');
  featWrap.innerHTML = ''; grid.innerHTML = '';
  if (!list.length) {
    grid.appendChild(el('div', 'empty', `<i data-lucide="search-x" class="ico"></i><div>No encontramos parcelas con estos filtros.<br>Prueba ampliando la superficie o el precio.</div>`));
    return;
  }
  // El proyecto se presenta primero y a mayor escala; las demás parcelas conservan su grilla.
  const project = list.find(p => p.featuredProject);
  let rest = project ? list.filter(p => p.id !== project.id) : list;
  if (project) featWrap.appendChild(featCard(project));
  const showFeat = rest.length >= 4 && !STATE.q && !STATE.carac.length && !STATE.sector;
  if (showFeat) {
    const feat = [...rest].sort((a, b) => (b.surfaceTotal || 0) - (a.surfaceTotal || 0))[0];
    featWrap.appendChild(featCard(feat));
    rest = rest.filter(p => p.id !== feat.id);
  }
  rest.forEach(p => grid.appendChild(card(p)));
}

function featCard(p) {
  const a = el('a', 'feat' + (p.featuredProject ? ' feat-project' : ''));
  a.href = detailHref(p);
  const chars = (p.features || []).slice(0, 4).map(f => `<span class="fc">${f}</span>`).join('');
  a.innerHTML = `
    <img src="${p.coverPhoto || (p.photos || [])[0] || ''}" alt="${p.title}">
    <div class="feat-body">
      <span class="ftag"><i data-lucide="${p.featuredProject ? 'land-plot' : 'star'}" class="ico"></i>${p.featuredProject ? 'Proyecto destacado' : 'Parcela destacada'}</span>
      <h2>${p.title}</h2>
      <div class="fmeta"><i data-lucide="map-pin" class="ico"></i>${p.address || p.commune || ''}</div>
      ${p.projectLead ? `<p class="feat-copy">${p.projectLead}</p>` : ''}
      <div class="fchars">${chars}</div>
      <div class="frow">
        <div class="fprice">${priceText(p)}<span>${surfText(p)} · ${approxText(p)}</span></div>
        <span class="btn btn-light"><i data-lucide="arrow-right" class="ico" style="width:16px;height:16px"></i>Ver parcela</span>
      </div>
    </div>`;
  return a;
}

function card(p) {
  const a = el('a', 'pcard');
  a.href = detailHref(p);
  const chars = (p.features || []).slice(0, 3).map(f => `<span class="c">${f}</span>`).join('');
  a.innerHTML = `
    <div class="img">
      <span class="surf"><i data-lucide="ruler" class="ico"></i>${surfText(p)}</span>
      <img src="${p.coverPhoto || (p.photos || [])[0] || ''}" alt="${p.title}" loading="lazy">
      <div class="on-img">${p.project ? `<div class="proj">${p.project}</div>` : ''}<h3>${p.title}</h3></div>
    </div>
    <div class="bd">
      <div class="loc"><i data-lucide="map-pin" class="ico"></i>${p.address || p.commune || ''}</div>
      <div class="chars">${chars}</div>
      <div class="foot">
        <div class="price">${priceText(p)}<span class="approx">${approxText(p)}</span></div>
        <span class="go">Ver más<i data-lucide="arrow-right" class="ico"></i></span>
      </div>
    </div>`;
  return a;
}

/* ---------- sector pills (dinámico) ---------- */
function buildSectorPills() {
  const wrap = $('#sectorPills'); if (!wrap) return;
  const comunas = [...new Set(ALL.map(p => p.commune).filter(Boolean))].sort();
  wrap.innerHTML = '<button class="pill on" data-v="">Todas</button>';
  comunas.forEach(c => { const b = el('button', 'pill', c); b.dataset.v = c; wrap.appendChild(b); });
  $$('#sectorPills .pill').forEach(b => b.addEventListener('click', () => {
    $$('#sectorPills .pill').forEach(x => x.classList.remove('on')); b.classList.add('on');
    STATE.sector = b.dataset.v; apply(); closeChip('sector');
  }));
}

/* ---------- chips estado ---------- */
function syncChips() {
  $('#cvSup').textContent = (STATE.supMin || STATE.supMax != null) ? '·' : '';
  $('#cvSector').textContent = STATE.sector ? `· ${STATE.sector}` : '';
  $('#cvCarac').textContent = STATE.carac.length ? `· ${STATE.carac.length}` : '';
  let pr = '';
  if (STATE.prMin != null || STATE.prMax != null) { const u = STATE.prMoneda === 'UF' ? 'UF ' : '$'; pr = `· ${STATE.prMin != null ? u + nf.format(STATE.prMin) : ''}${STATE.prMin != null && STATE.prMax != null ? '–' : ''}${STATE.prMax != null ? (STATE.prMin == null ? 'hasta ' : '') + u + nf.format(STATE.prMax) : '+'}`; }
  $('#cvPrecio').textContent = pr;
  $$('.chip').forEach(ch => {
    const k = ch.dataset.pop;
    const active = (k === 'superficie' && (STATE.supMin || STATE.supMax != null)) || (k === 'precio' && pr) || (k === 'sector' && STATE.sector) || (k === 'carac' && STATE.carac.length);
    ch.classList.toggle('active', !!active);
  });
}

/* ---------- eventos ---------- */
function buildEvents() {
  $$('.chip>button').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const chip = b.closest('.chip'); const wasOpen = chip.classList.contains('open');
    $$('.chip').forEach(c => c.classList.remove('open'));
    if (!wasOpen) chip.classList.add('open');
  }));
  document.addEventListener('click', e => { if (!e.target.closest('.chip')) $$('.chip').forEach(c => c.classList.remove('open')); });
  $$('.pop').forEach(p => p.addEventListener('click', e => e.stopPropagation()));

  // superficie
  $$('#supPills .pill').forEach(b => b.addEventListener('click', () => {
    $$('#supPills .pill').forEach(x => x.classList.remove('on')); b.classList.add('on');
    STATE.supMin = +b.dataset.min || 0; STATE.supMax = b.dataset.max === '' ? null : +b.dataset.max;
    apply(); closeChip('superficie');
  }));
  // moneda
  $$('#monedaSeg button').forEach(b => b.addEventListener('click', () => { $$('#monedaSeg button').forEach(x => x.classList.remove('on')); b.classList.add('on'); STATE.prMoneda = b.dataset.m; }));
  // precio
  $('[data-pop="precio"] [data-apply]').addEventListener('click', () => { STATE.prMin = numOrNull($('#prMin').value); STATE.prMax = numOrNull($('#prMax').value); apply(); closeChip('precio'); });
  $('[data-clear="precio"]').addEventListener('click', () => { $('#prMin').value = ''; $('#prMax').value = ''; STATE.prMin = STATE.prMax = null; apply(); });
  // caracteristicas
  $('[data-pop="carac"] [data-apply]').addEventListener('click', () => { STATE.carac = $$('#caracGrid input:checked').map(i => i.value); apply(); closeChip('carac'); });
  $('[data-clear="carac"]').addEventListener('click', () => { $$('#caracGrid input').forEach(i => i.checked = false); STATE.carac = []; apply(); });
  // búsqueda
  let t; $('#qInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { STATE.q = e.target.value.trim(); apply(); }, 200); });
  // orden
  $('#sortSel').addEventListener('change', e => { STATE.sort = e.target.value; apply(); });
}
function closeChip(k) { const c = $(`.chip[data-pop="${k}"]`); if (c) c.classList.remove('open'); }
function numOrNull(v) { v = String(v).replace(/[^\d]/g, ''); return v === '' ? null : +v; }

init();
