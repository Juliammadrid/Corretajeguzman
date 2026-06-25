/* ============================================================
   Corretaje Guzmán — helpers compartidos (precio, WhatsApp,
   carga de datos, SEO, PWA y rutas limpias).
   ============================================================ */
(function () {
  const CFG = window.GUZMAN_CONFIG || {};
  const nf = new Intl.NumberFormat('es-CL');
  const FALLBACK_PHOTO = 'assets/home-apartamento.jpg';
  const SITE_ORIGIN = 'https://corretajeguzman.com';
  const BRAND_ICON = '/assets/guzman-logo.png?v=20260621-3';

  const style = document.createElement('style');
  style.textContent = '.dbanner{display:none!important}';
  document.head.appendChild(style);

  function ensureHeadTag(tag, attrs) {
    const selector = attrs.rel ? `${tag}[rel="${attrs.rel}"]` : (attrs.name ? `${tag}[name="${attrs.name}"]` : `${tag}[property="${attrs.property}"]`);
    let node = document.head.querySelector(selector);
    if (!node) { node = document.createElement(tag); document.head.appendChild(node); }
    Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    return node;
  }

  function installPwaMeta() {
    ensureHeadTag('link', { rel: 'manifest', href: '/site.webmanifest?v=20260621-3' });
    ensureHeadTag('link', { rel: 'icon', href: BRAND_ICON, type: 'image/png' });
    ensureHeadTag('link', { rel: 'shortcut icon', href: '/favicon.ico?v=20260621-3' });
    ensureHeadTag('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=20260621-3' });
    ensureHeadTag('link', { rel: 'apple-touch-icon-precomposed', href: '/apple-touch-icon-precomposed.png?v=20260621-3' });
    ensureHeadTag('meta', { name: 'theme-color', content: '#241b31' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-title', content: 'Guzmán' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    ensureHeadTag('meta', { name: 'msapplication-TileImage', content: BRAND_ICON });
    ensureHeadTag('meta', { name: 'msapplication-TileColor', content: '#050505' });
  }

  function priceText(p) {
    if (!p || p.priceValue == null) return 'Consultar precio';
    if (p.currency === 'UF') return 'UF ' + nf.format(p.priceValue);
    return '$' + nf.format(p.priceValue);
  }

  function ufApprox(p) {
    if (!p || p.currency !== 'UF' || !CFG.ufValueClp) return '';
    return '≈ $' + nf.format(Math.round(p.priceValue * CFG.ufValueClp));
  }

  function priceHTML(p, perClass) {
    if (p && p.operation === 'arriendo' && p.promo && /50\s*%/.test(p.promo)) {
      const half = '$' + nf.format(Math.round(p.priceValue / 2));
      const full = '$' + nf.format(p.priceValue);
      return `${half} <span class="${perClass || 'per'}">1er mes</span> <span class="uf-approx" style="text-decoration:line-through;opacity:.55;font-weight:600">${full}</span>`;
    }
    const per = p && p.operation === 'arriendo' ? ` <span class="${perClass || 'per'}">/ mes</span>` : '';
    const uf = ufApprox(p);
    const approx = uf ? ` <span class="uf-approx">${uf}</span>` : '';
    return `${priceText(p)}${approx}${per}`;
  }

  const perLabel = (p) => p && p.operation === 'arriendo' ? '/ mes' : '';
  const opLabel = (p) => p && p.operation === 'venta' ? 'En Venta' : 'En Arriendo';

  function waNumber() { return (CFG.whatsapp || '56944637680').replace(/[^0-9]/g, ''); }

  function waLink(p, broker) {
    const via = (broker && broker !== 'Vi la empresa en internet') ? `por ${broker}` : 'por la empresa en internet';
    const title = p && p.title ? p.title : 'una propiedad';
    const msg = `Hola, quiero más información sobre esta propiedad: ${title}. La vi ${via}.`;
    return `https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`;
  }

  const ICON_HINTS = { piscina:'waves', gimnasio:'dumbbell', quincho:'flame', estacionamiento:'square-parking', acceso:'shield-check', lavander:'washing-machine', suite:'door-open', cocina:'cooking-pot', termopanel:'blinds', 'piso flotante':'layers', bodega:'package', terraza:'sun', amoblad:'sofa', patio:'trees', vista:'eye', ascensor:'arrow-up-down', logia:'washing-machine' };
  function iconFor(t) { t = (t || '').toLowerCase(); for (const k in ICON_HINTS) if (t.includes(k)) return ICON_HINTS[k]; return 'check'; }

  async function fetchJSON(url) {
    try { const r = await fetch(url, { headers: { accept: 'application/json' } }); if (r.ok) return await r.json(); } catch (e) {}
    return null;
  }

  function validPhotoUrl(url) {
    return (typeof url === 'string' && /^https?:\/\//.test(url)) || (typeof url === 'string' && /^assets\//.test(url));
  }

  function cleanText(v) {
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function slugify(v) {
    return cleanText(v).replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'propiedad';
  }

  function propertySlugBase(p) {
    return [p && p.operation === 'venta' ? 'venta' : 'arriendo', (p && p.propertyType) || 'propiedad', (p && p.title) || '', (p && p.commune) || ''].filter(Boolean).join(' ');
  }

  function propertyPath(p) {
    if (!p) return '/propiedad';
    const id = encodeURIComponent(String(p.id || p.codigo || ''));
    return id ? `/propiedad?id=${id}` : '/propiedad';
  }

  function propertyCanonicalUrl(p) { return SITE_ORIGIN + propertyPath(p); }

  function propertyIdFromPath(pathname) {
    const params = new URLSearchParams(location.search || '');
    const queryId = params.get('id');
    if (queryId) return queryId;
    const path = decodeURIComponent(pathname || location.pathname || '');
    const match = path.match(/\/propiedad\/[^/?#]*-([^/?#]+)$/i);
    if (match && match[1]) return match[1];
    const rec = path.match(/(rec[a-z0-9]+)/i);
    if (rec && rec[1]) return rec[1];
    return '';
  }

  function normalizeOperation(p) {
    const text = `${(p && p.operation) || ''} ${(p && p.title) || ''} ${(p && p.source) || ''}`.toLowerCase();
    return text.includes('vent') ? 'venta' : 'arriendo';
  }

  function normalizePropertyType(p) {
    const raw = (p && (p.propertyType || p.tipo || p.type)) || '';
    const text = cleanText(`${raw} ${(p && p.title) || ''}`);
    if (/\b(parcela|terreno|lote|sitio)\b/.test(text)) return 'Parcela';
    if (/\b(local comercial|local|comercial)\b/.test(text)) return 'Local';
    if (/\b(casa|townhouse)\b/.test(text)) return 'Casa';
    if (/\b(oficina)\b/.test(text)) return 'Oficina';
    if (/\b(estudio|studio)\b/.test(text)) return 'Estudio';
    if (/\b(depto|departamento|dpto|apto|apartamento)\b/.test(text)) return 'Departamento';
    return raw ? String(raw).trim() : 'Departamento';
  }

  function applyCommercialOverrides(p) {
    if (!p) return p;
    const id = String(p.id || '').trim();
    const codigo = String(p.codigo || '').replace(/\D/g, '');
    const link = String(p.link || '');
    if (id === '5421' || codigo === '5421' || /\/5421(?:\D|$)/.test(link)) {
      p.priceValue = 300000;
      p.currency = 'CLP';
      p.description = String(p.description || '')
        .replace(/Valor\s*\$\s*400\.000/gi, 'Valor $300.000')
        .replace(/\$\s*400\.000/g, '$300.000')
        .replace(/400000/g, '300000');
    }
    return p;
  }

  function normalizeLoadedProperty(input) {
    const p = applyCommercialOverrides({ ...(input || {}) });
    const photos = Array.isArray(p.photos) ? p.photos.filter(validPhotoUrl) : [];
    if (validPhotoUrl(p.coverPhoto) && !photos.includes(p.coverPhoto)) photos.unshift(p.coverPhoto);
    if (!photos.length) photos.push(FALLBACK_PHOTO);
    const address = p.address || p.direccionPublica || p['Direccion publica'] || p['Dirección pública'] || '';
    const commune = p.commune || p.comuna || '';
    return {
      ...p,
      id: String(p.id || p.codigo || p.title || Math.random()),
      operation: normalizeOperation(p),
      address,
      commune,
      fullAddress: p.fullAddress || [address, commune, 'Chile'].filter(Boolean).join(', '),
      propertyType: normalizePropertyType(p),
      photos,
      coverPhoto: photos[0]
    };
  }

  function activeRentandoProperties() {
    const rentando = Array.isArray(window.GUZMAN_RENTANDO) ? window.GUZMAN_RENTANDO : [];
    return rentando.filter(p => p && p.activa !== false && (p.status || 'Disponible') !== 'Arrendada');
  }

  function mergeProperties(primary, extra) {
    const seen = new Set();
    return [...(primary || []), ...(extra || [])].filter(p => {
      const key = `${p.source || ''}:${p.id || ''}:${p.title || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function loadProperties() {
    let data = null, live = false;
    if (CFG.endpoint) {
      const j = await fetchJSON(CFG.endpoint);
      if (j) { data = Array.isArray(j) ? j : (j.propiedades || j.properties || j.records || null); if (data && data.length) live = true; }
    }
    if (!data || !data.length) data = window.GUZMAN_FALLBACK || [];
    const rentando = activeRentandoProperties();
    data = mergeProperties(data, rentando).map(normalizeLoadedProperty);
    window.GUZMAN_PROPERTIES_INDEX = data;
    return { data, live };
  }

  async function loadReviews() {
    if (CFG.reviewsEndpoint) {
      const j = await fetchJSON(CFG.reviewsEndpoint);
      const arr = j && (Array.isArray(j) ? j : (j.reviews || j.reseñas));
      if (arr && arr.length) return arr;
    }
    return window.GUZMAN_REVIEWS || [];
  }

  async function loadConfig() {
    if (CFG.configEndpoint) {
      const j = await fetchJSON(CFG.configEndpoint);
      if (j) { if (j.mapsKey) CFG.mapsKey = j.mapsKey; if (j.whatsapp) CFG.whatsapp = j.whatsapp; }
    }
    return CFG;
  }

  function banner() { const b = document.getElementById('dbanner'); if (b) b.style.display = 'none'; }

  const CLEAN_ROUTES = {
    'home - corretaje guzman.html':'/', 'home - corretaje guzman':'/', 'home%20-%20corretaje%20guzman.html':'/', 'home%20-%20corretaje%20guzman':'/',
    'arriendos - corretaje guzman.html':'/arriendos', 'arriendos - corretaje guzman':'/arriendos', 'arriendos%20-%20corretaje%20guzman.html':'/arriendos', 'arriendos%20-%20corretaje%20guzman':'/arriendos',
    'ventas - corretaje guzman.html':'/comprar', 'ventas - corretaje guzman':'/comprar', 'ventas%20-%20corretaje%20guzman.html':'/comprar', 'ventas%20-%20corretaje%20guzman':'/comprar',
    'parcelas - corretaje guzman.html':'/parcelas', 'parcelas - corretaje guzman':'/parcelas', 'parcelas%20-%20corretaje%20guzman.html':'/parcelas', 'parcelas%20-%20corretaje%20guzman':'/parcelas',
    'administracion de propiedades - corretaje guzman.html':'/administracion', 'administracion de propiedades - corretaje guzman':'/administracion', 'administracion%20de%20propiedades%20-%20corretaje%20guzman.html':'/administracion', 'administracion%20de%20propiedades%20-%20corretaje%20guzman':'/administracion',
    'quiero arrendar mi propiedad - corretaje guzman.html':'/propietarios', 'quiero arrendar mi propiedad - corretaje guzman':'/propietarios', 'quiero%20arrendar%20mi%20propiedad%20-%20corretaje%20guzman.html':'/propietarios', 'quiero%20arrendar%20mi%20propiedad%20-%20corretaje%20guzman':'/propietarios',
    'formulario de arriendo - corretaje guzman.html':'/solicitud', 'formulario de arriendo - corretaje guzman':'/solicitud', 'formulario%20de%20arriendo%20-%20corretaje%20guzman.html':'/solicitud', 'formulario%20de%20arriendo%20-%20corretaje%20guzman':'/solicitud',
    'se corredor - corretaje guzman.html':'/corredores', 'se corredor - corretaje guzman':'/corredores', 'se%20corredor%20-%20corretaje%20guzman.html':'/corredores', 'se%20corredor%20-%20corretaje%20guzman':'/corredores',
    'ficha propiedad - corretaje guzman v2.html':'/ficha', 'ficha propiedad - corretaje guzman v2':'/ficha', 'ficha%20propiedad%20-%20corretaje%20guzman%20v2.html':'/ficha', 'ficha%20propiedad%20-%20corretaje%20guzman%20v2':'/ficha'
  };

  function cleanInternalLinks(root) {
    const scope = root || document;
    scope.querySelectorAll('a[href]').forEach(a => {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('https://wa.me/')) return;
      try {
        const u = new URL(raw, location.origin);
        if (u.origin !== location.origin) return;
        const key = decodeURIComponent(u.pathname).replace(/^\/+/, '').toLowerCase();
        const rawKey = u.pathname.replace(/^\/+/, '').toLowerCase();
        const id = u.searchParams.get('id');
        const clean = CLEAN_ROUTES[key] || CLEAN_ROUTES[rawKey];
        if ((clean === '/ficha' || u.pathname === '/ficha') && id) {
          a.setAttribute('href', `/propiedad?id=${encodeURIComponent(id)}${u.hash}`);
          return;
        }
        if (u.pathname === '/propiedad' && id) {
          a.setAttribute('href', `/propiedad?id=${encodeURIComponent(id)}${u.hash}`);
          return;
        }
        if (clean) a.setAttribute('href', clean + u.search + u.hash);
      } catch (e) {}
    });
  }

  function startLinkCleaner() {
    installPwaMeta();
    cleanInternalLinks();
    if (!document.body || !window.MutationObserver) return;
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (!node || node.nodeType !== 1) return;
          if (node.matches && node.matches('a[href]')) cleanInternalLinks(node.parentNode || document);
          else if (node.querySelectorAll) cleanInternalLinks(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startLinkCleaner);
  else startLinkCleaner();

  window.GZ = { CFG, nf, priceText, ufApprox, priceHTML, perLabel, opLabel, waNumber, waLink, iconFor, slugify, propertyPath, propertyCanonicalUrl, propertyIdFromPath, loadConfig, loadProperties, loadReviews, banner, cleanInternalLinks };
})();
