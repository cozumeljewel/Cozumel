/* =========================================================
   COZUMEL · ANALÍTICA (Microsoft Clarity) · SIN AVISO DE COOKIES (17/10/2026)

   · Clarity (gratis): mapas de calor, grabaciones anónimas de visitas,
     dispositivo, país y de dónde llega la gente. Panel en
     https://clarity.microsoft.com con la cuenta del proyecto.
   · No hay banner de cookies:
       - Fuera de Europa: Clarity normal (con sus cookies).
       - Desde la UE/EEE, Reino Unido y Suiza (o si aún no se sabe el
         país): Clarity SIN cookies (consentv2 analytics denied). Mide
         igual las visitas, clics y mapas de calor, pero cada visita
         cuenta como persona nueva.
     El país sale de cozumel_mercado_geo (mercados.js) o de /api/geo.
   · Quien no quiera ser medido: botón en cookies.html
     (COZUMEL_ANALITICA.desactivar()) → se guarda cozumel_analitica = no.
   · Las visitas del equipo (con la clave ?acceso=) llevan la etiqueta
     equipo = si, para poder filtrarlas en el panel.
   · Se carga en <head>, sin defer, en todas las páginas.
   · CLARITY_ID vacío = desactivado.
   · Píxeles de publicidad (2/11/2026): Meta (Instagram/Facebook) y TikTok,
     para que los anuncios sepan quién compra. SOLO fuera de Europa (en la
     UE pedirían el aviso de cookies). Id vacío = desactivado. Eventos:
     COZUMEL_ANALITICA.evento('ViewContent' | 'AddToCart' |
     'InitiateCheckout' | 'Purchase', { value, currency, content_ids,
     event_id? }).
   · Meta (5/11/2026, píxel 1177942677989903):
       - Cada evento va con un eventID: el que se pase en event_id (Purchase
         usa "purchase_<id de la sesión de Stripe>", que el servidor también
         conoce) o uno aleatorio. Así, el día que se añada la Conversions API
         desde el webhook de Stripe, Meta deduplica navegador y servidor.
       - autoConfig desactivado: Meta no "adivina" eventos por su cuenta
         (clics en botones, campos de formulario), solo los nuestros.
       - Nada de datos personales: ni email, ni teléfono, ni nombre.
       - Quien pulsa "No quiero que se mida mi visita" (cookies.html): se
         revoca el consentimiento en el momento y no se vuelve a cargar.
       - Modo prueba: ?probar_pixel=1 carga el píxel en esta pestaña aunque
         se entre desde Europa o con la clave del equipo, para verlo en
         Meta Events Manager → Probar eventos. ?probar_pixel=0 lo quita.
   ========================================================= */
(function () {
  const CLARITY_ID = 'yyzhqgqqw3';
  const META_PIXEL_ID = '1177942677989903'; // Administrador de eventos de Meta → píxel
  const TIKTOK_PIXEL_ID = '';  // TikTok Ads Manager → Herramientas → Eventos
  const CLAVE_NO = 'cozumel_analitica';
  const EUROPA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];

  // Modo prueba del píxel (solo esta pestaña), ver arriba
  let probarPixel = false;
  try {
    const q = new URLSearchParams(location.search).get('probar_pixel');
    if (q === '1') sessionStorage.setItem('cozumel_probar_pixel', '1');
    if (q === '0') sessionStorage.removeItem('cozumel_probar_pixel');
    probarPixel = sessionStorage.getItem('cozumel_probar_pixel') === '1';
  } catch (_) {}

  let pixelesListos = false;
  const pendientes = [];
  const idEvento = (nombre) => nombre + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  window.COZUMEL_ANALITICA = {
    desactivar() {
      try { localStorage.setItem(CLAVE_NO, 'no'); } catch (_) {}
      if (typeof window.clarity === 'function') window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    },
    activa() { try { return localStorage.getItem(CLAVE_NO) !== 'no'; } catch (_) { return true; } },
    // Eventos de compra para los píxeles (si están cargados; si no, nada)
    evento(nombre, datos) {
      // Si los píxeles aún no han cargado (se espera al país), se guarda
      if (!pixelesListos) { pendientes.push([nombre, datos]); return; }
      try {
        const { event_id, ...resto } = datos || {};
        const meta = { ...resto, content_type: 'product' };
        Object.keys(meta).forEach(k => meta[k] === undefined && delete meta[k]);
        if (typeof window.fbq === 'function') window.fbq('track', nombre, meta, { eventID: event_id || idEvento(nombre) });
        if (window.ttq && typeof window.ttq.track === 'function') {
          const TT = { ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment' };
          const d = resto;
          window.ttq.track(TT[nombre] || nombre, { value: d.value, currency: d.currency, contents: (d.content_ids || []).map(id => ({ content_id: id })) });
        }
      } catch (_) {}
    },
  };
  if (!CLARITY_ID || !window.COZUMEL_ANALITICA.activa()) return;
  // En local (pruebas) no se mide nada
  if (/^(localhost|127\.|192\.168\.)/.test(location.hostname) && !probarPixel) return;

  // Cola de Clarity ya disponible (clarity('event', ...) funciona antes de cargar)
  window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };

  const leerPais = () => {
    try { const g = JSON.parse(localStorage.getItem('cozumel_mercado_geo')); return g && g.pais ? String(g.pais).toUpperCase() : null; } catch (_) { return null; }
  };

  let cargada = false;
  function cargar(pais) {
    if (cargada) return;
    cargada = true;
    const conCookies = !!pais && !EUROPA.includes(pais);
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: conCookies ? 'granted' : 'denied' });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(s);
    const pagina = (document.body && document.body.dataset.page) || location.pathname.replace(/^\/|\.html$/g, '') || 'inicio';
    window.clarity('set', 'pagina', pagina);
    let equipo = false;
    try { equipo = localStorage.getItem('cozumel_acceso_web') === '1'; } catch (_) {}
    window.clarity('set', 'equipo', equipo ? 'si' : 'no');
    window.clarity('set', 'web', document.documentElement.classList.contains('web-cerrada') ? 'cerrada' : 'abierta');
    if ((conCookies && !equipo) || probarPixel) cargarPixeles();
  }

  // Píxeles de Meta y TikTok: código oficial de cada uno (solo fuera de Europa)
  function cargarPixeles() {
    if (META_PIXEL_ID) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView', {}, { eventID: idEvento('PageView') });
    }
    if (TIKTOK_PIXEL_ID) {
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load(TIKTOK_PIXEL_ID);
        ttq.page();
      }(window, document, 'ttq');
      /* eslint-enable */
    }
    pixelesListos = true;
    pendientes.splice(0).forEach(([n, d]) => window.COZUMEL_ANALITICA.evento(n, d));
  }

  const pais = leerPais();
  if (pais) { cargar(pais); return; }
  // Primera visita: se pregunta el país (máx. 3 s); si no llega, sin cookies.
  const corte = setTimeout(() => cargar(null), 3000);
  fetch('/api/geo', { headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : null)
    .then(d => { clearTimeout(corte); cargar(d && typeof d.country === 'string' ? d.country.toUpperCase() : null); })
    .catch(() => { clearTimeout(corte); cargar(null); });
})();
