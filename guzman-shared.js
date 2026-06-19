/* ============================================================
   Corretaje Guzmán — helpers compartidos (precio, WhatsApp,
   carga de datos). Lo usan el home y la ficha.
   ============================================================ */
(function () {
  const CFG = window.GUZMAN_CONFIG || {};
  const nf = new Intl.NumberFormat('es-CL');
  const FALLBACK_PHOTO = 'assets/home-apartamento.jpg';

  function priceText(p) {
    if (p.currency === 'UF') return 'UF ' + nf.format(p.priceValue);
    return '$' + nf.format(p.priceValue);
  }
  function ufApprox(p) {
    if (p.currency !== 'UF' || !CFG.ufValueClp) return '';
    return '≈ $' + nf.format(Math.round(p.priceValue * CFG.ufValueClp));
  }
  function priceHTML(p, perClass) {
    // Promo Rentando: 50% dcto primer mes → ese precio como valor principal
    if (p.operation === 'arriendo' && p.promo && /50\s*%/.test(p.promo)) {
      const half = '$' + nf.format(Math.round(p.priceValue / 2));
      const full = '$' + nf.format(p.priceValue);
      return `${half} <span class="${perClass || 'per'}">1er mes</span> <span class="uf-approx" style="text-decoration:line-through;opacity:.55;font-weight:600">${full}</span>`;
    }
    const per = p.operation === 'arriendo' ? ` <span class="${perClass || 'per'}">/ mes</span>` : '';
    const uf = ufApprox(p);
    const approx = uf ? ` <span class="uf-approx">${uf}</span>` : '';
    return `${priceText(p)}${approx}${per}`;
  }
  const perLabel = (p) => p.operation === 'arriendo' ? '/ mes' : '';
  const opLabel = (p) => p.operation === 'venta' ? 'En Venta' : 'En Arriendo';

  function waNumber() { return (CFG.whatsapp || '56944637680').replace(/[^0-9]/g, ''); }
  function waLink(p, broker) {
    const via = (broker && broker !== 'Vi la empresa en internet') ? `por ${broker}` : 'por la empresa en internet';
    const title = p && p.title ? p.title : 'una propiedad';
    const msg = `Hola, quiero más información sobre esta propiedad: ${title}. La vi ${via}.`;
    return `https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`;
  }

  const ICON_HINTS = { piscina:"waves", gimnasio:"dumbbell", quincho:"flame", estacionamiento:"square-parking", acceso:"shield-check", lavander:"washing-machine", suite:"door-open", cocina:"cooking-pot", termopanel:"blinds", "piso flotante":"layers", bodega:"package", terraza:"sun", amoblad:"sofa", patio:"trees", vista:"eye", ascensor:"arrow-up-down", logia:"washing-machine" };
  function iconFor(t) { t = (t || '').toLowerCase(); for (const k in ICON_HINTS) if (t.includes(k)) return ICON_HINTS[k]; return 'check'; }

  async function fetchJSON(url) {
    try { const r = await fetch(url, { headers: { accept: 'application/json' } }); if (r.ok) return await r.json(); } catch (e) {}
    return null;
  }

  function validPhotoUrl(url) {
    return typeof url === 'string' && /^https?:\/\//.test(url) || typeof url === 'string' && /^assets\//.test(url);
  }

  function normalizeOperation(p) {
    const text = `${p.operation || ''} ${p.title || ''} ${p.source || ''}`.toLowerCase();
    return text.includes('vent') ? 'venta' : 'arriendo';
  }

  function normalizeLoadedProperty(p) {
    const photos = Array.isArray(p.photos) ? p.photos.filter(validPhotoUrl) : [];
    if (validPhotoUrl(p.coverPhoto) && !photos.includes(p.coverPhoto)) photos.unshift(p.coverPhoto);
    if (!photos.length) photos.push(FALLBACK_PHOTO);
    return {
      ...p,
      operation: normalizeOperation(p),
      photos,
      coverPhoto: photos[0]
    };
  }

  async function loadProperties() {
    let data = null, live = false;
    if (CFG.endpoint) {
      const j = await fetchJSON(CFG.endpoint);
      if (j) { data = Array.isArray(j) ? j : (j.propiedades || j.properties || j.records || null); if (data && data.length) live = true; }
    }
    if (!data || !data.length) data = window.GUZMAN_FALLBACK || [];
    data = data.map(normalizeLoadedProperty);
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
      if (j) {
        if (j.mapsKey) CFG.mapsKey = j.mapsKey;
        if (j.whatsapp) CFG.whatsapp = j.whatsapp;
      }
    }
    return CFG;
  }

  function banner(live, n) {
    const b = document.getElementById('dbanner'); if (!b) return;
    const t = document.getElementById('dbannerTxt');
    if (live) {
      b.classList.add('live');
      const ic = b.querySelector('.ico'); if (ic) ic.setAttribute('data-lucide', 'check-circle');
      t.textContent = `Conectado a Airtable · ${n} propiedad${n === 1 ? '' : 'es'} en vivo`;
    } else {
      t.textContent = 'Vista previa con datos de ejemplo · conecta tu Airtable para ver tus propiedades en vivo';
    }
  }

  window.GZ = { CFG, nf, priceText, ufApprox, priceHTML, perLabel, opLabel, waNumber, waLink, iconFor, loadConfig, loadProperties, loadReviews, banner };
})();