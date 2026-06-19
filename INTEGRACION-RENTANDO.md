# Integración con RENTANDO (empresa aliada) — sincronización diaria

Tu aliado **Rentando** (plataforma Convecta) te facilita sus propiedades de
arriendo. Este módulo las trae **automáticamente a tu sitio + Airtable**, una
vez al día, y las quita cuando Rentando las arrienda.

## Cómo funciona

```
Rentando (feed)  →  sync-rentando (Netlify, 1×/día 06:00 Chile)  →  Airtable "Rentando"  →  tu web (listados + mapa)
```

- Las propiedades de Rentando quedan en Airtable con `Origen = "Rentando"`.
- Tu web ya lee desde Airtable → aparecen solas, mezcladas con las tuyas.
- Si una propiedad deja de venir en el feed (la arrendaron), se marca
  `Activa = false` y desaparece del sitio.

## ⚠️ Lo único que falta: la URL del feed de Rentando

El sitio de Rentando **carga las propiedades con JavaScript**, no están en el
HTML — por eso no se pueden "copiar" de la página. Hay que conectarse a la
**fuente de datos**. Pídele a **Rentando / Convecta** una de estas (en orden):

1. **🥇 Feed de portales (XML o JSON).** Convecta ya genera uno para enviar
   propiedades a Portal Inmobiliario / Yapo / MercadoLibre. Pídeles:
   *"la URL del feed de sindicación de propiedades para publicarlas en otro sitio"*.
2. **🥈 Endpoint interno (XHR).** En su sitio: clic derecho → Inspeccionar →
   pestaña **Network** → filtro **Fetch/XHR** → recargar → ver qué dirección
   devuelve las propiedades (en JSON). Esa URL sirve.
3. **🥉 Permiso para scraping renderizado** (último recurso, más frágil).

Cuando la tengas, cárgala en Netlify como `RENTANDO_FEED_URL`.

## Variables de entorno (Netlify)

| Variable | Valor |
|---|---|
| `RENTANDO_FEED_URL` | URL del feed de Rentando (XML/JSON) |
| `AIRTABLE_API_KEY` | Token con lectura + escritura |
| `AIRTABLE_BASE_ID` | `appkG5ldIIHTVkXf6` |
| `AIRTABLE_RENTANDO_TABLE` | `Rentando` (o el nombre que uses) |

## Tabla "Rentando" en Airtable (columnas)
`external_id` (texto, clave única) · `Origen` · `Operación` · `Tipo` · `Título`
· `Comuna` · `Dirección` · `Precio` (number) · `Moneda` · `Gastos comunes`
· `Dormitorios` · `Baños` · `Superficie` · `Estacionamientos` · `Latitud`
· `Longitud` · `Fotos` · `URL detalle` · `Activa` (checkbox)

## Ajuste del mapeo
Apenas tengamos el feed real, en `netlify/functions/sync-rentando.js` la función
`normalize()` calza los nombres de campo del feed con tu esquema. Ya soporta
JSON genérico y XML simple; con el feed a la vista lo dejo exacto.

## Probar la sincronización
- Manual: abre `…/.netlify/functions/sync-rentando` (devuelve cuántas trajo).
- Automática: corre sola cada día a las 09:00 UTC (~06:00 Chile), configurable
  en `netlify.toml` → `[functions."sync-rentando"] schedule`.

## Nota legal
Como es una **alianza**, lo correcto es publicar con su feed/permiso explícito.
Pedirles el feed (opción 1) además de ser lo más robusto, deja todo en regla.
