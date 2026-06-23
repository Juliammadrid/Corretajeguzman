export default async function handler(request, context) {
  const response = await context.next();
  const body = await response.text();

  const override = `

/* Override comercial Corretaje Guzmán — Rentando 5421 */
(function () {
  if (!Array.isArray(window.GUZMAN_RENTANDO)) return;
  window.GUZMAN_RENTANDO.forEach(function (p) {
    var id = String((p && p.id) || '').trim();
    var codigo = String((p && p.codigo) || '').replace(/\\D/g, '');
    var link = String((p && p.link) || '');
    if (id === '5421' || codigo === '5421' || /\\/5421(?:\\D|$)/.test(link)) {
      p.priceValue = 300000;
      p.currency = 'CLP';
      if (typeof p.description === 'string') {
        p.description = p.description
          .replace(/Valor\\s*\\$\\s*400\\.000/gi, 'Valor $300.000')
          .replace(/\\$\\s*400\\.000/g, '$300.000')
          .replace(/400000/g, '300000');
      }
    }
  });
})();
`;

  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.set('cache-control', 'public, max-age=60');

  return new Response(body + override, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const config = {
  path: '/data-rentando.js'
};
