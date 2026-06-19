/* ============================================================
 *  Netlify Function · propiedades (Corretaje Guzmán)
 *  Devuelve las propiedades NORMALIZADAS desde Airtable.
 *  Rutas (ver netlify.toml):
 *    /api/properties            → todas (arriendo + venta)
 *    /api/properties/rent       → sólo arriendo
 *    /api/properties/sale       → sólo venta
 *    /api/home-properties       → destacadas / todas
 *    /api/property/:id          → una por record id
 *
 *  Variables de entorno (Netlify):
 *    AIRTABLE_API_KEY           (obligatoria, secreta)
 *    AIRTABLE_BASE_ID           (def: appkG5ldIIHTVkXf6)
 *    AIRTABLE_RENT_TABLE_ID     (def: tblOZztlu6qSLMAtc)
 *    AIRTABLE_SALE_TABLE_ID     (def: tblB67Zm9zxDlFwY7)
 *  Nunca se expone la API key al frontend.
 * ============================================================ */
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const RENT_TABLE = process.env.AIRTABLE_RENT_TABLE_ID || "tblOZztlu6qSLMAtc";
const SALE_TABLE = process.env.AIRTABLE_SALE_TABLE_ID || "tblB67Zm9zxDlFwY7";

/* Nombres de columna esperados (con alternativas por si cambian) */
const F = {
  title:        ["Nombre de la propiedad", "Nombre", "Título", "Titulo", "Propiedad"],
  address:      ["Direccion publica", "Dirección pública", "Direccion Publica", "Dirección Publica", "Dirección", "Direccion", "Address"],
  commune:      ["Comuna", "Ciudad", "Sector"],
  bedrooms:     ["Dormitorios", "Habitaciones"],
  bathrooms:    ["Baños", "Banos", "Baño"],
  photos:       ["Fotos", "Foto", "Imágenes", "Imagenes", "Photos"],
  priceValue:   ["Precio valor", "Precio", "Valor"],
  currency:     ["Moneda", "Currency"],
  commonExpenses: ["Valor gasto común", "Gastos comunes", "Gasto común", "GGCC"],
  parking:      ["Estacionamiento", "Estacionamientos", "Garaje"],
  storage:      ["Bodega"],
  propertyType: ["Tipo propiedad", "Tipo de propiedad", "Tipo de inmueble", "Tipo", "Categoría", "Categoria"],
  operation:    ["Operación", "Operacion"],
  description:  ["Descripción pública", "Descripcion publica", "Descripción", "Descripcion", "Detalle"],
  usableArea:   ["Superficie útil m2", "Superficie útil", "Superficie util m2", "Metros útiles", "Metros utiles", "m2 útiles"],
  totalArea:    ["Metros totales", "Superficie total", "Metros"],
  terraceArea:  ["Superficie terraza m2", "Terraza", "Metros terraza"],
  latitude:     ["Latitud", "Latitude", "Lat"],
  longitude:    ["Longitud", "Longitude", "Lng", "Lon"],
  features:     ["Extras / características", "Extras", "Características", "Caracteristicas", "Comodidades"],
  status:       ["Estado", "Status"],
  condition:    ["Estado de la propiedad", "Condición", "Condicion", "Nuevo/Usado", "Nuevo o usado", "Nuevo / Usado"],
  updatedAt:    ["Fecha de actualización", "Última actualización", "Updated"]
};

const get = (fields, keys) => {
  for (const k of keys) if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") return fields[k];
  const low = {}; for (const k in fields) low[k.toLowerCase()] = fields[k];
  for (const k of keys) { const v = low[k.toLowerCase()]; if (v !== undefined && v !== null && v !== "") return v; }
  return undefined;
};
const pick = (v) => (v && v.name) ? v.name : v;
const num = (v) => { if (v == null) return null; const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")); return isNaN(n) ? null : n; };
const list = (v) => { if (v == null) return []; if (Array.isArray(v)) return v.map(x => (x && x.name) ? x.name : x).filter(Boolean); return String(v).split(/[\n,;•·]+/).map(s => s.trim()).filter(Boolean); };
const photos = (v) => { if (Array.isArray(v)) return v.map(a => a && a.url ? a.url : a).filter(x => typeof x === "string"); if (typeof v === "string") return v.split(/[\s,]+/).filter(u => /^https?:\/\//.test(u)); return []; };
const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function inferPropertyType(raw, title) {
  const text = norm(`${pick(raw) || ""} ${title || ""}`);
  if (/\b(parcela|terreno|lote|sitio)\b/.test(text)) return "Parcela";
  if (/\b(casa|townhouse)\b/.test(text)) return "Casa";
  if (/\b(oficina)\b/.test(text)) return "Oficina";
  if (/\b(local|comercial|local comercial)\b/.test(text)) return "Oficina";
  if (/\b(estudio|studio)\b/.test(text)) return "Estudio";
  if (/\b(depto|departamento|dpto|apto|apartamento)\b/.test(text)) return "Departamento";
  const selected = pick(raw);
  return selected ? String(selected).trim() : "Departamento";
}

function normalize(rec, operation) {
  const f = rec.fields || {};
  const g = (key) => get(f, F[key]);
  const ph = photos(g("photos"));
  let currency = (pick(g("currency")) || "").toUpperCase();
  const priceValue = num(g("priceValue")) || 0;
  if (currency !== "UF" && currency !== "CLP") currency = (priceValue > 0 && priceValue < 100000) ? "UF" : "CLP";
  let op = (pick(g("operation")) || operation || "").toString().toLowerCase();
  op = op.includes("vent") ? "venta" : "arriendo";
  const title = g("title") || "Propiedad";
  const address = g("address") || "";
  const commune = g("commune") || "";
  return {
    id: rec.id,
    source: "airtable-corretaje",
    operation: op,
    title,
    address,
    commune,
    fullAddress: [address, commune, "Chile"].filter(Boolean).join(", "),
    priceValue,
    currency,
    commonExpenses: num(g("commonExpenses")) || 0,
    bedrooms: g("bedrooms") != null ? num(g("bedrooms")) : null,
    bathrooms: g("bathrooms") != null ? num(g("bathrooms")) : null,
    parking: g("parking") != null ? (num(g("parking")) ?? (g("parking") ? 1 : 0)) : null,
    storage: !!g("storage"),
    propertyType: inferPropertyType(g("propertyType"), title),
    description: g("description") ? String(g("description")) : "",
    usableArea: g("usableArea") != null ? num(g("usableArea")) : null,
    totalArea: g("totalArea") != null ? num(g("totalArea")) : null,
    terraceArea: g("terraceArea") != null ? num(g("terraceArea")) : null,
    latitude: g("latitude") != null ? num(g("latitude")) : null,
    longitude: g("longitude") != null ? num(g("longitude")) : null,
    photos: ph,
    coverPhoto: ph[0] || "",
    features: list(g("features")),
    updatedAt: g("updatedAt") || "",
    status: pick(g("status")) || "Disponible",
    condition: pick(g("condition")) || ""
  };
}

async function fetchTable(token, table, operation) {
  if (!table) return [];
  let out = [], offset;
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

exports.handler = async function (event) {
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "Falta AIRTABLE_API_KEY" }) };
  const q = (event && event.queryStringParameters) || {};
  const wantRent = q.type !== "sale";
  const wantSale = q.type !== "rent";
  try {
    const jobs = [];
    if (wantRent) jobs.push(fetchTable(token, RENT_TABLE, "arriendo"));
    if (wantSale) jobs.push(fetchTable(token, SALE_TABLE, "venta"));
    const settled = await Promise.allSettled(jobs);
    let props = [];
    settled.forEach(s => { if (s.status === "fulfilled") props = props.concat(s.value); });
    if (!props.length) { const e = settled.find(s => s.status === "rejected"); if (e) return { statusCode: 502, body: JSON.stringify({ error: String(e.reason) }) }; }
    if (q.id) props = props.filter(p => p.id === q.id);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
      body: JSON.stringify({ properties: props })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};