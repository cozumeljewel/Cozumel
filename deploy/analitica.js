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
   ========================================================= */
(function () {
  const CLARITY_ID = 'yyzhqgqqw3';
  const CLAVE_NO = 'cozumel_analitica';
  const EUROPA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];

  window.COZUMEL_ANALITICA = {
    desactivar() {
      try { localStorage.setItem(CLAVE_NO, 'no'); } catch (_) {}
      if (typeof window.clarity === 'function') window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    },
    activa() { try { return localStorage.getItem(CLAVE_NO) !== 'no'; } catch (_) { return true; } },
  };
  if (!CLARITY_ID || !window.COZUMEL_ANALITICA.activa()) return;
  // En local (pruebas) no se mide nada
  if (/^(localhost|127\.|192\.168\.)/.test(location.hostname)) return;

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
