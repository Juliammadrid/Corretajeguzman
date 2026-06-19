/* ============================================================
   Corretaje Guzmán — Administración de Propiedades
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const POST_ENDPOINT = "/api/lead-propietario"; // reutiliza tabla de propietarios (origen distinto)

/* comunas R.M. para autocompletar */
const RM = ["Santiago (Centro)","Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Vitacura","Puente Alto","Pirque","San José de Maipo","San Bernardo","Buin","Calera de Tango","Paine","Colina","Lampa","Tiltil","Talagante","El Monte","Isla de Maipo","Padre Hurtado","Peñaflor","Melipilla","Curacaví","Villarrica","Pucón"];
(function(){ const dl = $('#comunasRM'); if (dl) RM.forEach(c => { const o = document.createElement('option'); o.value = c; dl.appendChild(o); }); })();

/* formato moneda */
const valorEl = $('#valor');
if (valorEl) valorEl.addEventListener('input', () => { let d = valorEl.value.replace(/\D/g, ''); valorEl.value = d ? Number(d).toLocaleString('es-CL') : ''; });

/* FAQ acordeón */
$$('#faq .qa .q').forEach(q => q.addEventListener('click', () => {
  const item = q.closest('.qa');
  const open = item.classList.contains('open');
  $$('#faq .qa').forEach(x => { x.classList.remove('open'); x.querySelector('.a').style.maxHeight = null; });
  if (!open) { item.classList.add('open'); item.querySelector('.a').style.maxHeight = item.querySelector('.a').scrollHeight + 'px'; }
}));

/* validación */
function setErr(f){ if (f) f.classList.add('err'); }
function clearErr(f){ if (f) f.classList.remove('err'); }
const validEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const validPhone = v => v.replace(/\D/g,'').length >= 8;

$$('#adminForm input, #adminForm select, #adminForm textarea').forEach(el => {
  el.addEventListener('input', () => clearErr(el.closest('.field')));
  el.addEventListener('change', () => clearErr(el.closest('.field')));
});

function validate(form) {
  let firstBad = null;
  const fail = n => { if (!firstBad) firstBad = n; };
  $$('[required]', form).forEach(el => {
    if (el.type === 'checkbox') return;
    const field = el.closest('.field');
    let ok = !!(el.value || '').trim();
    if (ok && el.type === 'email') ok = validEmail(el.value.trim());
    if (ok && el.name === 'whatsapp') ok = validPhone(el.value);
    if (!ok) { setErr(field); fail(field); } else clearErr(field);
  });
  const acc = $('#adminAccept'), inp = $('input[name="acepta"]', form);
  if (inp && !inp.checked) { acc.classList.add('err'); fail(acc); } else if (acc) acc.classList.remove('err');
  return firstBad;
}

$('#adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bad = validate(e.target);
  if (bad) { bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.servicio = 'Administración de propiedades';
  data.plan = 'Administración ($350.000 anual / 7% mensual)';
  data.origen = 'Administración de propiedades';
  data.fecha_envio = new Date().toISOString();
  if (data.whatsapp) data.whatsapp = '+56' + String(data.whatsapp).replace(/\D/g, '');
  if (data.valor) data.valor = Number(String(data.valor).replace(/\D/g, '')) || undefined;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="ico"></i>Enviando…'; if (window.lucide) lucide.createIcons();
  try { await fetch(POST_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (err) { /* preview sin backend */ }
  $('#adminForm').style.display = 'none';
  $('#adminOk').classList.add('show');
  $('#adminOk').scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
});

if (window.lucide) lucide.createIcons();
