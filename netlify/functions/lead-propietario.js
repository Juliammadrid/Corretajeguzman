/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-propietario
 *  Recibe "Quiero arrendar mi propiedad" (POST JSON) y crea un
 *  registro en Airtable (tabla de propietarios / captación).
 *
 *  Variables de entorno:
 *    AIRTABLE_API_KEY              = patXXXX...  (data.records:write)
 *    AIRTABLE_BASE_ID             = appkG5ldIIHTVkXf6 (por defecto)
 *    AIRTABLE_OWNERS_TABLE_ID     = nombre o id (def: "Propietarios")
 *
 *  Ajusta OWNER_MAP con los nombres EXACTOS de tus columnas.
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_OWNERS_TABLE_ID || "Propietarios";

const OWNER_MAP = {
  nombre:      "Nombre",
  whatsapp:    "WhatsApp",
  email:       "Correo",
  tipo:        "Tipo de propiedad",
  comuna:      "Comuna",
  direccion:   "Dirección",
  dormitorios: "Dormitorios",
  banos:       "Baños",
  valor:       "Valor arriendo estimado",
  plan:        "Plan de interés",
  etapa:       "Etapa",
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
  const put = (k, v) => { const col = OWNER_MAP[k]; if (col && v !== undefined && v !== null && v !== "") fields[col] = v; };
  put("nombre", data.nombre);
  put("whatsapp", data.whatsapp);
  put("email", data.email);
  put("tipo", data.tipo);
  put("comuna", data.comuna);
  put("direccion", data.direccion);
  put("dormitorios", data.dormitorios);
  put("banos", data.banos);
  put("valor", Number(data.valor) || undefined);
  put("plan", data.plan);
  put("etapa", data.etapa);
  put("origen", data.origen || "Quiero arrendar mi propiedad");
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
