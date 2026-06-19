const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_ADMIN_TABLE_ID || "Leads administración";

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

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) }; }

  if (data._gotcha) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  const fields = {};
  const put = (k, v) => {
    const col = ADMIN_MAP[k];
    if (col && v !== undefined && v !== null && v !== "") fields[col] = v;
  };

  put("nombre", data.nombre);
  put("whatsapp", data.whatsapp);
  put("email", data.email);
  put("tipo", data.tipo);
  put("comuna", data.comuna);
  put("estado_arriendo", data.estado_arriendo);
  put("valor", Number(data.valor) || undefined);
  put("mensaje", data.mensaje);
  put("servicio", data.servicio || "Administración de propiedades");
  put("plan", data.plan || "Administración ($350.000 anual / 7% mensual)");
  put("acepta", data.acepta === "on" || data.acepta === true ? "Sí" : "No");
  put("origen", data.origen || "Administración de propiedades");
  put("fecha_envio", data.fecha_envio || new Date().toISOString());
  put("estado_lead", data.estado_lead || "Nuevo");

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true })
    });
    if (!r.ok) {
      const t = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Airtable " + r.status, detail: t }) };
    }
    const j = await r.json();
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, id: (j.records && j.records[0] && j.records[0].id) || null }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};