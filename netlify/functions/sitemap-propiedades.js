const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const RENT_TABLE = process.env.AIRTABLE_RENT_TABLE_ID || "tblOZztlu6qSLMAtc";
const SALE_TABLE = process.env.AIRTABLE_SALE_TABLE_ID || "tblB67Zm9zxDlFwY7";
const SITE = "https://corretajeguzman.com";

const F = {
  title: ["Nombre de la propiedad", "Nombre", "Título", "Titulo", "Propiedad"],
  address: ["Direccion publica", "Dirección pública", "Direccion Publica", "Dirección Publica", "Dirección", "Direccion", "Address"],
  commune: ["Comuna", "Ciudad", "Sector"],
  propertyType: ["Tipo propiedad", "Tipo de propiedad", "Tipo de inmueble", "Tipo", "Categoría", "Categoria"],
  operation: ["Operación", "Operacion"],
  status: ["Estado", "Status"],
  updatedAt: ["Fecha de actualización", "Última actualización", "Updated"]
};

function get(fields, keys) {
  for (const k of keys) if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") return fields[k];
  const low = {};
  for (const k in fields) low[k.toLowerCase()] = fields[k];
  for (const k of keys) {
    const v = low[k.toLowerCase()];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}
function pick(v) { return v && v.name ? v.name : v; }
function cleanText(v) { return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function slugify(v) {
  return cleanText(v).replace(/&/g, " y ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "propiedad";
}
function xml(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function inferType(raw, title) {
  const text = cleanText(`${pick(raw) || ""} ${title || ""}`);
  if (/\b(parcela|terreno|lote|sitio)\b/.test(text)) return "Parcela";
  if (/\b(local comercial|local|comercial)\b/.test(text)) return "Local";
  if (/\b(casa|townhouse)\b/.test(text)) return "Casa";
  if (/\b(oficina)\b/.test(text)) return "Oficina";
  if (/\b(estudio|studio)\b/.test(text)) return "Estudio";
  if (/\b(depto|departamento|dpto|apto|apartamento)\b/.test(text)) return "Departamento";
  return pick(raw) || "Propiedad";
}
function normalize(rec, fallbackOperation) {
  const fields = rec.fields || {};
  const g = key => get(fields, F[key]);
  const title = g("title") || "Propiedad";
  let operation = String(pick(g("operation")) || fallbackOperation || "").toLowerCase();
  operation = operation.includes("vent") ? "venta" : "arriendo";
  const propertyType = inferType(g("propertyType"), title);
  const commune = g("commune") || "";
  const status = pick(g("status")) || "Disponible";
  return { id: rec.id, title, operation, propertyType, commune, status, updatedAt: g("updatedAt") || "" };
}
function propertyPath(p) {
  const slug = slugify([p.operation, p.propertyType, p.title, p.commune].filter(Boolean).join(" "));
  return `/propiedad/${slug}-${encodeURIComponent(p.id)}`;
}
async function fetchTable(token, table, operation) {
  if (!table) return [];
  let out = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`${operation} ${r.status}`);
    const j = await r.json();
    out = out.concat((j.records || []).map(rec => normalize(rec, operation)));
    offset = j.offset;
  } while (offset);
  return out;
}

exports.handler = async function () {
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, headers: { "Content-Type": "application/xml; charset=utf-8" }, body: "<error>Falta AIRTABLE_API_KEY</error>" };
  try {
    const settled = await Promise.allSettled([
      fetchTable(token, RENT_TABLE, "arriendo"),
      fetchTable(token, SALE_TABLE, "venta")
    ]);
    let props = [];
    settled.forEach(s => { if (s.status === "fulfilled") props = props.concat(s.value); });
    props = props.filter(p => !/arrendada|no disponible|borrador/i.test(String(p.status || "")));
    const urls = props.map(p => {
      const lastmod = /^\d{4}-\d{2}-\d{2}/.test(String(p.updatedAt)) ? `<lastmod>${xml(String(p.updatedAt).slice(0, 10))}</lastmod>` : "";
      return `  <url><loc>${xml(SITE + propertyPath(p))}</loc>${lastmod}<changefreq>daily</changefreq><priority>0.75</priority></url>`;
    }).join("\n");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
      body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    };
  } catch (e) {
    return { statusCode: 502, headers: { "Content-Type": "application/xml; charset=utf-8" }, body: `<error>${xml(e.message || e)}</error>` };
  }
};
