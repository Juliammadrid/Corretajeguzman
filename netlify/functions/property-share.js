const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";
const DEFAULT_IMAGE = "https://corretajeguzman.com/assets/guzman-logo.jpg";
const SITE_ORIGIN = "https://corretajeguzman.com";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstValue(fields, names) {
  for (const name of names) {
    const value = fields[name];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      return value;
    }
    return value;
  }
  return "";
}

function firstAttachmentUrl(value) {
  if (!Array.isArray(value)) return "";
  const found = value.find(item => item && (item.thumbnails?.large?.url || item.thumbnails?.full?.url || item.url));
  return found ? (found.thumbnails?.large?.url || found.thumbnails?.full?.url || found.url || "") : "";
}

function normalizeProperty(record, tableKind) {
  const fields = record.fields || {};
  const operation = tableKind === "sale" ? "venta" : "arriendo";
  const title = firstValue(fields, ["Nombre de la propiedad", "Nombre", "Titulo", "Título", "Propiedad"]) || "Propiedad Corretaje Guzmán";
  const comuna = firstValue(fields, ["Comuna", "Comuna propiedad", "Sector"]);
  const direccion = firstValue(fields, ["Direccion publica", "Dirección pública", "Dirección", "Direccion"]);
  const tipo = firstValue(fields, ["Tipo propiedad", "Tipo de propiedad", "Tipo"]);
  const price = firstValue(fields, ["Precio valor", "Valor esperado", "Valor arriendo", "Valor arriendo mensual", "Precio"]);
  const moneda = firstValue(fields, ["Moneda"]);
  const fotos = firstValue(fields, ["Fotos", "Foto", "Imagenes", "Imágenes"]);
  const image = firstAttachmentUrl(fotos) || DEFAULT_IMAGE;
  return {
    id: record.id,
    title: String(title),
    operation,
    comuna: String(comuna || ""),
    direccion: String(direccion || ""),
    tipo: String(tipo || ""),
    price: price ? String(price) : "",
    moneda: moneda ? String(moneda) : "",
    image
  };
}

function buildDescription(p) {
  const parts = [];
  if (p.operation) parts.push(p.operation === "venta" ? "En venta" : "En arriendo");
  if (p.tipo) parts.push(p.tipo);
  if (p.comuna) parts.push(p.comuna);
  if (p.price) parts.push(`${p.moneda ? p.moneda + " " : ""}${p.price}`);
  return parts.length
    ? `${parts.join(" · ")} en Corretaje Guzmán. Revisa fotos, detalles y agenda tu visita.`
    : "Propiedades disponibles en arriendo y venta con Corretaje Guzmán.";
}

function idFromPath(path) {
  const last = decodeURIComponent(String(path || "").split("/").filter(Boolean).pop() || "");
  const airtable = last.match(/(rec[a-zA-Z0-9]+)$/);
  if (airtable && airtable[1]) return airtable[1];

  const dash = last.lastIndexOf("-");
  if (dash >= 0 && dash < last.length - 1) return last.slice(dash + 1);

  return "";
}

async function findProperty(id, token) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tables = [
    { id: process.env.AIRTABLE_RENT_TABLE_ID, kind: "rent" },
    { id: process.env.AIRTABLE_SALE_TABLE_ID, kind: "sale" }
  ].filter(t => t.id);

  if (!baseId || !token || !id) return null;

  for (const table of tables) {
    try {
      const url = `${AIRTABLE_BASE_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table.id)}/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) continue;
      const record = await res.json();
      if (record && record.id) return normalizeProperty(record, table.kind);
    } catch (error) {
      console.error("property-share lookup failed", error);
    }
  }
  return null;
}

function redirectHtml(id) {
  const target = `/ficha?id=${encodeURIComponent(id || "")}`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(target)}">
  <title>Redirigiendo · Corretaje Guzmán</title>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <a href="${escapeHtml(target)}">Abrir propiedad</a>
</body>
</html>`;
}

function propertyHtml(data, path) {
  const title = `${data.title} · Corretaje Guzmán`;
  const desc = buildDescription(data);
  const canonical = `${SITE_ORIGIN}${path}`;
  const fichaUrl = `/ficha?id=${encodeURIComponent(data.id || "")}`;
  const image = data.image || DEFAULT_IMAGE;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Corretaje Guzmán">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: data.title,
    description: desc,
    url: canonical,
    image,
    address: [data.direccion, data.comuna, "Chile"].filter(Boolean).join(", "),
    offers: data.price ? {
      "@type": "Offer",
      price: String(data.price).replace(/[^0-9.]/g, ""),
      priceCurrency: data.moneda === "UF" ? "CLF" : "CLP",
      availability: "https://schema.org/InStock"
    } : undefined
  }).replace(/</g, "\\u003c")}</script>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(fichaUrl)}">
  <script>window.location.replace(${JSON.stringify(fichaUrl)});</script>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  <p>${escapeHtml(desc)}</p>
  <a href="${escapeHtml(fichaUrl)}">Ver ficha</a>
</body>
</html>`;
}

export default async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const id = idFromPath(path);
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;
  const property = await findProperty(id, token);

  return new Response(property ? propertyHtml(property, path) : redirectHtml(id), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
};

export const config = {
  path: "/propiedad/*"
};
