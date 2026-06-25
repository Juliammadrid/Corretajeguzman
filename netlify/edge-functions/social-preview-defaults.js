const SITE_ORIGIN = 'https://corretajeguzman.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/assets/home-apartamento.jpg`;
const FALLBACK_IMAGE = `${SITE_ORIGIN}/assets/guzman-logo.jpg`;

const ROUTE_META = {
  '/': {
    title: 'Corretaje Guzmán · Arriendos y ventas de propiedades',
    description: 'Encuentra propiedades en arriendo y venta con Corretaje Guzmán. Agenda visitas y recibe asesoría inmobiliaria personalizada.'
  },
  '/inicio': {
    title: 'Corretaje Guzmán · Arriendos y ventas de propiedades',
    description: 'Encuentra propiedades en arriendo y venta con Corretaje Guzmán. Agenda visitas y recibe asesoría inmobiliaria personalizada.'
  },
  '/arriendos': {
    title: 'Arriendos · Corretaje Guzmán',
    description: 'Propiedades disponibles en arriendo con Corretaje Guzmán. Revisa fotos, valores, ubicación y agenda tu visita.'
  },
  '/comprar': {
    title: 'Comprar propiedades · Corretaje Guzmán',
    description: 'Propiedades en venta con Corretaje Guzmán. Revisa opciones disponibles y recibe asesoría inmobiliaria.'
  },
  '/ventas': {
    title: 'Comprar propiedades · Corretaje Guzmán',
    description: 'Propiedades en venta con Corretaje Guzmán. Revisa opciones disponibles y recibe asesoría inmobiliaria.'
  },
  '/parcelas': {
    title: 'Parcelas · Corretaje Guzmán',
    description: 'Parcelas y terrenos disponibles con Corretaje Guzmán. Revisa alternativas y agenda tu visita.'
  },
  '/administracion': {
    title: 'Administración de propiedades · Corretaje Guzmán',
    description: 'Servicio de administración de propiedades para propietarios. Corretaje Guzmán gestiona arriendos, visitas y documentación.'
  },
  '/propietarios': {
    title: 'Arrendar mi propiedad · Corretaje Guzmán',
    description: 'Publica y arrienda tu propiedad con Corretaje Guzmán. Evaluación, difusión, visitas y gestión documental.'
  },
  '/solicitud': {
    title: 'Formulario de arriendo · Corretaje Guzmán',
    description: 'Completa tu solicitud de arriendo para recibir asesoría personalizada y opciones disponibles.'
  },
  '/corredores': {
    title: 'Sé corredor · Corretaje Guzmán',
    description: 'Postula para trabajar como corredor de propiedades con Corretaje Guzmán.'
  },
  '/ficha': {
    title: 'Propiedad · Corretaje Guzmán',
    description: 'Revisa la ficha de esta propiedad disponible y agenda tu visita con Corretaje Guzmán.'
  }
};

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function routeMeta(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/';
  return ROUTE_META[clean] || ROUTE_META['/'];
}

function hasTag(html, pattern) {
  return pattern.test(html);
}

function fichaDescriptionFix(url) {
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  if (pathname !== '/ficha') return '';
  return `<style id="cg-ficha-desc-fix">
.desc.clamped{max-height:none!important;overflow:visible!important;-webkit-mask-image:none!important;mask-image:none!important}
#readmore{display:none!important}
</style>`;
}

function globalLayoutFix() {
  return `<style id="cg-layout-stability-fix">
html,body{max-width:100%;overflow-x:hidden!important}
@media(max-width:620px){
  .hero{overflow:hidden!important}
  .hero-inner{padding-left:0!important;padding-right:0!important;max-width:100%!important}
  .search{width:calc(100% - 32px)!important;margin-left:auto!important;margin-right:auto!important;max-width:430px!important}
  .hero-stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;max-width:100%!important;margin:0!important;padding:18px 18px 12px!important;box-sizing:border-box!important;left:auto!important;right:auto!important;transform:none!important;overflow:hidden!important}
  .hero-stats .hstat{min-width:0!important;width:auto!important;text-align:center!important;overflow:hidden!important}
  .hero-stats .hstat b{font-size:26px!important;line-height:1.1!important;height:auto!important;margin:0 0 6px!important;letter-spacing:-.02em!important;white-space:nowrap!important}
  .hero-stats .hstat span{display:block!important;font-size:12px!important;line-height:1.25!important;white-space:normal!important;max-width:100%!important}
}
</style>`;
}

function upsertSocialMeta(html, url) {
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const meta = routeMeta(pathname);
  const canonical = `${SITE_ORIGIN}${url.pathname}`;
  const image = pathname === '/ficha' ? FALLBACK_IMAGE : DEFAULT_IMAGE;

  const tags = [];

  const cssFix = fichaDescriptionFix(url);
  if (cssFix && !html.includes('id="cg-ficha-desc-fix"')) tags.push(cssFix);

  const layoutFix = globalLayoutFix();
  if (!html.includes('id="cg-layout-stability-fix"')) tags.push(layoutFix);

  if (!hasTag(html, /<meta\s+property=["']og:title["']/i)) {
    tags.push(`<meta property="og:title" content="${esc(meta.title)}">`);
  }
  if (!hasTag(html, /<meta\s+property=["']og:description["']/i)) {
    tags.push(`<meta property="og:description" content="${esc(meta.description)}">`);
  }
  if (!hasTag(html, /<meta\s+property=["']og:url["']/i)) {
    tags.push(`<meta property="og:url" content="${esc(canonical)}">`);
  }
  if (!hasTag(html, /<meta\s+property=["']og:type["']/i)) {
    tags.push('<meta property="og:type" content="website">');
  }
  if (!hasTag(html, /<meta\s+property=["']og:site_name["']/i)) {
    tags.push('<meta property="og:site_name" content="Corretaje Guzmán">');
  }
  if (!hasTag(html, /<meta\s+property=["']og:image["']/i)) {
    tags.push(`<meta property="og:image" content="${esc(image)}">`);
    tags.push(`<meta property="og:image:secure_url" content="${esc(image)}">`);
    tags.push('<meta property="og:image:width" content="1200">');
    tags.push('<meta property="og:image:height" content="630">');
  }
  if (!hasTag(html, /<meta\s+name=["']twitter:card["']/i)) {
    tags.push('<meta name="twitter:card" content="summary_large_image">');
  }
  if (!hasTag(html, /<meta\s+name=["']twitter:title["']/i)) {
    tags.push(`<meta name="twitter:title" content="${esc(meta.title)}">`);
  }
  if (!hasTag(html, /<meta\s+name=["']twitter:description["']/i)) {
    tags.push(`<meta name="twitter:description" content="${esc(meta.description)}">`);
  }
  if (!hasTag(html, /<meta\s+name=["']twitter:image["']/i)) {
    tags.push(`<meta name="twitter:image" content="${esc(image)}">`);
  }

  if (!tags.length || !/<head[^>]*>/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${tags.join('\n')}`);
}

export default async function handler(request, context) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/propiedad/')) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  const patched = upsertSocialMeta(html, url);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-cache, must-revalidate');

  return new Response(patched, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const config = {
  path: '/*'
};
