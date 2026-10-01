/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-cotizacion
 *  Recibe la cotización de proyectos nuevos (POST JSON desde
 *  cotizacion.html) y crea un registro en Airtable.
 *
 *  Tabla:  Cotizaciones Proyectos  (tblyK2VefkLg66FgM)
 *  Base:   appkG5ldIIHTVkXf6
 *
 *  Variables de entorno (Netlify → Environment variables):
 *    AIRTABLE_API_KEY          = patXXXX...  (data.records:read y :write)
 *    AIRTABLE_BASE_ID          = appkG5ldIIHTVkXf6        (por defecto)
 *    AIRTABLE_COTIZ_TABLE_ID   = tblyK2VefkLg66FgM        (por defecto)
 *
 *  El token NUNCA se expone en el frontend.
 *  NO se envían Estado / Ejecutivo / Notas / Recibido: los maneja Airtable.
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE   = process.env.AIRTABLE_COTIZ_TABLE_ID || "tblyK2VefkLg66FgM";

/* campo del formulario → nombre EXACTO de la columna en Airtable */
const COT_MAP = {
  nombre:      "Nombre",
  apellido:    "Apellido",
  rut:         "RUT",
  telefono:    "Teléfono",
  email:       "Correo",
  renta:       "Renta líquida",
  periodo:     "Plazo de compra",
  complementa: "Complementa renta",
  credito:     "Crédito pre aprobado",
  contacto:    "Contacto preferido",
  proyecto:    "Proyecto",
  slug:        "Slug proyecto",
  comuna:      "Comuna",
  tipologia:   "Tipología",
  precio:      "Precio (UF)",
  destino:     "Destino",
  origen:      "Origen",
  fecha_envio: "Fecha de envío"
};

/* valores permitidos en los Single Select fijos (se validan en servidor) */
const ALLOWED = {
  renta:       ["Menos de $1.000.000", "$1.000.000 – $1.500.000", "$1.500.000 – $2.500.000", "$2.500.000 – $3.500.000", "Más de $3.500.000"],
  periodo:     ["Inmediato", "1 a 3 meses", "3 a 6 meses", "6 a 12 meses"],
  complementa: ["Sí", "No"],
  credito:     ["Sí", "No"],
  contacto:    ["WhatsApp", "Llamada", "Email"],
  destino:     ["primera", "inversion"]
};
const REQUIRED = ["nombre", "apellido", "rut", "telefono", "email", "renta", "periodo", "complementa", "credito", "contacto", "proyecto", "slug"];

/* idempotencia básica: evita duplicados por reintentos de red
   (memoria por instancia; ventana de 10 minutos) */
const SEEN = new Map();
const TTL = 10 * 60 * 1000;
function seen(id) {
  const now = Date.now();
  for (const [k, t] of SEEN) if (now - t > TTL) SEEN.delete(k);
  if (!id) return false;
  if (SEEN.has(id)) return true;
  SEEN.set(id, now);
  return false;
}

const headers = { "Content-Type": "application/json" };
const fail = (code, msg) => ({ statusCode: code, headers, body: JSON.stringify({ ok: false, error: msg }) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return fail(405, "method");

  let data;
  try { data = JSON.parse(event.body || "{}"); } catch (e) { return fail(400, "json"); }

  for (const k of REQUIRED) {
    if (!data[k] || !String(data[k]).trim()) { console.warn("[lead-cotizacion] falta campo", k); return fail(422, "validation"); }
  }
  for (const [k, list] of Object.entries(ALLOWED)) {
    if (data[k] && !list.includes(data[k])) { console.warn("[lead-cotizacion] valor no permitido", k, data[k]); return fail(422, "validation"); }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(data.email))) return fail(422, "validation");

  if (seen(data.requestId)) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, duplicate: true }) };

  const fields = {};
  for (const [k, col] of Object.entries(COT_MAP)) {
    const v = data[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") fields[col] = String(v).trim();
  }

  const key = process.env.AIRTABLE_API_KEY;
  if (!key) { console.error("[lead-cotizacion] falta AIRTABLE_API_KEY"); SEEN.delete(data.requestId); return fail(500, "server"); }

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })   // typecast crea opciones nuevas de Proyecto/Comuna
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.records || !out.records[0]) {
      console.error("[lead-cotizacion] Airtable error", r.status, JSON.stringify(out));
      SEEN.delete(data.requestId);
      return fail(502, "upstream");
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: out.records[0].id }) };
  } catch (err) {
    console.error("[lead-cotizacion] excepción", err);
    SEEN.delete(data.requestId);
    return fail(502, "upstream");
  }
};
