/* Zumi 5.3: isolated, responsive floating widget for the public site. */
(() => {
  'use strict';
  if (window.top !== window || document.getElementById('zumi-site-embed')) return;
  if (/^\/(?:portal|login|zumi)(?:\/|$)/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('zumi') === 'off') return;

  const style = document.createElement('style');
  style.textContent = [
    '#zumi-site-embed{position:fixed;bottom:10px;right:10px;width:245px;height:160px;z-index:2147482000;border:0;background:transparent;pointer-events:auto;transition:width .16s ease,height .16s ease}',
    '#zumi-site-embed.zumi-has-welcome{width:min(354px,calc(100vw - 16px));height:min(430px,calc(100dvh - 10px))}',
    '#zumi-site-embed.zumi-has-chat{width:min(455px,calc(100vw - 12px));height:min(710px,calc(100dvh - 12px))}',
    '@media(max-width:640px){#zumi-site-embed{bottom:6px;right:6px;width:222px;height:138px}#zumi-site-embed.zumi-has-welcome{width:min(338px,calc(100vw - 12px));height:min(418px,calc(100dvh - 12px))}#zumi-site-embed.zumi-has-chat{width:calc(100vw - 12px);height:min(690px,calc(100dvh - 12px))}}',
    '@media(prefers-reduced-motion:reduce){#zumi-site-embed{transition:none}}'
  ].join('\n');
  document.head.appendChild(style);

  const frame = document.createElement('iframe');
  frame.id = 'zumi-site-embed';
  frame.title = 'Zumi, asistente inmobiliario de Corretaje Guzmán';
  frame.src = '/zumi/index.html?embed=1';
  frame.setAttribute('allow', 'microphone; autoplay');
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  frame.setAttribute('aria-label', 'Asistente virtual Zumi');
  document.body.appendChild(frame);

  const sendPageContext = () => {
    const idFromPath = location.pathname.match(/\/propiedad\/(rec[A-Za-z0-9]{14})/);
    const url = new URL(location.href);
    const id = (idFromPath && idFromPath[1]) || [url.searchParams.get('id'), url.searchParams.get('propertyId')].find(x => /^rec[A-Za-z0-9]{14}$/.test(x || '')) || '';
    try {
      frame.contentWindow?.postMessage({type:'ZUMI_PAGE_CONTEXT',propertyId:id,url:location.href},location.origin);
    } catch (_) { /* iframe may still be loading */ }
  };
  frame.addEventListener('load', sendPageContext);
  window.addEventListener('popstate', sendPageContext);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    const state = event.data;
    if (!state || state.type !== 'ZUMI_EMBED_STATE') return;
    frame.classList.toggle('zumi-has-chat', state.chatOpen === true);
    frame.classList.toggle('zumi-has-welcome', state.chatOpen !== true && state.welcomeOpen === true);
  });
})();