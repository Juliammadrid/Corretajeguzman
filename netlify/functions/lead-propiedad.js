/* ============================================================
 * Netlify Function · /.netlify/functions/lead-propiedad
 * Recibe solicitudes desde la ficha de propiedad, crea un lead
 * en Airtable y, si está configurado, envía aviso por email.
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE_ID = process.env.AIRTABLE_PROPERTY_LEADS_TABLE_ID || process.env.AIRTABLE_ADMIN_TABLE_ID || "tblqGaWqSMaE42cTL";
const LEAD_EMAIL_TO = process.env.LEAD_EMAIL_TO || "corretajeguzman@gmail.com";
const LEAD_EMAIL_FROM = process.env.LEAD_EMAIL_FROM || "Corretaje Guzman <noreply@corretajeguzman.com>";

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

function escapeHtml(v) {
  return String(v || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function json(statusCode, payload) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function buildLeadMessage(data) {
  const propertyLine = [data.propiedad, data.operacion, data.comuna].filter(Boolean).join(" · ");
  return [
    data.mensaje || "Solicitud de información desde ficha de propiedad.",
    propertyLine ? `Propiedad: ${propertyLine}` : "",
    data.precio ? `Precio: ${data.precio}` : "",
    data.url ? `URL: ${data.url}` : "",
    data.codigo ? `Código: ${data.codigo}` : ""
  ].filter(Boolean);
}

async function sendEmailAlert(data, whatsapp, messageParts) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, reason: "Falta RESEND_API_KEY" };

  const rows = [
    ["Nombre", data.nombre],
    ["WhatsApp", whatsapp],
    ["Propiedad", data.propiedad],
    ["Operación", data.operacion],
    ["Comuna", data.comuna],
    ["Precio", data.precio],
    ["Código", data.codigo],
    ["URL", data.url],
    ["Mensaje", data.mensaje]
  ].filter(([, v]) => v != null && String(v).trim() !== "");

  const htmlRows = rows.map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b6280;font-weight:700">${escapeHtml(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#171223">${escapeHtml(v)}</td></tr>`).join("");
  const subject = `Nueva solicitud de visita · ${data.propiedad || "Propiedad"}`;
  const text = [`Nueva solicitud de visita`, ``, ...messageParts, ``, `Nombre: ${data.nombre}`, `WhatsApp: ${whatsapp}`].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;color:#171223">
      <h1 style="font-size:24px;margin:0 0 8px">Nueva solicitud de visita</h1>
      <p style="margin:0 0 20px;color:#6b6280">Llegó una consulta desde una ficha de propiedad de Corretaje Guzmán.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:12px;overflow:hidden">${htmlRows}</table>
    </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: LEAD_EMAIL_FROM, to: [LEAD_EMAIL_TO], subject, html, text })
  });
  const body = await r.text();
  if (!r.ok) return { ok: false, status: r.status, detail: body };
  let parsed = {};
  try { parsed = JSON.parse(body); } catch (e) {}
  return { ok: true, id: parsed.id || null };
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  let data = {};
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return json(400, { error: "JSON inválido" }); }
  if (data._gotcha) return json(200, { ok: true });

  const nombre = String(data.nombre || "").trim();
  const whatsapp = cleanPhone(data.telefono || data.whatsapp);
  if (!nombre || !whatsapp) return json(400, { error: "Faltan nombre o teléfono" });
  data.nombre = nombre;

  const messageParts = buildLeadMessage(data);
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

  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  let airtable = { skipped: true, reason: "Falta AIRTABLE_API_KEY" };
  if (token) {
    try {
      const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ fields }], typecast: true })
      });
      const text = await r.text();
      if (!r.ok) airtable = { ok: false, status: r.status, detail: text };
      else {
        let j = {};
        try { j = JSON.parse(text); } catch (e) {}
        airtable = { ok: true, id: j.records && j.records[0] && j.records[0].id };
      }
    } catch (e) {
      airtable = { ok: false, error: String(e.message || e) };
    }
  }

  let email = { skipped: true, reason: "Falta RESEND_API_KEY" };
  try { email = await sendEmailAlert(data, whatsapp, messageParts); }
  catch (e) { email = { ok: false, error: String(e.message || e) }; }

  if (airtable.ok || email.ok) return json(200, { ok: true, airtable, email });
  return json(502, { ok: false, error: "No se pudo registrar ni enviar la solicitud", airtable, email });
};
