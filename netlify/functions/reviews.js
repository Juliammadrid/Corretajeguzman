/* Netlify Function · /api/reviews
 * Lee la tabla "Reseñas de Facebook" desde Airtable.
 * Variables:
 *   AIRTABLE_API_KEY           (obligatoria)
 *   AIRTABLE_BASE_ID           (def: appkG5ldIIHTVkXf6)
 *   AIRTABLE_REVIEWS_TABLE_ID  (id o nombre de la tabla de reseñas)
 */
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkG5ldIIHTVkXf6";
const TABLE = process.env.AIRTABLE_REVIEWS_TABLE_ID || "Reseñas de Facebook";

const F = {
  name:   ["Nombre cliente", "Nombre", "Cliente", "Name"],
  text:   ["Texto reseña", "Reseña", "Texto", "Comentario", "Review"],
  rating: ["Calificación", "Calificacion", "Estrellas", "Rating"],
  photo:  ["Foto cliente", "Foto", "Avatar", "Imagen"]
};
const get = (f, keys) => { for (const k of keys) if (f[k] != null && f[k] !== "") return f[k]; return undefined; };
const photo = (v) => Array.isArray(v) ? (v[0] && v[0].url) : v;

exports.handler = async function () {
  const token = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
  if (!token) return { statusCode: 200, body: JSON.stringify({ reviews: [] }) };
  try {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
    url.searchParams.set("pageSize", "12");
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return { statusCode: 200, body: JSON.stringify({ reviews: [] }) };
    const j = await r.json();
    const reviews = (j.records || []).map(rec => {
      const f = rec.fields || {};
      return { name: get(f, F.name) || "Cliente", text: get(f, F.text) || "", rating: Number(get(f, F.rating)) || 5, photo: photo(get(f, F.photo)) || "" };
    }).filter(x => x.text);
    return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" }, body: JSON.stringify({ reviews }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ reviews: [] }) };
  }
};
