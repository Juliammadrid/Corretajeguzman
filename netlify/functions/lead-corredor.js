/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-corredor
 *  Recibe "Sé corredor" (POST JSON) y crea un registro en
 *  Airtable (tabla de corredores / postulaciones).
 *
 *  Variables de entorno:
 *    AIRTABLE_API_KEY               = patXXXX...  (data.records:write)
 *    AIRTABLE_BASE_ID              = appkG5ldIIHTVkXf6 (por defecto)
 *    AIRTABLE_BROKERS_TABLE_ID     = nombre o id (def: "Corredores")
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_BROKERS_TABLE_ID || "Corredores";

const MAP = {
  nombre:      "Nombre",
  whatsapp:    "WhatsApp",
  email:       "Correo",
  comuna:      "Comuna",
  experiencia: "Experiencia",
  plan:        "Plan de interés",
  origen:      "Origen",
  fecha_envio: "Fecha de envío"
};

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) }; }
  if (data._gotcha) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const fields = {};
  const put = (k, v) => { const col = MAP[k]; if (col && v !== undefined && v !== null && v !== "") fields[col] = v; };
  put("nombre", data.nombre);
  put("whatsapp", data.whatsapp);
  put("email", data.email);
  put("comuna", data.comuna);
  put("experiencia", data.experiencia);
  put("plan", data.plan);
  put("origen", data.origen || "Sé corredor");
  put("fecha_envio", data.fecha_envio || new Date().toISOString());

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });
    if (!r.ok) { const t = await r.text(); return { statusCode: 502, body: JSON.stringify({ error: "Airtable " + r.status, detail: t }) }; }
    const j = await r.json();
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, id: (j.records && j.records[0] && j.records[0].id) || null }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
