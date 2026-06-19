/* ============================================================
   Corretaje Guzmán — configuración + datos
   Esquema NORMALIZADO (igual al que devuelve la función de
   Netlify y al que consume el frontend).
   ============================================================ */
window.GUZMAN_CONFIG = {
  endpoint: "/api/properties",     // función serverless (Netlify)
  reviewsEndpoint: "/api/reviews", // opcional
  configEndpoint: "/api/config",   // entrega mapsKey + whatsapp desde el entorno
  whatsapp: "56944637680",
  ufValueClp: 39200,               // valor referencial UF→CLP (ajustable)
  // La key de Google Maps se inyecta sólo si está restringida por dominio.
  // Déjala vacía aquí; la función /api/config la entrega en producción.
  mapsKey: "",
  facebookReviews: "https://www.facebook.com/Corretajeguzman/reviews/?id=100049612577013&sk=reviews",
  useFallbackOnError: true
};

/* Corredores (para elegir antes de enviar WhatsApp) */
window.GUZMAN_BROKERS = [
  "Claudia Guzmán", "Juliam Madrid", "Paola Peña", "Rosa Pedreros",
  "Marling Pérez", "Adriana Rubio", "María José Villarroel",
  "Dante Muñoz", "Johana Madrid", "Vi la empresa en internet"
];

/* ============================================================
   PROPIEDADES — venta y parcelas vienen EN VIVO desde Airtable
   (/api/properties). Sin datos de ejemplo: la lista queda vacía
   hasta conectar la base. Los arriendos vienen de data-rentando.js
   (catálogo real de la empresa aliada Rentando).
   ============================================================ */
window.GUZMAN_FALLBACK = [];

/* ============================================================
   RESEÑAS reales (fuente: tabla "Reseñas de Facebook")
   ============================================================ */
window.GUZMAN_REVIEWS = [
  { name: "Natalia Luque", rating: 5, photo: "assets/review-natalia.jpg", text: "Les recomiendo está corredora, con una atención personalizada, preocupados y con una rapidez única." },
  { name: "Rodrigo Acevedo", rating: 5, photo: "assets/review-rodrigo.jpg", text: "Excelente servicio, lograron conseguir tres arrendatarios de calidad en pocas semanas para tres departamentos que encargué. Los recomiendo de todas maneras." },
  { name: "Daniel Villalobos", rating: 5, photo: "assets/review-daniel.jpg", text: "Los recomiendo al 100%. En menos de dos días conseguimos la casa que buscábamos desde hace 9 meses. Excelente gestión, eficiencia, profesionalismo y empatía." },
  { name: "Andrea Mercado", rating: 5, photo: "assets/review-andrea.jpg", text: "Súper profesionales. Fue todo muy expedito y rápido. Muy contenta con la atención recibida." },
  { name: "Manuel Carvallo", rating: 5, photo: "assets/review-manuel.jpg", text: "100% recomendado, confiables, atención cordial y resolvieron cada inquietud rápidamente." },
  { name: "Edo Flores", rating: 5, photo: "assets/review-edo.jpg", text: "Muy buenos corredores de propiedades, recomendados al 100%. Gran disposición y cercanía." }
];
