const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const RENT_TABLE = process.env.AIRTABLE_RENT_TABLE_ID || "tblOZztlu6qSLMAtc";
const SALE_TABLE = process.env.AIRTABLE_SALE_TABLE_ID || "tblB67Zm9zxDlFwY7";
const SITE_URL = "https://corretajeguzman.com";

const F = {
  title: ["Nombre de la propiedad", "Nombre", "Título", "Titulo", "Propiedad"],
  address: ["Direccion publica", "Dirección pública", "Direccion Publica", "Dirección Publica", "Dirección", "Direccion", "Address"],
  commune: ["Comuna", "Ciudad", "Sector"],
  bedrooms: ["Dormitorios", "Habitaciones"],
  bathrooms: ["Baños", "Banos", "Baño"],
  photos: ["Fotos", "Foto", "Imágenes", "Imagenes", "Photos"],
  priceValue: ["Precio valor", "Precio", "Valor"],
  currency: ["Moneda", "Currency"],
  commonExpenses: ["Valor gasto común", "Gastos comunes", "Gasto común", "GGCC"],
  propertyType: ["Tipo propiedad", "Tipo de propiedad", "Tipo de inmueble", "Tipo", "Categoría", "Categoria"],
  operation: ["Operación", "Operacion"],
  description: ["Descripción pública", "Descripcion publica", "Descripción", "Descripcion", "Detalle"]
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

const pick = (v) => (v && v.name) ? v.name : v;
const num = (v) => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
};
const photos = (v) => {
  if (Array.isArray(v)) return v.map(a => a && a.url ? a.url : a).filter(x => typeof x === "string");
  if (typeof v === "string") return v.split(/[\s,]+/).filter(u => /^https?:\/\//.test(u));
  return [];
};
const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function inferPropertyType(raw, title) {
  const text = norm(`${pick(raw) || ""} ${title || ""}`);
  if (/\b(parcela|terreno|lote|sitio)\b/.test(text)) return "Parcela";
  if (/\b(local comercial|local|comercial)\b/.test(text)) return "Local";
  if (/\b(casa|townhouse)\b/.test(text)) return "Casa";
  if (/\b(oficina)\b/.test(text)) return "Oficina";
  if (/\b(estudio|studio)\b/.test(text)) return "Estudio";
  if (/\b(depto|departamento|dpto|apto|apartamento)\b/.test(text)) return "Departamento";
  return pick(raw) || "Propiedad";
}

function normalize(rec, operation) {
  const f = rec.fields || {};
  const g = (key) => get(f, F[key]);
  let op = String(pick(g("operation")) || operation || "arriendo").toLowerCase();
  op = op.includes("vent") ? "venta" : "arriendo";
  const title = String(g("title") || "Propiedad");
  const priceValue = num(g("priceValue")) || 0;
  let currency = String(pick(g("currency")) || "").toUpperCase();
  if (currency !== "UF" && currency !== "CLP") currency = priceValue > 0 && priceValue < 100000 ? "UF" : "CLP";
  const imageList = photos(g("photos"));
  return {
    id: rec.id,
    operation: op,
    title,
    address: String(g("address") || ""),
    commune: String(g("commune") || ""),
    bedrooms: g("bedrooms") != null ? num(g("bedrooms")) : null,
    bathrooms: g("bathrooms") != null ? num(g("bathrooms")) : null,
    propertyType: inferPropertyType(g("propertyType"), title),
    priceValue,
    currency,
    commonExpenses: num(g("commonExpenses")) || 0,
    description: g("description") ? String(g("description")) : "",
    coverPhoto: imageList[0] || `${SITE_URL}/assets/guzman-logo.png`
  };
}

async function findProperty(id, token) {
  for (const item of [[RENT_TABLE, "arriendo"], [SALE_TABLE, "venta"]]) {
    const [table, operation] = item;
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) return normalize(await r.json(), operation);
    if (r.status !== 404) continue;
  }
  return null;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
}

function formatPrice(p) {
  if (!p || !p.priceValue) return "Consultar precio";
  const amount = Math.round(p.priceValue).toLocaleString("es-CL");
  return p.currency === "UF" ? `UF ${amount}` : `$${amount}`;
}

function buildDescription(p) {
  const parts = [];
  parts.push(`${p.propertyType} en ${p.operation === "venta" ? "venta" : "arriendo"}`);
  if (p.commune) parts.push(p.commune);
  const attrs = [];
  if (p.bedrooms != null) attrs.push(`${p.bedrooms} dorm.`);
  if (p.bathrooms != null) attrs.push(`${p.bathrooms} baño${p.bathrooms === 1 ? "" : "s"}`);
  if (attrs.length) parts.push(attrs.join(" · "));
  parts.push(formatPrice(p));
  return parts.join(" · ");
}

function fallbackHtml(id, path) {
  const url = `${SITE_URL}${path}`;
  return render({
    id,
    title: "Propiedad disponible en Corretaje Guzmán",
    description: "Revisa esta propiedad disponible y solicita más información con Corretaje Guzmán.",
    image: `${SITE_URL}/assets/guzman-logo.png`,
    url
  });
}

function render(data) {
  const title = escapeHtml(data.title);
  const description = escapeHtml(data.description);
  const image = escapeHtml(data.image);
  const url = escapeHtml(data.url);
  const fichaUrl = `/ficha?id=${encodeURIComponent(data.id || "")}`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Corretaje Guzmán">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0; url=${fichaUrl}">
<script>window.location.replace(${JSON.stringify(fichaUrl)});</script>
</head>
<body style="font-family:Arial,sans-serif;background:#f3f0f8;color:#16121f;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
  <main>
    <h1>${title}</h1>
    <p>${description}</p>
    <p><a href="${fichaUrl}">Ver propiedad</a></p>
  </main>
</body>
</html>`;
}

exports.handler = async function(event) {
  const path = event.path || "/propiedad";
  const last = decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
  const match = last.match(/(rec[a-zA-Z0-9]+)$/);
  const id = match ? match[1] : "";
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!id || !token) {
    return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: fallbackHtml(id, path) };
  }

  try {
    const p = await findProperty(id, token);
    if (!p) return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: fallbackHtml(id, path) };
    const price = formatPrice(p);
    const op = p.operation === "venta" ? "Venta" : "Arriendo";
    const location = p.commune ? ` en ${p.commune}` : "";
    const title = `${p.title} · ${op}${location} · Corretaje Guzmán`;
    const description = p.description ? p.description.slice(0, 190) : buildDescription(p);
    const url = `${SITE_URL}${path}`;
    const html = render({ id, title, description: `${buildDescription(p)}. ${description}`.slice(0, 260), image: p.coverPhoto, url });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      },
      body: html
    };
  } catch (err) {
    return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: fallbackHtml(id, path) };
  }
};
