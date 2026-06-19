# Plan de integración de datos — Corretaje Guzmán (Airtable + Netlify + Email)

Objetivo: que **todo el negocio quede ordenado en Airtable**. Cada formulario
del sitio (1) **guarda un registro en Airtable** y (2) **avisa por correo** al
equipo. El catálogo de propiedades también se **lee desde Airtable**.

Base de Airtable: `appkG5ldIIHTVkXf6`

---

## 1) Fuentes de datos del sitio (qué se conecta y a dónde)

| # | Sección del sitio | Qué hace | Endpoint (Netlify) | Tabla en Airtable | Dirección |
|---|---|---|---|---|---|
| 1 | **Arrendar / Comprar / Parcelas** (listados + ficha) | Muestra propiedades | `/api/properties` (+ `/rent`, `/sale`) y `/api/property/:id` | **Arriendos** `tblOZztlu6qSLMAtc` · **Ventas** `tblB67Zm9zxDlFwY7` · **Parcelas** *(crear)* | Airtable → Web (lectura) |
| 2 | **Formulario de Arriendo** (arrendatarios) | Captura interesados en arrendar | `/api/lead-arriendo` | **Solicitudes Arriendo** *(crear)* | Web → Airtable (escritura) |
| 3 | **Arrendar mi propiedad** (propietarios) | Captura propietarios + su propiedad | `/api/lead-propietario` | **Propietarios** *(crear)* | Web → Airtable |
| 4 | **Administración de propiedades** | Solicitudes de administración (7% / $350.000) | `/api/lead-propietario` *(mismo, con `origen` distinto)* | **Propietarios** | Web → Airtable |
| 5 | **Sé corredor** | Postulaciones de corredores (Gratis/Premium) | `/api/lead-corredor` | **Corredores** *(crear)* | Web → Airtable |
| 6 | **Reseñas** (Home) | Muestra opiniones de clientes | `/api/reviews` | **Reseñas** *(crear, opcional)* | Airtable → Web |
| 7 | **Contáctanos** (Home / Ficha) | Mensajes de contacto general | `/api/lead-contacto` *(por crear)* | **Contactos** *(crear, opcional)* | Web → Airtable |
| 8 | **Mapa** (Arrendar/Comprar) | Pines reales de propiedades | `/api/config` (entrega la API key) | — | Google Maps |

> Las funciones de los puntos 2–5 **ya están programadas** en `netlify/functions/`.
> Falta crear las **tablas** en Airtable y cargar las **variables** en Netlify.

---

## 2) Variables de entorno en Netlify
*Site settings → Environment variables.* Las llaves viven **solo aquí** (nunca en el código).

| Variable | Para qué | Obligatoria |
|---|---|---|
| `AIRTABLE_API_KEY` | Token (Personal Access Token) con permiso de lectura **y escritura** | ✅ |
| `AIRTABLE_BASE_ID` | Por defecto `appkG5ldIIHTVkXf6` | ⬜ |
| `AIRTABLE_RENT_TABLE_ID` | Def. `tblOZztlu6qSLMAtc` | ⬜ |
| `AIRTABLE_SALE_TABLE_ID` | Def. `tblB67Zm9zxDlFwY7` | ⬜ |
| `AIRTABLE_PARCELS_TABLE_ID` | Tabla de parcelas (cuando exista) | ⬜ |
| `AIRTABLE_LEADS_TABLE_ID` | Tabla "Solicitudes Arriendo" | ⬜ |
| `AIRTABLE_OWNERS_TABLE_ID` | Tabla "Propietarios" | ⬜ |
| `AIRTABLE_BROKERS_TABLE_ID` | Tabla "Corredores" | ⬜ |
| `AIRTABLE_REVIEWS_TABLE_ID` | Tabla "Reseñas" | ⬜ |
| `GOOGLE_MAPS_API_KEY` | Mapa real (restringida por dominio) | ⬜ (para mapa) |
| `WHATSAPP_NUMBER` | Def. `56944637680` | ⬜ |

El **token** se crea en https://airtable.com/create/tokens con scopes
`data.records:read` y `data.records:write`, y acceso a la base.

---

## 3) Tablas a crear en Airtable (con sus columnas)

### A. Solicitudes Arriendo  (arrendatarios)
`Nombre` · `WhatsApp` · `Correo` · `Fecha de cambio` · `Comunas de interés` (multi-select)
· `Presupuesto arriendo` (number) · `Dormitorios` · `Estacionamiento` · `Renta líquida` (number)
· `N° de personas` · `Complementa renta` · `Renta complemento` (number) · `Mascotas`
· `Acepta condiciones` (checkbox) · `Origen` · `Fecha de envío` (date)

### B. Propietarios  (arrendar mi propiedad + administración)
`Nombre` · `WhatsApp` · `Correo` · `Tipo de propiedad` · `Comuna` · `Dirección`
· `Dormitorios` · `Baños` · `Valor arriendo estimado` (number) · `Plan de interés`
· `Etapa` · `Origen` *(distingue "Quiero arrendar" vs "Administración")* · `Fecha de envío`

### C. Corredores  (postulaciones)
`Nombre` · `WhatsApp` · `Correo` · `Comuna` · `Experiencia` · `Plan de interés` (Gratis/Premium)
· `Origen` · `Fecha de envío`

### D. Parcelas  (catálogo) — mismo esquema que propiedades
`Título` · `Operación` (=Venta) · `Tipo` (=Parcela) · `Comuna/Sector` · `Dirección`
· `Precio` · `Moneda` (UF/CLP) · `Superficie` (m²) · `Características` (multi-select)
· `Latitud` · `Longitud` · `Fotos` (attachment) · `Destacado` (checkbox)

### E. Reseñas  (opcional, Home)
`Nombre` · `Comuna` · `Estrellas` (1–5) · `Comentario` · `Publicar` (checkbox)

### F. Contactos  (opcional, contacto general)
`Nombre` · `Correo` · `Teléfono` · `Mensaje` · `Origen` · `Fecha`

---

## 4) Aviso por correo cuando llega un dato (2 caminos)

**Opción recomendada — Automatización de Airtable (sin código):**
En cada tabla (Solicitudes Arriendo, Propietarios, Corredores, Contactos):
1. Airtable → *Automations* → *When a record is created*.
2. Acción *Send email* a `contacto@corretajeguzman.com` con los campos del registro.
3. (Opcional) Segunda acción: enviar a WhatsApp/Slack con un conector.

Ventaja: cero código, lo administras tú desde Airtable. El registro y el correo
salen del mismo evento.

**Opción avanzada — correo desde la función Netlify:**
Agregar un proveedor de email (Resend / SendGrid / Mailgun) y, dentro de cada
`lead-*.js`, enviar el correo además de guardar en Airtable. Requiere una
variable extra (ej. `RESEND_API_KEY`). Útil si quieres el correo aunque
Airtable falle.

---

## 5) Estado actual

- ✅ Funciones de captura programadas: `lead-arriendo`, `lead-propietario`, `lead-corredor`.
- ✅ Lectura de propiedades y reseñas: `properties`, `reviews`, `config`.
- ✅ Todos los formularios del sitio ya hacen el POST a su endpoint.
- ⬜ Crear las tablas (sección 3) y cargar variables (sección 2) en Netlify.
- ⬜ Activar las automatizaciones de correo (sección 4).
- ⬜ Crear tabla de Parcelas y cargar la Google Maps key para el mapa real.

> Cuando tengas las tablas creadas, pásame los **nombres exactos de las columnas**
> y dejo el mapeo (`FIELD_MAP` / `LEAD_MAP`) calzado al 100%.
