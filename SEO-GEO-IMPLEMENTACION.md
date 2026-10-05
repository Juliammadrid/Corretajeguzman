# Informe de implementación — 5 de octubre de 2026

## Estado

Implementado y verificado localmente. **Sin deploy de esta entrega**. No se modificaron Airtable, las automatizaciones de leads, variables de Netlify, Search Console ni Bing.
La revisión partió del commit publicado 6cfe999416230a735b6432bb07dea829d7b1e1bf en una copia limpia, outputs/seo-geo-release, rama codex/seo-geo-20261004. No se mezclaron los cambios pendientes de la copia antigua.

## Hallazgos y correcciones

| Área | Hallazgo / solución |
|---|---|
| Fichas de propiedades | La página intermedia dependía de redirección HTML/JS. Ahora entrega la ficha y metadatos en HTML inicial. |
| URL y canonical | Sitemap y enlaces usaban formatos distintos. Se unificaron en URL descriptiva con ID; legacy y slugs anteriores resuelven con 301. No se cambiaron slugs de proyectos ni URLs de secciones existentes. |
| Catálogo | HTML inicial con tarjetas, enlaces rastreables y paginación de 20 elementos. Filtros interactivos conservados. |
| Inventario | Reservadas/no disponibles fuera de catálogo activo y sitemap. Fichas retenidas con noindex y aviso. Privadas/borradores no públicas; desconocidas 404; fallos temporales 503. |
| Proyectos | 21 fichas prerenderizadas con nombre, dirección, descripción, precio actualizado desde plantas confirmadas y hero. Las 95 plantas siguen disponibles; fallback sin JS con planos y cotización. |
| Metadata | Title, description, canonical, Open Graph y Twitter por ficha. Se conservan las imágenes sociales específicas de las secciones. |
| Schema | RealEstateListing, Apartment/House/Place según tipo, Offer con CLF para UF, BreadcrumbList y RealEstateAgent. Se omiten mascotas/coordenadas/fechas desconocidas. No se inventan reseñas, horarios ni certificaciones. |
| Comunas | Landings dinámicas con inventario real; no se publican comunas vacías. Las subdivisiones por tipo idénticas al catálogo padre se omiten. |
| Enlaces | Fichas similares priorizan misma operación, comuna, tipo y cercanía de precio. Breadcrumbs y enlaces de comuna. |
| Rendimiento | Hero prioritario, galerías y miniaturas diferidas, dimensiones reales para hero y planos. No se redujo resolución ni se recomprimieron imágenes. |
| Rastreo IA | OAI-SearchBot permitido explícitamente, separado de la política de GPTBot. |
| Empresa | Schema con contacto ya publicado; página /nosotros/ con información verificable y enlace desde portada. |
| 404 | Página real con enlaces a catálogos; no redirección automática al inicio. |
| IndexNow | Endpoint protegido y clave de verificación por entorno, listo para conectar; **no activado**. |

## Parcelas: aclaración de Felipe

El 6% era un descuento excepcional negociado, no un recargo. El código efectivamente aumentaba el precio en 6% antes de calcular el financiamiento: se retiró ese aumento.
No se publicó ni se aplicó automáticamente un descuento de 5–6%.
Pie mínimo y valor inicial: 40%; saldo financiado: 60%. El usuario puede aportar un pie mayor: 80% en el control significa aportar 80%, no financiar 80%.
Se conserva la tasa de 1% mensual y los plazos de 12, 24 y 36 cuotas. Se explicita el porcentaje restante.
Se corrigió una variable constante que impedía sustituir la UF referencial por la UF obtenida de la API.
Ejemplo de regresión, NO cotización vigente: precio UF 2.500, UF $40.746,28, pie 40% $40.746.280, capital $61.119.420, cuota aproximada $2.030.039 a 36 meses y 1% mensual.

## Archivos principales

- seo-core.mjs: reglas compartidas, canonical, schemas, catálogos y sitemap.
- netlify/edge-functions/property-share-edge.js: ficha SSR y redirecciones.
- netlify/edge-functions/catalog-seo.js: listados y comunas SSR.
- netlify/functions/properties.mjs: API existente adaptada, indicador de respuesta completa, exclusión de privados y dimensiones de fotos.
- netlify/functions/sitemap-propiedades.mjs: sitemap de propiedades y comunas.
- netlify/functions/property-share.mjs: compatibilidad de endpoint legado.
- netlify/functions/indexnow.mjs: infraestructura protegida, sin credenciales en código.
- scripts/build-seo.mjs y scripts/image-dimensions.mjs: generación local y en Netlify.
- proyectos/*/index.html, seo-templates/*.txt y sitemap-*.xml: salidas generadas.
- app.js, arriendos.js y guzman-shared.js: uso del HTML/data inicial, metadata preservada, enlaces, inventario y paginación.
- proyecto-ficha.js: no sobrescribir SEO prerenderizado; dimensiones de planos.
- robots.txt, _headers, netlify.toml, package.json, 404.html y nosotros/index.html.
- Home - Corretaje Guzman.html: schema y enlace institucional.
- data-parcelas-proyectos.js, parcela-ficha.js y parcela-campo-alto-roble.html: corrección comercial y de UF.
- tests/seo.test.mjs y SEO-GEO.md: pruebas y operación.

## Nuevas páginas y sitemaps

Se mantienen /arriendos, /comprar, /proyectos/ y todas las rutas existentes de proyectos.
Se añade /nosotros/.
La muestra pública de Airtable tenía 35 registros: 34 disponibles y uno reservado.
Con esa muestra, las nuevas landings elegibles son:

- /arriendos/nunoa
- /arriendos/macul
- /arriendos/santiago
- /arriendos/la-reina
- /arriendos/providencia
- /arriendos/san-miguel
- /comprar/independencia
- /comprar/estacion-central
- /comprar/curacavi
- /comprar/santiago

Las landings se ajustan al inventario real, no a una lista fija de comunas.
Sitemap índice: /sitemap.xml. Hijos: /sitemap-servicios.xml, /sitemap-proyectos.xml, /sitemap-propiedades.xml y /sitemap-comunas.xml.
No se inventaron lastmod cuando faltaba fecha fiable en Airtable.

## Pruebas realizadas

- Build ejecutado correctamente.
- 10 pruebas automáticas aprobadas: metadatos, estados, fechas, canonical, schemas, SSR, errores, sitemap, seguridad IndexNow, 21 proyectos/95 plantas y parcelas.
- 57 vistas comprobadas: escritorio 1440px, móvil 390px y tres comprobaciones sin JavaScript. Sin errores de página ni desbordamiento horizontal detectados.
- Prueba funcional adicional en ambos tamaños: pie 40/80%, actualización de UF con respuesta controlada, paginación, comuna, menú móvil y apertura/cierre del visor de plantas.
- HTTPS y www comprobados en producción, solo lectura: HTTP y www devuelven 301 a https://corretajeguzman.com/.
- Capturas y resultados: outputs/seo-geo-qa, fuera de la carpeta publicable.
- No se enviaron formularios ni leads de prueba a producción.

## Pendiente / límites

1. Publicar y revisar el comportamiento real de Edge Functions en Netlify. La prueba local reproduce sus handlers; no es una validación del deploy.
2. Confirmar acceso de la empresa a Search Console y Bing Webmaster Tools y enviar el sitemap. No se borraron verificaciones existentes.
3. Configurar INDEXNOW_KEY e INDEXNOW_WEBHOOK_SECRET en Netlify y la automatización de Airtable. Probar recepción con un registro real autorizado.
4. No se midió Lighthouse/4G ni Core Web Vitals de esta versión en producción. No se promete carga menor a dos segundos.
5. No se verificó indexación efectiva ni posiciones: ningún cambio técnico garantiza primeras posiciones o aparición en ChatGPT.
6. Faltan datos explícitos de mascotas y fechas de actualización en parte del catálogo; se omiten del schema. No se modificó el esquema de Airtable para inventarlos.
7. Corregir un conflicto en Airtable: Casa Local Comercial en Ñuñoa (rec14Z7I0ICHXrPUF) muestra precio estructurado $2.800.000, pero descripción $2.900.000; superficie útil estructurada 360 m² frente a descripción de 275 m² construidos y 360 m² totales. Se conservó el origen, sin escoger arbitrariamente.
8. Para bajas definitivas con 410 o avisos IndexNow después de eliminar el registro, hace falta conservar historial de URLs. Actualmente se usa 404 cuando el registro no existe.

Las guías oficiales de OpenAI y Netlify orientaron la separación entre rastreo de búsqueda y entrenamiento, el SSR y los endpoints protegidos. No se añadió un archivo mágico ni contenido oculto para prometer posicionamiento.
