/* Netlify Function · /api/config
 * Entrega al frontend SÓLO valores públicos (clave de Google Maps
 * restringida por dominio + número de WhatsApp). La API key de
 * Airtable nunca se entrega aquí. */
exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    body: JSON.stringify({
      mapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
      whatsapp: process.env.WHATSAPP_NUMBER || "56944637680"
    })
  };
};
