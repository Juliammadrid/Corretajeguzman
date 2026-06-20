/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-corredor
 *  Recibe "Sé corredor" (POST JSON) y crea un registro en
 *  Airtable (tabla Leads corredores).
 *
 *  Variables de entorno:
 *    AIRTABLE_API_KEY               = patXXXX...  (data.records:write)
 *    AIRTABLE_BASE_ID              = appkG5ldIIHTVkXf6
 *    AIRTABLE_BROKERS_TABLE_ID     = tblEwecJVUAqvIKXd
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_BROKERS_TABLE_ID || "tblEwecJVUAqvIKXd";

const FIELD = {
  nombre: "fldjIlq8MFIKZpR3S",
  whatsapp: "fldUDWAGPJ7YqeAnQ",
  email: "fldtfx9nIFgMOpYO6",
  comuna: "fldM5Ms3EudUT4vV3",
  experiencia: "fldfKIjikGef0XOfk",
  plan: "fldgfOo9SriMgDmoj",
  origen: "fld1Sv1bOFKiOBM1D",
  fecha_envio: "fldVJHWcrDtwjWtfw",
  acepta: "fldVL9qVJzb8RAHU8"
};

function normalizeExperience(value) {
  const v = String(value || "").toLowerCase();
  if (!v) return "No";
  if (v.includes("sin experiencia")) return "No";
  if (v.includes("algo")) return "Experiencia media";
  if (v.includes("sí") || v.includes("si") || v.includes("experiencia")) return "Si";
  return "No";
}

function normalizePlan(value) {
  const v = String(value || "").toLowerCase();
  return v.includes("premium") ? "Premium" : "Gratis";
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  if (data._gotcha) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const fields = {};
  const put = (fieldId, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") fields[fieldId] = value;
  };

  put(FIELD.nombre, data.nombre);
  put(FIELD.whatsapp, data.whatsapp);
  put(FIELD.email, data.email);
  put(FIELD.comuna, data.comuna);
  put(FIELD.experiencia, normalizeExperience(data.experiencia));
  put(FIELD.plan, normalizePlan(data.plan));
  put(FIELD.origen, data.origen || "Sé corredor");
  put(FIELD.fecha_envio, data.fecha_envio || new Date().toISOString());
  put(FIELD.acepta, data.acepta ? "Sí" : "No");

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });

    if (!r.ok) {
      const detail = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Airtable " + r.status, detail }) };
    }

    const j = await r.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, id: (j.records && j.records[0] && j.records[0].id) || null })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
