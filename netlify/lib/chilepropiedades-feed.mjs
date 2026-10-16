// Public field allowlist, verified against both Airtable schemas. Never use the
// website normalizer: it defaults an absent Estado to Disponible.
export const env = key => globalThis.Netlify?.env.get(key) || process.env[key];
const shared = {
  title: 'Nombre de la propiedad', commune: 'Comuna', address: 'Direccion publica',
  type: 'Tipo propiedad', status: 'Estado', price: 'Precio valor', currency: 'Moneda',
  fees: 'Valor gasto comun', bedrooms: 'Dormitorios', bathrooms: 'Baños',
  parking: 'Estacionamiento', photos: 'Fotos',
};
export const FIELDS = {
  rent: { ...shared, description: 'Descripción pública', usable: 'Superficie útil m2' },
  sale: { ...shared, description: 'Descripcion publica', usable: 'Superficie util m2', total: 'Metros totales' },
};
export const TYPES = new Set(['Bodega', 'Casa', 'Departamento', 'Estacionamiento', 'Estudio', 'Galpón', 'Hotel', 'Local Comercial', 'Loft', 'Lote de Cementerio', 'Negocios turísticos', 'Oficina', 'Parcela', 'Sitio', 'Terreno', 'Terreno Agricola', 'Terreno Forestal', 'Terreno Industrial']);
const aliases = new Map([
  ['Local', 'Local Comercial'], ['Casa en condominio', 'Casa'],
  ['Departamento dúplex tipo loft', 'Loft'], ['Parcela con cabaña', 'Parcela'],
]);
const pick = value => value && typeof value === 'object' && !Array.isArray(value) ? value.name : value;
const str = value => typeof pick(value) === 'string' ? pick(value).trim() : '';
export const eligible = record => pick(record.fields?.Estado) === 'Disponible';
const unavailable = () => new Error('Feed unavailable');

function number(value, { required = false, integer = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw unavailable();
    return null;
  }
  // Numeric Airtable fields arrive as numbers. Text fields accept decimal comma;
  // never strip arbitrary text into a plausible but incorrect price or area.
  const raw = typeof value === 'string' ? value.trim().replace(',', '.') : value;
  const result = typeof raw === 'number' ? raw : /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(result) || result < 0 || (integer && !Number.isInteger(result))) throw unavailable();
  return result;
}

function parking(value) {
  const text = str(value).toLowerCase();
  if (['no informado', 'sin información', ''].includes(text) && typeof value !== 'number') return null;
  if (['no', 'sin estacionamiento'].includes(text)) return 0;
  const match = text.match(/^(\d+)(?:\s+(?:subterráneo|subterraneo|cubierto|descubierto)s?)?$/);
  return number(match ? match[1] : value, { integer: true });
}

export function mapListing(record, source) {
  if (!FIELDS[source]) throw unavailable();
  if (!eligible(record)) return null;
  if (!/^rec[a-zA-Z0-9]{14}$/.test(record.id)) throw unavailable();
  const f = record.fields;
  const get = key => f[FIELDS[source][key]];
  const rawType = str(get('type'));
  const type = aliases.get(rawType) || rawType;
  const commune = str(get('commune'));
  const currency = new Map([['UF', 'CLF'], ['CLF', 'CLF'], ['CLP', 'CLP'], ['USD', 'USD']]).get(str(get('currency')));
  if (!TYPES.has(type) || !commune || !currency) throw unavailable();
  const price = number(get('price'), { required: true });
  if (price <= 0) throw unavailable();
  const photos = get('photos') ?? [];
  if (!Array.isArray(photos)) throw unavailable();
  const usable = number(get('usable'));
  const total = number(get('total'));
  // House/land totals describe the plot; apartment totals describe floor area.
  // No fabricated terrace sums or values extracted from descriptions.
  const plotTypes = new Set(['Casa', 'Parcela', 'Sitio', 'Terreno', 'Terreno Agricola', 'Terreno Forestal', 'Terreno Industrial', 'Lote de Cementerio']);
  return {
    referenceId: `${source}-${record.id}`, type, commune, currency, price,
    operation: source === 'rent' ? 'Arriendo' : 'Venta',
    title: str(get('title')), address: str(get('address')), description: str(get('description')),
    fees: number(get('fees')), bedrooms: number(get('bedrooms'), { integer: true }),
    bathrooms: number(get('bathrooms'), { integer: true }), parking: parking(get('parking')),
    usableArea: usable, floorArea: plotTypes.has(type) ? usable : total,
    plotArea: plotTypes.has(type) ? total : null, photos,
  };
}

export function contactConfig(readEnv = env) {
  const email = (readEnv('CHILEPROPIEDADES_CONTACT_EMAIL') || '').trim();
  const phone = (readEnv('CHILEPROPIEDADES_CONTACT_PHONE') || '').trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) || !/^\+?[0-9 ()-]{8,24}$/.test(phone)) throw unavailable();
  const whatsapp = readEnv('CHILEPROPIEDADES_CONTACT_WHATSAPP');
  if (whatsapp && !['true', 'false'].includes(whatsapp)) throw unavailable();
  return { email, phone, whatsapp: whatsapp || 'false' };
}

export async function readInventory({ readEnv = env, fetchImpl = fetch, signal } = {}) {
  const token = readEnv('AIRTABLE_API_KEY') || readEnv('AIRTABLE_TOKEN');
  const base = readEnv('AIRTABLE_BASE_ID');
  const tables = { rent: readEnv('AIRTABLE_RENT_TABLE_ID'), sale: readEnv('AIRTABLE_SALE_TABLE_ID') };
  if (!token || !base || !tables.rent || !tables.sale) throw unavailable();
  const inventory = {};
  // Sequential pages stay below Airtable's 5 requests/second/base limit.
  let lastRequest = 0;
  for (const [source, table] of Object.entries(tables)) {
    let offset;
    const seen = new Set();
    const records = [];
    do {
      signal?.throwIfAborted();
      const delay = 210 - (Date.now() - lastRequest);
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`);
      url.searchParams.set('pageSize', '100');
      for (const name of Object.values(FIELDS[source])) url.searchParams.append('fields[]', name);
      if (offset) url.searchParams.set('offset', offset);
      lastRequest = Date.now();
      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}` }, redirect: 'error',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
      });
      if (!response.ok) throw unavailable();
      const data = await response.json();
      if (!Array.isArray(data.records) || data.records.some(r => !r || typeof r.id !== 'string' || !r.fields || typeof r.fields !== 'object' || Array.isArray(r.fields))) throw unavailable();
      records.push(...data.records);
      offset = data.offset;
      if (offset !== undefined && (typeof offset !== 'string' || !offset || seen.has(offset))) throw unavailable();
      if (offset) seen.add(offset);
    } while (offset);
    if (new Set(records.map(r => r.id)).size !== records.length) throw unavailable();
    inventory[source] = records;
  }
  return inventory;
}

// XML 1.0 legal characters, including supplementary Unicode and split CDATA.
export const cleanXml = value => String(value).replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
const cdata = value => `<![CDATA[${cleanXml(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
const tag = (name, value, attributes = '') => value === null || value === undefined ? '' : `<${name}${attributes}>${cdata(value)}</${name}>`;

export function renderXml(listings, contact) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<listings>\n' + listings.map(p => {
    const fields = [tag('referenceId', p.referenceId),
      `<contact>${tag('name', 'Corretaje Guzmán')}${tag('email', contact.email)}<phones>${tag('phone', contact.phone, ` whatsapp="${contact.whatsapp}"`)}</phones>${tag('agencyName', 'Corretaje Guzmán')}</contact>`,
      tag('address', p.address || null), tag('commune', p.commune), tag('description', p.description),
      `<prices>${tag('price', p.price, ` currency="${p.currency}" operation="${p.operation}"`)}</prices>`,
      tag('communityFeesPrice', p.fees), tag('title', p.title), tag('propertyType', p.type),
      tag('bedrooms', p.bedrooms), tag('bathrooms', p.bathrooms),
      tag('floorArea', p.floorArea, ' unit="sqm"'), tag('usableFloorArea', p.usableArea, ' unit="sqm"'),
      tag('plotArea', p.plotArea, ' unit="sqm"'),
      `<pictures>${p.pictureUrls.map(url => `<picture>${tag('url', url)}</picture>`).join('')}</pictures>`,
      tag('parkingLots', p.parking)];
    return `<listing>${fields.join('')}</listing>`;
  }).join('\n') + '\n</listings>\n';
}
