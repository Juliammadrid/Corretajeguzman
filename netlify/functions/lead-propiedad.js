/* ============================================================
 * Netlify Function · /.netlify/functions/lead-propiedad
 * Recibe solicitudes desde la ficha de propiedad y crea un lead
 * en Airtable, tabla "Leads administración".
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE_ID = process.env.AIRTABLE_PROPERTY_LEADS_TABLE_ID || process.env.AIRTABLE_ADMIN_TABLE_ID || "tblqGaWqSMaE42cTL";

const FIELD = {
  nombre: "fldvJeO1VJXmEfLd2",
  whatsapp: "fld9o47WAxg7IgZRV",
  mensaje: "fld7nkwPsacARsZeo",
  servicio: "fldt5nzvP4ApZwGCi",
  plan: "fld7XbwJlRoyqm1HF",
  origen: "fldUZ0akPMHhjdWQI",
  fecha: "fldqjXvHSeP1PCRRi",
  estado: "fld4zI7BVnfgQ920h"
};

function cleanPhone(v) {
  const digits = String(v || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("56")) return "+" + digits;
  if (digits.startsWith("9")) return "+56" + digits;
  return "+56" + digits;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };
  }

  let data = {};
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "JSON inválido" }) }; }
  if (data._gotcha) return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };

  const nombre = String(data.nombre || "").trim();
  const whatsapp = cleanPhone(data.telefono || data.whatsapp);
  if (!nombre || !whatsapp) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Faltan nombre o teléfono" }) };
  }

  const propertyLine = [data.propiedad, data.operacion, data.comuna].filter(Boolean).join(" · ");
  const messageParts = [
    data.mensaje || "Solicitud de información desde ficha de propiedad.",
    propertyLine ? `Propiedad: ${propertyLine}` : "",
    data.precio ? `Precio: ${data.precio}` : "",
    data.url ? `URL: ${data.url}` : "",
    data.codigo ? `Código: ${data.codigo}` : ""
  ].filter(Boolean);

  const fields = {
    [FIELD.nombre]: nombre,
    [FIELD.whatsapp]: whatsapp,
    [FIELD.mensaje]: messageParts.join("\n"),
    [FIELD.servicio]: "Consulta ficha propiedad",
    [FIELD.plan]: data.propiedad || "Ficha propiedad",
    [FIELD.origen]: "Ficha propiedad",
    [FIELD.fecha]: data.fecha_envio || new Date().toISOString(),
    [FIELD.estado]: "Nuevo"
  };

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });
    const text = await r.text();
    if (!r.ok) {
      return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Airtable " + r.status, detail: text }) };
    }
    let j = {};
    try { j = JSON.parse(text); } catch (e) {}
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, id: j.records && j.records[0] && j.records[0].id }) };
  } catch (e) {
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
