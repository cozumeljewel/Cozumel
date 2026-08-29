/* ---------- Fundido de salida entre páginas ----------
   Antes se dejaba esto en manos de la View Transitions API nativa del
   navegador (Chrome/Edge) y solo se usaba este script en Firefox/Safari.
   Se quitó la parte nativa (ver style.css): en la práctica el navegador
   la abortaba con navegación lenta y a veces dejaba la página a medias
   sin pintar. Ahora este mismo fundido por JS corre en todos los
   navegadores por igual — más simple y sin ese riesgo.
   Detecta clics en enlaces internos, añade un fundido de salida
   brevísimo (.09s) y navega. Nada de esto retrasa la navegación más de
   lo que dura el propio fundido, y respeta el atrás/adelante (el
   navegador restaura la página tal cual, no se queda "pillada"). */
(function () {
  var PREFIERE_MENOS_MOVIMIENTO =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (PREFIERE_MENOS_MOVIMIENTO) return;

  var DURACION_MS = 90;

  document.addEventListener('click', function (evento) {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;

    var enlace = evento.target.closest('a[href]');
    if (!enlace) return;

    var destino;
    try {
      destino = new URL(enlace.href, location.href);
    } catch (e) {
      return;
    }

    if (destino.origin !== location.origin) return;
    if (enlace.target && enlace.target !== '_self') return;
    if (enlace.hasAttribute('download')) return;
    if (destino.pathname === location.pathname && destino.hash) return;

    evento.preventDefault();
    document.documentElement.classList.add('is-leaving');
    setTimeout(function () {
      location.href = destino.href;
    }, DURACION_MS);
  });

  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('is-leaving');
  });
})();
