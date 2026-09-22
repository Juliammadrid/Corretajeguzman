/* Preload mínimo del hero de cada ficha antes de descargar el contenido pesado. */
(function () {
  var route = (location.pathname.match(/^\/proyectos\/([^\/?#]+)\/?$/) || [])[1];
  var slug = new URLSearchParams(location.search).get('slug') || route;
  var heroes = {
    'best-site': '/assets/proy/best-site/best-site-hero.webp',
    'metropolitan-park-nunoa': '/assets/proy/metropolitan-park-nunoa/metropolitan-banner.webp',
    'all-nunoa-2': '/assets/proy/all-nunoa-2/all-nunoa-2-hero.webp',
    'smart-too': '/assets/proy/smart-too/smart-too-banner-hd.webp'
  };
  var href = heroes[slug];
  if (!href || document.querySelector('link[data-project-hero-preload]')) return;
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.fetchPriority = 'high';
  link.setAttribute('data-project-hero-preload', '');
  document.head.appendChild(link);
})();
