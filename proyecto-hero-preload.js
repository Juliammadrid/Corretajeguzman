/* Preload mínimo del hero de cada ficha antes de descargar el contenido pesado. */
(function () {
  var route = (location.pathname.match(/^\/proyectos\/([^\/?#]+)\/?$/) || [])[1];
  var slug = new URLSearchParams(location.search).get('slug') || route;
  var heroes = {
    'best-site': '/assets/proy/best-site/best-site-hero.jpg',
    'metropolitan-park-nunoa': '/assets/proy/metropolitan-park-nunoa/metropolitan-banner.jpg',
    'all-nunoa-2': '/assets/proy/all-nunoa-2/all-nunoa-2-hero.jpg',
    'smart-too': '/assets/proy/smart-too/smart-too-banner-hd.jpg'
  };
  var href = heroes[slug];
  if (!href || document.querySelector('link[data-project-hero-preload]')) return;
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = '/.netlify/images?url='+encodeURIComponent(href)+'&w=1600&fm=webp&q=72';
  link.fetchPriority = 'high';
  link.setAttribute('data-project-hero-preload', '');
  document.head.appendChild(link);
})();
