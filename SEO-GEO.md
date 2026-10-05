# Operación SEO de Corretaje Guzmán

## Arquitectura

Sitio HTML/CSS/JS sin framework. Ejecutar `node scripts/build-seo.mjs` y `node --test tests/seo.test.mjs`.
El build genera HTML inicial para 21 proyectos usando data-proyectos.js, data-proyectos-detalle.js y tipologias-confirmadas.js (95 plantas). No reemplaza los recursos originales.
Las fichas de propiedades y los catálogos se renderizan mediante Edge Functions para personas y buscadores por igual, sin discriminación por user agent.
La API normalizada existente de Airtable sigue siendo la fuente de propiedades. No se incorpora Rentando.

## Publicación de propiedades

- Mantener nombre, operación, comuna, precio, moneda, descripción pública, fotos y estado coherentes en Airtable.
- Usar Estado Disponible para inventario comercial activo. Reservadas, vendidas, arrendadas, retiradas y no disponibles salen del sitemap y del catálogo activo; su ficha puede conservarse con aviso, alternativas y noindex.
- Borrador, privado, oculto, inactivo y eliminado no se publican. Un registro inexistente devuelve 404. No se usa 410 porque no existe un historial fiable de bajas.
- La URL descriptiva termina en el record ID. Los enlaces antiguos con id y los slugs anteriores se resuelven mediante 301 a la URL canónica calculada.
- No editar precios mediante SEO. Si el campo de precio difiere del texto comercial, corregir el origen en Airtable.
- La API y las fichas tienen caché corta (120 segundos); sitemap 300 segundos. La indexación posterior depende del buscador.
- Las fechas lastmod se incluyen solo si el campo de actualización contiene una fecha válida, no futura. No se inventa la fecha de publicación.
- Las fotos de Airtable tienen enlaces temporales. Se renuevan al consultar el catálogo; no se fijan en un build estático.

## Sitemaps y rastreo

Enviar https://corretajeguzman.com/sitemap.xml a Google Search Console y Bing Webmaster Tools tras publicar.
El índice contiene servicios, proyectos, propiedades y comunas.
Los catálogos por comuna requieren dos propiedades disponibles como mínimo. Las páginas por tipo solo se generan si aportan un subconjunto distinto del catálogo de comuna, también con al menos dos registros.
No se crean páginas vacías para comunas sin inventario ni combinaciones arbitrarias de filtros.
La paginación usa enlaces reales con pagina=2 y canonical propia. Los filtros adicionales llevan noindex,follow y canonical al catálogo base.
Los errores temporales de Airtable devuelven 503, no un sitemap vacío válido ni un 404 engañoso.

robots.txt permite explícitamente Googlebot, Bingbot y OAI-SearchBot. GPTBot conserva la política general anterior: no se cambió la decisión sobre entrenamiento.
No hay una garantía de aparecer primero ni de ser citado por ChatGPT. El acceso del rastreador es una condición de elegibilidad, no una promesa de posicionamiento.

## IndexNow: preparado, todavía no activado

Configurar en Netlify, fuera del repositorio:

- INDEXNOW_KEY: cadena aleatoria válida de 8 a 128 caracteres alfanuméricos o guiones.
- INDEXNOW_WEBHOOK_SECRET: secreto aleatorio independiente y fuerte.

El endpoint /indexnow-key.txt muestra exclusivamente la clave de verificación pública, no el secreto del webhook.
El endpoint POST /api/indexnow requiere Authorization: Bearer seguido del secreto.
Payload: {"recordId":"recXXXXXXXXXXXXXX"} o {"recordIds":["recXXXXXXXXXXXXXX"]}.
Para bajas o cambios de nombre agregar previousUrls con las URLs públicas anteriores del mismo record ID. Se rechazan dominios ajenos y rutas que no sean fichas.
Configurar una automatización de Airtable al publicar, cambiar precio/disponibilidad o retirar un registro. Guardar la última URL publicada para notificar bajas. No ejecutar el webhook directamente desde el frontend ni exponer su secreto.
Esta entrega no creó esa automatización, no cambió variables de producción ni envió avisos a IndexNow.
Si se elimina un registro sin conservar su URL anterior no se puede reconstruir con certeza el slug antiguo; enviar previousUrls desde el sistema de origen.
Un 200/202 del proveedor confirma recepción, no indexación.

## Validación tras deploy

1. Abrir fichas con JavaScript desactivado: título, descripción, precio, fotos y enlaces deben existir.
2. Comprobar 301 de /propiedad?id=..., 404 de ID desconocido y 503 controlado ante fallo del catálogo.
3. Revisar las cuatro entradas del sitemap y comparar disponibilidad con Airtable.
4. Confirmar filtros, mapas, WhatsApp, cotización y visor de plantas. No enviar leads ficticios a producción.
5. Inspeccionar URLs representativas en Search Console y Bing; revisar canonical seleccionada y permitir nuevo rastreo.
6. Validar JSON-LD con Schema.org y Rich Results Test. RealEstateListing no garantiza un resultado enriquecido de Google.
7. Medir Core Web Vitals con datos reales; no confundir una prueba local con rendimiento 4G de producción.

## Fuentes oficiales

- OpenAI: https://developers.openai.com/api/docs/bots
- Google, funciones de IA y SEO: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google, robots y noindex: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- IndexNow: https://www.indexnow.org/documentation
- Schema.org: https://schema.org/RealEstateListing y https://schema.org/Apartment
