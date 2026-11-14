/* =========================================================
   COZUMEL · ANALÍTICA Y COOKIES (Microsoft Clarity + Meta Pixel)
   Aviso de cookies desde el 5/11/2026.

   · 14/11/2026: EXCEPTO MÉXICO, donde no hay aviso y se mide desde el
     principio (ver "México: sin aviso", al final). Lo de abajo vale para
     el resto de países.
   · Aviso de cookies (todas las visitas, de cualquier país): "Aceptar" y
     "Rechazar" con el mismo peso, sin casillas marcadas. La decisión se
     guarda en este navegador (cozumel_cookies) y se puede cambiar cuando
     se quiera desde cookies.html (COZUMEL_ANALITICA.preferencias()).
     No se da por hecho que fuera de Europa se pueda medir sin preguntar
     (México, EE. UU. y Latinoamérica tienen sus propias leyes): hasta que
     la persona acepta, nada de publicidad, en ningún país.
   · Sin aceptar (o al rechazar):
       - Meta Pixel NO se carga: ni su script, ni cookies (_fbp, _fbc), ni
         peticiones. No hay <noscript> con la imagen del píxel en ninguna
         página, así que tampoco sale nada sin JavaScript.
       - Clarity funciona SIN cookies (consentv2 analytics denied): mide
         visitas, clics y mapas de calor de forma anónima, sin guardar nada
         en el navegador. Quien no quiera ni eso: "No quiero que se mida mi
         visita" en cookies.html (COZUMEL_ANALITICA.desactivar()).
   · Al aceptar: Clarity con cookies y Meta Pixel. Al retirar el
     consentimiento: se revoca en Meta y en Clarity en el momento y se
     borran las cookies de Meta.
   · Las visitas del equipo (con la clave ?acceso=) no cargan el píxel y en
     Clarity llevan la etiqueta equipo = si.
   · Se carga en <head>, sin defer, en todas las páginas públicas.
   · Meta Pixel (2134361704116564). Eventos desde script.js:
     COZUMEL_ANALITICA.evento('ViewContent' | 'AddToCart' |
     'InitiateCheckout' | 'Purchase', { value, currency, content_ids,
     num_items?, event_id? }).
       - Cada evento va con un eventID: el que se pase en event_id (Purchase
         usa "purchase_<id de la sesión de Stripe>", que el servidor también
         conoce) o uno aleatorio. Así, el día que se añada la Conversions API
         desde el webhook de Stripe, Meta deduplica navegador y servidor.
       - autoConfig desactivado: Meta no "adivina" eventos por su cuenta
         (clics en botones, campos de formulario), solo los nuestros.
       - Nada de datos personales: ni email, ni teléfono, ni nombre.
       - Los eventos de antes de aceptar se descartan al recargar; los de
         la página en la que se acepta se envían al aceptar.
   · Pruebas en local (localhost): no se mide nada salvo con
     ?probar_pixel=1, y aun así solo tras aceptar en el aviso. En la web
     publicada ese parámetro no hace nada.
   ========================================================= */
(function () {
  const CLARITY_ID = 'yyzhqgqqw3';
  const META_PIXEL_ID = '2134361704116564'; // Administrador de eventos de Meta → píxel
  const CLAVE_NO = 'cozumel_analitica';     // "no" = sin Clarity (cookies.html)
  const CLAVE_CONSENTIMIENTO = 'cozumel_cookies';
  const VERSION_AVISO = 1;                  // subirla si cambia lo que se pide

  const esLocal = /^(localhost|127\.|192\.168\.)/.test(location.hostname);
  let probarEnLocal = false;
  if (esLocal) {
    try {
      const q = new URLSearchParams(location.search).get('probar_pixel');
      if (q === '1') sessionStorage.setItem('cozumel_probar_pixel', '1');
      if (q === '0') sessionStorage.removeItem('cozumel_probar_pixel');
      probarEnLocal = sessionStorage.getItem('cozumel_probar_pixel') === '1';
    } catch (_) {}
  }

  // ---------- Consentimiento ----------
  // null = aún no ha decidido; true = acepta; false = rechaza
  function leerConsentimiento() {
    try {
      const c = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO));
      if (c && c.v === VERSION_AVISO && typeof c.publicidad === 'boolean') return c.publicidad;
    } catch (_) {}
    return null;
  }
  function guardarConsentimiento(acepta) {
    try {
      localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify({ v: VERSION_AVISO, publicidad: acepta, fecha: new Date().toISOString() }));
    } catch (_) {}
  }
  let consentimiento = leerConsentimiento();

  let equipo = false;
  try { equipo = localStorage.getItem('cozumel_acceso_web') === '1'; } catch (_) {}

  // ---------- Visitas que llegan desde un anuncio (6/11/2026) ----------
  // ?utm_source=meta: solo lo lleva el enlace del anuncio (9/11: ya no
  // fbclid, que Instagram añade también a la bio y a otros enlaces).
  // Se recuerda 7 días en este navegador. A esas
  // visitas no se les enseña el sorteo con Adri (no la conocen): en su
  // lugar, la oferta de lanzamiento y el envío gratis (script.js). La clase
  // en <html> va ya aquí, en <head>, para que el banner del sorteo no
  // llegue a verse ni un instante.
  const CLAVE_ORIGEN = 'cozumel_origen_anuncio';
  let desdeAnuncio = false;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('utm_source') === 'meta') localStorage.setItem(CLAVE_ORIGEN, String(Date.now()));
    const t = Number(localStorage.getItem(CLAVE_ORIGEN));
    desdeAnuncio = t > 0 && Date.now() - t < 7 * 24 * 3600 * 1000;
  } catch (_) {}
  if (desdeAnuncio) document.documentElement.classList.add('desde-anuncio');

  // ---------- Visitas que llegan desde TikTok (13/11/2026) ----------
  // ?utm_source=tiktok en el enlace de la bio / los vídeos. Igual que el
  // anuncio: 7 días en este navegador, sin cookies (los eventos se apuntan
  // con fuente 'tiktok', supabase-migracion-v44.sql). Gana el último origen:
  // si después llega desde el anuncio, cuenta como anuncio, y al revés.
  const CLAVE_TIKTOK = 'cozumel_origen_tiktok';
  let desdeTiktok = false;
  try {
    const q = new URLSearchParams(location.search);
    const fuenteUrl = (q.get('utm_source') || '').toLowerCase();
    if (fuenteUrl === 'tiktok') { localStorage.setItem(CLAVE_TIKTOK, String(Date.now())); localStorage.removeItem(CLAVE_ORIGEN); desdeAnuncio = false; }
    if (fuenteUrl === 'meta') localStorage.removeItem(CLAVE_TIKTOK);
    const t = Number(localStorage.getItem(CLAVE_TIKTOK));
    desdeTiktok = !desdeAnuncio && t > 0 && Date.now() - t < 7 * 24 * 3600 * 1000;
  } catch (_) {}

  let pixelesListos = false;
  let pendientes = [];
  const idEvento = (nombre) => nombre + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  window.COZUMEL_ANALITICA = {
    desactivar() {
      try { localStorage.setItem(CLAVE_NO, 'no'); } catch (_) {}
      retirar();
      if (typeof window.clarity === 'function') window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    },
    activa() { try { return localStorage.getItem(CLAVE_NO) !== 'no'; } catch (_) { return true; } },
    consentimiento() { return consentimiento; },
    desdeAnuncio() { return desdeAnuncio; },
    desdeTiktok() { return desdeTiktok; },
    // Vuelve a enseñar el aviso para cambiar la decisión (cookies.html)
    preferencias() { mostrarAviso(true); },
    // Eventos de compra para el píxel. Sin consentimiento: nada.
    evento(nombre, datos) {
      if (!pixelesListos) {
        if (consentimiento !== false) pendientes.push([nombre, datos]);
        return;
      }
      try {
        const { event_id, ...resto } = datos || {};
        const meta = { ...resto, content_type: 'product' };
        Object.keys(meta).forEach(k => meta[k] === undefined && delete meta[k]);
        if (typeof window.fbq === 'function') window.fbq('track', nombre, meta, { eventID: event_id || idEvento(nombre) });
      } catch (_) {}
    },
  };

  const puedeMedir = window.COZUMEL_ANALITICA.activa() && (!esLocal || probarEnLocal);

  // ---------- Clarity: siempre sin cookies salvo que se acepte ----------
  if (CLARITY_ID && puedeMedir) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: consentimiento === true ? 'granted' : 'denied' });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(s);
    const pagina = (document.body && document.body.dataset.page) || location.pathname.replace(/^\/|\.html$/g, '') || 'inicio';
    window.clarity('set', 'pagina', pagina);
    window.clarity('set', 'equipo', equipo ? 'si' : 'no');
    window.clarity('set', 'web', document.documentElement.classList.contains('web-cerrada') ? 'cerrada' : 'abierta');
    window.clarity('set', 'cookies', consentimiento === true ? 'aceptadas' : consentimiento === false ? 'rechazadas' : 'sin_decidir');
  }

  // ---------- Meta Pixel: solo con consentimiento ----------
  function cargarPixel() {
    if (pixelesListos || !META_PIXEL_ID || consentimiento !== true || equipo || !puedeMedir) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('consent', 'grant');
    window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView', {}, { eventID: idEvento('PageView') });
    pixelesListos = true;
    pendientes.splice(0).forEach(([n, d]) => window.COZUMEL_ANALITICA.evento(n, d));
  }

  function borrarCookiesMeta() {
    const dominios = ['', location.hostname, '.' + location.hostname.replace(/^www\./, '')];
    ['_fbp', '_fbc'].forEach(nombre => dominios.forEach(d => {
      document.cookie = nombre + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
    }));
  }

  function retirar() {
    pendientes = [];
    if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    pixelesListos = false;
    borrarCookiesMeta();
  }

  function decidir(acepta) {
    consentimiento = acepta;
    guardarConsentimiento(acepta);
    // Aceptar en el aviso anula un "No quiero que se mida mi visita" anterior
    // (con él no se cargaba nada): se quita y se recarga para medir ya.
    if (acepta && !window.COZUMEL_ANALITICA.activa()) {
      try { localStorage.removeItem(CLAVE_NO); } catch (_) {}
      location.reload();
      return;
    }
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: acepta ? 'granted' : 'denied' });
      window.clarity('set', 'cookies', acepta ? 'aceptadas' : 'rechazadas');
    }
    if (acepta) {
      // Si ya se cargó y se revocó en esta página, se vuelve a dar permiso
      if (typeof window.fbq === 'function') { window.fbq('consent', 'grant'); pixelesListos = true; }
      else cargarPixel();
    } else {
      retirar();
    }
    ocultarAviso();
  }

  if (consentimiento === true) cargarPixel();

  // ---------- Aviso de cookies ----------
  // Textos en español: idioma.js los traduce con su diccionario
  // (traduccion/en.txt), como el resto de la web.
  let aviso = null;
  function ocultarAviso() { if (aviso) aviso.hidden = true; }
  function mostrarAviso(forzado) {
    if (!forzado && consentimiento !== null) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', () => mostrarAviso(forzado)); return; }
    if (!aviso) {
      const estilo = document.createElement('style');
      estilo.textContent = `
        .aviso-cookies{position:fixed; left:16px; bottom:16px; z-index:9999; width:min(400px, calc(100% - 32px));
          box-sizing:border-box; padding:20px 20px 18px; background:#FFFFFF; color:#2B3B3C;
          border:1px solid #E6E0D5; border-radius:6px; box-shadow:0 10px 32px rgba(20,69,74,.14);
          font-family:inherit; font-size:13.5px; line-height:1.55;}
        .aviso-cookies[hidden]{display:none;}
        .aviso-cookies p{margin:0 0 14px;}
        .aviso-cookies strong{display:block; margin-bottom:4px; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#B08A45; font-weight:600;}
        .aviso-cookies a{color:#14454A; text-decoration:underline; text-underline-offset:3px;}
        .aviso-cookies-botones{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
        .aviso-cookies button{appearance:none; margin:0; height:44px; border-radius:4px; cursor:pointer;
          font:inherit; font-size:14px; font-weight:600; letter-spacing:.3px;
          background:#FFFFFF; color:#14454A; border:1px solid #14454A;}
        .aviso-cookies button:hover{background:#14454A; color:#FFFFFF;}
        .aviso-cookies button:focus-visible{outline:2px solid #B08A45; outline-offset:2px;}
        @media (max-width:520px){
          /* 13/11: en el móvil, arriba y compacto: abajo tapaba el botón de compra fijo */
          .aviso-cookies{left:10px; right:10px; top:10px; bottom:auto; width:auto; padding:12px 14px; font-size:12.5px; line-height:1.45;}
          .aviso-cookies p{margin:0 0 10px;}
          .aviso-cookies strong{display:inline; margin:0 6px 0 0; font-size:11px; letter-spacing:1.5px;}
          .aviso-cookies-botones{gap:8px;}
          .aviso-cookies button{height:36px; font-size:13px;}
        }
      `;
      document.head.appendChild(estilo);
      aviso = document.createElement('div');
      aviso.className = 'aviso-cookies';
      aviso.setAttribute('role', 'dialog');
      aviso.setAttribute('aria-label', 'Cookies');
      aviso.innerHTML =
        '<p><strong>Cookies</strong>Usamos cookies para mejorar tu experiencia. <a href="cookies.html">Más información</a></p>' +
        '<div class="aviso-cookies-botones">' +
        '<button type="button" data-cookies="no">Rechazar</button>' +
        '<button type="button" data-cookies="si">Aceptar</button>' +
        '</div>';
      aviso.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-cookies]');
        if (b) decidir(b.dataset.cookies === 'si');
      });
      document.body.appendChild(aviso);
    }
    aviso.hidden = false;
  }

  // ---------- México: sin aviso (14/11/2026) ----------
  // Decisión del negocio: a las visitas desde México no se les enseña el
  // aviso y se mide desde el principio (Clarity con cookies y píxel de
  // Meta). La ley mexicana pide aviso de privacidad y poder oponerse, no
  // permiso previo; la tienda es española, así que es una zona gris
  // asumida. No se guarda como "aceptado": se decide en cada visita por el
  // país (detección por IP, la misma de los precios). Quien rechace desde
  // cookies.html queda rechazado (eso sí se guarda). Lo explica cookies.html.
  const PAISES_SIN_AVISO = ['MX'];
  function paisGuardado() {
    try { const g = JSON.parse(localStorage.getItem('cozumel_mercado_geo')); return g && g.pais ? String(g.pais).toUpperCase() : null; }
    catch (_) { return null; }
  }
  function medirSinAviso() {
    consentimiento = true;
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      window.clarity('set', 'cookies', 'sin_aviso_mexico');
    }
    cargarPixel();
  }
  function decidirPorPais(pais) {
    if (pais && PAISES_SIN_AVISO.includes(pais)) medirSinAviso();
    else mostrarAviso(false);
  }

  // Quien desactivó toda medición en cookies.html no ve el aviso: ya decidió
  if (puedeMedir && consentimiento === null) {
    const pais = paisGuardado();
    if (pais) decidirPorPais(pais);
    else fetch('/api/geo', { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => decidirPorPais(d && typeof d.country === 'string' ? d.country.toUpperCase() : null))
      .catch(() => mostrarAviso(false));
  }
})();
