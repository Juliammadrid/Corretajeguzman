/* ============================================================
 *  Netlify Scheduled Function · sync-rentando
 *  ------------------------------------------------------------
 *  Sincroniza el catálogo de la empresa aliada RENTANDO con tu
 *  base de Airtable, 1 vez al día. Las propiedades de Rentando
 *  quedan en Airtable con source="Rentando" y aparecen solas en
 *  tu web (listados + mapa), mezcladas con las tuyas.
 *
 *  Cuando Rentando arrienda/quita una propiedad, deja de venir
 *  en el feed → aquí la marcamos "Activa = false" para que
 *  desaparezca de tu sitio.
 *
 *  ── REQUISITO: la URL del feed de Rentando ──────────────────
 *  El sitio de Rentando carga las propiedades por JavaScript,
 *  así que NO se puede leer del HTML. Necesitas pedirle a
 *  Rentando / Convecta UNA de estas:
 *    a) URL del FEED de portales (XML o JSON)  ← recomendado
 *    b) el endpoint interno (XHR) que usa su listado
 *  y cargarla en Netlify como variable RENTANDO_FEED_URL.
 *
 *  Variables de entorno (Netlify):
 *    RENTANDO_FEED_URL        = https://…  (feed XML/JSON)
 *    AIRTABLE_API_KEY         = pat…  (lectura + escritura)
 *    AIRTABLE_BASE_ID         = appkG5ldIIHTVkXf6
 *    AIRTABLE_RENTANDO_TABLE  = "Rentando"  (tabla destino)
 *
 *  Programación: ver netlify.toml → [functions."sync-rentando"]
 * ============================================================ */

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_RENTANDO_TABLE || "Rentando";
const FEED_URL = process.env.RENTANDO_FEED_URL || "";

/* Mapea un item del feed → esquema de tu web.
 * Soporta JSON genérico y, como respaldo, XML de portal (Convecta).
 * Cuando tengas el feed real, ajusta los nombres de campo aquí. */
function normalize(item) {
  const g = (...keys) => { for (const k of keys) { const v = item[k]; if (v !== undefined && v !== null && v !== "") return v; } return undefined; };
  const op = String(g("operacion", "operation", "tipo_operacion", "TipoOperacion") || "Arriendo").toLowerCase();
  const fotos = []
    .concat(g("fotos", "images", "imagenes", "photos") || [])
    .map(f => (f && f.url) ? f.url : f)
    .filter(x => typeof x === "string");
  return {
    external_id: String(g("id", "codigo", "code", "Codigo", "external_id") || ""),
    operation: op.includes("venta") ? "venta" : "arriendo",
    propertyType: g("tipo", "tipo_propiedad", "type", "Tipo") || "Departamento",
    title: g("titulo", "title", "nombre", "Titulo") || "Propiedad Rentando",
    commune: g("comuna", "commune", "Comuna") || "",
    address: g("direccion", "address", "Direccion") || g("comuna", "Comuna") || "",
    priceValue: Number(String(g("precio", "valor", "price", "Precio") || "").replace(/[^\d.]/g, "")) || 0,
    currency: String(g("moneda", "currency", "Moneda") || "CLP").toUpperCase().includes("UF") ? "UF" : "CLP",
    commonExpenses: Number(g("gastos_comunes", "ggcc") || 0) || 0,
    bedrooms: g("dormitorios", "bedrooms", "Dormitorios") != null ? Number(g("dormitorios", "bedrooms", "Dormitorios")) : null,
    bathrooms: g("banos", "bathrooms", "Banos") != null ? Number(g("banos", "bathrooms", "Banos")) : null,
    usableArea: g("superficie_util", "superficie", "area") != null ? Number(g("superficie_util", "superficie", "area")) : null,
    parking: g("estacionamientos", "parking") != null ? Number(g("estacionamientos", "parking")) : null,
    latitude: g("latitud", "lat", "latitude") != null ? Number(g("latitud", "lat", "latitude")) : null,
    longitude: g("longitud", "lng", "longitude") != null ? Number(g("longitud", "lng", "longitude")) : null,
    photos: fotos,
    detailUrl: g("url", "link", "detalle") || "",
    source: "Rentando"
  };
}

/* Lee el feed (JSON o XML simple) y devuelve un arreglo de items crudos */
async function fetchFeed(url) {
  const r = await fetch(url, { headers: { accept: "application/json, application/xml, text/xml" } });
  if (!r.ok) throw new Error("Feed " + r.status);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const body = await r.text();
  if (ct.includes("json") || body.trim().startsWith("{") || body.trim().startsWith("[")) {
    const j = JSON.parse(body);
    return Array.isArray(j) ? j : (j.propiedades || j.properties || j.items || j.data || []);
  }
  // XML muy básico: extrae <property>…</property> o <propiedad>…</propiedad>
  const blocks = body.match(/<(?:property|propiedad)\b[\s\S]*?<\/(?:property|propiedad)>/gi) || [];
  return blocks.map(b => {
    const o = {};
    const tags = b.match(/<([a-zA-Z_:]+)>([\s\S]*?)<\/\1>/g) || [];
    tags.forEach(t => { const m = t.match(/<([a-zA-Z_:]+)>([\s\S]*?)<\/\1>/); if (m) o[m[1].toLowerCase()] = m[2].replace(/<!\[CDATA\[|\]\]>/g, "").trim(); });
    return o;
  });
}

/* Airtable helpers */
async function atList(token) {
  let out = [], offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error("Airtable list " + r.status);
    const j = await r.json();
    out = out.concat(j.records || []); offset = j.offset;
  } while (offset);
  return out;
}
async function atBatch(token, method, records) {
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: chunk, typecast: true })
    });
    if (!r.ok) throw new Error(`Airtable ${method} ${r.status}: ${await r.text()}`);
  }
}
function toFields(p) {
  return {
    "external_id": p.external_id, "Origen": p.source, "Operación": p.operation === "venta" ? "Venta" : "Arriendo",
    "Tipo": p.propertyType, "Título": p.title, "Comuna": p.commune, "Dirección": p.address,
    "Precio": p.priceValue, "Moneda": p.currency, "Gastos comunes": p.commonExpenses,
    "Dormitorios": p.bedrooms, "Baños": p.bathrooms, "Superficie": p.usableArea, "Estacionamientos": p.parking,
    "Latitud": p.latitude, "Longitud": p.longitude, "Fotos": (p.photos || []).join(", "),
    "URL detalle": p.detailUrl, "Activa": true
  };
}

exports.handler = async function () {
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 500, body: "Falta AIRTABLE_API_KEY" };
  if (!FEED_URL) return { statusCode: 200, body: "Falta RENTANDO_FEED_URL — pídela a Rentando/Convecta (ver INTEGRACION-RENTANDO.md)" };

  try {
    const raw = await fetchFeed(FEED_URL);
    const items = raw.map(normalize).filter(p => p.external_id);
    const existing = await atList(token);
    const byId = {};
    existing.forEach(r => { const id = r.fields && r.fields["external_id"]; if (id) byId[id] = r; });

    const creates = [], updates = [], seen = new Set();
    for (const p of items) {
      seen.add(p.external_id);
      const f = toFields(p);
      if (byId[p.external_id]) updates.push({ id: byId[p.external_id].id, fields: f });
      else creates.push({ fields: f });
    }
    // marcar inactivas las que ya no vienen (arrendadas/quitadas)
    const deactivate = existing
      .filter(r => r.fields && r.fields["external_id"] && !seen.has(r.fields["external_id"]) && r.fields["Activa"] !== false)
      .map(r => ({ id: r.id, fields: { "Activa": false } }));

    if (creates.length) await atBatch(token, "POST", creates);
    if (updates.length) await atBatch(token, "PATCH", updates);
    if (deactivate.length) await atBatch(token, "PATCH", deactivate);

    return { statusCode: 200, body: JSON.stringify({ ok: true, recibidas: items.length, nuevas: creates.length, actualizadas: updates.length, desactivadas: deactivate.length }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};

/* Programación diaria (Netlify) */
exports.config = { schedule: "0 9 * * *" }; // 09:00 UTC ≈ 06:00 Chile
