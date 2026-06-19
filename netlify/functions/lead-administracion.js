/* ============================================================
 *  Netlify Function · /.netlify/functions/lead-administracion
 *  Recibe el formulario de Administración de Propiedades y crea
 *  un registro en la tabla Leads administración de Airtable.
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_ADMIN_TABLE_ID || "tblqGaWqSMaE42cTL";

const ADMIN_MAP = {
  nombre: "Nombre",
  whatsapp: "WhatsApp",
  email: "Correo",
  tipo: "Tipo de propiedad",
  comuna: "Comuna",
  estado_arriendo: "Está arrendada hoy",
  valor: "Valor de arriendo",
  mensaje: "Mensaje",
  servicio: "Servicio",
  plan: "Plan",
  acepta: "Acepta condiciones",
  origen: "Origen",
  fecha_envio: "Fecha de envío",
  estado_lead: "Estado lead"
};

const cleanText = value => value == null ? "" : String(value).trim();
const cleanNumber = value => {
  const number = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : undefined;
};
const accepts = value => value === "on" || value === true || value === "true" || value === "Sí" ? "Sí" : "No";

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };
  }

  let data = {};
  try {
    data = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  if (data._gotcha) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const fields = {};
  const put = (key, value) => {
    const column = ADMIN_MAP[key];
    if (column && value !== undefined && value !== null && value !== "") fields[column] = value;
  };

  put("nombre", cleanText(data.nombre));
  put("whatsapp", cleanText(data.whatsapp));
  put("email", cleanText(data.email));
  put("tipo", cleanText(data.tipo) || "Otro");
  put("comuna", cleanText(data.comuna));
  put("estado_arriendo", cleanText(data.estado_arriendo) || "No, está disponible");
  put("valor", cleanNumber(data.valor));
  put("mensaje", cleanText(data.mensaje));
  put("servicio", cleanText(data.servicio) || "Administración de propiedades");
  put("plan", cleanText(data.plan) || "Administración ($350.000 anual / 7% mensual)");
  put("acepta", accepts(data.acepta));
  put("origen", cleanText(data.origen) || "Administración de propiedades");
  put("fecha_envio", cleanText(data.fecha_envio) || new Date().toISOString());
  put("estado_lead", "Nuevo");

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Airtable " + response.status, detail })
      };
    }

    const json = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, id: json.records?.[0]?.id || null })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(error.message || error) })
    };
  }
};
