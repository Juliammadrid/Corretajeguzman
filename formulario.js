/* ============================================================
   Corretaje Guzmán — Formulario de Arriendo (captación)
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const POST_ENDPOINT = "/api/lead-arriendo";

const RM_COMUNAS = {
  "Provincia de Santiago": ["Santiago (Centro)", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura"],
  "Provincia Cordillera": ["Puente Alto", "Pirque", "San José de Maipo"],
  "Provincia de Maipo": ["San Bernardo", "Buin", "Calera de Tango", "Paine"],
  "Provincia de Talagante": ["Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
  "Provincia de Melipilla": ["Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro"],
  "Provincia de Chacabuco": ["Colina", "Lampa", "Tiltil"]
};

let comunas = [];
const MS = $('#comunaMS'), msControl = $('#comunaControl'), msPanel = $('#comunaPanel');
const msList = $('#comunaList'), msSearch = $('#comunaSearch'), msTags = $('#comunaTags');
const msCount = $('#comunaCount'), hidden = $('#comunasHidden');

function buildList(filter = '') {
  const q = filter.trim().toLowerCase();
  msList.innerHTML = '';
  let any = false;
  Object.entries(RM_COMUNAS).forEach(([prov, list]) => {
    const matches = list.filter(c => !q || c.toLowerCase().includes(q));
    if (!matches.length) return;
    any = true;
    const g = document.createElement('div'); g.className = 'ms-group';
    const allSel = matches.every(c => comunas.includes(c));
    g.innerHTML = `<div class="ms-group-h"><span class="gt">${prov}</span><button type="button" class="ga" data-prov="${prov}">${allSel ? 'Quitar todas' : 'Seleccionar todas'}</button></div>`;
    matches.forEach(c => {
      const checked = comunas.includes(c);
      const lbl = document.createElement('label'); lbl.className = 'ms-opt';
      lbl.innerHTML = `<input type="checkbox" value="${c}" ${checked ? 'checked' : ''}><span class="bx"><i data-lucide="check" class="ico"></i></span>${c}`;
      lbl.querySelector('input').addEventListener('change', e => { toggleComuna(c, e.target.checked); });
      g.appendChild(lbl);
    });
    g.querySelector('.ga').addEventListener('click', () => {
      const allNow = matches.every(c => comunas.includes(c));
      matches.forEach(c => toggleComuna(c, !allNow, true));
      renderAll(filter);
    });
    msList.appendChild(g);
  });
  if (!any) msList.innerHTML = '<div class="ms-empty">No encontramos esa comuna en la R.M.</div>';
  if (window.lucide) lucide.createIcons();
}

function toggleComuna(c, on, silent) {
  if (on) { if (!comunas.includes(c)) comunas.push(c); }
  else { comunas = comunas.filter(x => x !== c); }
  if (!silent) { renderTags(); renderCount(); clearErr(MS.closest('.field')); updateProgress(); }
}
function renderTags() {
  msTags.innerHTML = '';
  if (!comunas.length) { msTags.innerHTML = '<span class="ms-ph">Selecciona una o varias comunas de la R.M.</span>'; hidden.value = ''; return; }
  const shown = comunas.slice(0, 6);
  shown.forEach(c => {
    const t = document.createElement('span'); t.className = 'ctag';
    t.innerHTML = `${c}<button type="button" aria-label="Quitar"><i data-lucide="x" class="ico"></i></button>`;
    t.querySelector('button').addEventListener('click', e => { e.stopPropagation(); toggleComuna(c, false); buildList(msSearch.value); });
    msTags.appendChild(t);
  });
  if (comunas.length > 6) { const m = document.createElement('span'); m.className = 'ms-more'; m.textContent = `+${comunas.length - 6} más`; msTags.appendChild(m); }
  hidden.value = comunas.join(', ');
  if (window.lucide) lucide.createIcons();
}
function renderCount() { msCount.textContent = `${comunas.length} seleccionada${comunas.length === 1 ? '' : 's'}`; }
function renderAll(filter) { renderTags(); renderCount(); buildList(filter || ''); }
function openMS() { MS.classList.add('open'); msControl.setAttribute('aria-expanded', 'true'); buildList(msSearch.value); setTimeout(() => msSearch.focus(), 60); }
function closeMS() { MS.classList.remove('open'); msControl.setAttribute('aria-expanded', 'false'); }
msControl.addEventListener('click', () => { MS.classList.contains('open') ? closeMS() : openMS(); });
msSearch.addEventListener('input', () => buildList(msSearch.value));
$('#comunaClear').addEventListener('click', () => { comunas = []; renderAll(msSearch.value); clearErr(MS.closest('.field')); updateProgress(); });
$('#comunaDone').addEventListener('click', closeMS);
document.addEventListener('click', e => { if (!e.target.closest('#comunaMS')) closeMS(); });
renderTags(); renderCount();

function bindMoney(id) {
  const e = $('#' + id); if (!e) return;
  e.addEventListener('input', () => {
    let d = e.value.replace(/\D/g, '');
    e.value = d ? Number(d).toLocaleString('es-CL') : '';
    clearErr(e.closest('.field'));
  });
}
['presupuesto', 'renta', 'renta_complemento'].forEach(bindMoney);

$$('input[name="complementa"]').forEach(r => r.addEventListener('change', () => {
  const show = r.value === 'Sí' && r.checked;
  $('#rentaComp').classList.toggle('show', show);
}));

function setErr(field) { if (field) field.classList.add('err'); }
function clearErr(field) { if (field) field.classList.remove('err'); }
$$('#leadForm input, #leadForm select, #leadForm textarea').forEach(el => {
  el.addEventListener('input', () => clearErr(el.closest('.field')));
  el.addEventListener('change', () => clearErr(el.closest('.field')));
});

function validate() {
  let firstBad = null;
  const fail = (node) => { if (!firstBad) firstBad = node; };
  $$('#leadForm [required]').forEach(el => {
    if (el.type === 'radio') return;
    if (el.type === 'checkbox') return;
    const field = el.closest('.field');
    const val = (el.value || '').trim();
    let ok = !!val;
    if (ok && el.type === 'email') ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
    if (ok && el.name === 'whatsapp') ok = val.replace(/\D/g, '').length >= 8;
    if (!ok) { setErr(field); fail(field); } else clearErr(field);
  });
  if (!comunas.length) { setErr(MS.closest('.field')); fail(MS.closest('.field')); }
  ['estacionamiento', 'complementa', 'mascotas'].forEach(name => {
    const grp = $$(`input[name="${name}"]`);
    const field = grp[0].closest('.field');
    if (!grp.some(r => r.checked)) { setErr(field); fail(field); } else clearErr(field);
  });
  const acc = $('#acceptBox'), accInput = $('input[name="acepta"]');
  if (!accInput.checked) { acc.classList.add('err'); $('#acceptErr').style.display = 'block'; fail(acc); }
  else { acc.classList.remove('err'); $('#acceptErr').style.display = 'none'; }
  return firstBad;
}

function sectionComplete(step) {
  const sec = $(`.sec[data-step="${step}"]`);
  if (!sec) return false;
  const reqs = $$('[required]', sec).filter(el => el.offsetParent !== null || el.type === 'radio');
  if (step === 2 && !comunas.length) return false;
  const radioNames = [...new Set($$('input[type=radio][required]', sec).map(r => r.name))];
  for (const n of radioNames) if (!$$(`input[name="${n}"]`).some(r => r.checked)) return false;
  for (const el of reqs) {
    if (el.type === 'radio' || el.type === 'checkbox') continue;
    if (!(el.value || '').trim()) return false;
  }
  if (step === 4 && !$('input[name="acepta"]').checked) return false;
  return true;
}
function updateProgress() {
  $$('#stepsNav .step').forEach((s, i) => { s.classList.toggle('done', sectionComplete(i)); });
  let active = 0; for (let i = 0; i < 5; i++) { if (!sectionComplete(i)) { active = i; break; } active = i; }
  $$('#stepsNav .step').forEach((s, i) => s.classList.toggle('active', i === active && !s.classList.contains('done')));
}
$$('#leadForm input, #leadForm select').forEach(el => { el.addEventListener('input', updateProgress); el.addEventListener('change', updateProgress); });
$$('#stepsNav .step').forEach(s => s.addEventListener('click', () => {
  const sec = $(`.sec[data-step="${s.dataset.go}"]`);
  if (sec) { const y = sec.getBoundingClientRect().top + window.scrollY - 92; window.scrollTo({ top: y, behavior: 'smooth' }); }
}));

$('#leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bad = validate();
  if (bad) { const y = bad.getBoundingClientRect().top + window.scrollY - 100; window.scrollTo({ top: y, behavior: 'smooth' }); return; }

  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  data.comunas = comunas;
  ['presupuesto', 'renta', 'renta_complemento'].forEach(k => { if (data[k]) data[k] = Number(String(data[k]).replace(/\D/g, '')); });
  data.whatsapp = '+56' + String(data.whatsapp || '').replace(/\D/g, '');
  data.origen = 'Formulario de Arriendo';
  data.fecha_envio = new Date().toISOString();

  const btn = $('#leadForm button[type=submit]');
  const original = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="ico"></i>Enviando…'; if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch(POST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('No se pudo guardar en Airtable');
    $('#leadForm').style.display = 'none';
    const ok = $('#success'); ok.classList.add('show');
    window.scrollTo({ top: ok.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = original;
    alert('No se pudo enviar la solicitud. Por favor intenta nuevamente o escríbenos por WhatsApp.');
  }
  if (window.lucide) lucide.createIcons();
});

updateProgress();
if (window.lucide) lucide.createIcons();