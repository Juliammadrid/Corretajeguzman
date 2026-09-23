/* ============================================================
   Corretaje Guzmán — encabezado único del sitio
   Una sola fuente para navegación de escritorio y móvil.
   ============================================================ */
(function () {
  'use strict';

  const STYLE_ID = 'guzman-header-style';
  const WA_URL = 'https://wa.me/56944637680?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20de%20Corretaje%20Guzm%C3%A1n';
  const icon = {
    chevronDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><path d="M12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.98L0 24l6.18-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.82c-1.78 0-3.53-.48-5.06-1.38l-.36-.21-3.67.96.98-3.58-.24-.37A9.8 9.8 0 1 1 12 21.82zm5.37-7.35c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.04 2.82 1.19 3.01.15.2 2.05 3.13 4.97 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.74-.71 1.98-1.4.24-.69.24-1.28.17-1.4-.07-.12-.27-.2-.56-.34z"/></svg>'
  };

  const markup = `
    <header class="guzman-header" data-guzman-header>
      <div class="guzman-header__inner">
        <a class="guzman-header__brand" href="/" aria-label="Inicio Corretaje Guzmán">
          <img src="/assets/guzman-logo.png" width="160" height="46" alt="Corretaje Guzmán">
        </a>
        <nav class="guzman-header__links" aria-label="Navegación principal">
          <a href="/arriendos">Arrendar</a>
          <div class="guzman-header__buy">
            <button type="button" aria-expanded="false" aria-controls="guzman-buy-menu">Comprar ${icon.chevronDown}</button>
            <div class="guzman-header__dropdown" id="guzman-buy-menu">
              <a href="/proyectos/">Proyectos nuevos</a>
              <a href="/comprar">Propiedades usadas</a>
            </div>
          </div>
          <a href="/parcelas">Parcelas</a>
          <a href="/propietarios">Arrendar mi propiedad</a>
        </nav>
        <a class="guzman-header__wa" href="${WA_URL}" target="_blank" rel="noopener">${icon.whatsapp}<span>Contáctanos por WhatsApp</span></a>
        <button class="guzman-header__burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="guzman-mobile-menu">${icon.menu}</button>
      </div>
    </header>
    <div class="guzman-mobile-menu" id="guzman-mobile-menu" aria-hidden="true">
      <nav aria-label="Navegación móvil">
        <a href="/arriendos"><span>Arrendar</span>${icon.chevronRight}</a>
        <div class="guzman-mobile-menu__buy">
          <button type="button" aria-expanded="false"><span>Comprar</span>${icon.chevronDown}</button>
          <div class="guzman-mobile-menu__sub">
            <a href="/proyectos/"><span>Proyectos nuevos</span>${icon.chevronRight}</a>
            <a href="/comprar"><span>Propiedades usadas</span>${icon.chevronRight}</a>
          </div>
        </div>
        <a href="/parcelas"><span>Parcelas</span>${icon.chevronRight}</a>
        <a href="/propietarios"><span>Arrendar mi propiedad</span>${icon.chevronRight}</a>
        <a class="guzman-mobile-menu__wa" href="${WA_URL}" target="_blank" rel="noopener">${icon.whatsapp}<span>Contáctanos por WhatsApp</span></a>
      </nav>
    </div>`;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .guzman-header{position:fixed;top:0;left:0;right:0;z-index:1000;width:100%;background:rgba(20,15,30,.86);backdrop-filter:saturate(150%) blur(14px);-webkit-backdrop-filter:saturate(150%) blur(14px);border-bottom:1px solid rgba(255,255,255,.08);font-family:'Hanken Grotesk',system-ui,sans-serif;color:#fff}
      .guzman-header-ready{padding-top:76px}
      .guzman-header *, .guzman-mobile-menu *{box-sizing:border-box}
      .guzman-header__inner{height:76px;max-width:1180px;margin:0 auto;padding:0 26px;display:flex;align-items:center;gap:30px}
      .guzman-header__brand{display:flex;align-items:center;flex:none;line-height:0}.guzman-header__brand img{display:block;width:auto;height:32px;max-width:160px;object-fit:contain}
      .guzman-header__links{display:flex;align-items:center;gap:28px;margin-left:6px}.guzman-header__links>a,.guzman-header__buy>button{font:500 14.5px/1.2 'Hanken Grotesk',system-ui,sans-serif;color:rgba(255,255,255,.74);text-decoration:none;white-space:nowrap;transition:color .15s}
      .guzman-header__links>a:hover,.guzman-header__links>a:focus-visible,.guzman-header__buy>button:hover,.guzman-header__buy>button:focus-visible,.guzman-header__buy.is-open>button{color:#fff}
      .guzman-header__buy{position:relative}.guzman-header__buy>button{display:flex;align-items:center;gap:5px;padding:0;border:0;background:none;cursor:pointer}.guzman-header__buy svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .18s}.guzman-header__buy.is-open>button svg{transform:rotate(180deg)}
      .guzman-header__dropdown{position:absolute;top:calc(100% + 17px);left:-15px;min-width:210px;padding:8px;background:#fff;border:1px solid rgba(20,15,30,.08);border-radius:14px;box-shadow:0 18px 44px rgba(20,15,30,.28);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .16s,visibility .16s,transform .16s;z-index:1001}.guzman-header__buy.is-open .guzman-header__dropdown{opacity:1;visibility:visible;transform:none}.guzman-header__dropdown a{display:block;padding:12px 14px;border-radius:10px;color:#16121f;text-decoration:none;font:600 14px/1.25 'Hanken Grotesk',system-ui,sans-serif}.guzman-header__dropdown a:hover,.guzman-header__dropdown a:focus-visible{background:#f1eafe;color:#4c1d95}
      .guzman-header__wa{display:inline-flex;align-items:center;justify-content:center;gap:9px;margin-left:auto;padding:11px 18px;border-radius:12px;background:#25D366;color:#fff!important;text-decoration:none;font:600 14.5px/1.2 'Hanken Grotesk',system-ui,sans-serif;white-space:nowrap;transition:filter .15s}.guzman-header__wa:hover,.guzman-header__wa:focus-visible{filter:brightness(.95)}.guzman-header__wa svg{width:18px;height:18px;flex:none}
      .guzman-header__burger{display:none;margin-left:auto;width:44px;height:44px;padding:0;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:transparent;color:#fff;place-items:center;cursor:pointer}.guzman-header__burger svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
      .guzman-mobile-menu{display:none;position:fixed;top:76px;left:0;right:0;z-index:999;background:rgba(20,15,30,.98);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.1);padding:10px 0 16px;font-family:'Hanken Grotesk',system-ui,sans-serif}.guzman-mobile-menu.is-open{display:block}.guzman-mobile-menu nav>a,.guzman-mobile-menu__buy>button,.guzman-mobile-menu__sub>a{display:flex;align-items:center;justify-content:space-between;width:100%;padding:15px 26px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:#fff;text-decoration:none;text-align:left;font:600 16px/1.35 'Hanken Grotesk',system-ui,sans-serif}.guzman-mobile-menu svg{width:18px;height:18px;fill:none;stroke:#8b3fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}.guzman-mobile-menu__buy>button{cursor:pointer}.guzman-mobile-menu__buy>button svg{transition:transform .18s}.guzman-mobile-menu__buy.is-open>button svg{transform:rotate(180deg)}.guzman-mobile-menu__sub{display:none;background:rgba(0,0,0,.12)}.guzman-mobile-menu__buy.is-open .guzman-mobile-menu__sub{display:block}.guzman-mobile-menu__sub>a{padding:12px 26px 12px 52px;color:rgba(255,255,255,.88);font-size:15px}.guzman-mobile-menu__wa{display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;width:calc(100% - 52px)!important;max-width:calc(100% - 52px)!important;min-width:0!important;margin:14px auto 0!important;padding:15px 18px!important;border:0!important;border-radius:12px;background:#25D366!important;color:#fff!important;text-align:center!important;overflow:hidden}.guzman-mobile-menu__wa span{min-width:0}.guzman-mobile-menu__wa svg{width:19px;height:19px;fill:currentColor;stroke:none;flex:0 0 auto}
      @media (max-width:980px){:root{--navh:64px}.guzman-header-ready{padding-top:64px}.guzman-header__inner{height:64px;padding:0 18px;gap:14px}.guzman-header__brand img{height:30px;max-width:150px}.guzman-header__links,.guzman-header__wa{display:none}.guzman-header__burger{display:grid}.guzman-mobile-menu{top:64px}}
      @media (max-width:480px){.guzman-header__inner{padding:0 16px}.guzman-header__brand img{height:28px;max-width:145px}.guzman-mobile-menu nav>a,.guzman-mobile-menu__buy>button{padding-left:26px;padding-right:26px}}
    `;
    document.head.appendChild(style);
  }

  function init() {
    if (document.querySelector('[data-guzman-header]')) return;
    const legacyHeader = document.querySelector('header.nav') || document.querySelector('header');
    if (!legacyHeader) return;
    const nextLegacyMenu = legacyHeader.nextElementSibling;
    const legacyMenu = document.getElementById('mobileMenu') || (nextLegacyMenu && nextLegacyMenu.classList && nextLegacyMenu.classList.contains('mobile-menu') ? nextLegacyMenu : null);
    const mount = document.createElement('div');
    mount.setAttribute('data-guzman-header-root', '');
    legacyHeader.replaceWith(mount);
    if (legacyMenu && legacyMenu.parentNode) legacyMenu.remove();
    mount.innerHTML = markup;
    installStyle();
    document.body.classList.add('guzman-header-ready');

    const root = mount;
    const burger = root.querySelector('.guzman-header__burger');
    const mobile = root.querySelector('.guzman-mobile-menu');
    const desktopBuy = root.querySelector('.guzman-header__buy');
    const desktopBuyButton = desktopBuy.querySelector('button');
    const mobileBuy = root.querySelector('.guzman-mobile-menu__buy');
    const mobileBuyButton = mobileBuy.querySelector('button');
    const closeAll = () => {
      mobile.classList.remove('is-open');
      mobile.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
      desktopBuy.classList.remove('is-open');
      desktopBuyButton.setAttribute('aria-expanded', 'false');
      mobileBuy.classList.remove('is-open');
      mobileBuyButton.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !mobile.classList.contains('is-open');
      closeAll();
      if (open) {
        mobile.classList.add('is-open');
        mobile.setAttribute('aria-hidden', 'false');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Cerrar menú');
      }
    });
    desktopBuyButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !desktopBuy.classList.contains('is-open');
      desktopBuy.classList.toggle('is-open', open);
      desktopBuyButton.setAttribute('aria-expanded', String(open));
    });
    mobileBuyButton.addEventListener('click', () => {
      const open = !mobileBuy.classList.contains('is-open');
      mobileBuy.classList.toggle('is-open', open);
      mobileBuyButton.setAttribute('aria-expanded', String(open));
    });
    root.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeAll()));
    document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeAll(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 980) closeAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
