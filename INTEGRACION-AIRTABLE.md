# Conectar el sitio — Corretaje Guzmán

El sitio funciona ya con datos de ejemplo. Para datos en vivo solo
necesitas **publicar en Netlify y cargar las variables de entorno**.
Ninguna llave (Airtable / Google Maps) se escribe en el código: viven
solo en Netlify y las leen las funciones serverless.

## Archivos
| Archivo | Qué es |
|---|---|
| `Home - Corretaje Guzman.html` | Home con buscador (lista + mapa) y reseñas. |
| `Ficha Propiedad - Corretaje Guzman v2.html` | Ficha de detalle. |
| `guzman-shared.js` | Helpers (precio, UF, WhatsApp, carga de datos/config). |
| `home.js` / `app.js` | Lógica del home / de la ficha. |
| `data-propiedades.js` | Config + datos de ejemplo (fallback). |
| `netlify/functions/*` | Backend seguro (properties, reviews, config). |
| `netlify.toml` | Rutas `/api/...` y publicación. |
| `assets/guzman-logo.png` | Logo. |

## Variables de entorno en Netlify
*Site settings → Environment variables → Add a variable:*

| Variable | Obligatoria | Valor |
|---|---|---|
| `AIRTABLE_API_KEY` | ✅ | Tu Personal Access Token (`pat...`) con scope `data.records:read`. |
| `GOOGLE_MAPS_API_KEY` | ⬜ (para el mapa) | Tu clave `AIza...` **restringida por dominio**. |
| `AIRTABLE_BASE_ID` | ⬜ | Def: `appkG5ldIIHTVkXf6` |
| `AIRTABLE_RENT_TABLE_ID` | ⬜ | Def: `tblOZztlu6qSLMAtc` |
| `AIRTABLE_SALE_TABLE_ID` | ⬜ | Def: `tblB67Zm9zxDlFwY7` |
| `AIRTABLE_REVIEWS_TABLE_ID` | ⬜ | Tabla de reseñas (nombre o id). |
| `WHATSAPP_NUMBER` | ⬜ | Def: `56944637680` |

> ⚠️ **Nunca** pongas estas llaves en archivos `.js`/`.html` ni las
> pegues en chats. Solo en Environment variables de Netlify.

## Seguridad de la Google Maps API key
Como la usa el navegador, debe ser **restringida** (en Google Cloud Console):
1. **Application restrictions → HTTP referrers**: agrega
   `https://corretajeguzman.com/*` y tu dominio de Netlify `*.netlify.app/*`.
2. **API restrictions**: limita a *Maps JavaScript API*.
La función `/api/config` entrega esa key al sitio solo en tu dominio; el
código fuente queda sin llaves.

## Rutas API (ya configuradas en netlify.toml)
- `/api/properties` · `/api/properties/rent` · `/api/properties/sale`
- `/api/property/:id`
- `/api/reviews`
- `/api/config` (entrega mapsKey + whatsapp)

## Esquema de datos (lo que devuelve el backend)
`operation` (arriendo|venta), `title`, `address`, `commune`,
`priceValue`, `currency` (CLP|UF), `commonExpenses`, `bedrooms`,
`bathrooms`, `parking`, `storage`, `propertyType`, `description`,
`usableArea`, `totalArea`, `latitude`, `longitude`, `features[]`,
`photos[]`, `coverPhoto`, `status`, `updatedAt`.

Los nombres de columna de Airtable se mapean en
`netlify/functions/properties.js` (objeto `F`). Si alguno no calza,
mándame el encabezado de tu tabla y lo ajusto.
