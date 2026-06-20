/* ============================================================
   Corretaje Guzmán — Quiero arrendar mi propiedad (propietarios)
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const POST_ENDPOINT = "/api/lead-propietario"; // guarda en Airtable (tabla de propietarios)

const CLEAN_ROUTES = {
  'home - corretaje guzman.html': '/',
  'home - corretaje guzman': '/',
  'arriendos - corretaje guzman.html': '/arriendos',
  'arriendos - corretaje guzman': '/arriendos',
  'ventas - corretaje guzman.html': '/comprar',
  'ventas - corretaje guzman': '/comprar',
  'parcelas - corretaje guzman.html': '/parcelas',
  'parcelas - corretaje guzman': '/parcelas',
  'administracion de propiedades - corretaje guzman.html': '/administracion',
  'administracion de propiedades - corretaje guzman': '/administracion',
  'quiero arrendar mi propiedad - corretaje guzman.html': '/propietarios',
  'quiero arrendar mi propiedad - corretaje guzman': '/propietarios',
  'formulario de arriendo - corretaje guzman.html': '/solicitud',
  'formulario de arriendo - corretaje guzman': '/solicitud',
  'se corredor - corretaje guzman.html': '/corredores',
  'se corredor - corretaje guzman': '/corredores',
  'ficha propiedad - corretaje guzman v2.html': '/ficha',
  'ficha propiedad - corretaje guzman v2': '/ficha'
};

function cleanInternalLinks(root = document) {
  root.querySelectorAll('a[href]').forEach(a => {
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('https://wa.me/')) return;
    try {
      const u = new URL(raw, location.origin);
      if (u.origin !== location.origin) return;
      const key = decodeURIComponent(u.pathname).replace(/^\/+/, '').toLowerCase();
      const clean = CLEAN_ROUTES[key];
      if (clean) a.setAttribute('href', clean + u.search + u.hash);
    } catch (e) {}
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => cleanInternalLinks());
else cleanInternalLinks();

/* ---- comunas R.M. para autocompletar ---- */
const RM = ["Santiago (Centro)","Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Vitacura","Puente Alto","Pirque","San José de Maipo","San Bernardo","Buin","Calera de Tango","Paine","Colina","Lampa","Tiltil","Talagante","El Monte","Isla de Maipo","Padre Hurtado","Peñaflor","Melipilla","Curacaví","Villarrica","Pucón"];
(function(){ const dl = $('#comunasRM'); if (dl) RM.forEach(c => { const o = document.createElement('option'); o.value = c; dl.appendChild(o); }); })();

/* ---- formato moneda ---- */
const valorEl = $('#valor');
if (valorEl) valorEl.addEventListener('input', () => { let d = valorEl.value.replace(/\D/g, ''); valorEl.value = d ? Number(d).toLocaleString('es-CL') : ''; });

/* ---- preseleccionar plan desde botones ---- */
$$('[data-plan]').forEach(b => b.addEventListener('click', () => {
  const plan = b.dataset.plan;
  const r = $(`#ownerForm input[name="plan"][value="${plan}"]`);
  if (r) r.checked = true;
}));

/* ---- validación ---- */
function setErr(f){ if (f) f.classList.add('err'); }
function clearErr(f){ if (f) f.classList.remove('err'); }
function validEmail(v){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
function validPhone(v){ return v.replace(/\D/g,'').length >= 8; }

$$('#ownerForm input, #ownerForm select, #quickForm input, #quickForm select').forEach(el => {
  el.addEventListener('input', () => clearErr(el.closest('.field')));
  el.addEventListener('change', () => clearErr(el.closest('.field')));
});

function validateForm(form, opts = {}) {
  let firstBad = null;
  const fail = n => { if (!firstBad) firstBad = n; };
  $$('[required]', form).forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') return;
    const field = el.closest('.field');
    let ok = !!(el.value || '').trim();
    if (ok && el.type === 'email') ok = validEmail(el.value.trim());
    if (ok && el.name === 'whatsapp') ok = validPhone(el.value);
    if (!ok) { setErr(field); fail(field); } else clearErr(field);
  });
  if (opts.plan) {
    const grp = $$('input[name="plan"]', form);
    if (grp.length && !grp.some(r => r.checked)) fail($('.optset', form));
  }
  if (opts.accept) {
    const acc = $('#ownerAccept'), inp = $('input[name="acepta"]', form);
    if (inp && !inp.checked) { acc.classList.add('err'); fail(acc); } else if (acc) acc.classList.remove('err');
  }
  return firstBad;
}

async function send(data) {
  data.origen = 'Quiero arrendar mi propiedad';
  data.fecha_envio = new Date().toISOString();
  if (data.whatsapp) data.whatsapp = '+56' + String(data.whatsapp).replace(/\D/g, '');
  if (data.valor) data.valor = Number(String(data.valor).replace(/\D/g, '')) || data.valor;
  try { await fetch(POST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (e) { /* preview sin backend */ }
}

/* ---- quick form (hero) → scroll al formulario completo precargado ---- */
$('#quickForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bad = validateForm(e.target);
  if (bad) { bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  const fd = Object.fromEntries(new FormData(e.target).entries());
  // precargar el formulario completo con lo ingresado
  const of = $('#ownerForm');
  if (of.nombre) of.nombre.value = fd.nombre || '';
  if (of.whatsapp) of.whatsapp.value = fd.whatsapp || '';
  if (of.comuna) of.comuna.value = fd.comuna || '';
  if (of.tipo && fd.tipo) of.tipo.value = fd.tipo;
  await send({ ...fd, etapa: 'lead rápido (hero)' });
  const btn = e.target.querySelector('button');
  btn.innerHTML = '<i data-lucide="check" class="ico"></i>¡Listo! Completa el detalle ↓'; if (window.lucide) lucide.createIcons();
  document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => { if (of.email) of.email.focus(); }, 700);
});

/* ---- owner form (completo) ---- */
$('#ownerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bad = validateForm(e.target, { plan: true, accept: true });
  if (bad) { bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  const data = Object.fromEntries(new FormData(e.target).entries());
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="ico"></i>Enviando…'; if (window.lucide) lucide.createIcons();
  await send(data);
  $('#ownerForm').style.display = 'none';
  $('#ownerOk').classList.add('show');
  $('#ownerOk').scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
});

if (window.lucide) lucide.createIcons();
