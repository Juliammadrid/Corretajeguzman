# Feed ChilePropiedades — Corretaje Guzmán

Implementación preparada; no activar la sincronización ni desplegar a producción sin aprobación.

## Rutas y origen de los datos

- `GET /api/chilepropiedades.xml`: XML completo con raíz `listings`.
- `GET /api/chilepropiedades-images/v1/<sha256>.<ext>`: fotografías persistentes.
- Ambas rutas admiten `HEAD`. Otros métodos devuelven 405.
- Se reutilizan las credenciales y tablas del entorno de `properties.mjs` mediante el mismo patrón `Netlify.env.get`/`process.env`. No se modifica esa función, su normalizador ni ninguna otra API.
- Cada lectura consulta ambas tablas de Airtable con paginación y una lista explícita de campos públicos. No lee teléfonos, comisiones ni `Dirección` interna. Airtable permanece como única fuente de inventario, precios, textos, estado y selección/orden de fotografías.
- Solo `Estado === 'Disponible'`. Ni estado vacío, ni `Reservada`, ni variantes de mayúsculas/espacios son elegibles. IDs permanentes `rent-{recordId}` / `sale-{recordId}`.
- Un registro disponible con datos obligatorios inválidos impide emitir todo el feed (503). No se elimina silenciosamente ese aviso. Un inventario realmente vacío, verificado en ambas tablas, sí devuelve `<listings>` sin avisos.

## Configuración pendiente en Netlify

Conservar `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_RENT_TABLE_ID` y `AIRTABLE_SALE_TABLE_ID`, con alcance **Functions**. No copiar credenciales al repositorio, al XML ni a variables del cliente. Se acepta `AIRTABLE_TOKEN` como respaldo de la API key, igual que la conexión existente.

Crear estas variables de servidor en el proyecto `webcorretajeguzman`, alcance **Functions**, en el contexto que se vaya a validar:

| Variable | Valor verificado en la web actual | Estado |
|---|---|---|
| `CHILEPROPIEDADES_CONTACT_EMAIL` | `contacto@corretajeguzman.com` | Pendiente de configurar |
| `CHILEPROPIEDADES_CONTACT_PHONE` | `+56944637680` | Pendiente de configurar |
| `CHILEPROPIEDADES_CONTACT_WHATSAPP` | `true` (la web enlaza ese número a WhatsApp) | Opcional; por defecto `false` |
| `CHILEPROPIEDADES_PUBLIC_ORIGIN` | `https://corretajeguzman.com` | Opcional; valor por defecto en producción |

El correo y teléfono aparecen en el pie de `Home - Corretaje Guzman.html` al momento de implementar. No se toma automáticamente `LEADS_EMAIL_TO`: el destinatario interno es diferente del correo público. Las variables específicas no estaban creadas al revisar Netlify. No se modificaron variables remotas. Si falta el contacto, se responde 503 antes de consultar Airtable.

Los valores de contacto son públicos por definición, pero se configuran únicamente en servidor. La clave de Airtable sigue siendo secreta. Netlify necesita un nuevo deploy para aplicar variables a las funciones.

## Mapeo exacto

| XML | Arriendo | Venta |
|---|---|---|
| `title` | `Nombre de la propiedad` | Igual |
| `commune` | `Comuna` | Igual |
| `address` | `Direccion publica` | Igual; sin respaldo interno |
| `propertyType` | `Tipo propiedad` | Igual |
| `description` | `Descripción pública` | `Descripcion publica` |
| `bedrooms` / `bathrooms` / `parkingLots` | `Dormitorios` / `Baños` / `Estacionamiento` | Igual |
| `prices/price` | `Precio valor`, `Moneda`; operación `Arriendo` | Mismos campos; operación `Venta` |
| `communityFeesPrice` | `Valor gasto comun` (CLP) | Igual |
| `usableFloorArea` | `Superficie útil m2` | `Superficie util m2` |
| `floorArea` / `plotArea` | Ver reglas de superficie abajo | `Metros totales` y superficie útil según tipo |
| `pictures/picture/url` | Adjuntos `Fotos` persistidos en Blobs | Igual |

`UF` se transforma en `CLF`; `CLP`, `CLF` y `USD` se conservan. No se infiere moneda por el monto. Los ceros explícitos de gastos comunes y estacionamientos se conservan. `No` equivale a cero estacionamientos; `No informado` se omite. Se acepta el valor existente `1 subterráneo` como un estacionamiento.

Tipos: se aceptan los enumerados oficiales y estas equivalencias explícitas: `Local` → `Local Comercial`, `Casa en condominio` → `Casa`, `Departamento dúplex tipo loft` → `Loft`, `Parcela con cabaña` → `Parcela`. Los tipos desconocidos requieren corregir Airtable o añadir una equivalencia documentada, nunca se convierten por defecto en Departamento.

Superficies en `sqm`: se envía la superficie útil disponible. Para casa/parcela/terreno/sitio/lote, `Metros totales` es superficie del terreno (`plotArea`) y la útil es superficie edificada (`floorArea`). Para el resto de tipos, `Metros totales` se envía como `floorArea` y se mantiene la útil por separado. El esquema de arriendos no tiene `Metros totales`: se omite lo inexistente. No se suman terrazas ni se extraen superficies del texto. Esta interpretación del campo total debe conservarse al cargar nuevos registros en Airtable.

## Fotografías durables y versiones

Se usa la dependencia existente `@netlify/blobs` 11.1.4. El almacén productivo `chilepropiedades-photos-production` es de sitio y persiste entre despliegues. Cada preview usa `chilepropiedades-photos-preview-<hash-del-deploy>` para aislar escrituras; sus imágenes apuntan al dominio del preview.

Cada versión combina ID de adjunto, tamaño, tipo, nombre, dimensiones y hash de los bytes descargados. Reemplazar un adjunto en Airtable crea un nuevo ID y, por tanto, un nombre público distinto incluso si se vuelve a subir el mismo contenido. La rotación de una URL firmada no cambia la identidad. Un índice privado contiene solamente la clave de imagen persistida; nunca guarda la URL temporal.

Se descarga el original, con verificación de tamaño y firma JPEG/PNG/WebP/GIF; máximo 18 MiB para respetar el límite de respuesta en streaming. No se publican SVG/HTML ni recursos de hosts arbitrarios. Solo se aceptan HTTPS de `*.airtableusercontent.com` o `dl.airtable.com`, sin redirecciones y sin enviar credenciales de Airtable a los archivos.

Las imágenes son inmutables y se sirven con caché de un año. Al quitar/reordenar fotos en Airtable, la siguiente lectura refleja la lista actual. Las versiones anteriores se retienen para no romper URLs ya importadas; no hay limpieza automática ni operaciones destructivas.

El primer acceso puede requerir varios intentos para copiar todo el inventario. Se procesan hasta seis imágenes simultáneas, con presupuesto de 20 segundos por solicitud y 10 segundos por operación remota. Si no alcanza el tiempo, se conserva lo ya copiado y se responde **503**, `Retry-After: 60`, sin XML. La siguiente solicitud continúa reutilizando las copias existentes. No se emite el feed hasta que todas las imágenes seleccionadas estén persistidas.

## Fallos y validación

Fallo de cualquier tabla, página, descarga o escritura: HTTP 503 genérico, sin datos internos; nunca feed parcial ni sustitución por un XML vacío. Los errores y el feed llevan `Cache-Control: no-store` y `Netlify-CDN-Cache-Control: no-store`. Los logs usan identificadores fijos sin excepciones, tokens ni URLs firmadas. XML 1.0 elimina controles ilegales y divide correctamente `]]>` dentro de CDATA.

Validación local:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test:chilepropiedades
pnpm test
pnpm build
node --test tests/*.test.mjs
```

Las pruebas usan servicios simulados, sin escrituras en Airtable ni Blobs remotos. El build existente regenera el catálogo/HTML estático; esos archivos generados no forman parte del cambio. La prueba existente de uniformidad del pie requiere esos archivos generados (el `404.html` del repositorio base todavía no contiene el pie); por eso la suite completa se ejecuta después del build. Resultado: 40 pruebas de integración y 26 existentes correctas; `pnpm test` ejecuta 51 (las 40 nuevas y las 11 de SEO).

Lectura real de Airtable, 15 de octubre de 2026 (America/Santiago): 26/26 arriendos elegibles y 2/14 ventas elegibles; 11 ventas sin estado y una reservada excluidas. Total **28 avisos y 374 fotos**. Los 28 registros pasan el mapeo; un analizador XML independiente validó el documento completo offline. Las URLs de ese ensayo son ficticias y el XML de ensayo no es un feed publicable.

Antes de activar, tras la aprobación del propietario: configurar el contacto, desplegar, completar la carga inicial y comprobar HTTP 200 en el XML y en todas sus fotos. Solo entonces entregar la URL a ChilePropiedades para habilitar la importación. No se ha desplegado esta integración ni conectado la importación, por lo que la persistencia real en Netlify y la importación del portal quedan pendientes de esa validación.

Referencias: [especificación oficial del feed](https://chilepropiedades.cl/integraciones/crear-feed), [Netlify Functions](https://docs.netlify.com/build/functions/api/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
