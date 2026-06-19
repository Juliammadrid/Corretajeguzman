/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-arriendo
 *  Recibe el Formulario de Arriendo (POST JSON) y crea un
 *  registro en una tabla de Airtable (solicitudes de arriendo).
 *
 *  Variables de entorno (Netlify → Environment variables):
 *    AIRTABLE_API_KEY            = patXXXX...  (con data.records:write)
 *    AIRTABLE_BASE_ID            = appkG5ldIIHTVkXf6  (por defecto)
 *    AIRTABLE_LEADS_TABLE_ID     = nombre o id de la tabla de solicitudes
 *                                  (def: "Solicitudes Arriendo")
 *
 *  Ajusta LEAD_MAP con los nombres EXACTOS de las columnas de tu
 *  tabla de solicitudes en Airtable (izq = campo del form,
 *  der = nombre de tu columna).
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_LEADS_TABLE_ID || "Solicitudes Arriendo";

const LEAD_MAP = {
  nombre:            "Nombre",
  whatsapp:          "WhatsApp",
  email:             "Correo",
  fecha_cambio:      "Fecha de cambio",
  comunas:           "Comunas de interés",   // multi-select en Airtable (o texto separado por coma)
  presupuesto:       "Presupuesto arriendo",
  dormitorios:       "Dormitorios",
  estacionamiento:   "Estacionamiento",
  renta:             "Renta líquida",
  personas:          "N° de personas",
  complementa:       "Complementa renta",
  renta_complemento: "Renta complemento",
  mascotas:          "Mascotas",
  acepta:            "Acepta condiciones",
  origen:            "Origen",
  fecha_envio:       "Fecha de envío"
};

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) }; }

  // honeypot anti-spam opcional
  if (data._gotcha) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const fields = {};
  const put = (key, val) => { const col = LEAD_MAP[key]; if (col && val !== undefined && val !== null && val !== "") fields[col] = val; };

  put("nombre", data.nombre);
  put("whatsapp", data.whatsapp);
  put("email", data.email);
  put("fecha_cambio", data.fecha_cambio);
  // Comunas → arreglo para campo "Multiple select" de Airtable (typecast crea las opciones).
  // Si tu columna fuese de texto simple, cambia esta línea por: data.comunas.join(", ")
  put("comunas", Array.isArray(data.comunas) ? data.comunas : (data.comunas ? String(data.comunas).split(/,\s*/) : undefined));
  put("presupuesto", Number(data.presupuesto) || undefined);
  put("dormitorios", data.dormitorios);
  put("estacionamiento", data.estacionamiento);
  put("renta", Number(data.renta) || undefined);
  put("personas", data.personas);
  put("complementa", data.complementa);
  put("renta_complemento", Number(data.renta_complemento) || undefined);
  put("mascotas", data.mascotas);
  put("acepta", data.acepta === "on" || data.acepta === true ? true : false);
  put("origen", data.origen || "Formulario de Arriendo");
  put("fecha_envio", data.fecha_envio || new Date().toISOString());

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });
    if (!r.ok) {
      const txt = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Airtable " + r.status, detail: txt }) };
    }
    const j = await r.json();
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, id: (j.records && j.records[0] && j.records[0].id) || null }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
