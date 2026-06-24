export default async function handler(request, context) {
  const response = await context.next();
  const body = await response.text();

  const patch = `

/* Performance patch — catálogo rápido + actualización Airtable en segundo plano */
(function () {
  if (!window.GZ) return;
  var CFG = window.GZ.CFG || window.GUZMAN_CONFIG || {};
  var FALLBACK_PHOTO = 'assets/home-apartamento.jpg';
  var backgroundStarted = false;

  function validPhotoUrl(url) {
    return (typeof url === 'string' && /^https?:\\/\\//.test(url)) || (typeof url === 'string' && /^assets\\//.test(url));
  }
  function cleanText(v) {
    return String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
  }
  function normalizeOperation(p) {
    var text = String((p && p.operation) || '') + ' ' + String((p && p.title) || '') + ' ' + String((p && p.source) || '');
    return text.toLowerCase().includes('vent') ? 'venta' : 'arriendo';
  }
  function normalizePropertyType(p) {
    var raw = (p && (p.propertyType || p.tipo || p.type)) || '';
    var text = cleanText(String(raw) + ' ' + String((p && p.title) || ''));
    if (/\\b(parcela|terreno|lote|sitio)\\b/.test(text)) return 'Parcela';
    if (/\\b(local comercial|local|comercial)\\b/.test(text)) return 'Local';
    if (/\\b(casa|townhouse)\\b/.test(text)) return 'Casa';
    if (/\\b(oficina)\\b/.test(text)) return 'Oficina';
    if (/\\b(estudio|studio)\\b/.test(text)) return 'Estudio';
    if (/\\b(depto|departamento|dpto|apto|apartamento)\\b/.test(text)) return 'Departamento';
    return raw ? String(raw).trim() : 'Departamento';
  }
  function applyCommercialOverrides(p) {
    if (!p) return p;
    var id = String(p.id || '').trim();
    var codigo = String(p.codigo || '').replace(/\\D/g, '');
    var link = String(p.link || '');
    if (id === '5421' || codigo === '5421' || /\\/5421(?:\\D|$)/.test(link)) {
      p.priceValue = 300000;
      p.currency = 'CLP';
      if (typeof p.description === 'string') {
        p.description = p.description
          .replace(/Valor\\s*\\$\\s*400\\.000/gi, 'Valor $300.000')
          .replace(/\\$\\s*400\\.000/g, '$300.000')
          .replace(/400000/g, '300000');
      }
    }
    return p;
  }
  function normalizeLoadedProperty(input) {
    var p = applyCommercialOverrides(Object.assign({}, input || {}));
    var photos = Array.isArray(p.photos) ? p.photos.filter(validPhotoUrl) : [];
    if (validPhotoUrl(p.coverPhoto) && photos.indexOf(p.coverPhoto) < 0) photos.unshift(p.coverPhoto);
    if (!photos.length) photos.push(FALLBACK_PHOTO);
    var address = p.address || p.direccionPublica || p['Direccion publica'] || p['Dirección pública'] || '';
    var commune = p.commune || p.comuna || '';
    return Object.assign({}, p, {
      id: String(p.id || p.codigo || p.title || Math.random()),
      operation: normalizeOperation(p),
      address: address,
      commune: commune,
      fullAddress: p.fullAddress || [address, commune, 'Chile'].filter(Boolean).join(', '),
      propertyType: normalizePropertyType(p),
      photos: photos,
      coverPhoto: photos[0]
    });
  }
  function activeRentandoProperties() {
    var rentando = Array.isArray(window.GUZMAN_RENTANDO) ? window.GUZMAN_RENTANDO : [];
    return rentando.filter(function (p) { return p && p.activa !== false && (p.status || 'Disponible') !== 'Arrendada'; });
  }
  function mergeProperties(primary, extra) {
    var seen = new Set();
    return [].concat(primary || [], extra || []).filter(function (p) {
      var key = String((p && p.source) || '') + ':' + String((p && p.id) || '') + ':' + String((p && p.title) || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function localProperties() {
    var fallback = Array.isArray(window.GUZMAN_FALLBACK) ? window.GUZMAN_FALLBACK : [];
    var rentando = activeRentandoProperties();
    var data = mergeProperties(fallback, rentando).map(normalizeLoadedProperty);
    window.GUZMAN_PROPERTIES_INDEX = data;
    return data;
  }
  async function fetchJSONFast(url, ms) {
    if (!url) return null;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, ms || 1200) : null;
    try {
      var r = await fetch(url, { headers: { accept: 'application/json' }, signal: controller && controller.signal });
      if (timer) clearTimeout(timer);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      if (timer) clearTimeout(timer);
      return null;
    }
  }
  function normalizeApiPayload(j) {
    return j && (Array.isArray(j) ? j : (j.propiedades || j.properties || j.records || null));
  }
  async function fetchAirtableCatalog(ms) {
    var j = CFG.endpoint ? await fetchJSONFast(CFG.endpoint, ms || 3500) : null;
    var api = normalizeApiPayload(j);
    if (!api || !api.length) return null;
    return mergeProperties(api, activeRentandoProperties()).map(normalizeLoadedProperty);
  }
  function publishCatalog(data, live) {
    if (!data || !data.length) return;
    window.GUZMAN_PROPERTIES_INDEX = data;
    window.dispatchEvent(new CustomEvent('guzman:properties-updated', { detail: { data: data, live: !!live } }));
  }
  function startBackgroundCatalog() {
    if (backgroundStarted || !CFG.endpoint) return;
    backgroundStarted = true;
    fetchAirtableCatalog(4500).then(function (data) {
      if (data && data.length) publishCatalog(data, true);
    });
  }

  window.GZ.localProperties = localProperties;

  window.GZ.loadConfig = async function () {
    var j = CFG.configEndpoint ? await fetchJSONFast(CFG.configEndpoint, 900) : null;
    if (j) {
      if (j.mapsKey) CFG.mapsKey = j.mapsKey;
      if (j.whatsapp) CFG.whatsapp = j.whatsapp;
    }
    return CFG;
  };

  window.GZ.loadReviews = async function () {
    var j = CFG.reviewsEndpoint ? await fetchJSONFast(CFG.reviewsEndpoint, 1200) : null;
    var arr = j && (Array.isArray(j) ? j : (j.reviews || j.reseñas));
    return (arr && arr.length) ? arr : (window.GUZMAN_REVIEWS || []);
  };

  window.GZ.loadProperties = async function () {
    var local = localProperties();
    var data = local;
    var live = false;
    if (CFG.endpoint) {
      var apiData = await fetchAirtableCatalog(1800);
      if (apiData && apiData.length) {
        data = apiData;
        live = true;
        window.GUZMAN_PROPERTIES_INDEX = data;
      } else {
        startBackgroundCatalog();
      }
    }
    return { data: data, live: live };
  };
})();
`;

  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300');

  return new Response(body + patch, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const config = {
  path: '/guzman-shared.js'
};
